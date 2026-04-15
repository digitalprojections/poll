# TelePoll Pro - Production Setup Documentation

## Overview
TelePoll Pro is a Telegram Mini App built with React, Vite, and Firebase. It allows users to create polls with custom integer properties (e.g., Weight, Cost, Points) and provides detailed summarization beyond simple vote counting.

## Prerequisites
- Node.js 18+
- Firebase Project
- Telegram Bot (via @BotFather)

## Firebase Setup
1. Create a new Firebase project at [console.firebase.google.com](https://console.firebase.google.com).
2. Enable **Firestore Database** in production mode.
3. Enable **Google Authentication** in the Authentication section.
4. Add a Web App to your Firebase project and copy the configuration to `firebase-applet-config.json`.
5. Deploy the security rules provided in `firestore.rules`.

## Telegram Bot Setup
1. Message [@BotFather](https://t.me/botfather) on Telegram.
2. Create a new bot using `/newbot`.
3. Set up a Web App for your bot using `/newapp`.
4. When prompted for the Web App URL, provide your hosted application URL (e.g., `https://your-app.run.app`).
5. Use the provided link to open your Mini App within Telegram.

## Environment Variables
Ensure the following variables are set in your deployment environment:
- `GEMINI_API_KEY`: (Optional) For future AI features.
- `APP_URL`: The base URL of your hosted application.

## Credits
Developed by @ahmadfuzal
Date: 2026-04-15
