package com.timerhythm.app.app

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.timerhythm.app.feature.auth.SessionViewModel
import com.timerhythm.app.feature.tasks.TasksViewModel

class AppViewModelFactory(
    private val appContainer: AppContainer,
) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        return when {
            modelClass.isAssignableFrom(SessionViewModel::class.java) -> {
                SessionViewModel(appContainer.authRepository) as T
            }

            modelClass.isAssignableFrom(TasksViewModel::class.java) -> {
                TasksViewModel(appContainer.taskRepository) as T
            }

            else -> error("Unknown ViewModel class: ${modelClass.name}")
        }
    }
}