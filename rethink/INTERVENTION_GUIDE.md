# Rethink: Smart Intervention System Guide

This guide explains how the Smart Intervention system works, bridging the gap between React Native and Native Android code. 

## 🧠 First Principles: How it Works

The system is built on a "Listen → Detect → Intervene" loop.

### 1. The Listener (Native Android)
Android doesn't allow apps to easily "stalk" other apps for security. However, **Accessibility Services** (designed for screen readers) have a unique superpower: they receive updates every time the "window state" changes (i.e., when a new app is opened).

*   **`AppForegroundService.kt`**: This is our "spy." It lives in the Android OS. Every time you open an app, Android sends an event here.
*   **The Bridge**: When this service detects a package name change (e.g., you opened `com.google.android.youtube`), it needs to tell the JS layer.
    *   **If Rethink is open**: It "emits" an event (`APP_FOREGROUND_CHANGED`) directly to the JS engine.
    *   **If Rethink is killed**: It starts a **Headless JS Task** (`AppMonitorHeadlessService.kt`), which wakes up a tiny piece of JS code in the background without opening the full app.

### 2. The Bridge (Native Module)
To communicate between JS and Kotlin, we use a **Native Module**.

*   **`AppEventModule.kt`**: This defines the functions you can call from JS (like `openAccessibilitySettings()` or `blockApp()`).
*   **`AppEventPackage.kt`**: This is just a wrapper that registers the module so React Native can "see" it.

### 3. The Brain (React Native Context)
This is where you, the React Native developer, control everything.

*   **`InterventionContext.tsx`**: This is the global state. 
    *   It listens for the native events.
    *   It checks if the app you opened is in your "Monitored List."
    *   If it is, it sets `isIntervening` to `true`.
    *   It uses `AsyncStorage` to remember if the user has enabled the feature.

### 4. The UI (React Native Component)
*   **`InterventionOverlay.tsx`**: A standard React Native component. Because it's managed in the `RootNavigator`, it can "pop up" over the entire app regardless of which screen the user is on.

---

## 📂 File Map: Who does What?

| File | Language | Role |
| :--- | :--- | :--- |
| `AppForegroundService.kt` | Kotlin | The "Spy" - Detects which app is on screen. |
| `AppEventModule.kt` | Kotlin | The "Messenger" - Passes data between JS and Android. |
| `AndroidManifest.xml` | XML | The "ID Card" - Tells Android we have permission to use these powers. |
| `InterventionContext.tsx` | TSX | The "Brain" - Logic for when to show the overlay. |
| `InterventionOverlay.tsx` | TSX | The "Face" - The animated UI the user sees. |
| `AppMonitorTask.ts` | TS | The "Ghost" - JS code that runs even when the app is dead. |

---

## 🚀 What else can you do with these permissions?

Now that you have **Accessibility** and **Overlay** permissions, you have "Superuser" level UI powers:

### 1. Interactive App Blocking
Instead of just showing a "Take a Breath" screen, you could:
*   **Force Close**: Immediately send the user back to the Home Screen if they've used YouTube for more than 1 hour.
*   **Grayscale Mode**: Use the accessibility service to inject a grayscale filter over specific apps to make them less "addictive."

### 2. Usage Deep-Dives
*   **Scroll Tracking**: Accessibility services can see how much a user scrolls. You could warn them: "You've scrolled 5 miles on Instagram today. Maybe stop?"
*   **Button Detection**: You can detect when a user clicks specific buttons (like "Buy Now" on Amazon) and add a "Think twice" confirmation.

### 3. Smart Automation
*   **Focus Mode**: Automatically turn on "Do Not Disturb" when a user opens a productivity app like Notion or Slack.
*   **Screen Dimming**: Automatically dim the screen when it's late at night and the user opens a social media app.

### 4. Custom Overlays
*   **Floating Timers**: Show a small floating countdown timer over TikTok so they know exactly how much time is left.
*   **Micro-Journaling**: When they open a distracting app, ask a one-sentence question: "What is your goal for opening this right now?"

> [!TIP]
> **Scalability**: Because we used `Context` and a `monitoredApps` array, you can easily build a UI where users can pick *any* app from their phone to add to the list. The native code doesn't care which app it is; it just reports the name!
