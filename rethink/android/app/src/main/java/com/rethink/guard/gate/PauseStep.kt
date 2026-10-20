package com.rethink.guard.gate

import androidx.compose.animation.Crossfade
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.withFrameMillis
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.min
import androidx.compose.ui.unit.sp
import com.rethink.guard.model.GateSettings
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale
import kotlin.math.PI
import kotlin.math.ceil
import kotlin.math.cos
import kotlin.math.roundToInt
import kotlin.math.sin

private const val INTRO_MS = 1_600
private const val CYCLE_MS = 10_000

/** 4 s in, 6 s out: the long exhale is what actually calms the body down. */
private const val INHALE_SHARE = 0.4f
private const val WORD_MS = 170
private const val MIN_FULLNESS_SCALE = 0.55f
private const val ORB_POINTS = 96

private data class Breath(val fullness: Float, val inhaling: Boolean, val secondsLeft: Int)

/**
 * The mindful pause: a line that names this exact moment, a slow breath with a living orb,
 * and a quote chosen for the moment that reveals word by word while the user breathes.
 */
@Composable
internal fun PauseStep(
    request: GateRequest,
    timeUp: Boolean,
    onDismiss: () -> Unit,
    onFinished: () -> Unit,
) {
    val appName = request.app.label
    val copy = remember(request.nonce, timeUp) {
        val now = Calendar.getInstance()
        PauseContent.compose(
            appName = appName,
            attempts = request.attemptsToday,
            hour = now.get(Calendar.HOUR_OF_DAY),
            clock = SimpleDateFormat("h:mm a", Locale.getDefault()).format(now.time).lowercase(),
            timeUp = timeUp,
            customMessage = request.settings.message.takeIf { it != GateSettings.DEFAULT_MESSAGE },
        )
    }
    val breathMs = request.settings.breathSeconds.coerceAtLeast(1) * 1000
    val totalMs = INTRO_MS + breathMs
    var elapsed by remember(request.nonce, timeUp) { mutableLongStateOf(0L) }
    val haptics = LocalHapticFeedback.current

    LaunchedEffect(request.nonce, timeUp) {
        val start = withFrameMillis { it }
        var wasInhaling = true
        while (elapsed < totalMs) {
            elapsed = withFrameMillis { it } - start
            val inhaling = breathAt(elapsed - INTRO_MS, breathMs).inhaling
            // A soft tick when the breath turns, so it can be followed with eyes closed.
            if (elapsed > INTRO_MS && inhaling != wasInhaling) {
                haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
            }
            wasInhaling = inhaling
        }
        onFinished()
    }

    val breathing = elapsed > INTRO_MS
    val breath = breathAt(elapsed - INTRO_MS, breathMs)
    val introIn = (elapsed / 600f).coerceIn(0f, 1f)
    val orbIn = ((elapsed - 400) / 1000f).coerceIn(0f, 1f)
    val words = remember(copy) { copy.quote.text.split(" ").size }
    val reveal = ((elapsed - INTRO_MS + 300) / (words * WORD_MS).toFloat()).coerceIn(0f, 1f)

    Column(Modifier.fillMaxSize(), horizontalAlignment = Alignment.CenterHorizontally) {
        AppHeader(request.app, "Opening")
        Spacer(Modifier.height(28.dp))
        Text(
            copy.opener,
            color = GateColors.ink,
            fontSize = 26.sp,
            lineHeight = 31.sp,
            fontFamily = GateFonts.display,
            textAlign = TextAlign.Center,
            modifier = Modifier.graphicsLayer {
                alpha = introIn
                translationY = (1f - introIn) * 12.dp.toPx()
            },
        )

        BoxWithConstraints(Modifier.weight(1f).fillMaxWidth(), contentAlignment = Alignment.Center) {
            val side = min(min(maxWidth, maxHeight), 280.dp)
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier.size(side).graphicsLayer {
                    alpha = orbIn
                    scaleX = 0.9f + 0.1f * orbIn
                    scaleY = 0.9f + 0.1f * orbIn
                },
            ) {
                BreathOrb(
                    fullness = breath.fullness,
                    seconds = elapsed / 1000f,
                    progress = ((elapsed - INTRO_MS) / breathMs.toFloat()).coerceIn(0f, 1f),
                    modifier = Modifier.fillMaxSize(),
                )
                Crossfade(
                    targetState = if (!breathing) "" else if (breath.inhaling) "Breathe in" else "Let it go",
                    animationSpec = tween(500),
                    label = "breath-label",
                ) { label ->
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(label, color = GateColors.ink, fontSize = 20.sp, fontFamily = GateFonts.display)
                        if (label.isNotEmpty()) {
                            Text(
                                "${breath.secondsLeft}",
                                color = GateColors.ink.copy(alpha = 0.55f),
                                fontSize = 13.sp,
                                fontFamily = GateFonts.mono,
                            )
                        }
                    }
                }
            }
        }

        RevealedQuote(copy.quote, reveal)
        Spacer(Modifier.height(24.dp))
        copy.caption?.let {
            Text(it, color = GateColors.muted, fontSize = 13.sp, fontFamily = GateFonts.mono, textAlign = TextAlign.Center)
            Spacer(Modifier.height(4.dp))
        }
        SecondaryButton("Not now, close $appName", onDismiss)
    }
}

