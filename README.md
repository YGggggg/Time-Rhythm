# Time Rhythm

Time Rhythm（时律）是一款面向时间盲视、拖延倾向、执行功能障碍和高压多任务人群的 AI 视觉日程管理项目。它尝试把传统待办清单里抽象、冰冷的时间安排，转换成用户可以直接“看见”的时间圆环、任务层级和节奏反馈，帮助用户从“知道该做什么”走到“知道现在先做哪一步”。

当前仓库包含三个端：

- `backend`：FastAPI 后端，负责认证、任务管理、AI 拆解和任务编排
- `frontend`：React Web 端，负责视觉时间圆环、任务列表与交互编辑
- `Time_Rhythm_APP`：Kotlin + Jetpack Compose 原生 Android 端 MVP

## 项目背景

传统 To-do List 对“时间盲视”用户并不友好。很多人并不是不知道自己要完成什么，而是缺少对时间流逝的真实感，面对复杂任务时难以启动，也容易在排程过满后迅速透支精力。

Time Rhythm 想解决的核心问题有三类：

- 把时间具象化，让用户直观看见一天的任务占比和剩余时间
- 把复杂任务拆小，降低启动门槛，减少“我不知道从哪开始”的压力
- 把效率工具做得更柔和，既有执行支撑，也有情绪安抚和节奏提醒

## 核心思路

项目围绕三个产品理念展开：

1. **具象化时间**
   用 24 小时视觉圆环替代纯列表式日程，让时间不是数字，而是空间和进度。
2. **降低执行门槛**
   借助 AI 将模糊的大任务拆成可执行的子步骤，并生成父子任务结构与休息节奏。
3. **减少挫败感**
   当任务超时、冲突或排程过载时，系统倾向于温和提醒和动态调整，而不是惩罚式反馈。

## 当前已实现能力

### Web 与后端

- 用户注册、登录、JWT 会话管理
- 任务创建、查询、更新、删除
- 24 小时视觉时间圆环渲染
- 当前任务实时缩减与时间游标显示
- 任务拖拽调整开始时间
- 任务冲突检测与前后端提示
- 父子任务结构与树形任务列表
- AI 任务拆解与批量生成子任务
- 子任务间自动插入休息时间
- 超时温柔弹窗与任务顺延逻辑

### Android MVP

- 登录、注册、会话保持
- 按日期查看任务列表
- 创建、删除、更新任务状态
- 对已有任务触发 AI 拆解并批量生成子任务
- 基础的颜色、时间、日期、能量等级编辑

## 技术栈

### Frontend

- React
- TypeScript
- Vite
- Zustand
- TanStack Query
- Axios

### Backend

- FastAPI
- SQLAlchemy Async
- MySQL
- Alembic
- JWT (`python-jose`)
- LangGraph
- langchain-openai

### Android

- Kotlin
- Jetpack Compose Material 3
- Retrofit + OkHttp
- Kotlinx Serialization
- DataStore
- ViewModel + StateFlow

### AI

- SiliconFlow API
- `Qwen/Qwen3.5-27B`

## 仓库结构

```text
Time_Rhythm/
├── AIPM/                  # 项目背景、PRD、进度与协作文档
├── backend/               # FastAPI 后端
├── frontend/              # React Web 前端
├── Time_Rhythm_APP/       # Android 原生应用
├── .gitignore
└── push-to-github.ps1
```

## 快速开始

### 1. 启动后端

进入 [backend/.env.example](backend/.env.example)，复制为 `backend/.env` 并填写数据库与 AI 配置，然后运行：

```powershell
cd backend
venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```

### 2. 启动前端

```powershell
cd frontend
npm install
npm run dev
```

前端当前通过相对路径 `/api/v1` 请求后端，适合和本地代理或同域部署一起使用，配置见 [frontend/src/api/client.ts](frontend/src/api/client.ts)。

### 3. 启动 Android App

1. 用 Android Studio 打开 `Time_Rhythm_APP`
2. 等待 Gradle 同步完成
3. 确保后端已启动
4. 运行 `app` 模块

Android 端 API 地址通过 `BuildConfig.API_BASE_URL` 注入，网络容器定义位于 [Time_Rhythm_APP/app/src/main/java/com/timerhythm/app/app/AppContainer.kt](Time_Rhythm_APP/app/src/main/java/com/timerhythm/app/app/AppContainer.kt)。

## 配置说明

后端环境变量示例见 [backend/.env.example](backend/.env.example)，主要包括：

- 数据库连接：`DB_HOST`、`DB_PORT`、`DB_USER`、`DB_PASSWORD`、`DB_NAME`
- JWT 配置：`SECRET_KEY`、`ALGORITHM`、`ACCESS_TOKEN_EXPIRE_MINUTES`
- AI 配置：`AI_API_KEY`、`AI_BASE_URL`、`AI_MODEL`

敏感信息不应提交到 Git，仓库已经忽略 `backend/.env`。

## 当前状态与后续方向

根据 [AIPM/项目进度.md](AIPM/项目进度.md)，当前项目已经完成核心 MVP 的大部分能力，下一步重点仍然包括：

- 能量监控（Spoon / Energy Tracking）
- 更完整的拖拽改时长体验
- 更完善的移动端适配
- 持续打磨 AI 拆解与节奏建议体验

## 文档参考
- [AIPM/团队背景.md](AIPM/团队背景.md)
- [AIPM/项目进度.md](AIPM/项目进度.md)
