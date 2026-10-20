package com.rethink.guard.policy

import com.rethink.guard.model.AllowReason
import com.rethink.guard.model.BlockReason
import com.rethink.guard.model.Decision
import com.rethink.guard.model.GateSettings
import com.rethink.guard.model.GuardConfig
import com.rethink.guard.model.Rule
import com.rethink.guard.model.Session
import org.junit.Assert.assertEquals
import org.junit.Test

class PolicyEngineTest {

    private val insta = "com.instagram.android"
    private val now = 1_000_000_000L

    private fun config(graceSeconds: Int = 60, vararg extra: Rule) = GuardConfig(
        rules = listOf(Rule.Intervention("intervention", setOf(insta))) + extra,
        gate = GateSettings(graceSeconds = graceSeconds),
    )

    private fun decide(session: Session?, config: GuardConfig = config(), pkg: String = insta) =
        PolicyEngine.decide(pkg, config, session, now)

    @Test fun `unguarded app is allowed`() =
        assertEquals(Decision.Allow(AllowReason.NOT_GUARDED), decide(null, pkg = "com.example.notes"))

    @Test fun `guarded app without session is gated`() =
        assertEquals(Decision.Gate(insta), decide(null))

    @Test fun `open session is allowed`() =
        assertEquals(Decision.Allow(AllowReason.ACTIVE_SESSION), decide(Session(limitMs = 600_000, usedMs = 1_000)))

    @Test fun `return within grace is allowed`() =
        assertEquals(
            Decision.Allow(AllowReason.WITHIN_GRACE),
            decide(Session(limitMs = 600_000, leftAt = now - 30_000)),
        )

    @Test fun `return after grace is gated`() =
        assertEquals(Decision.Gate(insta), decide(Session(limitMs = 600_000, leftAt = now - 61_000)))

    @Test fun `grace off still tolerates a few seconds`() {
        val cfg = config(graceSeconds = 0)
        assertEquals(Decision.Allow(AllowReason.WITHIN_GRACE), decide(Session(600_000, leftAt = now - 3_000), cfg))
        assertEquals(Decision.Gate(insta), decide(Session(600_000, leftAt = now - 6_000), cfg))
    }

    @Test fun `exhausted session inside grace is shielded`() =
        assertEquals(Decision.Shield(insta), decide(Session(limitMs = 60_000, usedMs = 60_000, leftAt = now - 1_000)))

    @Test fun `exhausted session after grace gets a fresh gate`() =
        assertEquals(Decision.Gate(insta), decide(Session(limitMs = 60_000, usedMs = 60_000, leftAt = now - 120_000)))

    @Test fun `unlimited session never exhausts`() =
        assertEquals(
            Decision.Allow(AllowReason.ACTIVE_SESSION),
            decide(Session(limitMs = Session.UNLIMITED, usedMs = 10 * 3_600_000L)),
        )

    @Test fun `hard block wins over an active session`() {
        val block = Rule.Block("focus", setOf(insta), BlockReason.FOCUS)
        assertEquals(Decision.Block(insta, block), decide(Session(limitMs = 600_000), config(60, block)))
    }
}
