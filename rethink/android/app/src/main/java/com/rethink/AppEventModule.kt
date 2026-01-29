package com.rethink

import android.content.Intent
import android.net.Uri
import android.provider.Settings
import com.facebook.react.bridge.*

class AppEventModule(private val context: ReactApplicationContext) :
    ReactContextBaseJavaModule(context) {

    override fun getName(): String {
        return "AppEventModule"
    }

    override fun initialize() {
        super.initialize()
        AppForegroundService.reactContext = context
    }

    override fun onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy()
        AppForegroundService.reactContext = null
    }

    @ReactMethod
    fun isServiceConnected(promise: Promise) {
        promise.resolve(AppForegroundService.isServiceConnected)
    }

    @ReactMethod
    fun openAccessibilitySettings() {
        val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)
    }

    @ReactMethod
    fun blockApp(packageName: String?) {
        val intent = Intent(context, MainActivity::class.java)
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        intent.putExtra("isBlocking", true)
        intent.putExtra("triggerApp", packageName)
        context.startActivity(intent)
    }

    @ReactMethod
    fun getInitialTriggerApp(promise: Promise) {
        val activity = getCurrentActivity()
        if (activity != null) {
            val intent = activity.getIntent()
            if (intent != null) {
                val isBlocking = intent.getBooleanExtra("isBlocking", false)
                if (isBlocking) {
                    val triggerApp = intent.getStringExtra("triggerApp")
                    promise.resolve(triggerApp)
                    // Clear the extra so it doesn't trigger again on rotation/reload
                    intent.removeExtra("isBlocking")
                    intent.removeExtra("triggerApp")
                    return
                }
            }
        }
        promise.resolve(null)
    }

    @ReactMethod
    fun hasOverlayPermission(promise: Promise) {
        if (Settings.canDrawOverlays(context)) {
            promise.resolve(true)
        } else {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun openOverlaySettings() {
        val intent = Intent(
            Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
            Uri.parse("package:${context.packageName}")
        )
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)
    }
}
