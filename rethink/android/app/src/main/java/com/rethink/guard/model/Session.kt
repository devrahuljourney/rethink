package com.rethink.guard.model

/**
 * Time granted after the user chose to continue into a guarded app.
 * [usedMs] counts only screen-on foreground time in that app.
 * [leftAt] is 0 while the user is inside the app.
 */
data class Session(
    val limitMs: Long,
    val usedMs: Long = 0L,
    val leftAt: Long = 0L,
    val lastActiveAt: Long = 0L,
) {
    val isUnlimited: Boolean get() = limitMs == UNLIMITED
    val isExhausted: Boolean get() = !isUnlimited && usedMs >= limitMs
    val isOpen: Boolean get() = leftAt == 0L

    companion object {
        const val UNLIMITED = -1L
    }
}
