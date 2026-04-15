import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as crypto from 'crypto';

admin.initializeApp();
const db = admin.firestore();

/**
 * Verifies Telegram initData HMAC signature and mints a Firebase Custom Token.
 * Called from the client with { initData: WebApp.initData }
 */
export const telegramAuth = onCall({
  cors: true,
  region: 'us-central1'
}, async (request) => {
  try {
    const data = request.data as { initData: string };

    if (!data || !data.initData) {
      throw new HttpsError('invalid-argument', 'initData is required');
    }

    const botToken = "8353777316:AAFkXCNOcpiBjCj6E_VpvpDEe1R-7alKRMI";
    

  const { initData } = data;
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');

  if (!hash) {
    throw new HttpsError('invalid-argument', 'Missing hash in initData');
  }

  // Build the check string (all params except hash, sorted)
  params.delete('hash');
  const checkString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  // Compute HMAC
  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const expectedHash = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex');

  if (expectedHash !== hash) {
    throw new HttpsError('unauthenticated', 'Invalid Telegram signature');
  }

  // Check expiry: Telegram auth_date must be within 1 hour
  const authDate = Number(params.get('auth_date') || 0);
  const nowSec = Math.floor(Date.now() / 1000);
  if (nowSec - authDate > 3600) {
    throw new HttpsError('unauthenticated', 'Telegram auth expired');
  }

  // Parse user
  const userParam = params.get('user');
  if (!userParam) {
    throw new HttpsError('invalid-argument', 'No user in initData');
  }
  const tgUser = JSON.parse(userParam) as {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
    language_code?: string;
  };

  const uid = `telegram:${tgUser.id}`;

  // Upsert user record in Firestore
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
  } catch (err: any) {
    console.error('TelegramAuth Error:', err);
    throw new HttpsError('permission-denied', `Function failed: ${err.message || String(err)}`);
  }
});
