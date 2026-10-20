package com.rethink.guard.gate

import android.content.Context
import android.content.Intent
import android.content.pm.ActivityInfo
import android.os.Bundle
import android.os.PowerManager
import android.view.WindowManager
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.compose.setContent
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import com.rethink.MainActivity
import com.rethink.guard.model.Session
import com.rethink.guard.service.GuardAccessibilityService
import com.rethink.guard.state.EventLog.Outcome
import com.rethink.guard.state.GuardStore

enum class GateMode { INTERVENTION, SHIELD, BLOCKED }

/**
 * The gate shown in front of a guarded app. Native (no JS) so it is on screen instantly,
 * even when the React Native runtime is not running.
 *
 * Exits: back → home, home button → dismissed, screen off → home. Only an explicit
 * "continue" lets the user into the app.
 */
class GateActivity : ComponentActivity() {

    private var request by mutableStateOf<GateRequest?>(null)

    /** True once the user picked an outcome, so leaving the activity is not counted as a dismissal. */
    private var resolved = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        GuardStore.init(this)
        requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() = dismiss()
        })
        load(intent)
        setContent {
            request?.let { req ->
                GateScreen(
                    request = req,
                    onDismiss = ::dismiss,
                    onContinue = ::grantAccess,
                    onOpenRethink = ::openRethink,
                )
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        load(intent)
    }

    private fun load(intent: Intent) {
        val pkg = intent.getStringExtra(EXTRA_PACKAGE) ?: return finish()
        val mode = intent.getStringExtra(EXTRA_MODE)?.let(GateMode::valueOf) ?: GateMode.INTERVENTION
        val now = System.currentTimeMillis()
        val attempts = if (mode == GateMode.BLOCKED) 0 else GuardStore.attempts.record(pkg, now)
        resolved = false
        request = GateRequest(
            mode = mode,
            app = AppInfo.load(this, pkg),
            blockReason = intent.getStringExtra(EXTRA_BLOCK_REASON),
            attemptsToday = attempts,
            settings = GuardStore.config.current.gate,
            // A new request (e.g. another guarded app) must restart the flow from its first step.
            nonce = now,
        )
        showing = mode to pkg
    }

    private fun grantAccess(limitMinutes: Int?) {
        val pkg = request?.app?.packageName ?: return finish()
        val now = System.currentTimeMillis()
        val limitMs = limitMinutes?.let { it * 60_000L } ?: Session.UNLIMITED
        resolved = true
        GuardStore.sessions.grant(pkg, limitMs, now)
        GuardStore.events.append(pkg, Outcome.OPENED, now, limitMinutes)
        GuardAccessibilityService.instance?.onAccessGranted(pkg)

        // Bring the existing task of the target app back, exactly where the user left it.
        packageManager.getLaunchIntentForPackage(pkg)?.let {
            it.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_NO_ANIMATION)
            startActivity(it)
        }
        finishWithoutAnimation()
    }

    private fun dismiss() {
        recordDismissal()
        goHome()
    }

    private fun openRethink() {
        resolved = true
        startActivity(Intent(this, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
        finishWithoutAnimation()
    }

    private fun goHome() {
        startActivity(
            Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
        )
        finishWithoutAnimation()
    }

    private fun recordDismissal() {
        if (resolved) return
        resolved = true
        val req = request ?: return
        if (req.mode != GateMode.BLOCKED) {
            GuardStore.events.append(req.app.packageName, Outcome.DISMISSED, System.currentTimeMillis())
        }
    }

    override fun onUserLeaveHint() {
        super.onUserLeaveHint()
        // Home / recents pressed: the user walked away from the app, which is a win.
        recordDismissal()
        finishWithoutAnimation()
    }

    override fun onPause() {
        super.onPause()
        if (getSystemService(PowerManager::class.java)?.isInteractive == false) dismiss()
    }

    override fun onDestroy() {
        if (isFinishing) showing = null
        super.onDestroy()
    }

    @Suppress("DEPRECATION")
    private fun finishWithoutAnimation() {
        finish()
        overridePendingTransition(0, 0)
    }

    companion object {
        private const val EXTRA_PACKAGE = "packageName"
        private const val EXTRA_MODE = "mode"
        private const val EXTRA_BLOCK_REASON = "blockReason"

        @Volatile
        private var showing: Pair<GateMode, String>? = null

        fun isShowing(mode: GateMode, pkg: String) = showing == (mode to pkg)

        fun intent(context: Context, mode: GateMode, pkg: String, blockReason: String?): Intent =
            Intent(context, GateActivity::class.java)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_NO_ANIMATION)
                .putExtra(EXTRA_PACKAGE, pkg)
                .putExtra(EXTRA_MODE, mode.name)
                .putExtra(EXTRA_BLOCK_REASON, blockReason)
    }
}
