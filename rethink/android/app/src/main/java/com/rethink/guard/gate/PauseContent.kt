package com.rethink.guard.gate

import kotlin.random.Random

/**
 * The words on the mindful pause. People rarely open a guarded app on purpose: they are bored,
 * avoiding something, tired, lonely or on autopilot. The copy names the moment they are in
 * (hour, how often they reached for the app, a session that ran out) instead of a generic
 * "take a breath", and never repeats the same quote twice in a row.
 */
data class Quote(val text: String, val author: String? = null)

enum class Moment { LATE_NIGHT, EARLY_MORNING, REPEAT, TIME_UP, ANY }

data class PauseCopy(val opener: String, val caption: String?, val quote: Quote)

/** Why the user reached for the app. Naming the urge is what weakens it. */
enum class Reason(val label: String) {
    SPECIFIC("Something specific"),
    BORED("I'm bored"),
    AVOIDING("Putting something off"),
    AUTOPILOT("No reason, just habit"),
    TIRED("I need a break"),
    LONELY("Feeling low or alone"),
}

data class Reflection(val title: String, val body: String)

object PauseContent {

    private const val REPEAT_THRESHOLD = 4
    private const val CUSTOM_MESSAGE_CHANCE = 0.5f
    private const val MOMENT_QUOTE_CHANCE = 0.7f

    private val QUOTES: Map<Moment, List<Quote>> = mapOf(
        Moment.LATE_NIGHT to listOf(
            Quote("Nothing in there is worth the sleep you're about to trade for it."),
            Quote("Tomorrow's you is asking for this hour back."),
            Quote("The feed never ends. Your night should."),
            Quote("Rest is not idleness.", "John Lubbock"),
        ),
        Moment.EARLY_MORNING to listOf(
            Quote("Don't hand the first hour of your day to someone else's feed."),
            Quote("Start the day with your own thoughts, not everyone else's."),
            Quote("How we spend our days is, of course, how we spend our lives.", "Annie Dillard"),
        ),
        Moment.REPEAT to listOf(
            Quote("You can't stop the waves, but you can learn to surf.", "Jon Kabat-Zinn"),
            Quote("An urge is a wave. It rises, it peaks, it passes. Ride this one out."),
            Quote("Very little has changed since the last time you looked."),
            Quote("Your thumb got here before you decided to come."),
        ),
        Moment.TIME_UP to listOf(
            Quote("You made yourself a promise. Keeping it is how self-trust is built."),
            Quote("It is not that we have a short time to live, but that we waste a lot of it.", "Seneca"),
        ),
        Moment.ANY to listOf(
            Quote("How we spend our days is, of course, how we spend our lives.", "Annie Dillard"),
            Quote("Almost everything will work again if you unplug it for a few minutes, including you.", "Anne Lamott"),
            Quote("Attention is the rarest and purest form of generosity.", "Simone Weil"),
            Quote("My experience is what I agree to attend to.", "William James"),
            Quote("A wealth of information creates a poverty of attention.", "Herbert Simon"),
            Quote("Boredom is the dream bird that hatches the egg of experience.", "Walter Benjamin"),
            Quote("Tell me, what is it you plan to do with your one wild and precious life?", "Mary Oliver"),
            Quote("This app was built to keep you. You're allowed to leave."),
            Quote("What were you hoping to feel when you picked up your phone?"),
            Quote("The only moment that's actually happening is this one."),
        ),
    )

    @Volatile
    private var lastQuote: String? = null

    fun moment(hour: Int, attempts: Int, timeUp: Boolean): Moment = when {
        timeUp -> Moment.TIME_UP
        hour >= 23 || hour < 5 -> Moment.LATE_NIGHT
        attempts >= REPEAT_THRESHOLD -> Moment.REPEAT
        hour in 5..8 -> Moment.EARLY_MORNING
        else -> Moment.ANY
    }

    fun compose(
        appName: String,
        attempts: Int,
        hour: Int,
        clock: String,
        timeUp: Boolean,
        customMessage: String?,
        random: Random = Random.Default,
    ): PauseCopy {
        val moment = moment(hour, attempts, timeUp)
        val opener = when (moment) {
            Moment.TIME_UP -> "Your time on $appName is up."
            Moment.LATE_NIGHT -> "It's $clock."
            Moment.REPEAT -> "${ordinal(attempts)} time reaching for $appName in 24 hours."
            Moment.EARLY_MORNING -> "The first thing you reach for sets the tone."
            Moment.ANY -> "You reached for $appName."
        }
        val caption = if (attempts > 1 && moment != Moment.REPEAT) {
            "${ordinal(attempts)} time opening $appName in the last 24 hours"
        } else {
            null
        }
        return PauseCopy(opener, caption, pickQuote(moment, customMessage, random))
    }

    internal fun pickQuote(moment: Moment, customMessage: String?, random: Random): Quote {
        // The user's own words persuade better than anyone's, but not every single time.
        if (!customMessage.isNullOrBlank() && random.nextFloat() < CUSTOM_MESSAGE_CHANCE) {
            return Quote(customMessage, "a note from you")
        }
        val pool = QUOTES[moment]?.takeIf { moment != Moment.ANY && random.nextFloat() < MOMENT_QUOTE_CHANCE }
            ?: QUOTES.getValue(Moment.ANY)
        val fresh = pool.filter { it.text != lastQuote }.ifEmpty { pool }
        return fresh.random(random).also { lastQuote = it.text }
    }

    fun reflection(reason: Reason, appName: String): Reflection? = when (reason) {
        Reason.SPECIFIC -> null
        Reason.BORED -> Reflection(
            "Boredom is a doorway, not an emergency.",
            "Give it one quiet minute. Your own ideas show up right after the itch to fill it.",
        )
        Reason.AVOIDING -> Reflection(
            "The task won't get smaller while you scroll.",
            "Do the tiniest next step for two minutes. $appName will still be here after.",
        )
        Reason.AUTOPILOT -> Reflection(
            "Your thumb got here before you did.",
            "That's the habit, not you. Every time you close it now, the loop gets a little weaker.",
        )
        Reason.TIRED -> Reflection(
            "Your mind wants rest, not more input.",
            "Stand up, drink some water, look out a window. Two minutes of that beats twenty of $appName.",
        )
        Reason.LONELY -> Reflection(
            "A feed can't hug back.",
            "Message one person you actually miss. That's the connection you came looking for.",
        )
    }
}

internal fun ordinal(n: Int): String {
    val suffix = if (n % 100 in 11..13) "th" else when (n % 10) {
        1 -> "st"
        2 -> "nd"
        3 -> "rd"
        else -> "th"
    }
    return "$n$suffix"
}
