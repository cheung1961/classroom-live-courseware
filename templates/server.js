// 零依赖 Node 服务：托管静态页面 + 通过 SSE 把学生提交实时推送到教师大屏
// 仅教师机需要运行本服务；学生用浏览器访问教师机局域网 IP 即可。
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const PUBLIC = path.join(__dirname, "public");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

// 内存状态（课堂期间有效，重启清空）
const submissions = new Map(); // id -> {id,name,score,total,graded,open,ts}
const sseClients = new Set();

function buildState() {
  const list = [...submissions.values()];
  const qStats = {};
  for (const s of list) {
    if (s.graded) {
      for (const [qid, ok] of Object.entries(s.graded)) {
        if (!qStats[qid]) qStats[qid] = { correct: 0, total: 0 };
        qStats[qid].total += 1;
        if (ok) qStats[qid].correct += 1;
      }
    }
  }
  return {
    count: list.length,
    students: list.map(s => ({ id: s.id, name: s.name, score: s.score, total: s.total, ts: s.ts })),
    qStats,
    open: list
      .filter(s => s.open && s.open.length)
      .map(s => ({ name: s.name, answers: s.open })),
    serverTime: Date.now()
  };
}

function broadcast() {
  const payload = "data: " + JSON.stringify(buildState()) + "\n\n";
  for (const res of sseClients) {
    try { res.write(payload); } catch (e) { sseClients.delete(res); }
  }
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://" + (req.headers.host || "localhost"));
  const pathname = url.pathname;

  // SSE 实时推送
  if (pathname === "/events") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive"
    });
    res.write("data: " + JSON.stringify(buildState()) + "\n\n");
    sseClients.add(res);
    req.on("close", () => sseClients.delete(res));
    return;
  }

  // 当前状态快照（供刷新/轮询）
  if (pathname === "/api/state") {
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(buildState()));
    return;
  }

  // 学生提交
  if (pathname === "/submit" && req.method === "POST") {
    let body = "";
    req.on("data", c => {
      body += c;
      if (body.length > 1e6) req.destroy();
    });
    req.on("end", () => {
      try {
        const data = JSON.parse(body);
        submissions.set(data.id, {
          id: data.id,
          name: (data.name || "匿名").slice(0, 20),
          score: data.score || 0,
          total: data.total || 0,
          graded: data.graded || {},
          open: data.open || [],
          ts: Date.now()
        });
        broadcast();
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("bad json");
      }
    });
    return;
  }

  // 静态文件
  let file = pathname === "/" ? "/student.html" : pathname;
  if (pathname === "/teacher") file = "/teacher.html";
  const filePath = path.join(PUBLIC, file);
  if (!filePath.startsWith(PUBLIC)) {
    res.writeHead(403); res.end("forbidden"); return;
  }
  fs.readFile(filePath, (err, buf) => {
    if (err) { res.writeHead(404); res.end("not found"); return; }
    const ext = path.extname(filePath);
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(buf);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("课堂互动服务已启动");
  console.log("  学生端:  http://localhost:" + PORT + "/");
  console.log("  教师端:  http://localhost:" + PORT + "/teacher");
  console.log("  同一局域网下，学生用教师机 IP 访问，例如 http://192.168.x.x:" + PORT + "/");
});
