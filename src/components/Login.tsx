/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * @author @ahmadfuzal
 * @date 2026-04-15
 */

import React from 'react';
import { LogIn, BarChart3 } from 'lucide-react';
import { signInWithGoogle } from '../firebase';
import { motion } from 'motion/react';
import { usePolls } from '../context/PollContext';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function Login() {
  const { authError } = usePolls();
  // @ts-ignore
  const isTg = !!(window.Telegram?.WebApp?.initData);

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md sophisticated-card text-center relative overflow-hidden"
      >
        {/* Diagnostic info */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5 opacity-40">
           {isTg ? (
             <>
               <span className="text-[9px] font-bold text-green-500 tracking-tighter uppercase">TG_INTREGATED</span>
               <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
             </>
           ) : (
             <>
               <span className="text-[9px] font-bold text-text-secondary tracking-tighter uppercase">WEB_MODE</span>
               <div className="w-1.5 h-1.5 rounded-full bg-border" />
             </>
           )}
        </div>

        <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-accent/20">
          <BarChart3 className="w-8 h-8 text-white" />
        </div>
        
        <span className="status-pill mb-4 inline-block">Enterprise Analytics</span>
        <h1 className="text-3xl font-serif text-text-primary mb-3">Poll Architect</h1>
        <p className="text-text-secondary mb-8 text-sm leading-relaxed">
          Advanced strategic priority assessment <br />for high-velocity teams.
        </p>

        {authError && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-left">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-red-500 uppercase tracking-wider">Telegram Auth Blocked</p>
              <p className="text-[11px] text-red-500/80 leading-normal">{authError}</p>
              <p className="text-[9px] text-text-secondary pt-1 italic">Please re-launch the bot or use alternate sign-in below.</p>
            </div>
          </div>
        )}

        {!authError && isTg && (
          <div className="mb-8 p-4 bg-accent/5 border border-accent/10 rounded-xl flex items-center gap-3 text-left">
            <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
            <p className="text-[11px] text-text-primary">Telegram identity recognized. You can stay here or use Google login below if auto-auth persists failing.</p>
          </div>
        )}

        <button
          onClick={handleLogin}
          className="w-full flex items-center justify-center gap-3 btn-secondary py-4"
        >
          <LogIn className="w-5 h-5" />
          Authenticate with Google
        </button>

        <div className="mt-12 pt-8 border-t border-border text-[10px] text-text-secondary uppercase tracking-[0.2em] opacity-50">
          <p>© 2026 @ahmadfuzal</p>
        </div>
      </motion.div>
    </div>
  );
}
