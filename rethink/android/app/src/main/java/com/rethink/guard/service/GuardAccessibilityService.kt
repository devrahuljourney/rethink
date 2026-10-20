package com.rethink.guard.service

import android.accessibilityservice.AccessibilityService
import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.media.AudioManager
import android.os.Handler
import android.os.Looper
import android.os.PowerManager
import android.provider.Settings
import android.view.accessibility.AccessibilityEvent
import com.rethink.MainActivity
import com.rethink.guard.detect.AppSwitch
import com.rethink.guard.detect.ForegroundTracker
import com.rethink.guard.detect.InstalledApps
import com.rethink.guard.gate.GateActivity
import com.rethink.guard.gate.GateMode
import com.rethink.guard.model.Decision
import com.rethink.guard.policy.PolicyEngine
import com.rethink.guard.state.EventLog.Outcome
import com.rethink.guard.state.GuardStore

/**
 * Thin orchestrator: window events → [ForegroundTracker] → [PolicyEngine] → gate / session ticker.
 *
 * Play policy: this service only reads the package and class name of the foreground window
 * (typeWindowStateChanged, canRetrieveWindowContent=false). It never reads screen content.
 */
class GuardAccessibilityService : AccessibilityService() {

    private val handler = Handler(Looper.getMainLooper())
    private lateinit var installedApps: InstalledApps
    private lateinit var tracker: ForegroundTracker

    /** Package whose session is currently being charged, or null. */
    private var ticking: String? = null
    private var lastTickAt = 0L
    private var ticksSincePersist = 0

