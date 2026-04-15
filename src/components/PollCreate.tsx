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
  const [customProperties, setCustomProperties] = useState<CustomProperty[]>([
    { name: 'weight', label: 'Weight', unit: 'kg' }
  ]);
  const [options, setOptions] = useState<PollOption[]>([
    { id: '1', text: '', customValues: { weight: 0 } },
    { id: '2', text: '', customValues: { weight: 0 } }
  ]);

  const addProperty = () => {
    const name = `prop_${Date.now()}`;
    const newProp = { name, label: 'New Property', unit: '' };
    setCustomProperties([...customProperties, newProp]);
    setOptions(options.map(opt => ({
      ...opt,
      customValues: { ...opt.customValues, [name]: 0 }
    })));
  };

  const removeProperty = (name: string) => {
    setCustomProperties(customProperties.filter(p => p.name !== name));
    setOptions(options.map(opt => {
      const { [name]: _, ...rest } = opt.customValues;
      return { ...opt, customValues: rest };
    }));
  };

  const addOption = () => {
    const id = Date.now().toString();
    const initialValues: Record<string, number> = {};
    customProperties.forEach(p => initialValues[p.name] = 0);
    setOptions([...options, { id, text: '', customValues: initialValues }]);
  };

  const removeOption = (id: string) => {
    if (options.length <= 2) return;
    setOptions(options.filter(o => o.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question || options.some(o => !o.text)) return;

    try {
      await createPoll({
        question,
        description,
        customProperties,
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
        <span className="status-pill">Metric Configuration</span>
        <h1 className="text-4xl font-serif mt-2">Draft New Assessment</h1>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Column 1: Configuration */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="sophisticated-card space-y-8"
        >
          <span className="section-label">Configuration</span>
          
          <div className="space-y-6">
            <div className="field-group">
              <label className="block text-[11px] uppercase tracking-wider text-text-secondary mb-2">Poll Title</label>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Which feature should anchor the Q4 Release?"
                className="input-field"
                required
              />
            </div>
            <div className="field-group">
              <label className="block text-[11px] uppercase tracking-wider text-text-secondary mb-2">Contextual Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide additional details for voters..."
                className="input-field h-32 resize-none"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] uppercase tracking-wider text-text-secondary">Custom Integer Properties (Aggregates)</label>
              <button
                type="button"
                onClick={addProperty}
                className="text-xs text-accent font-medium hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Property
              </button>
            </div>
            
            <div className="space-y-3">
              <AnimatePresence>
                {customProperties.map((prop, idx) => (
                  <motion.div
                    key={prop.name}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-border"
                  >
                    <input
                      type="text"
                      value={prop.label}
                      onChange={(e) => {
                        const newProps = [...customProperties];
                        newProps[idx].label = e.target.value;
                        setCustomProperties(newProps);
                      }}
                      placeholder="Property Label"
                      className="flex-1 bg-transparent border-none focus:ring-0 outline-none text-sm text-text-primary"
                    />
                    <input
                      type="text"
                      value={prop.unit || ''}
                      onChange={(e) => {
                        const newProps = [...customProperties];
                        newProps[idx].unit = e.target.value;
                        setCustomProperties(newProps);
                      }}
                      placeholder="Unit"
                      className="w-16 bg-transparent border-none focus:ring-0 outline-none text-sm text-text-secondary text-right"
                    />
                    <button
                      type="button"
                      onClick={() => removeProperty(prop.name)}
                      className="text-text-secondary hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Column 2: Options */}
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
              <div key={opt.id} className="p-6 bg-white/5 border border-border rounded-xl space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={opt.text}
                    onChange={(e) => {
                      const newOpts = [...options];
                      newOpts[optIdx].text = e.target.value;
                      setOptions(newOpts);
                    }}
                    placeholder={`Option ${optIdx + 1}`}
                    className="flex-1 bg-transparent border-b border-border focus:border-accent outline-none py-1 text-text-primary"
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
                
                <div className="grid grid-cols-2 gap-4">
                  {customProperties.map((prop) => (
                    <div key={prop.name} className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase tracking-wider text-text-secondary">{prop.label}</span>
                      <input
                        type="number"
                        value={opt.customValues[prop.name] || 0}
                        onChange={(e) => {
                          const newOpts = [...options];
                          newOpts[optIdx].customValues[prop.name] = parseInt(e.target.value) || 0;
                          setOptions(newOpts);
                        }}
                        className="bg-[#1c1c1c] border border-border rounded px-3 py-1.5 text-sm text-text-primary focus:border-accent outline-none"
                      />
                    </div>
                  ))}
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
              Save Draft
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary"
            >
              Deploy to Telegram
            </button>
          </div>
        </motion.div>
      </form>
    </div>
  );
}
