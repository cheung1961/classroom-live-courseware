// 学生端逻辑：渲染题目、收集作答、本地判分、提交给教师端
(function () {
  "use strict";

  var COURSE = window.COURSE;
  var quizEl = document.getElementById("quiz");
  var resultEl = document.getElementById("result");
  var submitBtn = document.getElementById("submitBtn");
  var statusEl = document.getElementById("status");
  var whoName = document.getElementById("whoName");
  var resetBtn = document.getElementById("resetName");

  // ---- 身份 ----
  function loadIdentity() {
    var raw = localStorage.getItem("cm_id");
    var name = localStorage.getItem("cm_name");
    if (!raw) {
      raw = "s_" + Math.random().toString(36).slice(2, 10);
      localStorage.setItem("cm_id", raw);
    }
    if (!name) {
      name = (prompt("请输入你的姓名或学号：") || "匿名").trim().slice(0, 20);
      localStorage.setItem("cm_name", name);
    }
    return { id: raw, name: name };
  }
  var me = loadIdentity();
  whoName.textContent = me.name;

  resetBtn.addEventListener("click", function () {
    localStorage.removeItem("cm_name");
    me = loadIdentity();
    whoName.textContent = me.name;
  });

  document.getElementById("courseTitle").textContent = COURSE.title;

  // ---- 渲染 ----
  var dragAssign = {}; // itemIndex -> categoryKey

  function render() {
    quizEl.innerHTML = "";
    COURSE.questions.forEach(function (q, idx) {
      var card = document.createElement("section");
      card.className = "card";
      var head = document.createElement("h2");
      head.innerHTML = '<span class="badge">' + (idx + 1) + "</span> " + escapeHtml(q.prompt);
      card.appendChild(head);

      if (q.type === "choice") {
        card.appendChild(renderChoice(q));
      } else if (q.type === "judge") {
        card.appendChild(renderJudge(q));
      } else if (q.type === "calc") {
        card.appendChild(renderCalc(q));
      } else if (q.type === "drag") {
        card.appendChild(renderDrag(q));
      } else if (q.type === "open") {
        card.appendChild(renderOpen(q));
      }
      quizEl.appendChild(card);
    });
  }

  function renderChoice(q) {
    var wrap = document.createElement("div");
    wrap.className = "options";
    q.options.forEach(function (opt, i) {
      var lab = document.createElement("label");
      lab.className = "opt";
      lab.innerHTML = '<input type="radio" name="' + q.id + '" value="' + i + '"> ' + escapeHtml(opt);
      wrap.appendChild(lab);
    });
    return wrap;
  }

  function renderJudge(q) {
    var wrap = document.createElement("div");
    wrap.className = "options";
    [["对", true], ["错", false]].forEach(function (p) {
      var lab = document.createElement("label");
      lab.className = "opt";
      lab.innerHTML = '<input type="radio" name="' + q.id + '" value="' + p[1] + '"> ' + p[0];
      wrap.appendChild(lab);
    });
    return wrap;
  }

  function renderCalc(q) {
    var wrap = document.createElement("div");
    wrap.innerHTML = '<input type="text" inputmode="decimal" class="answer" data-q="' + q.id + '" placeholder="输入答案">';
    return wrap;
  }

  function renderOpen(q) {
    var wrap = document.createElement("div");
    wrap.innerHTML = '<textarea class="answer" data-q="' + q.id + '" rows="2" placeholder="在此输入你的回答"></textarea>';
    return wrap;
  }

  function renderDrag(q) {
    var wrap = document.createElement("div");
    wrap.className = "dragwrap";
    var pool = document.createElement("div");
    pool.className = "pool";
    pool.dataset.q = q.id;
    q.items.forEach(function (item, i) {
      var chip = document.createElement("div");
      chip.className = "chip";
      chip.draggable = true;
      chip.dataset.idx = i;
      chip.dataset.q = q.id;
      chip.textContent = item.label;
      chip.addEventListener("dragstart", function (e) {
        e.dataTransfer.setData("text/plain", JSON.stringify({ q: q.id, idx: i }));
      });
      pool.appendChild(chip);
    });

    var zones = document.createElement("div");
    zones.className = "zones";
    q.categories.forEach(function (cat) {
      var zone = document.createElement("div");
      zone.className = "zone";
      zone.dataset.cat = cat.key;
      zone.dataset.q = q.id;
      zone.innerHTML = '<div class="zonetitle">' + escapeHtml(cat.name) + "</div>";
      zone.addEventListener("dragover", function (e) { e.preventDefault(); zone.classList.add("over"); });
      zone.addEventListener("dragleave", function () { zone.classList.remove("over"); });
      zone.addEventListener("drop", function (e) {
        e.preventDefault();
        zone.classList.remove("over");
        var data;
        try { data = JSON.parse(e.dataTransfer.getData("text/plain")); } catch (err) { return; }
        dragAssign[data.q + "_" + data.idx] = cat.key;
        var chip = pool.querySelector('.chip[data-q="' + data.q + '"][data-idx="' + data.idx + '"]');
        if (chip) zone.appendChild(chip);
      });
      zones.appendChild(zone);
    });

    wrap.appendChild(pool);
    wrap.appendChild(zones);
    return wrap;
  }

  // ---- 收集与判分 ----
  function collect() {
    var answers = {};   // qid -> 学生作答
    var graded = {};    // qid -> 是否正确(仅自动判分型)
    var open = [];      // 开放作答文本
    var score = 0, total = 0;

    COURSE.questions.forEach(function (q) {
      if (q.type === "choice") {
        var el = document.querySelector('input[name="' + q.id + '"]:checked');
        var val = el ? parseInt(el.value, 10) : null;
        answers[q.id] = val;
        total++;
        var ok = val === q.answer;
        graded[q.id] = ok; if (ok) score++;
      } else if (q.type === "judge") {
        var el2 = document.querySelector('input[name="' + q.id + '"]:checked');
        var v2 = el2 ? el2.value === "true" : null;
        answers[q.id] = v2;
        total++;
        var ok2 = v2 === q.answer;
        graded[q.id] = ok2; if (ok2) score++;
      } else if (q.type === "calc") {
        var inp = document.querySelector('.answer[data-q="' + q.id + '"]');
        var raw = inp ? inp.value.trim() : "";
        var num = parseFloat(raw);
        answers[q.id] = raw;
        total++;
        var ok3 = !isNaN(num) && Math.abs(num - q.answer) <= (q.tolerance || 0.001);
        graded[q.id] = ok3; if (ok3) score++;
      } else if (q.type === "drag") {
        var correct = true;
        q.items.forEach(function (item, i) {
          if (dragAssign[q.id + "_" + i] !== item.cat) correct = false;
        });
        answers[q.id] = dragAssign;
        total++;
        graded[q.id] = correct; if (correct) score++;
      } else if (q.type === "open") {
        var ta = document.querySelector('.answer[data-q="' + q.id + '"]');
        var txt = ta ? ta.value.trim() : "";
        answers[q.id] = txt;
        if (txt) open.push({ q: q.id, text: txt });
      }
    });
    return { answers: answers, graded: graded, open: open, score: score, total: total };
  }

  // ---- 提交 ----
  submitBtn.addEventListener("click", function () {
    var data = collect();
    // 本地先展示
    showResult(data);
    // 发给教师端服务
    statusEl.textContent = "正在提交到教师端…";
    fetch("/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: me.id, name: me.name,
        score: data.score, total: data.total,
        graded: data.graded, open: data.open
      })
    }).then(function (r) {
      if (r.ok) { statusEl.textContent = "已同步到教师大屏 ✓"; }
      else { statusEl.textContent = "提交失败，可重试"; }
    }).catch(function () {
      statusEl.textContent = "未连接到教师服务（本地结果已显示）";
    });
  });

  function showResult(data) {
    resultEl.classList.remove("hidden");
    var html = '<h2>你的结果</h2>';
    html += '<p class="score">自动判分：<strong>' + data.score + " / " + data.total + "</strong></p>";
    html += '<ul class="rlist">';
    COURSE.questions.forEach(function (q, i) {
      if (q.type === "open") {
        html += "<li>第 " + (i + 1) + " 题（开放作答）：已提交，等待老师展示</li>";
      } else {
        var ok = data.graded[q.id];
        html += '<li class="' + (ok ? "ok" : "no") + '">第 ' + (i + 1) + " 题：" + (ok ? "✓ 正确" : "✗ 错误") + "</li>";
      }
    });
    html += "</ul>";
    resultEl.innerHTML = html;
    resultEl.scrollIntoView({ behavior: "smooth" });
    submitBtn.disabled = true;
    submitBtn.textContent = "已提交";
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  render();
})();
