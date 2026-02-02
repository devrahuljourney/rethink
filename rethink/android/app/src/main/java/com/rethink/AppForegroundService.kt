package com.rethink

import android.accessibilityservice.AccessibilityService
import android.view.accessibility.AccessibilityEvent
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.modules.core.DeviceEventManagerModule

class AppForegroundService : AccessibilityService() {

    companion object {
        var reactContext: ReactApplicationContext? = null
        var isServiceConnected = false
        private val blockedPackages = mutableSetOf<String>()

        fun setBlockedPackages(packages: Set<String>) {
            synchronized(blockedPackages) {
                blockedPackages.clear()
                blockedPackages.addAll(packages)
            }
        }
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        isServiceConnected = true
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return

        if (event.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            val packageName = event.packageName?.toString() ?: return

            // Check if app is explicitly blocked
            val isBlocked = synchronized(blockedPackages) {
                blockedPackages.contains(packageName)
            }

            if (isBlocked) {
                triggerBlock(packageName)
            }

            if (reactContext != null) {

                 reactContext?.getJSModule(
                    DeviceEventManagerModule.RCTDeviceEventEmitter::class.java
                )?.emit("APP_FOREGROUND_CHANGED", packageName)
            } else {
                // Determine if we should start headless task. 
                // We could filter packages here to avoid spamming the JS thread.
                val intent = android.content.Intent(this, AppMonitorHeadlessService::class.java)
                val bundle = android.os.Bundle()
                bundle.putString("packageName", packageName)
                intent.putExtras(bundle)
                startService(intent)
            }
        }
    }

    private fun triggerBlock(packageName: String) {
        val intent = android.content.Intent(this, MainActivity::class.java)
        intent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK)
        intent.addFlags(android.content.Intent.FLAG_ACTIVITY_SINGLE_TOP)
        intent.putExtra("isBlocking", true)
        intent.putExtra("triggerApp", packageName)
        startActivity(intent)
    }

    override fun onInterrupt() {

        isServiceConnected = false
    }

    override fun onDestroy() {
        super.onDestroy()
        isServiceConnected = false
    }
}
