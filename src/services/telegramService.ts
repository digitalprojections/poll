/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * @author @ahmadfuzal
 * @date 2026-04-15
 */

import WebApp from '@twa-dev/sdk';

/**
 * Service to interact with the Telegram Web App SDK.
 */
export const telegramService = {
  /**
   * Initializes the Web App and sets up basic UI.
   */
  init() {
    WebApp.ready();
    WebApp.expand();
    
    // Set theme colors
    const color = WebApp.themeParams.bg_color || '#ffffff';
    document.body.style.backgroundColor = color;
  },

  /**
   * Gets the current user from Telegram.
   */
  getUser() {
    return WebApp.initDataUnsafe.user;
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
  sendData(data: any) {
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
