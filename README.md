# RPS Bash

A rock-paper-scissors table game by stillmoth. Each player secretly loads a queue of throws, then they all play out at once in a quick, noisy reveal. Built for friends and family around a table.

Built with Expo (React Native + TypeScript), the same setup as Natural Wake-Up and Fidget. Android comes first; iOS and joining from a browser come later.

## Run it

```bash
npm ci
npm run android         # build and install the dev build on a USB-connected phone (once)
npm start               # live reload into the dev build: scan the QR code with the phone's camera
npm run go              # or live reload into the Expo Go app (SDK 57), no build needed
npm run apk             # or a standalone test APK, same as the GitHub build
npm test                # rules and scoring tests
npm run lint
npm run typecheck
```

Everything the prototype uses (sound, haptics, animation) works in Expo Go as well as the dev build. See [docs/building-on-windows.md](docs/building-on-windows.md) for the one-time Windows PC setup and which way to use when.

## How it plays (Phase 1 prototype)

- **Modes:** against a bot on one phone, or pass and play for two players. In pass and play, player 2 loads after the phone is handed over, then the phone goes in the middle of the table for the reveal, with player 2's side turned to face them.
- **Load:** each player fills their throw slots in secret (tap a slot to take a throw back), then locks in. With a load timer, empty slots are filled at random when time runs out.
- **Reveal:** throws are revealed in pairs until someone has enough wins. Each clash speeds up a little; the deciding throw plays in slow motion. If ties leave the match undecided when the queues run out, it goes to single tiebreak throws.
- **Rules presets** (`src/core/rules.ts`): Quick (one throw), Classic (best two out of three, the default), Speed (best of three with a 10-second load timer), Marathon (best four out of seven).
- **Points are for bragging only.** A throw win scores 100 times the winner's streak; combos add bonuses: Full circle (threw all three moves), Stubborn (same move three times in a row), Clean sweep (won without losing a throw). The match is decided on throws, never points.
- **Friendly stakes:** the loser gets a real-life challenge (pick the next restaurant, clear the table) from a small deck. Nothing in the app is a bet, and points can never be bought or cashed out.

## Builds

- **Checks:** every pull request and push to `main` runs tests, typecheck and lint (about a minute).
- **Test APK:** pushes to `main` build an installable APK attached to the `test-build` GitHub release. Pull requests build one (release `pr-<number>`) only while they carry the `build-apk` label, so testing from a PC doesn't spend GitHub build time.
- **Google Play:** run "Release build (Google Play)" from the Actions tab. It needs the `EXPO_TOKEN` repository secret, links the project to the `stillmoths-team` Expo account, builds a signed `.aab` on EAS and attaches it to a `release-<version>` GitHub release.

## Placeholder assets

- Sounds are synthesized by `npm run build:sounds` (`scripts/build-sounds.js`) into `assets/sounds/`, so no sound pack is needed yet.
- Icons are drawn by `python3 scripts/build-icons.py` from the Noto Color Emoji hands (SIL Open Font License). Hand-shape art on the cards is also emoji for now. Both get replaced by original art later.

## Not built yet (see the project plan)

- Table play with room codes and every phone showing the same synced reveal (Phase 2).
- Async matches, accounts and notifications (Phase 3).
- Host settings beyond the presets, cosmetics, and strategy modes such as power cards.

## Layout

```
src/app/                   screens (Expo Router): home, match
src/core/                  rules, match engine, scoring, bot, challenges (pure, tested)
src/components/            load panel, reveal, scoreboard, result
src/services/              sound, haptics
src/theme.ts               colours
scripts/                   sound and icon generators
```
