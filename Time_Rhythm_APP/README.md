# Time Rhythm Android

《时律》原生安卓端 MVP，采用 Kotlin + Jetpack Compose 开发，直接对接现有 FastAPI 后端。

## 已实现

- 登录、注册、会话保持
- 按日期查看任务列表
- 创建、删除、更新任务状态
- 对已有任务触发 AI 拆解并批量生成子任务
- 能量等级、颜色、时间与日期的基础编辑

## 技术栈

- Kotlin 2.0
- Jetpack Compose Material 3
- Retrofit + OkHttp + Kotlinx Serialization
- DataStore 保存 token
- ViewModel + StateFlow

## 后端地址

默认地址为 `http://10.0.2.2:8000/`，对应 Android 模拟器访问本机开发机后端。

如需修改，请编辑 `app/src/main/java/com/timerhythm/app/app/AppContainer.kt` 中的 `baseUrl`。

## 运行

1. 用 Android Studio 打开 `Time_Rhythm_APP`
2. 等待 Gradle 同步
3. 启动后端服务
4. 运行 `app` 模块

## 当前范围

这是原生 Android 首版，不包含 Web 端的圆环拖拽、超时弹窗和睡眠窗口跳过逻辑。结构已为后续扩展保留空间。