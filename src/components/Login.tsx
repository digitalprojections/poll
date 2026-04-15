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

export default function Login() {
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
        className="w-full max-w-md sophisticated-card text-center"
      >
        <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-accent/20">
          <BarChart3 className="w-8 h-8 text-white" />
        </div>
        
        <span className="status-pill mb-4 inline-block">Enterprise Analytics</span>
        <h1 className="text-3xl font-serif text-text-primary mb-3">Poll Architect</h1>
        <p className="text-text-secondary mb-10 text-sm leading-relaxed">
          Advanced strategic priority assessment <br />for high-velocity teams.
        </p>

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
