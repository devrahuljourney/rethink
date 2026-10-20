package com.rethink.guard.gate

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.rethink.R
import com.rethink.guard.model.BlockReason
import kotlinx.coroutines.launch

// Mirrors ui/theme.ts in the React Native app: paper, ink outlines, flat poster colours.
private object GateColors {
    val background = Color(0xFFF3EEE3)
    val card = Color(0xFFFFFCF5)
    val ink = Color(0xFF1B1A1F)
    val muted = Color(0xFF57534B)
    val mint = Color(0xFF8EDFC0)
    val sun = Color(0xFFFFDD3C)
    val tomato = Color(0xFFFF6B4A)
    val lilac = Color(0xFFC3B4FF)
}

private object GateFonts {
    val display = FontFamily(Font(R.font.bricolage_extrabold))
    val body = FontFamily(Font(R.font.figtree_semibold))
    val bodyBold = FontFamily(Font(R.font.figtree_bold))
    val mono = FontFamily(Font(R.font.dm_mono_medium))
}

private val STROKE = 2.dp

private enum class Step { BREATH, CHOICE, DURATION, SHIELD, BLOCKED }

private val SESSION_OPTIONS_MINUTES = listOf(5, 10, 15, 30)
private const val MIN_SCALE = 0.55f
private const val HALF_BREATH_MS = 4_000

@Composable
fun GateScreen(
    request: GateRequest,
    onDismiss: () -> Unit,
    onContinue: (limitMinutes: Int?) -> Unit,
    onOpenRethink: () -> Unit,
) {
    var step by remember(request.nonce) {
        mutableStateOf(
            when (request.mode) {
                GateMode.INTERVENTION -> Step.BREATH
                GateMode.SHIELD -> Step.SHIELD
                GateMode.BLOCKED -> Step.BLOCKED
            },
        )
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(GateColors.background)
            .systemBarsPadding()
            .padding(horizontal = 24.dp, vertical = 32.dp),
    ) {
        AnimatedContent(
            targetState = step,
            transitionSpec = { fadeIn(tween(250)) togetherWith fadeOut(tween(150)) },
            label = "gate-step",
        ) { current ->
            when (current) {
                Step.BREATH -> BreathStep(request) { step = Step.CHOICE }
                Step.CHOICE -> ChoiceStep(
                    request = request,
                    onDismiss = onDismiss,
                    onContinue = {
                        if (request.settings.askSessionLength) step = Step.DURATION else onContinue(null)
                    },
                )
                Step.DURATION -> DurationStep(request.app.label, onContinue)
                Step.SHIELD -> ShieldStep(request, onDismiss) { step = Step.BREATH }
                Step.BLOCKED -> BlockedStep(request, onDismiss, onOpenRethink)
            }
        }
    }
}

@Composable
private fun BreathStep(request: GateRequest, onFinished: () -> Unit) {
    val scale = remember { Animatable(MIN_SCALE) }
    val progress = remember { Animatable(0f) }
    var inhaling by remember { mutableStateOf(true) }
    val totalMs = request.settings.breathSeconds * 1000

    LaunchedEffect(request.nonce) {
        launch { progress.animateTo(1f, tween(totalMs, easing = LinearEasing)) }
        var elapsed = 0
        while (elapsed < totalMs) {
            val half = minOf(HALF_BREATH_MS, totalMs - elapsed)
            scale.animateTo(if (inhaling) 1f else MIN_SCALE, tween(half, easing = FastOutSlowInEasing))
            elapsed += half
            if (elapsed < totalMs) inhaling = !inhaling
        }
        onFinished()
    }

    StepLayout(
        header = { AppHeader(request.app, "Opening") },
        body = {
            Box(contentAlignment = Alignment.Center, modifier = Modifier.size(260.dp)) {
                Box(
                    Modifier
                        .size(260.dp)
                        .scale(scale.value)
                        .clip(CircleShape)
                        .background(GateColors.mint)
                        .border(STROKE, GateColors.ink, CircleShape),
                )
                Text(
                    if (inhaling) "Breathe in" else "Breathe out",
                    color = GateColors.ink,
                    fontSize = 24.sp,
                    fontFamily = GateFonts.display,
                )
            }
            Spacer(Modifier.height(32.dp))
            Title(request.settings.message)
        },
        footer = {
            if (request.attemptsToday > 1) {
                Caption("${ordinal(request.attemptsToday)} time opening ${request.app.label} in the last 24 hours")
                Spacer(Modifier.height(16.dp))
            }
            OutlinedProgress(progress.value)
        },
    )
}

