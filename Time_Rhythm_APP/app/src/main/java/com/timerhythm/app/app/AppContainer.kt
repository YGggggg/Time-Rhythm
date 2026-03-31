package com.timerhythm.app.app

import android.content.Context
import com.jakewharton.retrofit2.converter.kotlinx.serialization.asConverterFactory
import com.timerhythm.app.BuildConfig
import com.timerhythm.app.data.local.SessionStorage
import com.timerhythm.app.data.remote.TimeRhythmApiService
import com.timerhythm.app.data.repository.AuthRepository
import com.timerhythm.app.data.repository.TaskRepository
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import java.util.concurrent.TimeUnit

class AppContainer(context: Context) {
    private val json = Json {
        ignoreUnknownKeys = true
        explicitNulls = false
    }

    private val loggingInterceptor = HttpLoggingInterceptor().apply {
        level = if (BuildConfig.DEBUG) {
            HttpLoggingInterceptor.Level.BASIC
        } else {
            HttpLoggingInterceptor.Level.NONE
        }
    }

    private val httpClient = OkHttpClient.Builder()
        .addInterceptor(loggingInterceptor)
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(20, TimeUnit.SECONDS)
        .writeTimeout(20, TimeUnit.SECONDS)
        .build()

    private val baseUrl = BuildConfig.API_BASE_URL

    private val retrofit = Retrofit.Builder()
        .baseUrl(baseUrl)
        .client(httpClient)
        .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
        .build()

    private val apiService: TimeRhythmApiService = retrofit.create(TimeRhythmApiService::class.java)

    private val sessionStorage = SessionStorage(context)

    val authRepository = AuthRepository(apiService, sessionStorage)
    val taskRepository = TaskRepository(apiService, sessionStorage)
}