/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * @author @ahmadfuzal
 * @date 2026-04-15
 */

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { PollProvider, usePolls } from './context/PollContext';
import Login from './components/Login';
import PollList from './components/PollList';
import PollCreate from './components/PollCreate';
import PollVote from './components/PollVote';
import PollSummary from './components/PollSummary';
import PollSubscribe from './components/PollSubscribe';
import { telegramService } from './services/telegramService';
import { LogOut, User, BarChart3, Plus } from 'lucide-react';
import { auth } from './firebase';
import { cn } from './lib/utils';

function Navigation() {
  const { user } = usePolls();

  if (!user) return null;

  return (
    <aside className="w-[260px] bg-surface border-r border-border flex flex-col p-8 fixed h-screen">
      <div className="flex items-center gap-3 mb-12">
        <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-white" />
        </div>
        <span className="font-serif italic text-xl tracking-tight text-text-primary">Poll Architect</span>
      </div>

      <nav className="flex-1">
        <ul className="space-y-4">
          <li>
            <Link to="/" className="text-sm text-text-primary font-medium flex items-center gap-3 hover:text-accent transition-colors">
              <BarChart3 className="w-4 h-4" />
              Active Polls
            </Link>
          </li>
          <li>
            <Link to="/create" className="text-sm text-text-secondary flex items-center gap-3 hover:text-text-primary transition-colors">
              <Plus className="w-4 h-4" />
              Draft New Poll
            </Link>
          </li>
        </ul>
      </nav>

      <div className="pt-8 border-t border-border">
        <div className="flex items-center gap-3 mb-4">
          {user.photoURL ? (
            <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full border border-border" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-border flex items-center justify-center">
              <User className="w-4 h-4 text-text-secondary" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-text-primary truncate">{user.displayName}</p>
            <p className="text-[10px] text-text-secondary truncate">Admin Mode</p>
          </div>
          <button
            onClick={() => auth.signOut()}
            className="text-text-secondary hover:text-red-500 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

function BottomNav() {
  const { user } = usePolls();
  if (!user) return null;
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border flex items-center justify-around px-4 py-3 md:hidden z-50">
      <Link to="/" className="flex flex-col items-center gap-1 text-text-secondary hover:text-accent transition-colors">
        <BarChart3 className="w-5 h-5" />
        <span className="text-[10px] uppercase tracking-wider">Polls</span>
      </Link>
      <Link to="/create" className="flex flex-col items-center gap-1 text-text-secondary hover:text-accent transition-colors">
        <Plus className="w-5 h-5" />
        <span className="text-[10px] uppercase tracking-wider">New</span>
      </Link>
      <button
        onClick={() => auth.signOut()}
        className="flex flex-col items-center gap-1 text-text-secondary hover:text-red-500 transition-colors"
      >
        <LogOut className="w-5 h-5" />
        <span className="text-[10px] uppercase tracking-wider">Logout</span>
      </button>
    </nav>
  );
}

function AppContent() {
  const { user, loading, isTgSigningIn } = usePolls();

  if (loading || isTgSigningIn) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-bg gap-6">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-accent/20 rounded-2xl flex items-center justify-center">
            <BarChart3 className="w-8 h-8 text-accent mr-0" />
          </div>
          <div className="h-4 w-48 bg-border rounded" />
        </div>
        <div className="text-center">
          <p className="text-text-primary font-serif italic text-lg mb-1">
            {isTgSigningIn ? 'Authenticating with Telegram...' : 'Loading Poll Architect...'}
          </p>
          <p className="text-text-secondary text-[10px] uppercase tracking-widest">
            {isTgSigningIn ? 'Verifying Identity' : 'Initializing Suite'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex">
      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden md:block">
        <Navigation />
      </div>

      {/* Main content — edge-to-edge on mobile */}
      <main className={cn(
        "flex-1 w-full px-1 py-6 md:p-12",
        user ? "md:ml-[260px] pb-24 md:pb-12" : ""
      )}>
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
          <Route path="/" element={user ? <PollList /> : <Navigate to="/login" />} />
          <Route path="/create" element={user ? <PollCreate /> : <Navigate to="/login" />} />
          <Route path="/vote/:pollId" element={user ? <PollVote /> : <Navigate to="/login" />} />
          <Route path="/summary/:pollId" element={user ? <PollSummary /> : <Navigate to="/login" />} />
          <Route path="/subscribe/:pollId" element={<PollSubscribe />} />
        </Routes>

        {/* Footer Credits */}
        <footer className="mt-12 pt-8 border-t border-border text-text-secondary text-[11px] uppercase tracking-wider flex flex-col md:flex-row gap-2 md:gap-0 justify-between items-center">
          <p>Built by @ahmadfuzal • {new Date().toLocaleDateString()}</p>
          <p>Active Telegram Links</p>
        </footer>
      </main>

      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <PollProvider>
        <AppContent />
      </PollProvider>
    </Router>
  );
}
