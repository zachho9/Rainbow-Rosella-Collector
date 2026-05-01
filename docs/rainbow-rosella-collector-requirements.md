# Rainbow Rosella Collector — Requirements Document

## Project Overview

A simple, locally-run web-based collection game for a 5-year-old child. The player controls an Eastern Rosella (a colourful Australian/NZ parrot) that follows the mouse cursor around the screen, collecting hearts, stars, and rainbow gems for points within a 60-second time limit. The game features a start screen, gameplay screen, and results screen, with a click-to-pop bubble mechanic for variety.

**Target user:** 5-year-old child, mouse-only input, icon and sound based with simple words, primarily for fun.

**Build target:** Local development, runs in browser on Windows 11.

---

## Tech Stack

- **Framework:** React (with TypeScript)
- **Build tool:** Vite
- **Styling:** CSS modules or plain CSS (no heavy UI framework needed)
- **Storage:** `localStorage` for persistent high score
- **Audio:** HTML5 `Audio` API (or Howler.js if preferred)
- **Animation:** CSS animations + `requestAnimationFrame` for game loop

---

## Game Mechanics

### Core Loop

1. Player sees a Start Screen with a "Play" button and the current high score.
2. Player clicks Play, the game starts, and a 60-second timer begins counting down.
3. An Eastern Rosella sprite follows the mouse cursor smoothly around the play area.
4. Stationary collectibles (hearts, stars, rainbow gems) are scattered across the screen.
5. When the rosella overlaps with a collectible, it is collected: the item disappears with a sound and sparkle effect, and the score increases.
6. New collectibles spawn at random positions to replace collected ones, so the screen never feels empty.
7. Periodically (every 10 to 15 seconds), a treasure bubble appears at a random spot. The player clicks the bubble to pop it, releasing 3 to 5 hearts and stars in a small burst around the bubble's position.
8. After 60 seconds, the game ends and the Results Screen shows the final score, high score, and a "Play Again" button.

### Movement

- The rosella follows the mouse cursor using a smooth lerp (linear interpolation) for a slightly delayed, friendly feel rather than snapping rigidly to the cursor.
- Lerp factor around 0.15 to 0.25 per frame works well.
- The rosella sprite is approximately 70 pixels wide.

### Collectibles

| Type | Icon | Points | Spawn rarity |
|------|------|--------|--------------|
| Heart | ❤️ | 1 | Common |
| Star | ⭐ | 3 | Uncommon |
| Rainbow gem | 🌈 (or a gem icon) | 5 | Rare |

- All collectibles are **stationary** once spawned.
- Collectibles are around 50 to 60 pixels in size.
- Maintain roughly 8 to 12 collectibles on screen at any time.
- When one is collected, spawn a new one after a short delay (around 0.5 to 1 seconds) at a random position.
- The collision radius for the rosella should be slightly larger than its visible sprite (add 10 to 15 pixels) to make collection feel generous and forgiving.
- Use simple distance-based circle collision: if `distance(rosella, collectible) < (rosellaRadius + collectibleRadius)`, collect.
- When collected, play a "pop" or "ding" sound and show a brief sparkle/particle effect at the collectible's position.

### Treasure Bubbles (Click Interaction)

- Spawn one bubble every 10 to 15 seconds at a random position on screen.
- The bubble has a friendly look: a soft round shape with a gentle pulsing animation and a slight rainbow shimmer or glow.
- Clickable area should be generous, around 70 to 80 pixels in diameter.
- When clicked:
  - Play a satisfying "pop" sound (distinct from regular collection sound).
  - Show a confetti or sparkle burst particle effect.
  - Spawn 3 to 5 hearts and stars (mix) at slightly randomised positions in a small radius around the bubble.
  - Remove the bubble.
- If the bubble is not clicked within 8 seconds, it gently fades out and disappears on its own.
- Only one bubble at a time.

### Timer

- Countdown from 60 seconds.
- Display as a horizontal **rainbow gradient bar** at the top of the screen that shrinks from full width to zero. This is more intuitive for a 5-year-old than numbers.
- Optionally also show the number of seconds remaining in small text alongside the bar.
- When the timer reaches zero, transition to the Results Screen.

### Scoring & High Score

- Score increases each time a collectible is picked up.
- Display the current score in a pill-shaped container in a corner of the screen during gameplay, with a small star icon next to the number.
- High score is saved to `localStorage` under a key like `rosellaHighScore`.
- High score is displayed on the Start Screen and on the Results Screen.
- If the player beats their high score, show a celebratory animation on the Results Screen (e.g. confetti, "New High Score!" text).

