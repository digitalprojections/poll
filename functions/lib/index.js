"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.telegramAuth = void 0;
const admin = require("firebase-admin");
const https_1 = require("firebase-functions/v2/https");
const crypto = require("crypto");
admin.initializeApp();
const db = admin.firestore();
/**
 * Verifies Telegram initData HMAC signature and mints a Firebase Custom Token.
 * Called from the client with { initData: WebApp.initData }
 */
exports.telegramAuth = (0, https_1.onCall)({
    cors: true,
    region: 'us-central1'
}, async (request) => {
    const botToken = "8353777316:AAFkXCNOcpiBjCj6E_VpvpDEe1R-7alKRMI";
    try {
        const data = request.data;
        if (!data || !data.initData) {
            console.error('telegramAuth: Missing initData');
            throw new https_1.HttpsError('invalid-argument', 'initData is required');
        }
        const { initData } = data;
        const params = new URLSearchParams(initData);
        const hash = params.get('hash');
        if (!hash) {
            console.error('telegramAuth: Missing hash in initData');
            throw new https_1.HttpsError('invalid-argument', 'Missing hash in initData');
        }
        // Build the check string
        const checkParams = new URLSearchParams(initData);
        checkParams.delete('hash');
        const checkString = [...checkParams.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => `${k}=${v}`)
            .join('\n');
        // Compute HMAC
        const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
        const expectedHash = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex');
        if (expectedHash !== hash) {
            console.error('telegramAuth: Invalid signature', { expected: expectedHash, received: hash });
            throw new https_1.HttpsError('unauthenticated', 'Invalid Telegram signature');
        }
        // Check expiry
        const authDate = Number(params.get('auth_date') || 0);
        const nowSec = Math.floor(Date.now() / 1000);
        if (nowSec - authDate > 3600) {
            console.error('telegramAuth: Token expired', { authDate, nowSec });
            throw new https_1.HttpsError('unauthenticated', 'Telegram auth expired');
        }
        // Parse user
        const userParam = params.get('user');
        if (!userParam) {
            console.error('telegramAuth: No user data');
            throw new https_1.HttpsError('invalid-argument', 'No user in initData');
        }
        const tgUser = JSON.parse(userParam);
        const uid = `telegram:${tgUser.id}`;
        console.log('telegramAuth: Authenticating user', { uid, username: tgUser.username });
        // Upsert user record
        await db.collection('users').doc(uid).set({
            telegramId: tgUser.id,
            firstName: tgUser.first_name,
            lastName: tgUser.last_name || null,
            username: tgUser.username || null,
            photoURL: tgUser.photo_url || null,
            displayName: [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' '),
            languageCode: tgUser.language_code || null,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        // Mint custom token
        const customToken = await admin.auth().createCustomToken(uid, {
            telegramId: tgUser.id,
            username: tgUser.username || null,
        });
        return { token: customToken };
    }
    catch (err) {
        console.error('TelegramAuth Error:', err);
        // If it's already an HttpsError, rethrow it. Otherwise wrap it.
        if (err instanceof https_1.HttpsError) {
            throw err;
        }
        throw new https_1.HttpsError('internal', `Auth failed: ${err.message || String(err)}`);
    }
});
//# sourceMappingURL=index.js.map