package com.rethink.guard.detect

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class ForegroundTrackerTest {

    private val apps = setOf("com.instagram.android", "com.launcher", "com.whatsapp")
    private val tracker = ForegroundTracker(
        ownPackage = "com.rethink",
        isSwitchTarget = { it in apps },
        isTransient = { it == "com.android.systemui" || it == "com.keyboard" },
    )

    private fun event(pkg: String, cls: String? = "Activity", changes: Int = 0) =
        tracker.onWindowStateChanged(pkg, cls, changes)

    @Test fun `reports real switches with the previous app`() {
        assertEquals(AppSwitch(null, "com.launcher"), event("com.launcher"))
        assertEquals(AppSwitch("com.launcher", "com.instagram.android"), event("com.instagram.android"))
    }

    @Test fun `ignores repeated events from the same app`() {
        event("com.instagram.android")
        assertNull(event("com.instagram.android", "OtherActivity"))
    }

    @Test fun `ignores notification shade, keyboards and soft input windows`() {
        event("com.instagram.android")
        assertNull(event("com.android.systemui"))
        assertNull(event("com.keyboard"))
        assertNull(event("com.launcher", ForegroundTracker.SOFT_INPUT_WINDOW))
        assertEquals("com.instagram.android", tracker.current)
    }

    @Test fun `ignores pane disappeared events`() {
        event("com.launcher")
        assertNull(event("com.instagram.android", changes = ForegroundTracker.CONTENT_CHANGE_TYPE_PANE_DISAPPEARED))
    }

    @Test fun `ignores packages that are not apps`() =
        assertNull(event("com.google.android.permissioncontroller"))

    @Test fun `own package counts as a switch so leaving a guarded app is recorded`() {
        event("com.instagram.android")
        assertEquals(AppSwitch("com.instagram.android", "com.rethink"), event("com.rethink"))
    }

    @Test fun `whatsapp call screens never count as opening whatsapp`() {
        event("com.launcher")
        assertNull(event("com.whatsapp", "com.whatsapp.calling.VoipActivity"))
        assertEquals(AppSwitch("com.launcher", "com.whatsapp"), event("com.whatsapp", "com.whatsapp.HomeActivity"))
    }
}