    override fun onServiceConnected() {
        super.onServiceConnected()
        GuardStore.init(this)
        installedApps = InstalledApps(this).apply { refresh() }
        tracker = ForegroundTracker(
            ownPackage = packageName,
            isSwitchTarget = { installedApps.isLaunchableOrHome(it) || GuardStore.config.current.guards(it) },
            isTransient = installedApps::isTransient,
        )
        GuardStore.sessions.closeOpenSessions()
        registerReceiver(screenReceiver, IntentFilter().apply {
            addAction(Intent.ACTION_SCREEN_OFF)
            addAction(Intent.ACTION_SCREEN_ON)
            addAction(Intent.ACTION_USER_PRESENT)
        })
        registerReceiver(packageReceiver, IntentFilter().apply {
            addAction(Intent.ACTION_PACKAGE_ADDED)
            addAction(Intent.ACTION_PACKAGE_REMOVED)
            addDataScheme("package")
        })
        instance = this

        // The user just enabled us from settings: take them straight back to Rethink.
        if (GuardStore.consumeRecentAccessibilitySetup(System.currentTimeMillis())) {
            startActivity(
                Intent(this, MainActivity::class.java)
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT),
            )
        }
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event?.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED || instance == null) return
        val pkg = event.packageName?.toString() ?: return
        val switch = tracker.onWindowStateChanged(pkg, event.className?.toString(), event.contentChangeTypes)
            ?: return
        onAppSwitch(switch)
    }

    private fun onAppSwitch(switch: AppSwitch) {
        val now = System.currentTimeMillis()
        switch.from?.let { leave(it, now) }

        val pkg = switch.to
        if (pkg == packageName || isInCall()) return

        val sessions = GuardStore.sessions
        when (val decision = PolicyEngine.decide(pkg, GuardStore.config.current, sessions.get(pkg), now)) {
            is Decision.Allow -> enter(pkg, now)
            is Decision.Gate -> {
                sessions.end(pkg)
                GuardStore.events.append(pkg, Outcome.GATED, now)
                showGate(GateMode.INTERVENTION, pkg)
            }
            is Decision.Shield -> shield(pkg, now)
            is Decision.Block -> {
                GuardStore.events.append(pkg, Outcome.BLOCKED, now)
                showGate(GateMode.BLOCKED, pkg, decision.rule.reason.name)
            }
        }
    }

    /** Called by the gate when the user chose to continue, before the target app is back on screen. */
    fun onAccessGranted(pkg: String) {
        tracker.forceCurrent(pkg)
        enter(pkg, System.currentTimeMillis())
    }

    private fun enter(pkg: String, now: Long) {
        if (GuardStore.sessions.get(pkg) == null) return
        GuardStore.sessions.markEntered(pkg, now)
        startTicking(pkg, now)
    }

    private fun leave(pkg: String, now: Long) {
        if (ticking == pkg) stopTicking()
        GuardStore.sessions.markLeft(pkg, now)
    }

    private fun shield(pkg: String, now: Long) {
        stopTicking()
        GuardStore.sessions.end(pkg)
        GuardStore.events.append(pkg, Outcome.SHIELDED, now)
        showGate(GateMode.SHIELD, pkg)
    }

    private fun showGate(mode: GateMode, pkg: String, blockReason: String? = null) {
        if (GateActivity.isShowing(mode, pkg)) return
        startActivity(GateActivity.intent(this, mode, pkg, blockReason))
    }

    // ---- Session ticker: charges screen-on foreground time to the open session ----------------

    private val tick = object : Runnable {
        override fun run() {
            val pkg = ticking ?: return
            val now = System.currentTimeMillis()
            val session = GuardStore.sessions.addUsage(pkg, now - lastTickAt, now)
            lastTickAt = now
            when {
                session == null -> stopTicking()
                session.isExhausted -> shield(pkg, now)
                else -> {
                    if (++ticksSincePersist >= PERSIST_EVERY_TICKS) {
                        ticksSincePersist = 0
                        GuardStore.sessions.persist()
                    }
                    handler.postDelayed(this, TICK_MS)
                }
            }
        }
    }

    private fun startTicking(pkg: String, now: Long) {
        handler.removeCallbacks(tick)
        ticking = pkg
        lastTickAt = now
        if (isInteractive()) handler.postDelayed(tick, TICK_MS)
    }

    private fun stopTicking() {
        handler.removeCallbacks(tick)
        ticking = null
        GuardStore.sessions.persist()
    }

    private val screenReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            val pkg = ticking ?: return
            when (intent.action) {
                Intent.ACTION_SCREEN_OFF -> {
                    tick.run() // charge time up to the moment the screen went off
                    handler.removeCallbacks(tick)
                }
                Intent.ACTION_SCREEN_ON, Intent.ACTION_USER_PRESENT -> startTicking(pkg, System.currentTimeMillis())
            }
        }
    }

    private val packageReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) = installedApps.refresh()
    }

    private fun isInteractive() = getSystemService(PowerManager::class.java)?.isInteractive ?: true

    /** Never gate a call screen or an app opened while the phone is ringing. */
    private fun isInCall(): Boolean = when (getSystemService(AudioManager::class.java)?.mode) {
        AudioManager.MODE_RINGTONE, AudioManager.MODE_IN_CALL, AudioManager.MODE_IN_COMMUNICATION -> true
        else -> false
    }

    override fun onInterrupt() = Unit

    override fun onUnbind(intent: Intent?): Boolean {
        tearDown()
        return super.onUnbind(intent)
    }

    override fun onDestroy() {
        tearDown()
        super.onDestroy()
    }

    private fun tearDown() {
        if (instance == null) return
        instance = null
        stopTicking()
        runCatching { unregisterReceiver(screenReceiver) }
        runCatching { unregisterReceiver(packageReceiver) }
    }

    companion object {
        private const val TICK_MS = 1_000L
        private const val PERSIST_EVERY_TICKS = 15

        @Volatile
        var instance: GuardAccessibilityService? = null
            private set

        /** Source of truth is the system setting, not whether this process is currently bound. */
        fun isEnabled(context: Context): Boolean {
            val enabled = Settings.Secure.getString(
                context.contentResolver, Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES,
            ) ?: return false
            val self = ComponentName(context, GuardAccessibilityService::class.java)
            return enabled.split(':').any { ComponentName.unflattenFromString(it) == self }
        }
    }
}
