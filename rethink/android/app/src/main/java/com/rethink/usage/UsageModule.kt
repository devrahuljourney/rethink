package com.rethink.usage

import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.rethink.usage.ForegroundTimeCalculator.Event
import com.rethink.usage.ForegroundTimeCalculator.Kind

/**
 * Screen time per app for an arbitrary time range, computed from raw usage events so the
 * numbers match Digital Wellbeing. All durations are returned in milliseconds.
 */
class UsageModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {

    override fun getName() = "UsageModule"

    /**
     * Resolves to [{ packageName, appName, totalTimeInForeground (ms), appLaunchCount, lastTimeUsed }]
     * for launchable apps only (home screens and system UI are excluded, like Digital Wellbeing).
     */
    @ReactMethod
    fun queryUsage(startTime: Double, endTime: Double, promise: Promise) {
        try {
            val start = startTime.toLong()
            val end = endTime.toLong()
            val usage = ForegroundTimeCalculator.calculate(readEvents(start - LOOKBACK_MS, end), start, end)

            val pm = context.packageManager
            val launchable = launchablePackages(pm)
            val homes = homePackages(pm)

            val result = Arguments.createArray()
            usage.values
                .filter { it.packageName in launchable && it.packageName !in homes }
                .sortedByDescending { it.foregroundMs }
                .forEach { app ->
                    result.pushMap(Arguments.createMap().apply {
                        putString("packageName", app.packageName)
                        putString("appName", labelOf(pm, app.packageName))
                        putDouble("totalTimeInForeground", app.foregroundMs.toDouble())
                        putInt("appLaunchCount", app.launches)
                        putDouble("lastTimeUsed", app.lastUsed.toDouble())
                    })
                }
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("E_USAGE_QUERY", e.message, e)
        }
    }

    private fun readEvents(start: Long, end: Long): List<Event> {
        val manager = context.getSystemService(UsageStatsManager::class.java) ?: return emptyList()
        val raw = manager.queryEvents(start, end) ?: return emptyList()
        val events = ArrayList<Event>()
        val event = UsageEvents.Event()
        while (raw.hasNextEvent()) {
            raw.getNextEvent(event)
            val kind = kindOf(event.eventType) ?: continue
            events += Event(event.packageName, event.className, kind, event.timeStamp)
        }
        return events
    }

    @Suppress("DEPRECATION")
    private fun kindOf(type: Int): Kind? = when (type) {
        UsageEvents.Event.ACTIVITY_RESUMED -> Kind.RESUMED
        UsageEvents.Event.ACTIVITY_PAUSED -> Kind.PAUSED
        else -> when {
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q && type == UsageEvents.Event.ACTIVITY_STOPPED -> Kind.PAUSED
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.P && type == UsageEvents.Event.SCREEN_NON_INTERACTIVE -> Kind.SCREEN_OFF
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q && type == UsageEvents.Event.DEVICE_SHUTDOWN -> Kind.SCREEN_OFF
            else -> null
        }
    }

    private fun launchablePackages(pm: PackageManager): Set<String> =
        pm.queryIntentActivities(Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER), 0)
            .mapTo(HashSet()) { it.activityInfo.packageName }

    private fun homePackages(pm: PackageManager): Set<String> =
        pm.queryIntentActivities(Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME), 0)
            .mapTo(HashSet()) { it.activityInfo.packageName }

    private fun labelOf(pm: PackageManager, packageName: String): String = try {
        pm.getApplicationLabel(pm.getApplicationInfo(packageName, 0)).toString()
    } catch (_: PackageManager.NameNotFoundException) {
        packageName
    }

    private companion object {
        /** Catch apps that were already in the foreground when the range started. */
        const val LOOKBACK_MS = 6 * 60 * 60 * 1000L
    }
}
