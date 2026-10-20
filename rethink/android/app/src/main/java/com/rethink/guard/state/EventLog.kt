package com.rethink.guard.state

import android.content.SharedPreferences
import org.json.JSONArray
import org.json.JSONObject

/**
 * Outcome log consumed by JS (stats, coach, backend sync). Stays on device until JS drains it.
 * Bounded so a long-closed app can never grow it without limit.
 */
class EventLog(private val prefs: SharedPreferences) {

    enum class Outcome(val wire: String) {
        GATED("gated"),
        OPENED("opened"),
        DISMISSED("dismissed"),
        SHIELDED("shielded"),
        BLOCKED("blocked"),
    }

    /** Invoked after each append so a live JS runtime can drain immediately. */
    @Volatile
    var onAppended: (() -> Unit)? = null

    @Synchronized
    fun append(packageName: String, outcome: Outcome, now: Long, sessionMinutes: Int? = null) {
        val event = JSONObject()
            .put("packageName", packageName)
            .put("outcome", outcome.wire)
            .put("timestamp", now)
        if (sessionMinutes != null) event.put("sessionMinutes", sessionMinutes)

        val events = read().put(event)
        while (events.length() > MAX_EVENTS) events.remove(0)
        prefs.edit().putString(KEY_EVENTS, events.toString()).apply()
        onAppended?.invoke()
    }

    @Synchronized
    fun drain(): JSONArray {
        val events = read()
        prefs.edit().remove(KEY_EVENTS).apply()
        return events
    }

    private fun read(): JSONArray = try {
        JSONArray(prefs.getString(KEY_EVENTS, null) ?: "[]")
    } catch (_: Exception) {
        JSONArray()
    }

    private companion object {
        const val KEY_EVENTS = "events"
        const val MAX_EVENTS = 1000
    }
}
