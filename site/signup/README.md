# Go Around · Sign-up / Sign-in (v9 live stub)

Branch: `feature/signup-v9`
Source design: v9 on `design/signin-first-page-redesign` (Pearl + Midnight, Option A hero, DFE claim copy locked).

## What this is
Static UI under `/signup/` for the sign-in first page and the multi-step sign-up flow, including the DFE claim screens. Pearl and Midnight themes only.

## What waits for the database (do not wire yet)
- Real Google OAuth / session creation (`gate.ts`, auth handlers)
- Persisting profile, licences, ratings, DFE claim rows (`appdata/`)
- SA review queue for DFE claims → blue tick only after paid membership + approval (B-19)
- Returning-member skip / account merge
- Live toast + redirect into the aerodrome dashboard after real sign-in

Protected files **not** touched on this branch: `gate.ts`, `appdata/`, auth logic, `wm-core.js`, `wm-shell.css`, `wm-shell.js`.

Google buttons and Continue actions are UI stubs — they navigate the mock screens only.

## Screens (`?screen=`)
- `signin-a` (default) — GA logo centred + “What every pilot needs” (Clash Display)
- `identity` · `terms` · `aviation` · `licences` · `dfe-claim` · `dfe-pending` · `done`
- Themes: `?t=pearl` or `?t=midnight`

Merges only on MT’s yes. Parked waiting for the database.
