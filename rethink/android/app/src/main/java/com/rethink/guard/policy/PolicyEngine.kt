package com.rethink.guard.policy

import com.rethink.guard.model.AllowReason
import com.rethink.guard.model.Decision
import com.rethink.guard.model.GuardConfig
import com.rethink.guard.model.Session

/**
 * Pure decision function: no Android, no I/O. Order matters:
 * hard blocks → not guarded → session state → grace window → gate.
 */
object PolicyEngine {

    /** Short interruptions (notification shade, quick app switch) never re-gate, even with grace off. */
    const val MIN_GRACE_MS = 5_000L

    fun decide(packageName: String, config: GuardConfig, session: Session?, now: Long): Decision {
        config.blockRuleFor(packageName, now)?.let { return Decision.Block(packageName, it) }

        if (config.interventionRuleFor(packageName, now) == null) {
            return Decision.Allow(AllowReason.NOT_GUARDED)
        }

        if (session == null) return Decision.Gate(packageName)

        val graceMs = maxOf(config.gate.graceSeconds * 1000L, MIN_GRACE_MS)
        val isStale = !session.isOpen && now - session.leftAt > graceMs
        if (isStale) return Decision.Gate(packageName)

        if (session.isExhausted) return Decision.Shield(packageName)

        return Decision.Allow(if (session.isOpen) AllowReason.ACTIVE_SESSION else AllowReason.WITHIN_GRACE)
    }
}
