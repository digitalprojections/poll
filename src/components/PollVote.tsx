/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * @author @ahmadfuzal
 * @date 2026-04-15
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePolls } from '../context/PollContext';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, ArrowLeft, Info, Clock, AlertTriangle, ShieldX } from 'lucide-react';
import { cn, formatDate } from '../lib/utils';

export default function PollVote() {
  const { pollId } = useParams();
  const navigate = useNavigate();
  const { polls, castVote, getPollSummary, user } = usePolls();
  const [selections, setSelections] = useState<Record<string, Record<string, number>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const poll = polls.find(p => p.id === pollId);

  const isExpired = poll ? Date.now() > poll.closedAt : false;
  const timeRemaining = poll ? poll.closedAt - Date.now() : 0;
  const totalDuration = poll ? poll.closedAt - poll.createdAt : 1;
  const percentLeft = Math.max(0, Math.min(100, (timeRemaining / totalDuration) * 100));

  // Visual Gauge Colors
  const gaugeColor = percentLeft > 50 ? 'bg-green-500' : percentLeft > 20 ? 'bg-yellow-500' : 'bg-red-500';
  const gaugeText = percentLeft > 50 ? 'text-green-500' : percentLeft > 20 ? 'text-yellow-500' : 'text-red-500';

  React.useEffect(() => {
    if (pollId && user) {
      getPollSummary(pollId).then(summary => {
        const myVote = summary.votes.find(v => v.userId === user.uid);
        if (myVote) {
          setSelections(myVote.selections || {});
        }
      }).finally(() => {
        setInitialLoading(false);
      });
    } else {
      setInitialLoading(false);
    }
  }, [pollId, user, getPollSummary]);

  if (initialLoading) return <div className="text-center p-12 text-text-secondary">Retrieving existing poll...</div>;
  if (!poll) return (
    <div className="max-w-md mx-auto mt-20 sophisticated-card text-center space-y-6">
      <ShieldX className="w-12 h-12 text-red-500 mx-auto" />
      <h2 className="text-2xl font-serif">Poll Unavailable</h2>
      <p className="text-text-secondary text-sm">This poll has been removed by the creator or the link is invalid.</p>
      <button onClick={() => navigate('/')} className="btn-primary w-full">Return to Dashboard</button>
    </div>
  );

  const toggleOption = (optionId: string) => {
    setSelections(prev => {
      const newSelections = { ...prev };
      if (newSelections[optionId]) {
        delete newSelections[optionId];
      } else {
        const option = poll.options.find(o => o.id === optionId);
        const defaultValues: Record<string, number> = {};
        option?.properties.forEach(p => {
          defaultValues[p.label] = p.value;
        });

        if (poll.type === 'single-select') {
          return { [optionId]: defaultValues };
        }
        newSelections[optionId] = defaultValues;
      }
      return newSelections;
    });
  };

  const updatePropertyValue = (optionId: string, propLabel: string, value: number) => {
    setSelections(prev => ({
      ...prev,
      [optionId]: {
        ...prev[optionId],
        [propLabel]: value
      }
    }));
  };

  const handleVote = async () => {
    if (Object.keys(selections).length === 0 || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await castVote(poll.id, selections);
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
          <ArrowLeft className="w-4 h-4" /> Return to Dashboard
        </button>

        <span className="section-label">{poll.type === 'single-select' ? 'Single Choice Poll' : 'Multi-Select Poll'}</span>

        {/* Timeframe Gauge */}
        <div className="mt-4 mb-8 p-4 bg-white/5 rounded-2xl border border-border overflow-hidden relative group">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className={cn("w-4 h-4", gaugeText)} />
              <span className="text-[10px] uppercase tracking-widest font-bold text-text-secondary">Voting Lifespan</span>
            </div>
            <span className={cn("text-xs font-serif", gaugeText)}>{isExpired ? 'EXPIRED' : formatDate(poll.closedAt)}</span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentLeft}%` }}
              className={cn("h-full transition-colors duration-1000", gaugeColor)}
            />
          </div>
          {isExpired && (
            <div className="absolute inset-0 bg-red-950/20 backdrop-blur-[1px] flex items-center justify-center">
              <span className="flex items-center gap-2 text-red-500 font-bold text-xs uppercase tracking-tighter">
                <AlertTriangle className="w-4 h-4" /> Voting Period Ended
              </span>
            </div>
          )}
        </div>

        <h1 className="text-3xl font-serif text-text-primary mb-2">{poll.question}</h1>
        {poll.description && <p className="text-text-secondary mb-8 text-sm leading-relaxed">{poll.description}</p>}

        <div className="space-y-4 mb-10">
          {poll.options.map((option) => (
            <div key={option.id} className="space-y-3">
              <button
                type="button"
                onClick={() => toggleOption(option.id)}
                className={cn(
                  "w-full flex items-center justify-between p-5 rounded-xl border transition-all text-left group",
                  selections[option.id]
                    ? "border-accent bg-accent/5"
                    : "border-border bg-white/5 hover:border-text-secondary/30"
                )}
              >
                <div className="flex-1">
                  <span className={cn(
                    "font-medium transition-colors",
                    selections[option.id] ? "text-accent" : "text-text-primary"
                  )}>
                    {option.text}
                  </span>
                </div>
                <div className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                  selections[option.id] ? "border-accent bg-accent" : "border-border",
                  poll.type === 'multi-select' && "rounded-md"
                )}>
                  {selections[option.id] && (
                    poll.type === 'single-select'
                      ? <div className="w-2 h-2 bg-white rounded-full" />
                      : <CheckCircle2 className="w-3 h-3 text-white" />
                  )}
                </div>
              </button>

              <AnimatePresence>
                {selections[option.id] && option.properties.length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-2 gap-3 p-4 bg-white/5 rounded-xl border border-border ml-4">
                      {option.properties.map((prop, pIdx) => (
                        <div key={pIdx} className="space-y-1">
                          <label className="text-[10px] uppercase tracking-wider text-text-secondary">
                            {prop.label} {prop.unit ? `(${prop.unit})` : ''}
                          </label>
                          <input
                            type="number"
                            value={selections[option.id][prop.label] === 0 ? '' : selections[option.id][prop.label]}
                            placeholder="0"
                            onChange={(e) => {
                              const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                              updatePropertyValue(option.id, prop.label, isNaN(val as number) ? 0 : val as number);
                            }}
                            onFocus={(e) => {
                              if (selections[option.id][prop.label] === 0) {
                                e.target.select();
                              }
                            }}
                            className="w-full bg-bg border border-border rounded px-3 py-1.5 text-sm text-text-primary focus:border-accent outline-none"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
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
            disabled={Object.keys(selections).length === 0 || isSubmitting || isExpired}
            className="flex-1 btn-primary disabled:opacity-50"
          >
            {isExpired ? 'Poll Closed' : isSubmitting ? 'Processing...' : 'Submit My Vote'}
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