@Composable
private fun ChoiceStep(request: GateRequest, onDismiss: () -> Unit, onContinue: () -> Unit) {
    val appName = request.app.label
    StepLayout(
        header = { AppHeader(request.app, null) },
        body = {
            Title("Do you still want to open $appName?")
            Spacer(Modifier.height(12.dp))
            Caption("Closing it now is a small win. Your future self will thank you.")
        },
        footer = {
            PrimaryButton("I don't need it right now", onDismiss)
            Spacer(Modifier.height(8.dp))
            SecondaryButton("Continue to $appName", onContinue)
        },
    )
}

@Composable
private fun DurationStep(appName: String, onContinue: (Int?) -> Unit) {
    StepLayout(
        header = {},
        body = {
            Title("How much time do you need on $appName?")
            Spacer(Modifier.height(12.dp))
            Caption("Be realistic. We'll check in when the time is up.")
            Spacer(Modifier.height(32.dp))
            SESSION_OPTIONS_MINUTES.chunked(2).forEach { row ->
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
                    row.forEach { minutes ->
                        DurationChip("$minutes min", Modifier.weight(1f)) { onContinue(minutes) }
                    }
                }
                Spacer(Modifier.height(12.dp))
            }
        },
        footer = { SecondaryButton("No limit") { onContinue(null) } },
    )
}

@Composable
private fun ShieldStep(request: GateRequest, onDismiss: () -> Unit, onBreathe: () -> Unit) {
    val appName = request.app.label
    StepLayout(
        header = { AppHeader(request.app, null) },
        body = {
            Title("Time's up. Do you still need $appName?")
            Spacer(Modifier.height(12.dp))
            Caption("You'll need another mindful pause to keep going.")
        },
        footer = {
            PrimaryButton("Close $appName", onDismiss)
            Spacer(Modifier.height(8.dp))
            SecondaryButton("Take a breath to continue", onBreathe)
        },
    )
}

@Composable
private fun BlockedStep(request: GateRequest, onDismiss: () -> Unit, onOpenRethink: () -> Unit) {
    val appName = request.app.label
    val reason = when (request.blockReason?.let { runCatching { BlockReason.valueOf(it) }.getOrNull() }) {
        BlockReason.LIMIT -> "You've reached today's limit for $appName."
        BlockReason.FOCUS -> "Focus mode is on. $appName is paused until it ends."
        else -> "$appName is blocked right now."
    }
    StepLayout(
        header = { AppHeader(request.app, null) },
        body = {
            Sticker("blocked", GateColors.tomato)
            Spacer(Modifier.height(16.dp))
            Title("$appName is blocked")
            Spacer(Modifier.height(12.dp))
            Caption(reason)
        },
        footer = {
            PrimaryButton("Close", onDismiss)
            Spacer(Modifier.height(8.dp))
            SecondaryButton("Manage in Rethink", onOpenRethink)
        },
    )
}

// ---- Building blocks ---------------------------------------------------------------------------

@Composable
private fun StepLayout(
    header: @Composable () -> Unit,
    body: @Composable () -> Unit,
    footer: @Composable () -> Unit,
) {
    Column(Modifier.fillMaxSize(), horizontalAlignment = Alignment.CenterHorizontally) {
        header()
        Column(
            Modifier.weight(1f).fillMaxWidth(),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally,
        ) { body() }
        Column(Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) { footer() }
    }
}

@Composable
private fun AppHeader(app: AppInfo, prefix: String?) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier
            .clip(RoundedCornerShape(50))
            .background(GateColors.card)
            .border(STROKE, GateColors.ink, RoundedCornerShape(50))
            .padding(start = 6.dp, end = 14.dp, top = 6.dp, bottom = 6.dp),
    ) {
        app.icon?.let {
            Image(it.asImageBitmap(), contentDescription = null, modifier = Modifier.size(26.dp).clip(CircleShape))
            Spacer(Modifier.size(8.dp))
        }
        Text(
            if (prefix != null) "$prefix ${app.label}" else app.label,
            color = GateColors.ink,
            fontSize = 14.sp,
            fontFamily = GateFonts.bodyBold,
        )
    }
}

