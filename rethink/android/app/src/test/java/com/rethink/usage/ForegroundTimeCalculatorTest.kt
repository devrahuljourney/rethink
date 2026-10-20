package com.rethink.usage

import com.rethink.usage.ForegroundTimeCalculator.Event
import com.rethink.usage.ForegroundTimeCalculator.Kind
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class ForegroundTimeCalculatorTest {

    private val min = 60_000L
    private val start = 1_000 * min
    private val end = start + 600 * min

    private fun resumed(pkg: String, at: Long, cls: String = "Main") = Event(pkg, cls, Kind.RESUMED, at)
    private fun paused(pkg: String, at: Long, cls: String = "Main") = Event(pkg, cls, Kind.PAUSED, at)
    private fun screenOff(at: Long) = Event("android", null, Kind.SCREEN_OFF, at)

    private fun calc(vararg events: Event) = ForegroundTimeCalculator.calculate(events.toList(), start, end)

    @Test fun `sums foreground sessions and counts launches`() {
        val usage = calc(
            resumed("yt", start + 10 * min), paused("yt", start + 40 * min),
            resumed("yt", start + 100 * min), paused("yt", start + 115 * min),
        ).getValue("yt")
        assertEquals(45 * min, usage.foregroundMs)
        assertEquals(2, usage.launches)
    }

    @Test fun `app already open before range start counts only from start`() {
        val usage = calc(resumed("yt", start - 30 * min), paused("yt", start + 20 * min)).getValue("yt")
        assertEquals(20 * min, usage.foregroundMs)
        assertEquals(0, usage.launches)
    }

    @Test fun `app still open at range end counts until end`() {
        assertEquals(5 * min, calc(resumed("yt", end - 5 * min)).getValue("yt").foregroundMs)
    }

    @Test fun `switching activities inside an app is one continuous session`() {
        val usage = calc(
            resumed("ig", start, "Feed"),
            resumed("ig", start + 5 * min, "Reels"), paused("ig", start + 5 * min, "Feed"),
            paused("ig", start + 12 * min, "Reels"),
        ).getValue("ig")
        assertEquals(12 * min, usage.foregroundMs)
        assertEquals(1, usage.launches)
    }

    @Test fun `screen off closes open apps`() {
        val usage = calc(resumed("yt", start), screenOff(start + 3 * min), paused("yt", start + 60 * min))
        assertEquals(3 * min, usage.getValue("yt").foregroundMs)
    }

    @Test fun `sessions entirely before the range are ignored`() =
        assertNull(calc(resumed("yt", start - 60 * min), paused("yt", start - 30 * min))["yt"])
}
