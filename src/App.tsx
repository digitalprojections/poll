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

function AppContent() {
  const { user, loading } = usePolls();

  useEffect(() => {
    telegramService.init();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-accent/20 rounded-full" />
          <div className="h-4 w-32 bg-border rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex">
      <Navigation />
      <main className={cn("flex-1 p-12", user ? "ml-[260px]" : "ml-0")}>
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
          <Route path="/" element={user ? <PollList /> : <Navigate to="/login" />} />
          <Route path="/create" element={user ? <PollCreate /> : <Navigate to="/login" />} />
          <Route path="/vote/:pollId" element={user ? <PollVote /> : <Navigate to="/login" />} />
          <Route path="/summary/:pollId" element={user ? <PollSummary /> : <Navigate to="/login" />} />
        </Routes>

        {/* Footer Credits */}
        <footer className="mt-12 pt-8 border-t border-border text-text-secondary text-[11px] uppercase tracking-wider flex justify-between items-center">
          <p>Built by @ahmadfuzal • {new Date().toLocaleDateString()}</p>
          <p>Telegram Mini App Integration Enabled</p>
        </footer>
      </main>
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
