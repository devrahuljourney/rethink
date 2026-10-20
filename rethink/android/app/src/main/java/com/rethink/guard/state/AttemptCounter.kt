package com.rethink.guard.state

import android.content.SharedPreferences
import org.json.JSONArray
import org.json.JSONObject

/** Rolling 24h count of gate appearances per app, shown on the breathing screen. */
class AttemptCounter(private val prefs: SharedPreferences) {

    /** Records an attempt and returns the count in the last 24 hours, including this one. */
    @Synchronized
    fun record(packageName: String, now: Long): Int {
        val all = read()
        val recent = all.timestamps(packageName).filter { now - it < DAY_MS } + now
        all.put(packageName, JSONArray(recent))
        prefs.edit().putString(KEY_ATTEMPTS, all.toString()).apply()
        return recent.size
    }

    @Synchronized
    fun countLast24h(packageName: String, now: Long): Int =
        read().timestamps(packageName).count { now - it < DAY_MS }

    private fun read(): JSONObject = try {
        JSONObject(prefs.getString(KEY_ATTEMPTS, null) ?: "{}")
    } catch (_: Exception) {
        JSONObject()
    }

    private fun JSONObject.timestamps(packageName: String): List<Long> {
        val array = optJSONArray(packageName) ?: return emptyList()
        return (0 until array.length()).map { array.getLong(it) }
    }

    private companion object {
        const val KEY_ATTEMPTS = "attempts"
        const val DAY_MS = 24 * 60 * 60 * 1000L
    }
}
