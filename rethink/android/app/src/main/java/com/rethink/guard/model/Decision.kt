package com.rethink.guard.model

sealed interface Decision {
    data class Allow(val reason: AllowReason) : Decision

    /** Show the intervention flow (breath → choice → session length). */
    data class Gate(val packageName: String) : Decision

    /** The granted session ran out while the user was in the app. */
    data class Shield(val packageName: String) : Decision

    data class Block(val packageName: String, val rule: Rule.Block) : Decision
}

enum class AllowReason { NOT_GUARDED, ACTIVE_SESSION, WITHIN_GRACE }
