package com.rethink.guard.detect

import android.content.Context
import android.content.Intent
import android.view.inputmethod.InputMethodManager

/**
 * Android-side knowledge the tracker needs. Visibility of launcher apps comes from the
 * MAIN/LAUNCHER <queries> entry in the manifest (no QUERY_ALL_PACKAGES needed).
 */
class InstalledApps(private val context: Context) {

    @Volatile
    private var launchable: Set<String> = emptySet()

    @Volatile
    private var homes: Set<String> = emptySet()

    @Volatile
    private var keyboards: Set<String> = emptySet()

    fun refresh() {
        val pm = context.packageManager
        launchable = pm.queryIntentActivities(
            Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER), 0,
        ).mapTo(HashSet()) { it.activityInfo.packageName }
        homes = pm.queryIntentActivities(
            Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME), 0,
        ).mapTo(HashSet()) { it.activityInfo.packageName }
        keyboards = context.getSystemService(InputMethodManager::class.java)
            ?.enabledInputMethodList?.mapTo(HashSet()) { it.packageName }
            .orEmpty()
    }

    fun isLaunchableOrHome(packageName: String) = packageName in launchable || packageName in homes

    /** Windows that float over the current app without the user leaving it. */
    fun isTransient(packageName: String) = packageName in SYSTEM_OVERLAYS || packageName in keyboards

    private companion object {
        val SYSTEM_OVERLAYS = setOf("com.android.systemui", "android")
    }
}
