package com.timerhythm.app.core.model

data class User(
    val id: String,
    val email: String,
    val username: String,
    val createdAt: String,
)

data class Task(
    val id: String,
    val userId: String,
    val title: String,
    val startTime: String,
    val durationMinutes: Int,
    val color: String,
    val orderIndex: Int,
    val status: TaskStatus,
    val energyLevel: Int,
    val parentId: String?,
    val createdAt: String,
    val updatedAt: String,
)

data class TaskSuggestion(
    val title: String,
    val durationMinutes: Int,
    val energyLevel: Int,
    val color: String,
)

data class TaskDraft(
    val title: String = "",
    val selectedDate: String = DateTimeFormatterExt.todayIsoDate(),
    val startTimeText: String = "09:00",
    val durationMinutes: String = "30",
    val energyLevel: Int = 2,
    val color: String = "#A8B5A2",
)

enum class TaskStatus {
    Pending,
    Active,
    Done,
}

object DateTimeFormatterExt {
    fun todayIsoDate(): String = java.time.LocalDate.now().toString()
}