/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * @author @ahmadfuzal
 * @date 2026-04-15
 */

import WebApp from '@twa-dev/sdk';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAuth, signInWithCustomToken } from 'firebase/auth';

/**
 * Service to interact with the Telegram Web App SDK.
 */
export const telegramService = {
  /**
   * Returns true when running inside Telegram (initData is present).
   */
  isTelegram(): boolean {
    return Boolean(WebApp.initData && WebApp.initData.length > 0);
  },

  /**
   * Initializes the Web App and sets up basic UI.
   */
  init() {
    WebApp.ready();
    WebApp.expand();
  },

  /**
   * Gets the current user from Telegram (unverified, UI-only).
   */
  getUser() {
    return WebApp.initDataUnsafe.user;
  },

  /**
   * Verifies Telegram identity via Cloud Function and signs into Firebase.
   * Must be called when isTelegram() is true.
   */
  async signInWithTelegram(): Promise<void> {
    const functions = getFunctions();
    const telegramAuth = httpsCallable<{ initData: string }, { token: string }>(
      functions,
      'telegramAuth'
    );
    const result = await telegramAuth({ initData: WebApp.initData });
    await signInWithCustomToken(getAuth(), result.data.token);
  },

  /**
   * Shows a main button in the Telegram UI.
   */
  showMainButton(text: string, onClick: () => void) {
    WebApp.MainButton.setText(text);
    WebApp.MainButton.show();
    WebApp.MainButton.onClick(onClick);
  },

  /**
   * Hides the main button.
   */
  hideMainButton() {
    WebApp.MainButton.hide();
  },

  /**
   * Shows a back button.
   */
  showBackButton(onClick: () => void) {
    WebApp.BackButton.show();
    WebApp.BackButton.onClick(onClick);
  },

  /**
   * Hides the back button.
   */
  hideBackButton() {
    WebApp.BackButton.hide();
  },

  /**
   * Closes the Web App.
   */
  close() {
    WebApp.close();
  },

  /**
   * Sends data back to the bot.
   */
  sendData(data: unknown) {
    WebApp.sendData(JSON.stringify(data));
  },

  /**
   * Haptic feedback.
   */
  hapticFeedback(type: 'impact' | 'notification' | 'selection' = 'selection') {
    if (type === 'impact') {
      WebApp.HapticFeedback.impactOccurred('medium');
    } else if (type === 'notification') {
      WebApp.HapticFeedback.notificationOccurred('success');
    } else {
      WebApp.HapticFeedback.selectionChanged();
    }
  }
};
