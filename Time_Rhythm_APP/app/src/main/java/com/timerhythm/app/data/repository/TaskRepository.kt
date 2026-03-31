package com.timerhythm.app.data.repository

import com.timerhythm.app.core.common.AppResult
import com.timerhythm.app.core.model.Task
import com.timerhythm.app.core.model.TaskDraft
import com.timerhythm.app.core.model.TaskStatus
import com.timerhythm.app.core.model.TaskSuggestion
import com.timerhythm.app.data.local.SessionStorage
import com.timerhythm.app.data.remote.CreateTaskRequest
import com.timerhythm.app.data.remote.DecomposeRequest
import com.timerhythm.app.data.remote.TimeRhythmApiService
import com.timerhythm.app.data.remote.UpdateTaskRequest
import com.timerhythm.app.feature.tasks.TaskDateParser

class TaskRepository(
    private val apiService: TimeRhythmApiService,
    private val sessionStorage: SessionStorage,
) {
    suspend fun getTasks(date: String): AppResult<List<Task>> {
        val authorization = buildAuthorization() ?: return AppResult.Error("未登录")
        return parseResponse(
            responseProvider = { apiService.getTasks(authorization, date) },
            transform = { dtoList -> dtoList.map { it.toModel() } },
        )
    }

    suspend fun createTask(draft: TaskDraft, parentId: String? = null): AppResult<Task> {
        val authorization = buildAuthorization() ?: return AppResult.Error("未登录")
        val startTime = TaskDateParser.parse(draft.selectedDate, draft.startTimeText)
            ?: return AppResult.Error("时间格式应为 HH:mm")
        val duration = draft.durationMinutes.toIntOrNull()
            ?: return AppResult.Error("时长必须为数字")
        if (duration !in 5..480) {
            return AppResult.Error("任务时长需在 5 到 480 分钟之间")
        }

        val body = CreateTaskRequest(
            title = draft.title.trim(),
            startTime = startTime,
            durationMinutes = duration,
            color = draft.color,
            energyLevel = draft.energyLevel,
            parentId = parentId,
        )

        return parseResponse(
            responseProvider = { apiService.createTask(authorization, body) },
            transform = { dto -> dto.toModel() },
        )
    }

    suspend fun updateTaskStatus(taskId: String, status: TaskStatus): AppResult<Task> {
        val authorization = buildAuthorization() ?: return AppResult.Error("未登录")
        return parseResponse(
            responseProvider = {
                apiService.updateTask(
                    authorization = authorization,
                    taskId = taskId,
                    body = UpdateTaskRequest(status = status.toApiStatus()),
                )
            },
            transform = { dto -> dto.toModel() },
        )
    }

    suspend fun updateTaskDuration(taskId: String, durationMinutes: Int): AppResult<Task> {
        val authorization = buildAuthorization() ?: return AppResult.Error("未登录")
        return parseResponse(
            responseProvider = {
                apiService.updateTask(
                    authorization = authorization,
                    taskId = taskId,
                    body = UpdateTaskRequest(durationMinutes = durationMinutes),
                )
            },
            transform = { dto -> dto.toModel() },
        )
    }

    suspend fun deleteTask(taskId: String): AppResult<Unit> {
        val authorization = buildAuthorization() ?: return AppResult.Error("未登录")
        return parseEmptyResponse(responseProvider = { apiService.deleteTask(authorization, taskId) })
    }

    suspend fun decomposeTask(taskId: String, hint: String): AppResult<List<TaskSuggestion>> {
        val authorization = buildAuthorization() ?: return AppResult.Error("未登录")
        return parseResponse(
            responseProvider = {
                apiService.decomposeTask(
                    authorization = authorization,
                    taskId = taskId,
                    body = DecomposeRequest(hint = hint.takeIf { it.isNotBlank() }),
                )
            },
            transform = { dto -> dto.subtasks.map { it.toModel() } },
        )
    }

    private suspend fun buildAuthorization(): String? {
        val token = sessionStorage.readToken() ?: return null
        return "Bearer $token"
    }
}