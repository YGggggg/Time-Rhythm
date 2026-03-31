package com.timerhythm.app.data.remote

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path
import retrofit2.http.Query

@Serializable
data class ApiEnvelope<T>(
    val success: Boolean,
    val data: T? = null,
    val error: String? = null,
)

@Serializable
data class TokenDto(
    @SerialName("access_token") val accessToken: String,
    @SerialName("token_type") val tokenType: String,
)

@Serializable
data class UserDto(
    val id: String,
    val email: String,
    val username: String,
    @SerialName("created_at") val createdAt: String,
)

@Serializable
data class TaskDto(
    val id: String,
    @SerialName("user_id") val userId: String,
    val title: String,
    @SerialName("start_time") val startTime: String,
    @SerialName("duration_minutes") val durationMinutes: Int,
    val color: String,
    @SerialName("order_index") val orderIndex: Int,
    val status: String,
    @SerialName("energy_level") val energyLevel: Int,
    @SerialName("parent_id") val parentId: String? = null,
    @SerialName("created_at") val createdAt: String,
    @SerialName("updated_at") val updatedAt: String,
)

@Serializable
data class TaskSuggestionDto(
    val title: String,
    @SerialName("duration_minutes") val durationMinutes: Int,
    @SerialName("energy_level") val energyLevel: Int,
    val color: String,
)

@Serializable
data class DecomposeResultDto(
    @SerialName("original_task_id") val originalTaskId: String,
    val subtasks: List<TaskSuggestionDto>,
)

@Serializable
data class LoginRequest(
    val email: String,
    val password: String,
)

@Serializable
data class RegisterRequest(
    val email: String,
    val username: String,
    val password: String,
)

@Serializable
data class CreateTaskRequest(
    val title: String,
    @SerialName("start_time") val startTime: String,
    @SerialName("duration_minutes") val durationMinutes: Int,
    val color: String,
    @SerialName("energy_level") val energyLevel: Int,
    @SerialName("parent_id") val parentId: String? = null,
)

@Serializable
data class UpdateTaskRequest(
    val title: String? = null,
    @SerialName("start_time") val startTime: String? = null,
    @SerialName("duration_minutes") val durationMinutes: Int? = null,
    val color: String? = null,
    val status: String? = null,
    @SerialName("energy_level") val energyLevel: Int? = null,
    @SerialName("parent_id") val parentId: String? = null,
)

@Serializable
data class DecomposeRequest(
    val hint: String? = null,
    @SerialName("max_subtasks") val maxSubtasks: Int = 5,
)

interface TimeRhythmApiService {
    @POST("auth/register")
    suspend fun register(@Body body: RegisterRequest): Response<ApiEnvelope<UserDto>>

    @POST("auth/login")
    suspend fun login(@Body body: LoginRequest): Response<ApiEnvelope<TokenDto>>

    @GET("auth/me")
    suspend fun me(@Header("Authorization") authorization: String): Response<ApiEnvelope<UserDto>>

    @GET("tasks")
    suspend fun getTasks(
        @Header("Authorization") authorization: String,
        @Query("date") date: String,
    ): Response<ApiEnvelope<List<TaskDto>>>

    @POST("tasks")
    suspend fun createTask(
        @Header("Authorization") authorization: String,
        @Body body: CreateTaskRequest,
    ): Response<ApiEnvelope<TaskDto>>

    @PUT("tasks/{taskId}")
    suspend fun updateTask(
        @Header("Authorization") authorization: String,
        @Path("taskId") taskId: String,
        @Body body: UpdateTaskRequest,
    ): Response<ApiEnvelope<TaskDto>>

    @DELETE("tasks/{taskId}")
    suspend fun deleteTask(
        @Header("Authorization") authorization: String,
        @Path("taskId") taskId: String,
    ): Response<ApiEnvelope<Unit>>

    @POST("tasks/{taskId}/decompose")
    suspend fun decomposeTask(
        @Header("Authorization") authorization: String,
        @Path("taskId") taskId: String,
        @Body body: DecomposeRequest,
    ): Response<ApiEnvelope<DecomposeResultDto>>
}