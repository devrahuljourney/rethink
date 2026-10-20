package com.rethink.guard.gate

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertNull
import org.junit.Test
import kotlin.random.Random

class PauseContentTest {

    @Test fun `running out of time wins over every other moment`() =
        assertEquals(Moment.TIME_UP, PauseContent.moment(hour = 1, attempts = 9, timeUp = true))

    @Test fun `late night is named before repeated opens`() =
        assertEquals(Moment.LATE_NIGHT, PauseContent.moment(hour = 23, attempts = 9, timeUp = false))

    @Test fun `fourth open in a day is a repeat`() =
        assertEquals(Moment.REPEAT, PauseContent.moment(hour = 14, attempts = 4, timeUp = false))

    @Test fun `early morning`() =
        assertEquals(Moment.EARLY_MORNING, PauseContent.moment(hour = 7, attempts = 1, timeUp = false))

    @Test fun `ordinary afternoon`() =
        assertEquals(Moment.ANY, PauseContent.moment(hour = 15, attempts = 2, timeUp = false))

    @Test fun `late night opener shows the time`() {
        val copy = PauseContent.compose("Instagram", attempts = 1, hour = 1, clock = "1:12 am", timeUp = false, customMessage = null)
        assertEquals("It's 1:12 am.", copy.opener)
        assertNull(copy.caption)
    }

    @Test fun `repeat opener carries the count so the caption does not repeat it`() {
        val copy = PauseContent.compose("Instagram", attempts = 7, hour = 15, clock = "", timeUp = false, customMessage = null)
        assertEquals("7th time reaching for Instagram in 24 hours.", copy.opener)
        assertNull(copy.caption)
    }

    @Test fun `the same quote never shows twice in a row`() {
        val random = Random(42)
        var previous = PauseContent.pickQuote(Moment.REPEAT, null, random)
        repeat(50) {
            val next = PauseContent.pickQuote(Moment.REPEAT, null, random)
            assertNotEquals(previous, next)
            previous = next
        }
    }

    @Test fun `specific reason has no reflection`() =
        assertNull(PauseContent.reflection(Reason.SPECIFIC, "Instagram"))

    @Test fun ordinals() =
        assertEquals(listOf("1st", "2nd", "3rd", "4th", "11th", "12th", "13th", "21st"), listOf(1, 2, 3, 4, 11, 12, 13, 21).map(::ordinal))
}
