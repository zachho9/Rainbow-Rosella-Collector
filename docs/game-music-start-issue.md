# Game Music Start Issue — Root Cause Investigation

> **Status: UNRESOLVED.** The fix described in this document (branch `fix/music-production-silence`) was implemented and tested. Music now plays when the user clicks, which is an improvement over silent failure. However, the original desired behaviour — music starting automatically on mouse movement without requiring an explicit click — is **still not achieved** on a fresh origin. The click-to-start behaviour is a workaround, not the intended design. A proper fix is pending.

## Problem

Game background music played correctly on `npm run dev` (mouse movement triggered it) but was completely silent on `npm run build` + `npm run preview`. No error appeared in the console.

## Root Cause

Three compounding issues, each hiding the next.

### 1. `import.meta.env.DEV` silenced production errors

Every `.catch()` handler in `src/utils/sound.ts` was guarded by `if (import.meta.env.DEV)`. Vite replaces `import.meta.env.DEV` with `false` in production builds, so any `play()` rejection was swallowed silently. This hid the real error completely.

### 2. Chrome blocked muted autoplay on a fresh origin

`startMusicMuted()` was called from a `useEffect` on mount — no user gesture. Chrome's autoplay policy allows muted autoplay only for origins with a non-zero **Media Engagement Index (MEI)**. `localhost:4173` (the Vite preview server) had never been visited, so its MEI was 0. Chrome rejected `play()` with:

```
NotAllowedError: play() failed because the user didn't interact with the document first.
```

The fix for (1) made this visible.

### 3. `mousemove` is not a user gesture; `unmuteMusic()` had no fallback

After `startMusicMuted()` failed (audio element stayed `paused`), the code tried `unmuteMusic()` on the first `mousemove` event. Two problems:

- `mousemove` is **not** a valid user gesture for `HTMLMediaElement.play()`. Chrome still rejects it.
- `unmuteMusic()` checked `if (src.paused) return` — it returned early instead of retrying `play()`.

So even the fallback path failed silently.

### Why dev worked (but only for this developer)

`localhost:5173` (the Vite dev server) had a **high MEI** from hundreds of development sessions. Chrome relaxed its autoplay policy for that origin and allowed muted autoplay without a gesture — making `mousemove` appear to work. A fresh browser profile, or any first-time visitor, would have seen the same failure on `localhost:5173`.

React 18 StrictMode also double-invoked the `useEffect` in dev, giving `startMusicMuted()` a second attempt (via unmount → remount). This sometimes masked the rejection on a "warm" dev origin.

## Fix (branch `fix/music-production-silence`)

**`src/utils/sound.ts`**

- Removed all `import.meta.env.DEV` guards from `.catch()` handlers so failures are always logged.
- `unmuteMusic()`: when `src.paused` (i.e. `play()` was previously rejected), call `play()` instead of returning.

**`src/App.tsx`**

- Split the single `handleFirstInteraction` listener into two independent handlers: `handleMouseMove` and `handleClick`.
- `handleMouseMove` removes only itself, leaving `handleClick` alive as a fallback.
- `handleClick` fires within a real user-gesture context (satisfies Chrome's autoplay policy) and removes both listeners.

## Resulting Behaviour (After Fix)

| Scenario | Music start |
|---|---|
| Fresh origin (first visit, MEI = 0) | First click anywhere on the page |
| Warm origin (repeat visits, MEI > 0) | First mouse movement |
| User presses Play button | Immediately (click is both gesture and explicit action) |

**This is not the desired behaviour.** The intended design is for music to start automatically on mouse movement for all users, including first-time visitors. The click requirement is a browser-enforced constraint that the current fix does not overcome — it simply makes the failure visible and provides a click fallback instead of silently doing nothing.

Real users on a deployed site will always have MEI = 0 on their first visit, meaning they will always need to click before music plays. This is currently unresolved.

## Files Changed

- `src/utils/sound.ts` — error visibility, `unmuteMusic` resilience
- `src/App.tsx` — split interaction handlers, keep click listener as fallback
