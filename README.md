# Reflex Rush

A neon-arcade reaction-time game for the browser. Wait for the arena to turn from red to green, then click, tap or press Space as fast as you can. Play five rounds, see your times and score, and try to beat your personal best.

Everything runs in the browser. There is no backend, no account, no API key and no paid service.

## Key features

- Five-round sessions with a clearly defined state machine: idle → ready → waiting → go → result / false start → game over.
- Reaction times measured with `performance.now()`, captured at the instant the green signal fires.
- Mouse, touch and Space-bar input. The first valid input wins; repeats and stray keys are ignored.
- False-start handling (−250 points) with a round that is never counted as a valid measurement.
- Tab-visibility safety: hiding the tab during a round cancels that round instead of recording a bogus time.
- Personal records (best average and best score) saved in LocalStorage, validated on load.
- Optional synthesized sound effects (Web Audio API), silent by default.
- Neon arcade design with CSS-only animation, a personal-best celebration, and full reduced-motion support.
- Responsive layout for phones, tablets and desktops, with safe-area insets and 48 px touch targets.
- Accessible: semantic HTML, visible focus, screen-reader announcements, and text/icon cues in addition to colour.

## Screenshots

Screenshots have not been generated yet. Add them to a `docs/` folder and update these placeholders:

| Screen | Placeholder |
| --- | --- |
| Idle / start screen | `docs/screenshot-idle.png` _(placeholder)_ |
| Waiting (red arena) | `docs/screenshot-waiting.png` _(placeholder)_ |
| Go (green arena) | `docs/screenshot-go.png` _(placeholder)_ |
| Round result | `docs/screenshot-result.png` _(placeholder)_ |
| Session summary | `docs/screenshot-summary.png` _(placeholder)_ |

## Technology stack

- React 18 with functional components and hooks
- TypeScript (strict mode)
- Vite 6
- Standard CSS organised in `src/styles/` (CSS custom properties for the palette)
- Lucide React for icons
- Vitest and React Testing Library for tests
- ESLint (typescript-eslint, react-hooks) for code quality
- LocalStorage for personal records and settings

## Project structure

```text
reflex-rush/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── GameArena.tsx          # the central arena; renders every game state
│   │   ├── GameHeader.tsx
│   │   ├── GameInstructions.tsx   # per-state instructions
│   │   ├── GameResults.tsx        # single-round result / false start
│   │   ├── ResetRecordsButton.tsx # two-step reset confirmation
│   │   ├── RoundProgress.tsx
│   │   ├── SessionSummary.tsx
│   │   ├── SettingsPanel.tsx
│   │   └── StatsPanel.tsx
│   ├── game/
│   │   ├── gameTypes.ts           # shared TypeScript types
│   │   ├── gameLogic.ts           # pure reducer (state machine)
│   │   ├── scoring.ts             # score formula, feedback, session summary
│   │   └── timing.ts              # clock, random delay, timer manager
│   ├── hooks/
│   │   ├── useReactionGame.ts     # timers, input, visibility, sound, records
│   │   └── useSettings.ts
│   ├── styles/
│   │   ├── variables.css
│   │   ├── global.css
│   │   ├── components.css
│   │   └── animations.css
│   ├── utils/
│   │   ├── formatTime.ts
│   │   ├── sound.ts               # Web Audio synthesized tones
│   │   └── storage.ts             # validated LocalStorage access
│   ├── App.tsx
│   └── main.tsx
├── tests/
│   ├── setup.ts
│   ├── gameLogic.test.ts
│   ├── scoring.test.ts
│   ├── timing.test.ts
│   ├── storage.test.ts
│   └── ui.test.tsx
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vercel.json
├── eslint.config.js
├── README.md
└── .gitignore
```

## Prerequisites

- Node.js 18.18 or newer (Node 20 or 22 recommended)
- npm 9 or newer

## Installation

```bash
npm install
```

## Development commands

```bash
npm run dev       # start the Vite dev server with hot reload
npm run preview   # serve the production build locally (run `npm run build` first)
```

## Production build

```bash
npm run build     # type-checks, then writes the static site to dist/
```

## Testing

```bash
npm run test         # run the whole suite once
npm run test:watch   # watch mode
```

Tests use fake timers and a mocked `performance.now()`, so they are deterministic and contain no sleep delays.

## Linting and type checking

```bash
npm run lint        # ESLint
npm run typecheck   # TypeScript validation with no output files
```

## Deploying to Vercel

The project is a static Vite site and needs no environment variables.

1. Push the repository to GitHub, GitLab or Bitbucket.
2. In Vercel choose **Add New → Project** and import the repository.
3. Confirm these settings (they are also in `vercel.json`):
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Click **Deploy**. The game is served over HTTPS at the generated URL.

Or with the CLI:

```bash
npm install --global vercel
vercel          # preview deployment
vercel --prod   # production deployment
```

After deploying, play a session, refresh the page and confirm your records are still shown. That verifies LocalStorage on the live origin.

## How to play

1. Press **Start Game**. After a short "get ready" pause the arena turns red.
2. Wait for the arena to turn green and show **CLICK NOW!**.
3. Click, tap or press Space as quickly as you can.
4. If you react while the arena is red, it is a **false start**.
5. After each round press **Next Round**. After five rounds you see the session summary.

If you switch tabs during a round, that round is cancelled and you restart it manually.

## Scoring

```
roundScore = max(0, 1000 - 2 * max(0, reactionTimeMs - 200))
```

- A reaction of 200 ms or faster scores 1,000 points.
- Each millisecond above 200 ms costs 2 points, down to a minimum of 0.
- A false start scores **−250** and is not counted as a valid reaction.
- The session score is the sum of all five rounds.
- Averages, fastest and slowest times use valid rounds only. A session with no valid rounds shows "—" instead of an average.

The score and feedback messages ("Lightning Fast!", "Nice Reaction!", "Keep Building Your Speed!") are informal game feedback. They are not a validated measure of ability, and one session does not show an improvement in real-world reflexes.

### What counts as a personal best

- **Best average:** the lowest average reaction time across a session with at least one valid round.
- **Best score:** the highest session score, which must be greater than zero.

## LocalStorage and privacy

The game stores two small entries in your browser's LocalStorage:

| Key | Contents |
| --- | --- |
| `reflex-rush:records:v1` | best average reaction time and best session score |
| `reflex-rush:settings:v1` | sound and reduce-motion preferences |

Nothing is sent to a server, and the game uses no analytics or cookies. Stored data is validated when loaded; corrupted or unavailable storage falls back to empty records. You can erase records at any time with **Reset Personal Records** (it asks for confirmation).

The page requests the Orbitron and Inter fonts from Google Fonts. If they cannot be loaded, the game falls back to system fonts.

## Known limitations

- Measured times include input-device and display latency, which differ between devices (touch screens and Bluetooth mice can add tens of milliseconds). Compare times on the same device.
- Records live in one browser on one device; there is no sync or leaderboard.
- Private browsing modes may block or clear LocalStorage, in which case records do not persist.
- Sound is generated with the Web Audio API and may be blocked by a browser until the first interaction.
- The five-round session length and score constants are fixed in code and are not configurable in the UI.

## Future improvements

- Optional session history and a progress chart.
- Configurable round count and delay range.
- Additional reaction modes (for example, target-position or colour-match rounds).
- Installable PWA with offline support and self-hosted fonts.
- Exporting and importing personal records.

## License

No license has been selected yet. Choose one before publishing or accepting contributions (MIT is a common choice for small open-source games) and add a `LICENSE` file.
