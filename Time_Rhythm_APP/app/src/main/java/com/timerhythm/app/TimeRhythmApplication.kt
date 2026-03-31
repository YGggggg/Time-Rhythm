package com.timerhythm.app

import android.app.Application
import com.timerhythm.app.app.AppContainer

class TimeRhythmApplication : Application() {
    lateinit var appContainer: AppContainer
        private set

    override fun onCreate() {
        super.onCreate()
        appContainer = AppContainer(applicationContext)
    }
}