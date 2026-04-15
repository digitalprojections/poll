/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * @author @ahmadfuzal
 * @date 2026-04-15
 */

import React from 'react';
import { usePolls } from '../context/PollContext';
import { motion } from 'motion/react';
import { Plus, BarChart2, Vote as VoteIcon, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../lib/utils';

export default function PollList() {
  const { polls, user } = usePolls();
  const navigate = useNavigate();

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-end justify-between mb-12">
        <div>
          <span className="status-pill">Active Telegram Links</span>
          <h1 className="text-4xl font-serif mt-2">Strategic Priority <br />Assessments</h1>
        </div>
        <button
          onClick={() => navigate('/create')}
          className="btn-primary flex items-center gap-2"
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
                <span className="section-label">Metric Template</span>
                <div className="flex items-center gap-2 text-[10px] font-medium text-text-secondary uppercase tracking-widest">
                  <Calendar className="w-3 h-3" />
                  {formatDate(poll.createdAt)}
                </div>
              </div>

              <h2 className="text-2xl font-serif text-text-primary mb-3 group-hover:text-accent transition-colors">
                {poll.question}
              </h2>
              <p className="text-sm text-text-secondary line-clamp-2 mb-8 font-sans">
                {poll.description || 'No additional context provided for this assessment.'}
              </p>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate(`/vote/${poll.id}`)}
                  className="flex-1 btn-primary flex items-center justify-center gap-2"
                >
                  <VoteIcon className="w-4 h-4" /> Deploy
                </button>
                <button
                  onClick={() => navigate(`/summary/${poll.id}`)}
                  className="w-12 h-12 flex items-center justify-center btn-secondary"
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
