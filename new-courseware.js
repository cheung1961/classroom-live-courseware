#!/usr/bin/env node
// 零依赖课件生成器：把 templates/ 复制为一个可运行的课件目录。
// 用法： node new-courseware.js <目标目录> [课程标题]
// 例：   node new-courseware.js my-physics "初中物理互动课"
// 生成后进入该目录运行 node server.js 即可（学生端/ 教师端自动就绪）。

const fs = require("fs");
const path = require("path");

const TPL = path.join(__dirname, "templates");
const target = process.argv[2] || "classroom-courseware";
const title = process.argv[3] || "我的课堂互动课件";
const dest = path.resolve(process.cwd(), target);

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name);
    const d = path.join(dst, e.name);
    if (e.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

if (!fs.existsSync(TPL)) {
  console.error("找不到 templates 目录，本脚本需与 templates/ 同目录。");
  process.exit(1);
}
if (fs.existsSync(dest) && fs.readdirSync(dest).length) {
  console.error("目标目录已存在且非空：" + dest + "\n请换一个目录名，或先清空。");
  process.exit(1);
}

copyDir(TPL, dest);

// 写入课程标题
const contentPath = path.join(dest, "public", "content.js");
if (fs.existsSync(contentPath)) {
  const c = fs.readFileSync(contentPath, "utf8").replace(
    "示例课 · 在这里写你的课程标题",
    title
  );
  fs.writeFileSync(contentPath, c, "utf8");
}

console.log("✓ 已生成课件到：" + dest);
console.log("");
console.log("下一步：");
console.log("  cd " + target);
console.log("  node server.js");
console.log("  学生端  http://localhost:3000/");
console.log("  教师端  http://localhost:3000/teacher");
console.log("");
console.log("换题：编辑 " + target + "/public/content.js");
