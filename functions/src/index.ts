import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as crypto from 'crypto';

admin.initializeApp();
const db = admin.firestore();

// Attempt to log the project ID to verify context
console.log('Functions starting up for project:', process.env.GCLOUD_PROJECT || 'unknown');


/**
 * Verifies Telegram initData HMAC signature and mints a Firebase Custom Token.
 * Called from the client with { initData: WebApp.initData }
 */
export const telegramAuth = onCall({
  cors: true,
  region: 'us-central1'
}, async (request) => {
  // Use environment variables for the bot token
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!botToken) {
    console.error('TELEGRAM_BOT_TOKEN is not defined in environment variables');
    throw new HttpsError('internal', 'Server configuration error.');
  }
    const data = request.data as { initData: string };

    if (!data || !data.initData) {
      console.error('telegramAuth: Missing initData');
      throw new HttpsError('invalid-argument', 'initData is required');
    }

    const { initData } = data;
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');

    if (!hash) {
      console.error('telegramAuth: Missing hash in initData');
      throw new HttpsError('invalid-argument', 'Missing hash in initData');
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
      throw new HttpsError('unauthenticated', 'Invalid Telegram signature');
    }

    // Check expiry
    const authDate = Number(params.get('auth_date') || 0);
    const nowSec = Math.floor(Date.now() / 1000);
    if (nowSec - authDate > 3600) {
      console.error('telegramAuth: Token expired', { authDate, nowSec });
      throw new HttpsError('unauthenticated', 'Telegram auth expired');
    }

    // Parse user
    const userParam = params.get('user');
    if (!userParam) {
      console.error('telegramAuth: No user data');
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
  } catch (err: any) {
    console.error('TelegramAuth Error:', err);
    // If it's already an HttpsError, rethrow it. Otherwise wrap it.
    if (err instanceof HttpsError) {
      throw err;
    }
    throw new HttpsError('internal', `Auth failed: ${err.message || String(err)}`);
  }
});


/**
 * Triggered when a poll is deleted to clean up references in user profiles.
 */
export const onPollDeleted = functions.firestore
  .document('polls/{pollId}')
  .onDelete(async (snap, context) => {
    const pollId = context.params.pollId;
    console.log(`onPollDeleted: Cleaning up references for poll ${pollId}`);

    const usersSnap = await db.collection('users')
      .where('subscribedPollIds', 'array-contains', pollId)
      .get();

    if (usersSnap.empty) {
      console.log('onPollDeleted: No subscribers found to clean up.');
      return;
    }

    const batch = db.batch();
    usersSnap.forEach(userDoc => {
      batch.update(userDoc.ref, {
        subscribedPollIds: admin.firestore.FieldValue.arrayRemove(pollId)
      });
    });

    await batch.commit();
    console.log(`onPollDeleted: Cleaned up ${usersSnap.size} user references.`);
  });
