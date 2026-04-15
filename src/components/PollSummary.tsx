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
import { formatNumber } from '../lib/utils';

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
    votes: summary.optionStats[opt.id]?.voteCount || 0,
    color: COLORS[idx % COLORS.length]
  }));

  // Prepare data for custom property charts
  const propertyCharts = poll.customProperties.map(prop => {
    const data = poll.options.map((opt, idx) => ({
      name: opt.text,
      value: summary.optionStats[opt.id]?.propertyTotals[prop.name] || 0,
      color: COLORS[idx % COLORS.length]
    }));
    return { prop, data };
  });

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="flex items-end justify-between">
        <div>
          <span className="status-pill">Analytics Preview (Real-time)</span>
          <h1 className="text-4xl font-serif mt-2">{poll.question}</h1>
          {poll.description && <p className="text-text-secondary mt-2 max-w-2xl">{poll.description}</p>}
        </div>
        <div className="flex items-center gap-4">
          <div className="status-pill flex items-center gap-2">
            <Users className="w-3 h-3" />
            {summary.totalVotes} Samples
          </div>
          <button 
            onClick={() => navigate('/')}
            className="btn-secondary py-2 px-4 text-xs"
          >
            Close Report
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {poll.customProperties.map(prop => (
          <motion.div 
            key={prop.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="sophisticated-card !p-6 bg-white/[0.02]"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-medium text-text-secondary uppercase tracking-widest">{prop.label}</span>
              <TrendingUp className="w-3 h-3 text-accent" />
            </div>
            <div className="text-4xl font-serif text-text-primary">
              {formatNumber(summary.overallPropertyTotals[prop.name])}
              <span className="text-xs font-sans text-text-secondary ml-1 italic">{prop.unit}</span>
            </div>
            <p className="text-[10px] text-text-secondary mt-2 uppercase tracking-tighter opacity-50">Aggregate Coefficient</p>
          </motion.div>
        ))}
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Vote Distribution */}
        <div className="sophisticated-card">
          <span className="section-label">Sample Distribution</span>
          <h2 className="text-xl font-serif mb-8">Vote Velocity Analysis</h2>
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
                  dataKey="votes"
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
                <span className="text-xs font-serif text-text-primary ml-2">{item.votes}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Property Charts */}
        {propertyCharts.map(({ prop, data }) => (
          <div key={prop.name} className="sophisticated-card">
            <span className="section-label">Metric Performance</span>
            <h2 className="text-xl font-serif mb-8">{prop.label} Variance</h2>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#262626" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10, fill: '#A0A0A0' }} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ backgroundColor: '#141414', border: '1px solid #262626', borderRadius: '8px' }}
                    itemStyle={{ color: '#E5E5E5' }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.6} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[10px] text-center mt-6 text-text-secondary uppercase tracking-[0.2em] opacity-40">
              Impact Coefficient Distribution
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
