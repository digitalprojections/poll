/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * @author @ahmadfuzal
 * @date 2026-04-15
 */

import React from 'react';
import { usePolls } from '../context/PollContext';
import { motion } from 'motion/react';
import { Plus, BarChart2, Vote as VoteIcon, Calendar, Share2, ShieldQuestion, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../lib/utils';

export default function PollList() {
  const { polls, user, deletePoll } = usePolls();
  const navigate = useNavigate();

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <span className="status-pill">Active Telegram Links</span>
          <h1 className="text-3xl md:text-4xl font-serif mt-2">Strategic Priority <br className="hidden md:block" /> Polls</h1>
        </div>
        <button
          onClick={() => navigate('/create')}
          className="btn-primary flex items-center justify-center gap-2 w-full md:w-auto"
        >
          <Plus className="w-5 h-5" /> Draft New Poll
        </button>
      </div>

      {polls.length === 0 ? (
        <div className="text-center py-20 sophisticated-card border-dashed">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <VoteIcon className="w-8 h-8 text-text-secondary" />
          </div>
          <h3 className="text-lg font-medium text-text-primary">No active drafts</h3>
          <p className="text-text-secondary mb-6">Start by creating a new metric template.</p>
          <button
            onClick={() => navigate('/create')}
            className="text-accent font-medium hover:underline"
          >
            Draft your first poll
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {polls.map((poll, idx) => (
            <motion.div
              key={poll.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="sophisticated-card group hover:border-accent/50 transition-all"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex flex-col gap-1">
                  <span className="section-label">Locked Poll</span>
                  {Date.now() > poll.expiresAt ? (
                    <span className="text-[9px] font-bold text-red-500 uppercase bg-red-500/10 px-1.5 py-0.5 rounded">Finalized</span>
                  ) : (
                    <span className="text-[9px] font-bold text-green-500 uppercase bg-green-500/10 px-1.5 py-0.5 rounded">Active</span>
                  )}
                </div>
                {poll.creatorId === user?.uid && (
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (window.confirm('Are you sure you want to remove this poll? This will also remove it for all subscribers.')) {
                        try {
                          await deletePoll(poll.id);
                        } catch (err: any) {
                          alert(err.message);
                        }
                      }
                    }}
                    className="p-2 text-text-secondary hover:text-red-500 transition-colors"
                    title="Remove Poll"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <div className="flex flex-col items-end gap-1 text-[10px] font-medium text-text-secondary uppercase tracking-widest">
                  <span className="flex items-center gap-1.5 opacity-50"><Calendar className="w-3 h-3" /> {formatDate(poll.createdAt)}</span>
                  <span className="flex items-center gap-1.5 text-accent"><Calendar className="w-3 h-3" /> Ends: {formatDate(poll.expiresAt)}</span>
                </div>
              </div>

              <h2 className="text-2xl font-serif text-text-primary mb-3 group-hover:text-accent transition-colors">
                {poll.question}
              </h2>
              <p className="text-sm text-text-secondary line-clamp-2 mb-8 font-sans">
                {poll.description || 'No additional context provided for this poll.'}
              </p>

               <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate(`/vote/${poll.id}`)}
                  className="flex-1 btn-primary flex items-center justify-center gap-2"
                >
                  <VoteIcon className="w-4 h-4" /> Cast Vote
                </button>
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/subscribe/${poll.id}?code=${poll.accessCode}`;
                    navigator.clipboard.writeText(url);
                    alert('Subscription link copied to clipboard!');
                  }}
                  className="w-12 h-12 btn-square"
                  title="Share Invite"
                >
                  <Share2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => navigate(`/summary/${poll.id}`)}
                  className="w-12 h-12 btn-square"
                  title="View Analytics"
                >
                  <BarChart2 className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
