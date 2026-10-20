/** Wire format shared with android/.../guard/state/ConfigRepository.kt (version 1). */
export type GuardRule =
    | { id: string; type: 'intervention'; packages: string[] }
    | { id: string; type: 'block'; reason: 'limit' | 'focus' | 'other'; packages: string[] };

export interface GateSettings {
    breathSeconds: number;
    /** Returning to an app within this window skips the gate. */
    graceSeconds: number;
    /** Ask "how much time do you need?" and re-gate when it runs out. */
    askSessionLength: boolean;
    message?: string;
}

export interface GuardConfig {
    rules: GuardRule[];
    gate: GateSettings;
}

export type GuardOutcome = 'gated' | 'opened' | 'dismissed' | 'shielded' | 'blocked';

export interface GuardEvent {
    packageName: string;
    outcome: GuardOutcome;
    timestamp: number;
    sessionMinutes?: number;
}
