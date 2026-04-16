/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * @author @ahmadfuzal
 * @date 2026-04-15
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePolls } from '../context/PollContext';
import { PollSummary as PollSummaryType, Poll } from '../types/poll';
import { motion } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { ArrowLeft, Users, TrendingUp, Info } from 'lucide-react';
import { formatNumber, formatDate } from '../lib/utils';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function PollSummary() {
  const { pollId } = useParams();
  const navigate = useNavigate();
  const { polls, getPollSummary } = usePolls();
  const [summary, setSummary] = useState<PollSummaryType | null>(null);
  const [loading, setLoading] = useState(true);

  const poll = polls.find(p => p.id === pollId);

  useEffect(() => {
    if (pollId) {
      getPollSummary(pollId)
        .then(setSummary)
        .finally(() => setLoading(false));
    }
  }, [pollId, getPollSummary]);

  if (loading) return <div className="flex items-center justify-center min-h-[400px] text-text-secondary">Loading analytics...</div>;
  if (!poll || !summary) return <div className="text-center p-12 text-text-secondary">Assessment not found</div>;

  const voteData = poll.options.map((opt, idx) => ({
    name: opt.text,
    selections: summary.optionStats[opt.id]?.voteCount || 0,
    color: COLORS[idx % COLORS.length]
  }));

  // Extract distinct property labels from summary totals
  const metrics = summary.overallPropertyTotals ? Object.keys(summary.overallPropertyTotals) : [];

  // Prepare data for custom property charts
  const propertyCharts = metrics.map(metricLabel => {
    const data = poll.options.map((opt, idx) => ({
      name: opt.text,
      value: summary.optionStats[opt.id]?.propertyTotals[metricLabel] || 0,
      color: COLORS[idx % COLORS.length]
    }));
    return { label: metricLabel, data };
  });

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="status-pill">Analytics Preview (Real-time)</span>
          <h1 className="text-3xl md:text-4xl font-serif mt-2 line-clamp-2">{poll.question}</h1>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 bg-accent/10 text-accent rounded border border-accent/20 h-fit">
              {poll.type === 'single-select' ? 'Single Choice' : 'Multi-Select'}
            </span>
            {poll.description && <p className="text-text-secondary text-sm md:line-clamp-none">{poll.description}</p>}
          </div>
        </div>
        <div className="flex items-center justify-between md:justify-end gap-4 border-t border-white/5 pt-4 md:border-none md:pt-0">
          <div className="status-pill flex items-center gap-2">
            <Users className="w-3 h-3" />
            {summary.totalVotes} Respondents
          </div>
          <button 
            onClick={() => navigate('/')}
            className="btn-secondary py-2.5 px-6 text-xs whitespace-nowrap"
          >
            Close Report
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map(metricLabel => (
          <motion.div 
            key={metricLabel}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="sophisticated-card !p-6 bg-white/[0.02]"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-medium text-text-secondary uppercase tracking-widest">{metricLabel} Total</span>
              <TrendingUp className="w-3 h-3 text-accent" />
            </div>
            <div className="text-4xl font-serif text-text-primary">
              {formatNumber(summary.overallPropertyTotals[metricLabel] || 0)}
            </div>
            <p className="text-[10px] text-text-secondary mt-2 uppercase tracking-tighter opacity-50">Aggregate Selection Impact</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Selection Distribution */}
        <div className="sophisticated-card">
          <span className="section-label">Selection Volume</span>
          <h2 className="text-xl font-serif mb-8">Option Popularity</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={voteData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="selections"
                  stroke="none"
                >
                  {voteData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#141414', border: '1px solid #262626', borderRadius: '8px' }}
                  itemStyle={{ color: '#E5E5E5' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-4">
            {voteData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-border">
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-[11px] text-text-secondary truncate">{item.name}</span>
                </div>
                <span className="text-xs font-serif text-text-primary ml-2">{item.selections}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Voter Manifest - Who voted what */}
        <div className="sophisticated-card flex flex-col">
          <span className="section-label">Audit Trail</span>
          <h2 className="text-xl font-serif mb-8">Voter Manifest</h2>
          
          <div className="flex-1 overflow-y-auto max-h-[440px] pr-2 custom-scrollbar space-y-4">
            {summary.votes.length === 0 ? (
              <div className="text-center py-12 text-text-secondary text-sm italic">
                No verified records found in terminal.
              </div>
            ) : (
              summary.votes.map((vote) => (
                <div key={vote.id} className="p-4 bg-white/5 border border-border rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-text-primary flex items-center gap-2">
                       <User size={12} className="text-accent" /> {vote.userName}
                    </span>
                    <span className="text-[9px] text-text-secondary uppercase">
                      {formatDate(vote.timestamp)}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    {Object.entries(vote.selections).map(([optId, values]) => {
                      const opt = poll.options.find(o => o.id === optId);
                      return (
                        <div key={optId} className="pl-3 border-l-2 border-accent/30 py-1">
                          <div className="text-[11px] text-text-primary mb-1">{opt?.text}</div>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(values).map(([label, val]) => (
                               <span key={label} className="text-[9px] px-1.5 py-0.5 bg-bg border border-border text-text-secondary rounded">
                                 {label}: <span className="text-accent">{val}</span>
                               </span>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { User } from 'lucide-react';


