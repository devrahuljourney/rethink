package com.rethink.guard.bridge

import android.content.Intent
import android.os.PowerManager
import android.provider.Settings
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.rethink.guard.model.Rule
import com.rethink.guard.service.GuardAccessibilityService
import com.rethink.guard.state.GuardStore

/**
 * JS ↔ native contract for the guard. JS owns configuration and insights;
 * native owns enforcement. Only JSON documents cross the boundary.
 */
class GuardModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {

    override fun getName() = NAME

    override fun initialize() {
        super.initialize()
        GuardStore.init(context)
        GuardStore.events.onAppended = ::notifyEventsAvailable
    }

    override fun invalidate() {
        GuardStore.events.onAppended = null
        super.invalidate()
    }

    /** Replaces the whole guard config. Rejects malformed JSON instead of silently dropping rules. */
    @ReactMethod
    fun setConfig(json: String, promise: Promise) {
        try {
            GuardStore.config.update(json)
            val interventionPackages = GuardStore.config.current.rules
                .filterIsInstance<Rule.Intervention>()
                .flatMapTo(HashSet()) { it.packages }
            GuardStore.sessions.retainOnly(interventionPackages)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("E_GUARD_CONFIG", "Invalid guard config: ${e.message}", e)
        }
    }

    /** Returns and clears the outcome log as a JSON array string. */
    @ReactMethod
    fun drainEvents(promise: Promise) {
        promise.resolve(GuardStore.events.drain().toString())
    }

    @ReactMethod
    fun isServiceEnabled(promise: Promise) {
        promise.resolve(GuardAccessibilityService.isEnabled(context))
    }

    /** Only call after the user accepted the in-app prominent disclosure (Play policy). */
    @ReactMethod
    fun openAccessibilitySettings() {
        GuardStore.markAccessibilitySettingsOpened(System.currentTimeMillis())
        context.startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    }

    @ReactMethod
    fun isIgnoringBatteryOptimizations(promise: Promise) {
        val pm = context.getSystemService(PowerManager::class.java)
        promise.resolve(pm?.isIgnoringBatteryOptimizations(context.packageName) ?: true)
    }

    /** Opens the system list (no REQUEST_IGNORE_BATTERY_OPTIMIZATIONS permission needed). */
    @ReactMethod
    fun openBatteryOptimizationSettings() {
        context.startActivity(
            Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
        )
    }

    // Required by NativeEventEmitter.
    @ReactMethod
    fun addListener(eventName: String) = Unit

    @ReactMethod
    fun removeListeners(count: Double) = Unit

    private fun notifyEventsAvailable() {
        if (!context.hasActiveReactInstance()) return
        runCatching {
            context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(EVENT_AVAILABLE, null)
        }
    }

    companion object {
        const val NAME = "GuardModule"
        const val EVENT_AVAILABLE = "GuardEventsAvailable"
    }
}
