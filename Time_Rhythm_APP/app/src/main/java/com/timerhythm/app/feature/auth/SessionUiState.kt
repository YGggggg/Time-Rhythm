package com.timerhythm.app.feature.auth

import com.timerhythm.app.core.model.User

enum class AuthMode {
    Login,
    Register,
}

data class SessionUiState(
    val isReady: Boolean = false,
    val isSubmitting: Boolean = false,
    val mode: AuthMode = AuthMode.Login,
    val email: String = "",
    val username: String = "",
    val password: String = "",
    val user: User? = null,
    val error: String? = null,
)