### No Game Over / No Punishment

- There are no enemies, no lives, no losing condition.
- Missing a bubble does not punish the player; they just lose out on bonus items.
- The game is purely a positive, collection-focused experience.

---

## Screens

### 1. Start Screen

**Layout:**
- Sky-blue gradient background (lighter at top, slightly deeper at bottom).
- Soft white fluffy clouds scattered at the top of the screen.
- A green grassy hill curving along the bottom with simple tulip flowers poking up.
- Title text "Rainbow Rosella" in a chunky rounded display font, centred near the top.
- The Eastern Rosella mascot in the centre of the screen, large and friendly cartoon-style.
- A big primary "Play" button below the mascot, pink with a soft drop shadow underneath.
- High score displayed in a small pastel pill at the top-right corner ("Best: 42 ⭐").
- Optional small mute/sound toggle button at the top-left corner.

### 2. Game Screen

**Layout:**
- Same sky and grass background as the Start Screen, for consistency.
- Rainbow timer bar at the top inside a white rounded pill container.
- Score pill at the top-right corner ("⭐ 12").
- Rosella sprite following the cursor.
- Collectibles scattered in the play area.
- Bubbles (when active) appearing in the play area.
- Confetti/sparkle particle effects on collection and bubble pop events.

### 3. Results Screen

**Layout:**
- Same background, with confetti scattered across the top to feel celebratory.
- Rosella mascot front and centre with a happy expression.
- Big chunky text saying "Great job!" with a slight outline.
- Final score displayed in a large pastel pill: "You got 42 ⭐"
- High score shown below, with "New High Score!" message if applicable.
- "Play Again" button at the bottom in the same chunky pink style as the Play button.
- Optional "Home" button to return to the Start Screen.

---

## Visual Design Style

The visual style should match flat cartoon illustration with chunky rounded shapes, no outlines, and friendly characters. Think bright but not harsh, colourful but not overwhelming. Reference: clean modern kids' app design with soft sky-and-grass scenery and pastel UI accents.

### Colour Palette

**Background and scenery:**
- Sky gradient top: `#B8E5F5`
- Sky gradient bottom: `#E0F4FA`
- Grass green: `#A8D86E`
- Grass shadow: `#7BC04A`
- Cloud white: `#FFFFFF`

**UI elements:**
- Primary button pink: `#FF8FA3`
- Primary button shadow: `#E66B82`
- Secondary button yellow: `#FFD93D`
- Secondary button shadow: `#E6B82E`
- Card backgrounds: `#FFFFFF` or very light pink `#FFF5F8`
- Text dark: `#2C3E50` (soft dark blue-grey, never pure black)

**Pastel accents (for collectibles and effects):**
- Soft pink: `#FFADAD`
- Soft peach: `#FFD6A5`
- Soft yellow: `#FDFFB6`
- Soft mint: `#CAFFBF`
- Soft sky: `#9BF6FF`
- Soft cornflower: `#A0C4FF`
- Soft lavender: `#BDB2FF`

### Typography

- **Title font:** Fredoka or Fredoka One (Google Fonts) — chunky, rounded, kid-friendly.
- **Body/UI font:** Nunito (Google Fonts) — rounded, very readable.
- Both are free and easy to import in a Vite project.

### Buttons

- Border radius: 24 to 32 pixels (very rounded).
- Use the chunky offset-shadow style:
  ```css
  background: #FF8FA3;
  box-shadow: 0 6px 0 #E66B82;
  border: none;
  ```
- On press: remove the shadow and translate the button down by 6 pixels for a satisfying tactile feel:
  ```css
  &:active {
    box-shadow: 0 0 0 #E66B82;
    transform: translateY(6px);
  }
  ```
- Padding: generous, around 16px vertical and 32px horizontal minimum.
- Text: bold, white, in the chunky title font.

### Cards and Containers

- Border radius: 20 to 24 pixels.
- Soft drop shadow: `box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);`
- White or very light pastel backgrounds.

### Layered Scenery

- Sky in the back (with clouds).
- Grass hills in the midground.
- Flowers, mascot, and UI elements in the foreground.

---

## Audio

Source free sounds from sites like pixabay.com or freesound.org. Required sounds:

