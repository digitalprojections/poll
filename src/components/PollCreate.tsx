/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * @author @ahmadfuzal
 * @date 2026-04-15
 */

import React, { useState } from 'react';
import { Plus, Trash2, Settings2, ListPlus } from 'lucide-react';
import { usePolls } from '../context/PollContext';
import { CustomProperty, PollOption } from '../types/poll';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function PollCreate() {
  const { createPoll } = usePolls();
  const navigate = useNavigate();
  const [question, setQuestion] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<Poll['type']>('single-select');
  const [options, setOptions] = useState<PollOption[]>([
    { id: '1', text: '', properties: [{ label: 'Weight', value: 0, unit: 'kg' }] },
    { id: '2', text: '', properties: [{ label: 'Weight', value: 0, unit: 'kg' }] }
  ]);

  const addOption = () => {
    const id = Date.now().toString();
    setOptions([...options, { id, text: '', properties: [] }]);
  };

  const removeOption = (id: string) => {
    if (options.length <= 2) return;
    setOptions(options.filter(o => o.id !== id));
  };

  const addProperty = (optIdx: number) => {
    const newOpts = [...options];
    newOpts[optIdx].properties.push({ label: 'New Metric', value: 0, unit: '' });
    setOptions(newOpts);
  };

  const removeProperty = (optIdx: number, propIdx: number) => {
    const newOpts = [...options];
    newOpts[optIdx].properties.splice(propIdx, 1);
    setOptions(newOpts);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question || options.some(o => !o.text)) {
      alert('Please provide a title and text for all options.');
      return;
    }

    try {
      await createPoll({
        question,
        description,
        type,
        options
      });
      navigate('/');
    } catch (error) {
      console.error('Failed to create poll:', error);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-12">
        <span className="status-pill">Assessment Architect</span>
        <h1 className="text-4xl font-serif mt-2">Draft New Evaluation</h1>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Column 1: Core Meta */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="sophisticated-card space-y-8"
        >
          <span className="section-label">Core Protocol</span>
          
          <div className="space-y-6">
            <div className="field-group">
              <label className="block text-[11px] uppercase tracking-wider text-text-secondary mb-2">Evaluation Title</label>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Release Strategy Prioritization"
                className="input-field"
                required
              />
            </div>
            <div className="field-group">
              <label className="block text-[11px] uppercase tracking-wider text-text-secondary mb-2">Evaluation Type</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setType('single-select')}
                  className={cn(
                    "p-3 rounded-lg border text-xs font-medium transition-all",
                    type === 'single-select' ? "border-accent bg-accent/10 text-accent" : "border-border bg-white/5 text-text-secondary"
                  )}
                >
                  Single Select
                </button>
                <button
                  type="button"
                  onClick={() => setType('multi-select')}
                  className={cn(
                    "p-3 rounded-lg border text-xs font-medium transition-all",
                    type === 'multi-select' ? "border-accent bg-accent/10 text-accent" : "border-border bg-white/5 text-text-secondary"
                  )}
                >
                  Multi-Select
                </button>
              </div>
            </div>
            <div className="field-group">
              <label className="block text-[11px] uppercase tracking-wider text-text-secondary mb-2">Scope & Context</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Define the parameters and constraints of this evaluation..."
                className="input-field h-32 resize-none"
              />
            </div>
          </div>
        </motion.div>

        {/* Column 2: Specific Metrics */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="sophisticated-card space-y-8"
        >
          <div className="flex items-center justify-between">
            <span className="section-label">Metric Templates</span>
            <button
              type="button"
              onClick={addOption}
              className="text-xs text-accent font-medium hover:underline flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Add Option
            </button>
          </div>

          <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {options.map((opt, optIdx) => (
              <div key={opt.id} className="p-6 bg-white/5 border border-border rounded-xl space-y-5 group/card transition-all hover:bg-white/[0.07]">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={opt.text}
                    onChange={(e) => {
                      const newOpts = [...options];
                      newOpts[optIdx].text = e.target.value;
                      setOptions(newOpts);
                    }}
                    placeholder={`Option Asset ${optIdx + 1}`}
                    className="flex-1 bg-transparent border-b border-border focus:border-accent outline-none py-1 text-text-primary text-xl font-serif"
                  />
                  <button
                    type="button"
                    onClick={() => removeOption(opt.id)}
                    disabled={options.length <= 2}
                    className="text-text-secondary hover:text-red-500 disabled:opacity-30"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] uppercase tracking-widest text-text-secondary opacity-50">Local Metrics</span>
                    <button
                      type="button"
                      onClick={() => addProperty(optIdx)}
                      className="text-[9px] text-accent uppercase font-bold tracking-wider hover:underline"
                    >
                      + Add Target
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2">
                    {opt.properties.map((prop, propIdx) => (
                      <div key={propIdx} className="flex items-center gap-2 p-2 bg-bg rounded border border-border/50">
                        <input
                          type="text"
                          value={prop.label}
                          onChange={(e) => {
                            const newOpts = [...options];
                            newOpts[optIdx].properties[propIdx].label = e.target.value;
                            setOptions(newOpts);
                          }}
                          className="flex-1 bg-transparent border-none text-[10px] text-text-primary focus:ring-0 p-0"
                          placeholder="Label"
                        />
                        <input
                          type="number"
                          value={prop.value}
                          onChange={(e) => {
                            const newOpts = [...options];
                            newOpts[optIdx].properties[propIdx].value = parseInt(e.target.value) || 0;
                            setOptions(newOpts);
                          }}
                          className="w-16 bg-transparent border-none text-[10px] text-accent text-right focus:ring-0 p-0"
                        />
                        <input
                          type="text"
                          value={prop.unit || ''}
                          onChange={(e) => {
                            const newOpts = [...options];
                            newOpts[optIdx].properties[propIdx].unit = e.target.value;
                            setOptions(newOpts);
                          }}
                          className="w-10 bg-transparent border-none text-[9px] text-text-secondary focus:ring-0 p-0"
                          placeholder="U"
                        />
                        <button
                          type="button"
                          onClick={() => removeProperty(optIdx, propIdx)}
                          className="text-text-secondary hover:text-red-500"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-6 flex gap-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex-1 btn-secondary"
            >
              Discard
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary"
            >
              Deploy Terminal
            </button>
          </div>
        </motion.div>
      </form>
    </div>
  );
}
