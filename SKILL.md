---
name: classroom-live-courseware
version: 1.0.0
description: "Generate classroom interactive courseware (HTML): student-side answering + teacher big-screen real-time aggregation of the whole class's correctness rate and open responses. Zero-dependency Node service, no cloud backend needed. For in-class quizzes, practice, concept sorting, open discussion."
description_zh: "课堂互动课件生成：学生端作答 + 教师大屏实时汇总，零依赖 Node 服务"
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, AskUserQuestion
display_name: "课堂互动课件"
display_name_en: "Classroom Live Courseware"
visibility: "user"
---

# 课堂互动课件（学生端 + 教师实时大屏）

把一节课做成「学生用浏览器作答、教师机大屏实时看到全班结果」的网页课件。特点：
- **学生端**：选择题 / 判断题 / 填空计算 / 拖拽分类 / 开放作答，提交后**本地即时判分**，立刻看对错与得分。
- **教师端**：大屏**实时汇总**——各题正确率进度条、学生提交名单、开放作答墙（SSE 推送，无需刷新）。
- **零依赖**：仅用 Node.js 内置模块，无需 `npm install`，无需联网后端。
- **真实课堂**：学生用「教师机局域网 IP + 端口」访问，教师投屏 `/teacher`。

## 何时使用
- 用户要「做 / 做个 / 生成 课件、课堂互动、随堂测验、学生端、教师大屏、实时汇总、课堂练习」。
- 用户是中小学教师，希望学生课上用设备作答、结果能投屏看到全班。
- 不要用于：纯展示型单页课件（可用内置 `teachany` 技能）、成人职业培训、非课堂场景。

## 工作流程
1. **澄清需求**（需求模糊时用 AskUserQuestion）：学科主题、需要的题型（可多选）、是否要教师大屏汇总（本技能默认两者都要）。
2. **落盘模板**：把 `templates/` 下全部文件复制到用户指定目录（默认 `classroom-courseware/`，或按学科命名如 `physics-quiz/`）。
3. **填题库**：根据用户提供的题目，改写 `content.js` 的 `title` 与 `questions` 数组（题型规范见下）。用户没有现成题时，先用示例题搭好结构，再请用户替换。
4. **本地验证**：`node server.js` 启动，`curl` 自检 `/` 与 `/teacher` 返回 200；必要时用浏览器或内置预览打开体验实时汇总。
5. **交付说明**：告诉用户如何上课使用、如何换题、GitHub Pages 的局限。可选：初始化 git 并协助推送 GitHub（需用户提供令牌或用户自行推送）。

## content.js 题型规范（5 种 type）
- `choice` 单选：`{id, type:"choice", prompt, options:[...], answer: 正确项下标(从0开始)}`
- `judge` 判断：`{id, type:"judge", prompt, answer: true|false}`
- `calc` 填空计算：`{id, type:"calc", prompt, answer: 数值, tolerance?: 容差}`
- `drag` 拖拽分类：`{id, type:"drag", prompt, items:[{label,cat}], categories:[{key,name}]}`（每个 item 的 `cat` 必须匹配某个 category 的 `key`）
- `open` 开放作答：`{id, type:"open", prompt}`（无标准答案，不计入自动判分，进入教师端开放作答墙）

判分逻辑在 `app.js` 自动处理，教师端统计由 `teacher.js` + `server.js` 完成，**新增/修改题目无需改动其他文件**。

## 关键文件职责
- `server.js`：零依赖 Node 服务，托管页面 + SSE 实时推送 + 接收提交。**仅教师机运行**。
- `content.js`：题库，**唯一需要频繁修改的文件**。
- `student.html / app.js`：学生端页面与作答、本地判分逻辑。
- `teacher.html / teacher.js`：教师大屏页面与实时汇总逻辑。
- `style.css`：学生端（浅色）+ 教师端（深色大屏）共用样式。

## 注意事项
- **GitHub Pages 跑不了实时汇总**：Pages 只托管静态文件，不能跑 Node 服务。GitHub 仅用于代码备份/分发；课堂实时汇总必须本地跑 `node server.js`。若需纯云端实时，需另接 Supabase/Firebase（本技能不含）。
- 服务端口：`PORT` 环境变量可改，默认 3000。重启服务会清空已提交数据（内存态，课堂期间有效）。
- 局域网访问：学生用教师机 `ipconfig` 查到的局域网 IP，如 `http://192.168.1.10:3000/`，不是 localhost。
- 身份：学生端首次打开会要求输入姓名（存浏览器本地），同一浏览器重复提交会覆盖该学生记录。

## 常用命令
```bash
cd <课件目录>
node server.js            # 启动（或 npm start）
# 学生端 http://localhost:3000/       教师端 http://localhost:3000/teacher
```

## 独立生成（无需对话，最适合分发 / 售卖）
技能根目录附带零依赖生成器 `new-courseware.js`，不懂技术也能一键产出一套可运行课件：
```bash
node new-courseware.js <目标目录> [课程标题]
# 例：node new-courseware.js my-physics "初中物理互动课"
```
生成后的目录结构（开箱即用）：
```
<目标目录>/
├── server.js          # 零依赖 Node 服务（仅教师机运行）
├── package.json
├── README.md
└── public/            # 前端（学生端 + 教师端 + 题库）
    ├── content.js     # ★题库：唯一需要改的文件
    ├── student.html / app.js
    ├── teacher.html / teacher.js
    └── style.css
```
进入该目录 `node server.js` 即可，学生端 `/`、教师端 `/teacher` 自动就绪；换学科只改 `public/content.js`。

## 分发与售卖
- **打包分发**：把整个技能文件夹（`classroom-live-courseware/`）压缩发给买家；买家解压到
  `C:/Users/<用户名>/.workbuddy/skills/`（macOS / Linux 同路径）即生效，无需联网。
- **上架技能市场**：在 WorkBuddy 技能面板提交本文件夹，由平台分配 skillId 后公开售卖。
- **版权与许可**：见 `LICENSE`（EULA 模板，版权归 cheung1961，买家获使用授权、不得转售源码）。
- **二次定制 SKU**：卖家可预置不同学科的题库（`public/content.js`）做成多个套件分别售卖。
