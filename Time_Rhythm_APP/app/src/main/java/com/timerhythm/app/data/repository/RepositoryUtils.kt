package com.timerhythm.app.data.repository

import com.timerhythm.app.core.common.AppResult
import com.timerhythm.app.data.remote.ApiEnvelope
import kotlinx.coroutines.CancellationException
import retrofit2.Response

suspend fun <T, R> parseResponse(
    responseProvider: suspend () -> Response<ApiEnvelope<T>>,
    transform: (T) -> R,
): AppResult<R> {
    return try {
        val response = responseProvider()
        if (!response.isSuccessful) {
            AppResult.Error(response.message().ifBlank { "请求失败" })
        } else {
            val body = response.body()
            when {
                body == null -> AppResult.Error("服务返回为空")
                !body.success -> AppResult.Error(body.error ?: "请求失败")
                body.data == null -> AppResult.Error("服务返回为空")
                else -> AppResult.Success(transform(body.data))
            }
        }
    } catch (error: CancellationException) {
        throw error
    } catch (error: Exception) {
        AppResult.Error(error.message ?: "网络异常")
    }
}

suspend fun parseEmptyResponse(
    responseProvider: suspend () -> Response<ApiEnvelope<Unit>>,
): AppResult<Unit> {
    return try {
        val response = responseProvider()
        if (!response.isSuccessful) {
            AppResult.Error(response.message().ifBlank { "请求失败" })
        } else {
            val body = response.body()
            when {
                body == null -> AppResult.Error("服务返回为空")
                !body.success -> AppResult.Error(body.error ?: "请求失败")
                else -> AppResult.Success(Unit)
            }
        }
    } catch (error: CancellationException) {
        throw error
    } catch (error: Exception) {
        AppResult.Error(error.message ?: "网络异常")
    }
}