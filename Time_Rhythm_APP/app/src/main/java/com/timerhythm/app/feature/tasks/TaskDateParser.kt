package com.timerhythm.app.feature.tasks

object TaskDateParser {
    fun parse(date: String, time: String): String? {
        return try {
            val localDate = java.time.LocalDate.parse(date)
            val localTime = java.time.LocalTime.parse(time)
            java.time.LocalDateTime.of(localDate, localTime).toString()
        } catch (_: Exception) {
            null
        }
    }
}