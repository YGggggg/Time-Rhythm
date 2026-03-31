package com.timerhythm.app.feature.tasks

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class TaskRepositoryTest {
    @Test
    fun `task date parser returns local iso datetime`() {
        val result = TaskDateParser.parse("2026-03-30", "09:45")

        assertEquals("2026-03-30T09:45", result)
    }

    @Test
    fun `task date parser returns null for invalid time`() {
        val result = TaskDateParser.parse("2026-03-30", "9:99")

        assertNull(result)
    }
}