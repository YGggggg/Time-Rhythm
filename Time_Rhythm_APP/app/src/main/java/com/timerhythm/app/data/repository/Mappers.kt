package com.timerhythm.app.data.repository

import com.timerhythm.app.core.model.Task
import com.timerhythm.app.core.model.TaskStatus
import com.timerhythm.app.core.model.TaskSuggestion
import com.timerhythm.app.core.model.User
import com.timerhythm.app.data.remote.TaskDto
import com.timerhythm.app.data.remote.TaskSuggestionDto
import com.timerhythm.app.data.remote.UserDto

fun UserDto.toModel(): User = User(
    id = id,
    email = email,
    username = username,
    createdAt = createdAt,
)

fun TaskDto.toModel(): Task = Task(
    id = id,
    userId = userId,
    title = title,
    startTime = startTime,
    durationMinutes = durationMinutes,
    color = color,
    orderIndex = orderIndex,
    status = status.toTaskStatus(),
    energyLevel = energyLevel,
    parentId = parentId,
    createdAt = createdAt,
    updatedAt = updatedAt,
)

fun TaskSuggestionDto.toModel(): TaskSuggestion = TaskSuggestion(
    title = title,
    durationMinutes = durationMinutes,
    energyLevel = energyLevel,
    color = color,
)

fun String.toTaskStatus(): TaskStatus {
    return when (this) {
        "pending" -> TaskStatus.Pending
        "active" -> TaskStatus.Active
        "done" -> TaskStatus.Done
        else -> TaskStatus.Pending
    }
}

fun TaskStatus.toApiStatus(): String {
    return when (this) {
        TaskStatus.Pending -> "pending"
        TaskStatus.Active -> "active"
        TaskStatus.Done -> "done"
    }
}