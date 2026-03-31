package com.timerhythm.app.feature.tasks

import com.timerhythm.app.core.model.Task
import com.timerhythm.app.core.model.TaskDraft
import com.timerhythm.app.core.model.TaskSuggestion

data class TasksUiState(
    val selectedDate: String = TaskDraft().selectedDate,
    val tasks: List<Task> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null,
    val draft: TaskDraft = TaskDraft(),
    val isCreateSheetOpen: Boolean = false,
    val decomposeTarget: Task? = null,
    val decomposeHint: String = "",
    val suggestions: List<TaskSuggestion> = emptyList(),
    val isDecomposing: Boolean = false,
    val isApplyingSuggestions: Boolean = false,
)