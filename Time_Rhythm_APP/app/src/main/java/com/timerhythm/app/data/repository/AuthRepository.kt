package com.timerhythm.app.data.repository

import com.timerhythm.app.core.common.AppResult
import com.timerhythm.app.core.model.User
import com.timerhythm.app.data.local.SessionStorage
import com.timerhythm.app.data.remote.LoginRequest
import com.timerhythm.app.data.remote.RegisterRequest
import com.timerhythm.app.data.remote.TimeRhythmApiService

class AuthRepository(
    private val apiService: TimeRhythmApiService,
    private val sessionStorage: SessionStorage,
) {
    suspend fun register(email: String, username: String, password: String): AppResult<User> {
        return parseResponse(
            responseProvider = { apiService.register(RegisterRequest(email, username, password)) },
            transform = { dto -> dto.toModel() },
        )
    }

    suspend fun login(email: String, password: String): AppResult<Unit> {
        return when (
            val result = parseResponse(
                responseProvider = { apiService.login(LoginRequest(email, password)) },
                transform = { dto -> dto.accessToken },
            )
        ) {
            is AppResult.Success -> {
                sessionStorage.saveToken(result.data)
                AppResult.Success(Unit)
            }

            is AppResult.Error -> result
        }
    }

    suspend fun getCurrentUser(): AppResult<User> {
        val token = sessionStorage.readToken() ?: return AppResult.Error("未登录")
        return parseResponse(
            responseProvider = { apiService.me("Bearer $token") },
            transform = { dto -> dto.toModel() },
        )
    }

    suspend fun hasToken(): Boolean = sessionStorage.readToken() != null

    suspend fun logout() {
        sessionStorage.clearToken()
    }
}