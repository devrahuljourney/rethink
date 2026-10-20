package com.rethink.guard.state

import android.content.SharedPreferences
import com.rethink.guard.model.BlockReason
import com.rethink.guard.model.GateSettings
import com.rethink.guard.model.GuardConfig
import com.rethink.guard.model.Rule
import org.json.JSONArray
import org.json.JSONObject

/**
 * Stores the config JSON pushed from JS and keeps the parsed form in memory.
 *
 * Wire format (version 1):
 * {
 *   "rules": [
 *     { "id": "intervention", "type": "intervention", "packages": ["com.instagram.android"] },
 *     { "id": "limit", "type": "block", "reason": "limit", "packages": ["com.zhiliaoapp.musically"] }
 *   ],
 *   "gate": { "breathSeconds": 8, "graceSeconds": 60, "askSessionLength": true, "message": "…" }
 * }
 */
class ConfigRepository(private val prefs: SharedPreferences) {

    @Volatile
    var current: GuardConfig = load()
        private set

    /** Throws on malformed JSON so the JS caller gets a rejected promise instead of silently losing rules. */
    fun update(json: String) {
        val parsed = parse(JSONObject(json))
        prefs.edit().putString(KEY_CONFIG, json).apply()
        current = parsed
    }

    private fun load(): GuardConfig {
        val raw = prefs.getString(KEY_CONFIG, null) ?: return GuardConfig.EMPTY
        return try {
            parse(JSONObject(raw))
        } catch (_: Exception) {
            GuardConfig.EMPTY
        }
    }

    private fun parse(json: JSONObject): GuardConfig {
        val rules = json.optJSONArray("rules")?.objects()?.mapNotNull(::parseRule).orEmpty()
        val gate = json.optJSONObject("gate")
        val defaults = GateSettings()
        return GuardConfig(
            rules = rules,
            gate = GateSettings(
                breathSeconds = (gate?.optInt("breathSeconds", defaults.breathSeconds) ?: defaults.breathSeconds)
                    .coerceIn(3, 60),
                graceSeconds = (gate?.optInt("graceSeconds", defaults.graceSeconds) ?: defaults.graceSeconds)
                    .coerceIn(0, 30 * 60),
                askSessionLength = gate?.optBoolean("askSessionLength", defaults.askSessionLength)
                    ?: defaults.askSessionLength,
                message = gate?.optString("message")?.takeIf { it.isNotBlank() } ?: defaults.message,
            ),
        )
    }

    private fun parseRule(json: JSONObject): Rule? {
        val id = json.optString("id").ifBlank { return null }
        val packages = json.optJSONArray("packages")?.strings()?.toSet().orEmpty()
        if (packages.isEmpty()) return null
        return when (json.optString("type")) {
            "intervention" -> Rule.Intervention(id, packages)
            "block" -> Rule.Block(id, packages, parseReason(json.optString("reason")))
            else -> null // Unknown rule types from a newer JS bundle are ignored, not fatal.
        }
    }

    private fun parseReason(value: String) = when (value) {
        "limit" -> BlockReason.LIMIT
        "focus" -> BlockReason.FOCUS
        else -> BlockReason.OTHER
    }

    private fun JSONArray.objects() = (0 until length()).mapNotNull { optJSONObject(it) }
    private fun JSONArray.strings() = (0 until length()).mapNotNull { optString(it).takeIf(String::isNotBlank) }

    private companion object {
        const val KEY_CONFIG = "config"
    }
}