@Composable
private fun Title(text: String) {
    Text(
        text,
        color = GateColors.ink,
        fontSize = 30.sp,
        lineHeight = 35.sp,
        fontFamily = GateFonts.display,
        textAlign = TextAlign.Center,
    )
}

@Composable
private fun Caption(text: String) {
    Text(
        text,
        color = GateColors.muted,
        fontSize = 16.sp,
        lineHeight = 23.sp,
        fontFamily = GateFonts.body,
        textAlign = TextAlign.Center,
    )
}

/** Ink button with a hard offset shadow that collapses while pressed. */
@Composable
private fun PrimaryButton(text: String, onClick: () -> Unit) {
    PopBox(
        onClick = onClick,
        fill = GateColors.ink,
        modifier = Modifier.fillMaxWidth().height(60.dp),
    ) { Text(text, color = GateColors.card, fontSize = 17.sp, fontFamily = GateFonts.display) }
}

@Composable
private fun SecondaryButton(text: String, onClick: () -> Unit) {
    Box(
        contentAlignment = Alignment.Center,
        modifier = Modifier
            .fillMaxWidth()
            .height(52.dp)
            .clickable(role = Role.Button, onClick = onClick),
    ) {
        Text(
            text,
            color = GateColors.ink,
            fontSize = 15.sp,
            fontFamily = GateFonts.bodyBold,
            textDecoration = TextDecoration.Underline,
        )
    }
}

@Composable
private fun DurationChip(text: String, modifier: Modifier, onClick: () -> Unit) {
    PopBox(onClick = onClick, fill = GateColors.sun, modifier = modifier.height(68.dp)) {
        Text(text, color = GateColors.ink, fontSize = 20.sp, fontFamily = GateFonts.display)
    }
}

@Composable
private fun PopBox(
    onClick: () -> Unit,
    fill: Color,
    modifier: Modifier,
    content: @Composable () -> Unit,
) {
    val interaction = remember { MutableInteractionSource() }
    val pressed by interaction.collectIsPressedAsState()
    val shape = RoundedCornerShape(16.dp)
    val shadow = 4.dp

    Box(modifier.padding(end = shadow, bottom = shadow)) {
        Box(
            Modifier
                .fillMaxSize()
                .offset(shadow, shadow)
                .clip(shape)
                .background(GateColors.ink),
        )
        Box(
            contentAlignment = Alignment.Center,
            modifier = Modifier
                .fillMaxSize()
                .offset(if (pressed) shadow else 0.dp, if (pressed) shadow else 0.dp)
                .clip(shape)
                .background(fill)
                .border(STROKE, GateColors.ink, shape)
                .clickable(interactionSource = interaction, indication = null, role = Role.Button, onClick = onClick),
        ) { content() }
    }
}

@Composable
private fun OutlinedProgress(progress: Float) {
    val shape = RoundedCornerShape(50)
    Box(
        Modifier
            .fillMaxWidth()
            .height(14.dp)
            .clip(shape)
            .background(GateColors.card)
            .border(STROKE, GateColors.ink, shape),
    ) {
        Box(
            Modifier
                .fillMaxHeight()
                .fillMaxWidth(progress.coerceIn(0f, 1f))
                .background(GateColors.lilac),
        )
    }
}

@Composable
private fun Sticker(text: String, fill: Color) {
    Box(
        Modifier
            .rotate(-4f)
            .clip(RoundedCornerShape(10.dp))
            .background(fill)
            .border(STROKE, GateColors.ink, RoundedCornerShape(10.dp))
            .padding(horizontal = 12.dp, vertical = 5.dp),
    ) {
        Text(text.uppercase(), color = GateColors.ink, fontSize = 13.sp, fontFamily = GateFonts.display, letterSpacing = 0.8.sp)
    }
}

private fun ordinal(n: Int): String {
    val suffix = if (n % 100 in 11..13) "th" else when (n % 10) {
        1 -> "st"
        2 -> "nd"
        3 -> "rd"
        else -> "th"
    }
    return "$n$suffix"
}
