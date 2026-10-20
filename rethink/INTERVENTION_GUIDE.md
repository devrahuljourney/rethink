# Rethink Guard: Mindful Pause, Limits & Focus Enforcement

The guard decides, natively, what happens when the user opens an app: let it through,
show the mindful pause, or block it. JS only owns *configuration* and *insights*.

## Flow

```
Accessibility event (TYPE_WINDOW_STATE_CHANGED)
  → ForegroundTracker   filters noise → AppSwitch(from, to)
  → PolicyEngine        (config, session, now) → Decision
  → GateActivity        native Compose screen, or allow + start session ticker
  → EventLog            outcome → JS (stats now, backend/coach in P1)
```

Decision order (`PolicyEngine`): **hard block → not guarded → stale session → exhausted (shield) → allow**.

| Concept | Behaviour |
|---|---|
| Gate | Breath (configurable seconds) → "Do you still want to open X?" → "How much time do you need?" (5/10/15/30 min, no limit) |
| Session | Only screen-on foreground time counts. When it runs out the shield asks "Do you still need X?" |
| Grace window | Returning to an app within `graceSeconds` of leaving skips the gate (minimum 5 s for short interruptions) |
| Hard block | Limits / focus mode. No way through, only "Close" or "Manage in Rethink" |
| Exits | Back → home, Home → dismissed, screen off → home |
| Ignored | Same-app events, keyboards, notification shade, pane-disappeared events, calls (incl. WhatsApp call screens), non-launchable packages |

## Code map

### Native (`android/app/src/main/java/com/rethink/guard/`)

| Path | Role |
|---|---|
| `model/` | `GuardConfig`, `Rule`, `Session`, `Decision`: plain data |
| `policy/PolicyEngine.kt` | Pure decision function (unit tested) |
| `detect/ForegroundTracker.kt` | Event → real app switch filters (unit tested) |
| `detect/InstalledApps.kt` | Launcher apps / home screens / keyboards |
| `state/` | `ConfigRepository`, `SessionRepository`, `AttemptCounter`, `EventLog` (SharedPreferences) |
| `service/GuardAccessibilityService.kt` | Thin orchestrator + session ticker |
| `gate/` | `GateActivity` + Compose `GateScreen` |
| `bridge/` | `GuardModule` RN module |

Unit tests: `cd android && ./gradlew :app:testDebugUnitTest`

### JS

| Path | Role |
|---|---|
| `services/guard/types.ts` | Wire format shared with `ConfigRepository.kt` |
| `services/guard/buildGuardConfig.ts` | Pure: app state → rules |
| `services/guard/guardNative.ts` | Typed bridge |
| `services/guard/guardEvents.ts` | Drains native outcome events into storage |
| `utils/useGuardSync.ts` | Pushes config on every change, collects events |
| `context/InterventionContext.tsx` | User settings (enabled, monitored apps, gate settings) |
| `screen/Intervention/AccessibilityDisclosure.tsx` | Play prominent disclosure |

## Adding a feature

1. Add a `Rule` subtype in `model/GuardConfig.kt` and parse it in `ConfigRepository`.
2. Teach `PolicyEngine` where it sits in the decision order, with a unit test.
3. Emit it from `buildGuardConfig.ts`.

Unknown rule types are ignored by older native builds, so JS can ship ahead of native.

## Google Play compliance checklist

- [x] Prominent in-app disclosure with explicit consent **before** opening accessibility settings
- [x] Least privilege: `typeWindowStateChanged` only, `canRetrieveWindowContent="false"`
- [x] `isAccessibilityTool` not set (Rethink is not an accessibility tool)
- [x] Clear service description in system settings (`guard_service_description`)
- [x] No `SYSTEM_ALERT_WINDOW` (a bound accessibility service may start the gate activity)
- [x] No `QUERY_ALL_PACKAGES`: `<queries>` for launcher/home intents only
- [x] No `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`: user opens the system list themselves
- [x] No foreground service, so no special-use FGS declaration is needed
- [ ] Play Console → App content → **Permissions declaration** for Accessibility API, with a short video showing the disclosure and the feature
- [ ] Privacy policy section matching the disclosure text
- [ ] Data safety form: update before P1 syncs guard events to the backend