- **Collection sound:** Soft "pop" or "ding" — plays each time a collectible is collected.
- **Bubble pop sound:** A satisfying "pop" or magical chime — plays when a bubble is clicked. Should be distinct from the regular collection sound.
- **Game start sound:** Optional cheerful chime when Play is clicked.
- **Game end sound:** "Ta-da" or celebratory chime — plays when the timer hits zero.
- **High score sound:** Extra-celebratory sound — plays on the Results Screen if high score is beaten.
- **Background music:** Optional gentle, looping, kid-friendly music. Must be muteable from a button on the Start Screen.

Implementation note: preload all sounds at app start. Use a small wrapper function that creates and plays an Audio instance so multiple sounds can overlap (important when collecting multiple items quickly).

---

## Assets

For a weekend project, **emoji-based assets** are recommended for speed:

- Rosella: 🦜 (parrot emoji), rendered large.
- Heart: ❤️
- Star: ⭐
- Rainbow gem: 🌈 (or a custom SVG gem if preferred)
- Bubble: a CSS-styled circle with a radial gradient and shimmer animation, or a soap-bubble emoji 🫧.

If time permits, the rosella can be replaced with a custom SVG illustration of an Eastern Rosella for more visual personality. Free SVG icon sets like Lucide or Phosphor can supply alternative shapes if desired.

---

## Project Structure (suggested)

```
rainbow-rosella/
├── src/
│   ├── components/
│   │   ├── StartScreen.tsx
│   │   ├── GameScreen.tsx
│   │   ├── ResultsScreen.tsx
│   │   ├── Rosella.tsx
│   │   ├── Collectible.tsx
│   │   ├── Bubble.tsx
│   │   ├── TimerBar.tsx
│   │   ├── ScoreDisplay.tsx
│   │   └── ParticleEffect.tsx
│   ├── hooks/
│   │   ├── useMousePosition.ts
│   │   ├── useGameLoop.ts
│   │   └── useHighScore.ts
│   ├── utils/
│   │   ├── collision.ts
│   │   ├── spawn.ts
│   │   └── sound.ts
│   ├── styles/
│   │   └── (CSS modules or global styles)
│   ├── assets/
│   │   └── sounds/
│   ├── App.tsx
│   └── main.tsx
├── public/
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Build Order (Weekend Plan)

### Saturday morning
- Scaffold the Vite + React + TypeScript project.
- Set up the screen state machine (`start` | `playing` | `results`).
- Build the Start Screen with sky/grass background, title, and Play button.
- Implement the rosella following the mouse cursor with smooth lerp.

### Saturday afternoon
- Implement collectibles: spawn at random positions, render as emoji/icon.
- Implement collision detection and collection logic.
- Score tracking and respawning of collectibles.
- Add the score display pill in the corner.

### Sunday morning
- Implement the 60-second timer with the rainbow shrinking bar.
- Build the Results Screen with score and Play Again button.
- Implement `localStorage` for high score saving and loading.
- Add high score display on Start and Results screens.

### Sunday afternoon
- Add the bubble mechanic: timed spawning, click-to-pop, item burst.
- Add all sound effects.
- Add sparkle/confetti particle effects on collection and bubble pop.
- Final visual polish: animations, hover states, button press feedback.
- Test the full game loop with the kid.

---

## Acceptance Criteria

- The game runs locally with `npm run dev` and opens in the browser.
- The Start Screen, Game Screen, and Results Screen all display correctly and transition properly.
- The rosella smoothly follows the mouse cursor.
- Collectibles can be collected by hovering the rosella over them, with sound and visual feedback.
- A bubble appears every 10 to 15 seconds, can be clicked to pop, and releases items.
- The 60-second timer counts down visibly and ends the game on zero.
- The score updates live and saves to `localStorage` as a high score.
- The game has no errors in the browser console.
- Visual style matches the colour palette, typography, and layered scenery described.
- All sounds play correctly without delay or overlap issues.
- The game is fun and easy enough for a 5-year-old to play independently.

---

## Notes for Claude Code

- Prioritise a working game loop first, then add polish.
- Keep components small and focused.
- Use TypeScript types for game state, collectibles, and bubble objects.
- Use `requestAnimationFrame` for the main game loop, not `setInterval`.
- Avoid heavy dependencies; the standard React + Vite + TypeScript setup is enough.
- Make the code easy to read so the parent can tweak values like timer length, spawn rates, and point values for their kid.
