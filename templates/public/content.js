// 题库：学生端与教师端共用。修改 title 与 questions 即可换整套题。
// type 支持：choice(单选) / judge(判断) / calc(填空计算) / drag(拖拽分类) / open(开放作答)
// 判分规则：choice / judge / calc / drag 自动判分；open 不判分，进入教师端开放作答墙。
// 新增/修改题目无需改动其他文件。
window.COURSE = {
  title: "示例课 · 在这里写你的课程标题",
  questions: [
    // —— 单选题 ——
    {
      id: "q1",
      type: "choice",
      prompt: "问题文字？（示例）",
      options: ["选项A", "选项B", "选项C", "选项D"],
      answer: 0 // 正确选项的下标，从 0 开始
    },
    // —— 判断题 ——
    {
      id: "q2",
      type: "judge",
      prompt: "判断：……（对 / 错）（示例）",
      answer: true // true 表示“对”，false 表示“错”
    },
    // —— 填空/计算题 ——
    {
      id: "q3",
      type: "calc",
      prompt: "计算：…… = ?（示例）",
      answer: 96,    // 标准答案（数字）
      tolerance: 0   // 允许的误差，如 0.01；默认 0
    },
    // —— 拖拽分类题 ——
    {
      id: "q4",
      type: "drag",
      prompt: "把下列项拖入正确的类别：（示例）",
      items: [
        { label: "项1", cat: "catA" },
        { label: "项2", cat: "catB" },
        { label: "项3", cat: "catA" }
      ],
      categories: [
        { key: "catA", name: "类别一" },
        { key: "catB", name: "类别二" }
      ]
    },
    // —— 开放作答题（无标准答案）——
    {
      id: "q5",
      type: "open",
      prompt: "用一句话回答：……（老师大屏会汇总展示）（示例）"
    }
  ]
};
