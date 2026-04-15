/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * @author @ahmadfuzal
 * @date 2026-04-15
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePolls } from '../context/PollContext';
import { motion } from 'motion/react';
import { CheckCircle2, ArrowLeft, Info } from 'lucide-react';
import { cn } from '../lib/utils';

export default function PollVote() {
  const { pollId } = useParams();
  const navigate = useNavigate();
  const { polls, castVote, user } = usePolls();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const poll = polls.find(p => p.id === pollId);

  if (!poll) return <div className="text-center p-12">Poll not found</div>;

  const handleVote = async () => {
    if (!selectedOption || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await castVote(poll.id, selectedOption);
      navigate(`/summary/${poll.id}`);
    } catch (error) {
      console.error('Failed to vote:', error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="sophisticated-card"
      >
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-8 text-[11px] uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Archives
        </button>

        <span className="section-label">Active Assessment</span>
        <h1 className="text-3xl font-serif text-text-primary mb-2">{poll.question}</h1>
        {poll.description && <p className="text-text-secondary mb-8 text-sm leading-relaxed">{poll.description}</p>}

        <div className="space-y-3 mb-10">
          {poll.options.map((option) => (
            <button
              key={option.id}
              onClick={() => setSelectedOption(option.id)}
              className={cn(
                "w-full flex items-center justify-between p-5 rounded-xl border transition-all text-left group",
                selectedOption === option.id 
                  ? "border-accent bg-accent/5" 
                  : "border-border bg-white/5 hover:border-text-secondary/30"
              )}
            >
              <div className="flex-1">
                <span className={cn(
                  "font-medium transition-colors",
                  selectedOption === option.id ? "text-accent" : "text-text-primary"
                )}>
                  {option.text}
                </span>
                <div className="flex gap-3 mt-2">
                  {poll.customProperties.map(prop => (
                    <span key={prop.name} className="text-[9px] uppercase tracking-wider text-text-secondary bg-bg px-2 py-0.5 rounded border border-border">
                      {prop.label}: {option.customValues[prop.name]}{prop.unit}
                    </span>
                  ))}
                </div>
              </div>
              <div className={cn(
                "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                selectedOption === option.id ? "border-accent bg-accent" : "border-border"
              )}>
                {selectedOption === option.id && <div className="w-2 h-2 bg-white rounded-full" />}
              </div>
            </button>
          ))}
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex-1 btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleVote}
            disabled={!selectedOption || isSubmitting}
            className="flex-1 btn-primary disabled:opacity-50"
          >
            {isSubmitting ? 'Processing...' : 'Submit Assessment'}
          </button>
        </div>

        <div className="mt-8 flex items-start gap-3 p-4 bg-accent/5 rounded-xl border border-accent/20 text-text-secondary text-[11px] leading-relaxed italic">
          <Info className="w-4 h-4 shrink-0 text-accent" />
          <p>This assessment utilizes a weighted aggregate model. Your input will be processed according to the metric templates defined by the administrator.</p>
        </div>
      </motion.div>
    </div>
  );
}
