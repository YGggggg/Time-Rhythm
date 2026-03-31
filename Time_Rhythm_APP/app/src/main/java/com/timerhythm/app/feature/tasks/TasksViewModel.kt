package com.timerhythm.app.feature.tasks

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.timerhythm.app.core.common.AppResult
import com.timerhythm.app.core.model.Task
import com.timerhythm.app.core.model.TaskDraft
import com.timerhythm.app.core.model.TaskStatus
import com.timerhythm.app.data.repository.TaskRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.time.LocalDateTime
import java.time.format.DateTimeParseException
import java.time.format.DateTimeFormatter

class TasksViewModel(
    private val taskRepository: TaskRepository,
) : ViewModel() {
    private val _uiState = MutableStateFlow(TasksUiState())
    val uiState: StateFlow<TasksUiState> = _uiState.asStateFlow()

    init {
        loadTasks(_uiState.value.selectedDate)
    }

    fun loadTasks(date: String) {
        _uiState.update {
            it.copy(
                selectedDate = date,
                draft = it.draft.copy(selectedDate = date),
                isLoading = true,
                error = null,
            )
        }

        viewModelScope.launch {
            when (val result = taskRepository.getTasks(date)) {
                is AppResult.Success -> {
                    _uiState.update {
                        it.copy(
                            tasks = result.data.sortedBy(Task::startTime),
                            isLoading = false,
                        )
                    }
                }

                is AppResult.Error -> {
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            error = result.message,
                        )
                    }
                }
            }
        }
    }

    fun shiftDate(days: Long) {
        val nextDate = java.time.LocalDate.parse(_uiState.value.selectedDate).plusDays(days).toString()
        loadTasks(nextDate)
    }

    fun showCreateSheet() {
        _uiState.update { it.copy(isCreateSheetOpen = true, error = null) }
    }

    fun hideCreateSheet() {
        _uiState.update { it.copy(isCreateSheetOpen = false) }
    }

    fun updateDraft(transform: (TaskDraft) -> TaskDraft) {
        _uiState.update { it.copy(draft = transform(it.draft), error = null) }
    }

    fun submitDraft() {
        val snapshot = _uiState.value
        if (snapshot.draft.title.isBlank()) {
            _uiState.update { it.copy(error = "任务标题不能为空") }
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            when (val result = taskRepository.createTask(snapshot.draft)) {
                is AppResult.Success -> {
                    val createdDate = snapshot.draft.selectedDate
                    _uiState.update {
                        it.copy(
                            draft = TaskDraft(selectedDate = createdDate),
                            isCreateSheetOpen = false,
                        )
                    }
                    loadTasks(createdDate)
                }

                is AppResult.Error -> {
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            error = result.message,
                        )
                    }
                }
            }
        }
    }

    fun updateStatus(task: Task, status: TaskStatus) {
        viewModelScope.launch {
            when (val result = taskRepository.updateTaskStatus(task.id, status)) {
                is AppResult.Success -> {
                    _uiState.update {
                        it.copy(tasks = it.tasks.map { existing ->
                            if (existing.id == task.id) result.data else existing
                        })
                    }
                }

                is AppResult.Error -> {
                    _uiState.update { it.copy(error = result.message) }
                }
            }
        }
    }

    fun deleteTask(taskId: String) {
        viewModelScope.launch {
            when (val result = taskRepository.deleteTask(taskId)) {
                is AppResult.Success -> {
                    _uiState.update {
                        it.copy(tasks = it.tasks.filterNot { existing -> existing.id == taskId })
                    }
                }

                is AppResult.Error -> {
                    _uiState.update { it.copy(error = result.message) }
                }
            }
        }
    }

    fun openDecompose(task: Task) {
        _uiState.update {
            it.copy(
                decomposeTarget = task,
                decomposeHint = "",
                suggestions = emptyList(),
                error = null,
            )
        }
    }

    fun closeDecompose() {
        _uiState.update {
            it.copy(
                decomposeTarget = null,
                decomposeHint = "",
                suggestions = emptyList(),
                isDecomposing = false,
                isApplyingSuggestions = false,
            )
        }
    }

    fun setDecomposeHint(value: String) {
        _uiState.update { it.copy(decomposeHint = value, error = null) }
    }

    fun generateSuggestions() {
        val target = _uiState.value.decomposeTarget ?: return
        viewModelScope.launch {
            _uiState.update { it.copy(isDecomposing = true, error = null) }
            when (val result = taskRepository.decomposeTask(target.id, _uiState.value.decomposeHint)) {
                is AppResult.Success -> {
                    _uiState.update {
                        it.copy(
                            suggestions = result.data,
                            isDecomposing = false,
                        )
                    }
                }

                is AppResult.Error -> {
                    _uiState.update {
                        it.copy(
                            isDecomposing = false,
                            error = result.message,
                        )
                    }
                }
            }
        }
    }

    fun applySuggestions() {
        val state = _uiState.value
        val target = state.decomposeTarget ?: return
        if (state.suggestions.isEmpty()) {
            _uiState.update { it.copy(error = "请先生成拆解建议") }
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isApplyingSuggestions = true, error = null) }

            val parentStart = try {
                LocalDateTime.parse(target.startTime)
            } catch (_: DateTimeParseException) {
                null
            }
            if (parentStart == null) {
                _uiState.update {
                    it.copy(
                        isApplyingSuggestions = false,
                        error = "父任务时间格式错误",
                    )
                }
                return@launch
            }

            var cursor = parentStart
            var totalDuration = 0

            for (suggestion in state.suggestions) {
                val draft = TaskDraft(
                    title = suggestion.title,
                    selectedDate = cursor.toLocalDate().toString(),
                    startTimeText = cursor.toLocalTime().format(TIME_FORMATTER),
                    durationMinutes = suggestion.durationMinutes.toString(),
                    energyLevel = suggestion.energyLevel,
                    color = suggestion.color,
                )
                when (val createResult = taskRepository.createTask(draft, parentId = target.id)) {
                    is AppResult.Success -> {
                        cursor = cursor.plusMinutes(suggestion.durationMinutes.toLong())
                        totalDuration += suggestion.durationMinutes
                    }

                    is AppResult.Error -> {
                        _uiState.update {
                            it.copy(
                                isApplyingSuggestions = false,
                                error = createResult.message,
                            )
                        }
                        return@launch
                    }
                }
            }

            when (val durationResult = taskRepository.updateTaskDuration(target.id, totalDuration)) {
                is AppResult.Success -> {
                    closeDecompose()
                    loadTasks(_uiState.value.selectedDate)
                }

                is AppResult.Error -> {
                    _uiState.update {
                        it.copy(
                            isApplyingSuggestions = false,
                            error = durationResult.message,
                        )
                    }
                }
            }
        }
    }

    companion object {
        private val TIME_FORMATTER: DateTimeFormatter = DateTimeFormatter.ofPattern("HH:mm")
    }
}