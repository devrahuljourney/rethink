package com.rethink.guard.gate

import android.content.Context
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import com.rethink.guard.model.GateSettings

data class GateRequest(
    val mode: GateMode,
    val app: AppInfo,
    val blockReason: String?,
    val attemptsToday: Int,
    val settings: GateSettings,
    val nonce: Long,
)

data class AppInfo(val packageName: String, val label: String, val icon: Bitmap?) {
    companion object {
        fun load(context: Context, packageName: String): AppInfo {
            val pm = context.packageManager
            return try {
                val info = pm.getApplicationInfo(packageName, 0)
                AppInfo(packageName, pm.getApplicationLabel(info).toString(), pm.getApplicationIcon(info).toBitmap())
            } catch (_: PackageManager.NameNotFoundException) {
                AppInfo(packageName, packageName.substringAfterLast('.').replaceFirstChar(Char::uppercase), null)
            }
        }

        private fun Drawable.toBitmap(): Bitmap {
            if (this is BitmapDrawable && bitmap != null) return bitmap
            val size = 144
            val bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
            setBounds(0, 0, size, size)
            draw(Canvas(bitmap))
            return bitmap
        }
    }
}
