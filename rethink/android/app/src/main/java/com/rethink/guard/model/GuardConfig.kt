package com.rethink.guard.model

/**
 * Everything the guard enforces, pushed from JS as one JSON document.
 * New features (schedules, budgets, intents) are added as new [Rule] types,
 * never as new branches inside the service.
 */
data class GuardConfig(
    val rules: List<Rule> = emptyList(),
    val gate: GateSettings = GateSettings(),
) {
    fun blockRuleFor(packageName: String, now: Long): Rule.Block? =
        rules.firstOrNull { it is Rule.Block && it.appliesTo(packageName, now) } as Rule.Block?

    fun interventionRuleFor(packageName: String, now: Long): Rule.Intervention? =
        rules.firstOrNull { it is Rule.Intervention && it.appliesTo(packageName, now) } as Rule.Intervention?

    fun guards(packageName: String): Boolean = rules.any { packageName in it.packages }

    companion object {
        val EMPTY = GuardConfig()
    }
}

sealed interface Rule {
    val id: String
    val packages: Set<String>

    fun appliesTo(packageName: String, now: Long): Boolean = packageName in packages

    /** Mindful gate: the user may continue after the intervention. */
    data class Intervention(override val id: String, override val packages: Set<String>) : Rule

    /** Hard block (daily limit, focus mode): no way through from the gate. */
    data class Block(
        override val id: String,
        override val packages: Set<String>,
        val reason: BlockReason,
    ) : Rule
}

enum class BlockReason { LIMIT, FOCUS, OTHER }

data class GateSettings(
    val breathSeconds: Int = 8,
    /** Returning to an app within this window skips the gate ("intentional app switching"). */
    val graceSeconds: Int = 60,
    /** Ask how long the user needs; the session is re-gated when that time runs out. */
    val askSessionLength: Boolean = true,
    val message: String = DEFAULT_MESSAGE,
) {
    companion object {
        const val DEFAULT_MESSAGE = "Take a deep breath…"
    }
}
