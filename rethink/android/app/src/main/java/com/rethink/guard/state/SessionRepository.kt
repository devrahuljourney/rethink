package com.rethink.guard.state

import android.content.SharedPreferences
import com.rethink.guard.model.Session
import org.json.JSONObject

/**
 * In-memory sessions backed by SharedPreferences. Usage ticks update memory only;
 * callers persist at natural boundaries (leaving the app, every few ticks).
 */
class SessionRepository(private val prefs: SharedPreferences) {

    private val sessions: MutableMap<String, Session> = load()

    @Synchronized
    fun get(packageName: String): Session? = sessions[packageName]

    @Synchronized
    fun grant(packageName: String, limitMs: Long, now: Long) {
        sessions[packageName] = Session(limitMs = limitMs, lastActiveAt = now)
        persist()
    }

    @Synchronized
    fun end(packageName: String) {
        if (sessions.remove(packageName) != null) persist()
    }

    @Synchronized
    fun retainOnly(packages: Set<String>) {
        if (sessions.keys.retainAll(packages)) persist()
    }

    @Synchronized
    fun addUsage(packageName: String, deltaMs: Long, now: Long): Session? {
        val session = sessions[packageName] ?: return null
        return session.copy(usedMs = session.usedMs + deltaMs, lastActiveAt = now)
            .also { sessions[packageName] = it }
    }

    @Synchronized
    fun markEntered(packageName: String, now: Long) {
        val session = sessions[packageName] ?: return
        sessions[packageName] = session.copy(leftAt = 0L, lastActiveAt = now)
    }

    @Synchronized
    fun markLeft(packageName: String, now: Long) {
        val session = sessions[packageName] ?: return
        sessions[packageName] = session.copy(leftAt = now)
        persist()
    }

    /** After a service restart nobody is inside an app yet: close open sessions at their last activity. */
    @Synchronized
    fun closeOpenSessions() {
        var changed = false
        sessions.replaceAll { _, s ->
            if (s.isOpen) {
                changed = true
                s.copy(leftAt = s.lastActiveAt)
            } else s
        }
        if (changed) persist()
    }

    @Synchronized
    fun persist() {
        val json = JSONObject()
        sessions.forEach { (pkg, s) ->
            json.put(pkg, JSONObject()
                .put("limitMs", s.limitMs)
                .put("usedMs", s.usedMs)
                .put("leftAt", s.leftAt)
                .put("lastActiveAt", s.lastActiveAt))
        }
        prefs.edit().putString(KEY_SESSIONS, json.toString()).apply()
    }

    private fun load(): MutableMap<String, Session> {
        val raw = prefs.getString(KEY_SESSIONS, null) ?: return mutableMapOf()
        return try {
            val json = JSONObject(raw)
            json.keys().asSequence().associateWithTo(mutableMapOf()) { pkg ->
                val o = json.getJSONObject(pkg)
                Session(
                    limitMs = o.getLong("limitMs"),
                    usedMs = o.getLong("usedMs"),
                    leftAt = o.getLong("leftAt"),
                    lastActiveAt = o.getLong("lastActiveAt"),
                )
            }
        } catch (_: Exception) {
            mutableMapOf()
        }
    }

    private companion object {
        const val KEY_SESSIONS = "sessions"
    }
}
