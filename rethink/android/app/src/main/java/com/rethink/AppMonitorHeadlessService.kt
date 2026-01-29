package com.rethink

import android.content.Intent
import com.facebook.react.HeadlessJsTaskService
import com.facebook.react.bridge.Arguments
import com.facebook.react.jstasks.HeadlessJsTaskConfig

class AppMonitorHeadlessService : HeadlessJsTaskService() {

    override fun getTaskConfig(intent: Intent?): HeadlessJsTaskConfig? {
        val extras = intent?.extras
        if (extras != null) {
            return HeadlessJsTaskConfig(
                "AppMonitorTask",
                Arguments.fromBundle(extras),
                5000, // Timeout for the task
                true // Allowed in foreground (although this is technically background service)
            )
        }
        return null
    }
}
