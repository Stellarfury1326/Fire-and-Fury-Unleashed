# 🔥 FIRE AND FURY ARCADE

A browser-based action arcade game inspired by the history and military innovations of the Kingdom of Mysore.

## 🎮 About the Project

FIRE AND FURY ARCADE is an interactive arcade experience featuring multiple game modes, player accounts, competitive scoring and customizable profiles.

The project is designed to run in a web browser and support both desktop and mobile screens.

## ⚔️ Game Modes

- **Rocket Battle** — An action-focused rocket battle experience.
- **Volcano Rush** — A challenging volcano-themed game mode.
- **Final Fury** — An intense final challenge.

## ✨ Features

- Player registration and login using Firebase.
- Player profiles and avatar customization.
- Score tracking and gameplay history.
- Hall of Fame and achievements.
- Multiplayer features.
- Responsive desktop and mobile interface.
- Background music and sound effects.
- Progressive Web App installation support.
- Service worker for basic offline caching.

*Feature availability depends on the current implementation and backend configuration.*

## 🛠️ Technology

- HTML
- CSS
- JavaScript
- Firebase Authentication
- Firebase database services
- Progressive Web App technologies

## 📁 Project Structure

```text
FIRE-AND-FURY-ARCADE/
│
├── index.html
├── manifest.webmanifest.json
├── sw.js
├── README.md
│
└── icons/
    ├── icon-192.png
    └── icon-512.png
```

The icons folder is optional until the actual icon files have been created and referenced in the manifest.

## 🚀 Run Locally

1. Download or clone this repository.
2. Open `index.html` in a browser.
3. For service-worker and PWA functionality, run the project through a local web server or HTTPS hosting.
4. Configure Firebase using the project's existing Firebase configuration.

## 🌐 GitHub Pages Deployment

1. Upload the project files to a GitHub repository.
2. Open the repository's **Settings**.
3. Select **Pages**.
4. Choose **Deploy from a branch**.
5. Select the branch containing the project, usually `main`.
6. Select the root folder (`/`).
7. Save and wait for deployment.

GitHub Pages will provide a public website URL once deployment completes.

## 🔐 Firebase Configuration

The project uses Firebase for authentication and data-related functionality.

Make sure the Firebase project is configured correctly, including authorized domains and the required database security rules.

Never publish private service-account credentials or server-side secrets.

## 📱 PWA Support

The project includes a web app manifest and service worker for installation and basic offline caching.

Full offline gameplay is not guaranteed if the game depends on external services or assets that are not cached.

## 📜 Project Notes

- Preserve the original game implementation when making updates.
- Keep all required supporting files in the repository.
- Do not remove existing gameplay features when modifying the code.
- Test login, gameplay, scoring and multiplayer functionality after major updates.

---

**FIRE AND FURY ARCADE**

*Enter the battlefield. Make your mark.*
