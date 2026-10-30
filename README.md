# FIRE AND FURY

**FIRE AND FURY** is a fast-paced 2D historical arcade action game that runs entirely in the browser. It pairs short arcade missions with a small museum-style exhibition about volcanoes and the German **V-2 missile**.

## V-2 missile theme

The rocket in *Rocket Battle* is a V-2 missile. The in-game history section covers its development at Peenemünde under a team led by Wernher von Braun, its first successful test launch on 3 October 1942, how its liquid-fuel engine and gyroscopic guidance worked, its June 1944 test flight that reached space, its operational use from September 1944, and its legacy. The V-2 is widely regarded as the world's first long-range guided ballistic missile. The history section also states plainly that V-2 production relied on forced labour and that the weapon caused great civilian suffering.

## Game modes

- **Volcano Rush** – a 45-second volcano mission.
- **Rocket Battle** – a 45-second mission flying a V-2: shoot targets (+200) and collect or shoot historical scrolls (+500).
- **Final Fury** – a 60-second finale mission.
- **Online matches** – head-to-head play over Firebase (invite / accept flow).

## Implemented features

- Original 2D canvas gameplay with keyboard, on-screen joystick and fire button
- Email/password sign-up, login and password recovery, plus Google sign-in (Firebase Authentication)
- Player profiles with avatars
- Scores, play history, Hall of Fame and achievements (Cloud Firestore)
- Online multiplayer match requests and matches (Cloud Firestore)
- Background music and sound effects, with a volume control
- Exhibition and V-2 history pages
- Responsive desktop and mobile layout
- Installable Progressive Web App (see limitations below)

## Technologies

HTML5, CSS3, vanilla JavaScript, Canvas 2D, Firebase Authentication and Cloud Firestore (Firebase JS SDK 10.12.2, compat build, loaded from the gstatic CDN with a cdnjs fallback), Web App Manifest, Service Worker.

## Project structure

```
FIRE-AND-FURY/
├── index.html                  # the whole game (HTML, CSS, JS)
├── manifest.webmanifest.json   # PWA manifest
├── sw.js                       # service worker (app-shell cache)
├── README.md
├── icons/
│   ├── icon-192.png
│   ├── icon-512.png
│   └── icon-512-maskable.png
└── sounds/                     # audio files (see below) – you must add these
    ├── menu-bgm.mp3
    ├── battle-bgm.mp3
    ├── final-fury-bgm.mp3
    ├── rocket-launch.mp3
    ├── explosion.mp3
    ├── rock-destruction.mp3
    ├── victory.mp3
    └── defeat.mp3
```

> The `sounds/` folder is referenced by `index.html` but was **not** part of the supplied project file. Copy your original audio files into `sounds/` using exactly these names, otherwise the game runs silently.

## Run locally

Service workers and PWA install need `http://localhost` or HTTPS, not `file://`. From the project folder:

```
python3 -m http.server 8000
```

then open `http://localhost:8000/`. (Opening `index.html` directly also plays the game, but the PWA features are disabled.)

## Firebase configuration

The Firebase web configuration is in the `ffStartBackend` function in `index.html`. It points at the existing project and **must not be renamed** — the project identifier contains an older internal name, which is why it differs from the public game name. A Firebase web `apiKey` is not a secret; access is controlled by Firebase Security Rules, so keep your Firestore rules restrictive. Do not put service-account keys or admin credentials in this repository.

To use your own Firebase project, replace the values in that config object, enable Email/Password (and Google) sign-in, create a Firestore database, add your deployed domain (for example `username.github.io`) under *Authentication → Settings → Authorized domains*, and publish matching Firestore security rules.

## Deploy on GitHub Pages

1. Create a repository and push the contents of this folder to the root of the `main` branch.
2. Open *Settings → Pages*, choose *Deploy from a branch*, select `main` and `/ (root)`, and save.
3. Add the Pages domain to Firebase *Authorized domains* (see above).
4. After each release, bump `CACHE_VERSION` in `sw.js` so returning players receive the new files.

All paths are relative, so the game works from a project sub-path such as `https://username.github.io/FIRE-AND-FURY/`.

## PWA and offline limitations

The service worker caches the local app shell (page, manifest, icons and any audio files present) so the page can open without a connection. It does **not** make the game fully offline: the Firebase SDK is loaded from a CDN, and sign-in, scores, profiles, Hall of Fame and multiplayer all need an internet connection. Playing missions requires being logged in, so gameplay is effectively online-only. Cross-origin requests are never cached, and only older `fire-and-fury-*` caches are removed on update.
