package com.rethink.guard.state

import android.content.Context
import android.content.SharedPreferences

/**
 * Process-wide entry point to guard state. Shared by the accessibility service,
 * the gate activity and the React Native module, which all run in the app process.
 */
object GuardStore {

    private const val PREFS = "rethink_guard"
    private const val KEY_A11Y_OPENED_AT = "a11y_settings_opened_at"
    private const val RETURN_WINDOW_MS = 2 * 60 * 1000L

    lateinit var config: ConfigRepository
        private set
    lateinit var sessions: SessionRepository
        private set
    lateinit var attempts: AttemptCounter
        private set
    lateinit var events: EventLog
        private set

    private lateinit var prefs: SharedPreferences

    @Volatile
    private var initialized = false

    fun init(context: Context) {
        if (initialized) return
        synchronized(this) {
            if (initialized) return
            prefs = context.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            config = ConfigRepository(prefs)
            sessions = SessionRepository(prefs)
            attempts = AttemptCounter(prefs)
            events = EventLog(prefs)
            initialized = true
        }
    }

    /** Onboarding: remember that we sent the user to accessibility settings. */
    fun markAccessibilitySettingsOpened(now: Long) {
        prefs.edit().putLong(KEY_A11Y_OPENED_AT, now).apply()
    }

    /** True (once) if the user enabled the service shortly after we sent them to settings. */
    fun consumeRecentAccessibilitySetup(now: Long): Boolean {
        val openedAt = prefs.getLong(KEY_A11Y_OPENED_AT, 0L)
        if (openedAt == 0L) return false
        prefs.edit().remove(KEY_A11Y_OPENED_AT).apply()
        return now - openedAt < RETURN_WINDOW_MS
    }
}