@Composable
private fun RevealedQuote(quote: Quote, reveal: Float) {
    val words = remember(quote) { quote.text.split(" ") }
    val shown = reveal * words.size
    // Every word is laid out from the start (just transparent), so nothing jumps while revealing.
    val text = buildAnnotatedString {
        words.forEachIndexed { i, word ->
            withStyle(SpanStyle(color = GateColors.ink.copy(alpha = (shown - i).coerceIn(0f, 1f)))) { append(word) }
            if (i < words.lastIndex) append(" ")
        }
    }
    Text(
        text,
        fontSize = 22.sp,
        lineHeight = 28.sp,
        fontFamily = GateFonts.display,
        textAlign = TextAlign.Center,
        modifier = Modifier.fillMaxWidth(),
    )
    quote.author?.let {
        Spacer(Modifier.height(10.dp))
        Text(
            "— ${it.uppercase()}",
            color = GateColors.muted.copy(alpha = ((shown - words.size + 1) / 2f).coerceIn(0f, 1f)),
            fontSize = 11.sp,
            letterSpacing = 1.2.sp,
            fontFamily = GateFonts.mono,
        )
    }
}

/**
 * A slowly wobbling mint orb that fills with the breath, ripples that spread as it empties,
 * and a dot travelling a thin ring that shows how much of the pause is left.
 */
@Composable
private fun BreathOrb(fullness: Float, seconds: Float, progress: Float, modifier: Modifier) {
    Canvas(modifier) {
        val c = center
        val ringR = size.minDimension / 2 - 6.dp.toPx()
        val ringBox = Size(ringR * 2, ringR * 2)
        val ringTopLeft = Offset(c.x - ringR, c.y - ringR)

        drawCircle(GateColors.ink.copy(alpha = 0.12f), ringR, c, style = Stroke(1.dp.toPx()))
        drawArc(
            GateColors.ink,
            startAngle = -90f,
            sweepAngle = 360f * progress,
            useCenter = false,
            topLeft = ringTopLeft,
            size = ringBox,
            style = Stroke(2.dp.toPx(), cap = StrokeCap.Round),
        )
        val angle = (-90f + 360f * progress) * PI.toFloat() / 180f
        drawCircle(GateColors.ink, 4.dp.toPx(), Offset(c.x + ringR * cos(angle), c.y + ringR * sin(angle)))

        val outerR = ringR - 14.dp.toPx()
        val orbR = outerR * 0.82f * (MIN_FULLNESS_SCALE + (1f - MIN_FULLNESS_SCALE) * fullness)
        for (k in 1..3) {
            val echoR = orbR + k * (outerR - orbR) / 3.2f
            drawPath(
                orbPath(c, echoR, seconds + k * 0.7f, amplitude = 0.02f),
                GateColors.ink.copy(alpha = 0.2f - k * 0.05f),
                style = Stroke(1.dp.toPx()),
            )
        }
        val orb = orbPath(c, orbR, seconds, amplitude = 0.035f)
        drawPath(orb, GateColors.mint)
        drawPath(orb, GateColors.ink, style = Stroke(2.dp.toPx()))
    }
}

private fun orbPath(c: Offset, r: Float, t: Float, amplitude: Float): Path = Path().apply {
    for (i in 0..ORB_POINTS) {
        val theta = i * 2f * PI.toFloat() / ORB_POINTS
        val wobble = sin(3 * theta + t * 0.8f) + 0.6f * sin(5 * theta - t * 1.1f) + 0.4f * sin(2 * theta + t * 0.5f)
        val k = 1f + amplitude * wobble / 2f
        val x = c.x + r * k * cos(theta)
        val y = c.y + r * k * sin(theta)
        if (i == 0) moveTo(x, y) else lineTo(x, y)
    }
    close()
}

/** Breath at [t] ms into a pause of [totalMs]: whole in/out cycles, so the pause always ends on an exhale. */
private fun breathAt(t: Long, totalMs: Int): Breath {
    if (t <= 0) return Breath(0f, true, 0)
    if (t >= totalMs) return Breath(0f, false, 0)
    val cycles = (totalMs / CYCLE_MS.toFloat()).roundToInt().coerceAtLeast(1)
    val cycle = totalMs.toFloat() / cycles
    val inhale = cycle * INHALE_SHARE
    val x = t % cycle
    return if (x < inhale) {
        Breath(ease(x / inhale), true, ceil((inhale - x) / 1000f).toInt())
    } else {
        Breath(1f - ease((x - inhale) / (cycle - inhale)), false, ceil((cycle - x) / 1000f).toInt())
    }
}

private fun ease(f: Float): Float = 0.5f - 0.5f * cos(PI.toFloat() * f)
