# TelePoll Pro - Production Setup Documentation

## Overview
TelePoll Pro is a Telegram Mini App built with React, Vite, and Firebase. It allows users to create polls with custom integer properties (e.g., Weight, Cost, Points) and provides detailed summarization beyond simple vote counting.

## Live URL
🌐 **https://big-genre-172004.web.app**

## Prerequisites
- Node.js 18+
- Firebase Project (`big-genre-172004`)
- Telegram Bot (via @BotFather)

## Firebase Setup
1. Project is configured under `big-genre-172004` on Firebase.
2. Firestore Database is enabled with rules from `firestore.rules`.
3. Web App config is stored in `firebase-applet-config.json`.
4. Hosting and Firestore rules are deployed via `firebase deploy`.

## Telegram Bot Setup
1. Message [@BotFather](https://t.me/botfather) on Telegram.
2. Create a new bot using `/newbot`.
3. Set up a Web App for your bot using `/newapp`.
4. When prompted for the Web App URL, use: `https://big-genre-172004.web.app`
5. Use the provided link to open your Mini App within Telegram.

> **Note:** No Telegram Bot Token is required on the frontend. The app uses `@twa-dev/sdk` to access user data directly from the Telegram Web App environment. A bot token is only needed if you add a backend to verify `initData` or send bot messages.

## Environment Variables
Ensure the following variables are set in your `.env` file:
- `GEMINI_API_KEY`: (Optional) For future AI features.

## Deployment
```bash
npm install
npm run build
firebase deploy --project big-genre-172004
```

## Credits
Developed by @ahmadfuzal  
Date: 2026-04-15
