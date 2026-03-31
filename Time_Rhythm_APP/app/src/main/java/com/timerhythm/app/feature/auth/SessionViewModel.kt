package com.timerhythm.app.feature.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.timerhythm.app.core.common.AppResult
import com.timerhythm.app.data.repository.AuthRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

class SessionViewModel(
    private val authRepository: AuthRepository,
) : ViewModel() {
    private val _uiState = MutableStateFlow(SessionUiState())
    val uiState: StateFlow<SessionUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            if (!authRepository.hasToken()) {
                _uiState.update { it.copy(isReady = true) }
            } else {
                refreshUser()
            }
        }
    }

    fun setEmail(value: String) {
        _uiState.update { it.copy(email = value, error = null) }
    }

    fun setUsername(value: String) {
        _uiState.update { it.copy(username = value, error = null) }
    }

    fun setPassword(value: String) {
        _uiState.update { it.copy(password = value, error = null) }
    }

    fun toggleMode() {
        _uiState.update {
            it.copy(
                mode = if (it.mode == AuthMode.Login) AuthMode.Register else AuthMode.Login,
                error = null,
            )
        }
    }

    fun submit() {
        val snapshot = _uiState.value
        if (snapshot.email.isBlank() || snapshot.password.isBlank()) {
            _uiState.update { it.copy(error = "邮箱和密码不能为空") }
            return
        }
        if (snapshot.mode == AuthMode.Register && snapshot.username.isBlank()) {
            _uiState.update { it.copy(error = "用户名不能为空") }
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isSubmitting = true, error = null) }

            val result = if (snapshot.mode == AuthMode.Login) {
                authRepository.login(snapshot.email.trim(), snapshot.password)
            } else {
                when (
                    val registerResult = authRepository.register(
                        email = snapshot.email.trim(),
                        username = snapshot.username.trim(),
                        password = snapshot.password,
                    )
                ) {
                    is AppResult.Success -> authRepository.login(snapshot.email.trim(), snapshot.password)
                    is AppResult.Error -> registerResult
                }
            }

            when (result) {
                is AppResult.Success -> refreshUser()
                is AppResult.Error -> {
                    _uiState.update {
                        it.copy(
                            isReady = true,
                            isSubmitting = false,
                            error = result.message,
                            password = "",
                        )
                    }
                }
            }
        }
    }

    fun logout() {
        viewModelScope.launch {
            authRepository.logout()
            _uiState.value = SessionUiState(isReady = true)
        }
    }

    private suspend fun refreshUser() {
        when (val userResult = authRepository.getCurrentUser()) {
            is AppResult.Success -> {
                _uiState.update {
                    it.copy(
                        isReady = true,
                        isSubmitting = false,
                        user = userResult.data,
                        error = null,
                        password = "",
                    )
                }
            }

            is AppResult.Error -> {
                authRepository.logout()
                _uiState.value = SessionUiState(isReady = true, error = userResult.message, password = "")
            }
        }
    }
}