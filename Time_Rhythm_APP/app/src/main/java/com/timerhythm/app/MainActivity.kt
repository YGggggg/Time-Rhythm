package com.timerhythm.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.runtime.getValue
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.timerhythm.app.app.AppViewModelFactory
import com.timerhythm.app.feature.auth.AuthScreen
import com.timerhythm.app.feature.auth.SessionViewModel
import com.timerhythm.app.feature.tasks.TasksScreen
import com.timerhythm.app.feature.tasks.TasksViewModel
import com.timerhythm.app.ui.theme.TimeRhythmTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        val factory = AppViewModelFactory((application as TimeRhythmApplication).appContainer)

        setContent {
            TimeRhythmTheme {
                val sessionViewModel: SessionViewModel = viewModel(factory = factory)
                val sessionState by sessionViewModel.uiState.collectAsStateWithLifecycle()

                if (!sessionState.isReady) {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center,
                    ) {
                        CircularProgressIndicator()
                    }
                } else if (sessionState.user != null) {
                    val tasksViewModel: TasksViewModel = viewModel(factory = factory)
                    TasksScreen(
                        sessionState = sessionState,
                        tasksViewModel = tasksViewModel,
                        onLogout = sessionViewModel::logout,
                    )
                } else {
                    AuthScreen(
                        state = sessionState,
                        onEmailChanged = sessionViewModel::setEmail,
                        onUsernameChanged = sessionViewModel::setUsername,
                        onPasswordChanged = sessionViewModel::setPassword,
                        onToggleMode = sessionViewModel::toggleMode,
                        onSubmit = sessionViewModel::submit,
                    )
                }
            }
        }
    }
}