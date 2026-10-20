package com.rethink.guard.detect

/** A real move of the user from one app to another. */
data class AppSwitch(val from: String?, val to: String)

/**
 * Turns noisy TYPE_WINDOW_STATE_CHANGED events into real app switches.
 * Pure Kotlin: the Android-specific inputs (launchable apps, keyboards) are injected.
 */
class ForegroundTracker(
    private val ownPackage: String,
    private val isSwitchTarget: (String) -> Boolean,
    private val isTransient: (String) -> Boolean,
) {
    var current: String? = null
        private set

    fun onWindowStateChanged(packageName: String, className: String?, contentChangeTypes: Int): AppSwitch? {
        if (packageName == current) return null
        if (contentChangeTypes and CONTENT_CHANGE_TYPE_PANE_DISAPPEARED != 0) return null
        if (className == SOFT_INPUT_WINDOW) return null
        if (isTransient(packageName)) return null
        if (isInternalSwitch(packageName, className)) return null
        if (packageName != ownPackage && !isSwitchTarget(packageName)) return null

        val switch = AppSwitch(current, packageName)
        current = packageName
        return switch
    }

    /** Used when the gate grants access, so the session starts before the next window event. */
    fun forceCurrent(packageName: String) {
        current = packageName
    }

    private fun isInternalSwitch(packageName: String, className: String?): Boolean {
        val prefixes = INTERNAL_CLASS_PREFIXES[packageName] ?: return false
        return className != null && prefixes.any { className.startsWith(it) }
    }

    companion object {
        // AccessibilityEvent.CONTENT_CHANGE_TYPE_PANE_DISAPPEARED, inlined to keep this class JVM-testable.
        const val CONTENT_CHANGE_TYPE_PANE_DISAPPEARED = 32
        const val SOFT_INPUT_WINDOW = "android.inputmethodservice.SoftInputWindow"

        /** Screens that belong to a guarded app but must never trigger the gate (e.g. incoming calls). */
        private val INTERNAL_CLASS_PREFIXES = mapOf(
            "com.whatsapp" to listOf("com.whatsapp.calling.", "com.whatsapp.voipcalling."),
        )
    }
}
