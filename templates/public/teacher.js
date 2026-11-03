// 教师端逻辑：通过 SSE 实时接收学生提交并汇总展示
(function () {
  "use strict";

  var COURSE = window.COURSE;
  var qstatsEl = document.getElementById("qstats");
  var studentsEl = document.getElementById("students");
  var openEl = document.getElementById("open");
  var countEl = document.getElementById("count");
  var connEl = document.getElementById("conn");

  document.getElementById("courseTitle").textContent = COURSE.title + " · 教师端";

  // 预置题目信息，用于把 qid 映射成题号/题干
  var qMeta = {};
  COURSE.questions.forEach(function (q, i) {
    qMeta[q.id] = { idx: i + 1, prompt: q.prompt, type: q.type };
  });

  var es = new EventSource("/events");
  es.onopen = function () { connEl.className = "dot on"; };
  es.onerror = function () { connEl.className = "dot off"; };

  es.onmessage = function (e) {
    var state;
    try { state = JSON.parse(e.data); } catch (err) { return; }
    render(state);
  };

  function render(state) {
    countEl.textContent = state.count;

    // 各题正确率
    var html = "";
    Object.keys(state.qStats || {}).forEach(function (qid) {
      var s = state.qStats[qid];
      var meta = qMeta[qid];
      if (!meta) return;
      var rate = s.total ? Math.round((s.correct / s.total) * 100) : 0;
      html += '<div class="qstat">';
      html += '<div class="qstitle">第 ' + meta.idx + ' 题 · ' + escapeHtml(truncate(meta.prompt, 22)) + "</div>";
      html += '<div class="bar"><div class="barfill" style="width:' + rate + '%"></div></div>';
      html += '<div class="qsmeta">' + s.correct + "/" + s.total + " 正确（" + rate + "%）</div>";
      html += "</div>";
    });
    if (!html) html = '<p class="empty">暂无自动判分型提交</p>';
    qstatsEl.innerHTML = html;

    // 学生列表
    var shtml = '<table class="tbl"><thead><tr><th>姓名</th><th>得分</th><th>状态</th></tr></thead><tbody>';
    (state.students || []).forEach(function (st) {
      shtml += "<tr><td>" + escapeHtml(st.name) + "</td><td>" + st.score + " / " + st.total + "</td><td>已交</td></tr>";
    });
    shtml += "</tbody></table>";
    if (!(state.students || []).length) shtml = '<p class="empty">等待学生提交…</p>';
    studentsEl.innerHTML = shtml;

    // 开放作答
    var ohtml = "";
    (state.open || []).forEach(function (o) {
      o.answers.forEach(function (a) {
        var meta = qMeta[a.q];
        ohtml += '<div class="openitem"><span class="openwho">' + escapeHtml(o.name) + "</span>：" + escapeHtml(a.text) + "</div>";
      });
    });
    if (!ohtml) ohtml = '<p class="empty">暂无开放作答</p>';
    openEl.innerHTML = ohtml;
  }

  function truncate(s, n) { return s.length > n ? s.slice(0, n) + "…" : s; }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
})();
