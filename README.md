# 课堂互动课件 · 技能包（Classroom Live Courseware）

**课堂互动课件（Classroom Live Courseware）** 是一个 WorkBuddy 技能，帮助教师把一节课快速变成可互动的网页课件：

- **学生端**：选择题 / 判断题 / 填空计算 / 拖拽分类 / 开放作答，提交后本地即时判分。
- **教师端大屏**：实时汇总全班各题正确率、提交名单与开放作答墙（自动推送，无需刷新）。
- **零依赖**：仅需 Node.js，无需安装依赖、无需联网后端。
- 改 `public/content.js` 一个文件即可换学科，适合随堂测验、练习与课堂讨论。

**Classroom Live Courseware** is a WorkBuddy skill that turns any lesson into interactive web courseware in minutes:

- **Student side**: choice / judge / calculation / drag-to-classify / open response, with instant local grading on submit.
- **Teacher big-screen**: live aggregation of the whole class's per-question accuracy, submission list, and an open-response wall (auto-pushed, no refresh).
- **Zero dependencies**: only Node.js required, no npm install, no cloud backend.
- Swap subjects by editing a single file (`public/content.js`). Ideal for in-class quizzes, practice, and discussion.

---

## 安装（买家）

把本文件夹整体解压 / 复制到：

```
C:/Users/<你的用户名>/.workbuddy/skills/classroom-live-courseware/
```

（macOS / Linux 路径相同，替换 `C:/Users/<用户名>` 为你的家目录。）
重启 WorkBuddy 后，在「技能」面板即可看到「课堂互动课件」，对话中提到“课件 / 随堂测验 / 学生端 / 教师大屏”会自动触发。

## 一键生成课件（无需懂代码）

技能内附带零依赖生成器，运行一条命令即得一套可运行课件：

```bash
node new-courseware.js <目标目录> [课程标题]
# 例： node new-courseware.js my-physics "初中物理互动课"
```

生成后进入该目录，运行：

```bash
cd my-physics
node server.js
# 学生端  http://localhost:3000/
# 教师端  http://localhost:3000/teacher
```

## 上课使用

1. 教师机装 Node.js（≥14），进入课件目录运行 `node server.js`。
2. 教师端浏览器打开 `http://localhost:3000/teacher` 投屏。
3. 学生用教师机的**局域网 IP** 访问（教师机 `ipconfig` 查到，如 `http://192.168.1.10:3000/`），输姓名即作答。

## 换题（只改一个文件）

编辑 `public/content.js` 的 `title` 与 `questions` 数组即可，无需改动其他文件。题型规范见 `SKILL.md`。

## 注意事项

- **GitHub Pages 跑不了实时汇总**：Pages 仅托管静态文件，不能跑 Node 服务。GitHub 仅用于代码分发/备份；课堂实时汇总必须本地跑 `node server.js`。
- 服务重启会清空已提交数据（内存态，单节课内有效）。

## 许可

版权归作者所有（cheung1961）。买家获得**使用授权**，可自用与教学，**不得转售或公开源码**。详见 `LICENSE`。
