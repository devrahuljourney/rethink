package com.rethink.usage

/**
 * Computes per-app foreground time from raw usage events, the way Digital Wellbeing does,
 * instead of summing UsageStatsManager's pre-aggregated buckets (which don't align with
 * midnight and over/under-count "today").
 *
 * Pure Kotlin so it can be unit tested; [UsageModule] feeds it android.app.usage events.
 */
object ForegroundTimeCalculator {

    enum class Kind { RESUMED, PAUSED, SCREEN_OFF }

    data class Event(val packageName: String, val className: String?, val kind: Kind, val timestamp: Long)

    data class AppUsage(val packageName: String, val foregroundMs: Long, val launches: Int, val lastUsed: Long)

    /**
     * [events] must be in chronological order and may start before [start], so apps that were
     * already open at [start] are counted from [start]. Only time inside [start, end] is counted.
     */
    fun calculate(events: List<Event>, start: Long, end: Long): Map<String, AppUsage> {
        val open = HashMap<String, OpenApp>()
        val totals = HashMap<String, Accumulator>()

        fun close(pkg: String, app: OpenApp, at: Long) {
            val from = maxOf(app.since, start)
            val to = minOf(at, end)
            if (to > from) {
                totals.getOrPut(pkg, ::Accumulator).apply {
                    foregroundMs += to - from
                    lastUsed = maxOf(lastUsed, to)
                }
            }
        }

        for (event in events) {
            if (event.timestamp > end) break
            when (event.kind) {
                Kind.RESUMED -> {
                    val app = open.getOrPut(event.packageName) {
                        if (event.timestamp >= start) totals.getOrPut(event.packageName, ::Accumulator).launches++
                        OpenApp(event.timestamp)
                    }
                    app.activities += event.className.orEmpty()
                }
                Kind.PAUSED -> {
                    val app = open[event.packageName] ?: continue
                    app.activities -= event.className.orEmpty()
                    if (app.activities.isEmpty()) {
                        close(event.packageName, app, event.timestamp)
                        open.remove(event.packageName)
                    }
                }
                Kind.SCREEN_OFF -> {
                    open.forEach { (pkg, app) -> close(pkg, app, event.timestamp) }
                    open.clear()
                }
            }
        }
        open.forEach { (pkg, app) -> close(pkg, app, end) }

        return totals
            .filterValues { it.foregroundMs > 0 || it.launches > 0 }
            .mapValues { (pkg, acc) -> AppUsage(pkg, acc.foregroundMs, acc.launches, acc.lastUsed) }
    }

    private class OpenApp(val since: Long) {
        val activities = HashSet<String>()
    }

    private class Accumulator {
        var foregroundMs = 0L
        var launches = 0
        var lastUsed = 0L
    }
}
