'use client'

import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Download, RotateCcw, BarChart3, GripVertical } from 'lucide-react';

interface Option {
  id: number;
  name: string;
}

interface Criterion {
  id: number;
  name: string;
  weight: number;
}

interface Score {
  optionId: number;
  criterionId: number;
  value: number;
}

interface DecisionMatrixProps {
  lang: string;
  dict: any;
}

const DecisionMatrix = ({ lang = 'en' }: DecisionMatrixProps) => {
  const [title, setTitle] = useState('Project Decision');
  const [options, setOptions] = useState<Option[]>([
    { id: 1, name: 'Option A' },
    { id: 2, name: 'Option B' },
    { id: 3, name: 'Option C' },
  ]);
  const [criteria, setCriteria] = useState<Criterion[]>([
    { id: 1, name: 'Cost', weight: 3 },
    { id: 2, name: 'Impact', weight: 5 },
    { id: 3, name: 'Effort', weight: 2 },
  ]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [newOptionName, setNewOptionName] = useState('');
  const [newCriterionName, setNewCriterionName] = useState('');
  const [scale, setScale] = useState(5);

  const nextOptionId = useMemo(() => Math.max(...options.map(o => o.id), 0) + 1, [options]);
  const nextCriterionId = useMemo(() => Math.max(...criteria.map(c => c.id), 0) + 1, [criteria]);

  const getScore = (optionId: number, criterionId: number) => {
    return scores[`${optionId}-${criterionId}`] ?? null;
  };

  const setScore = (optionId: number, criterionId: number, value: number | null) => {
    const key = `${optionId}-${criterionId}`;
    setScores(prev => {
      const next = { ...prev };
      if (value === null) {
        delete next[key];
      } else {
        next[key] = value;
      }
      return next;
    });
  };

  const results = useMemo(() => {
    return options.map(option => {
      let totalWeighted = 0;
      let totalWeight = 0;
      let count = 0;
      for (const criterion of criteria) {
        const score = getScore(option.id, criterion.id);
        if (score !== null) {
          totalWeighted += score * criterion.weight;
          totalWeight += criterion.weight;
          count++;
        }
      }
      const weightedScore = totalWeight > 0 ? totalWeighted / totalWeight : 0;
      const maxScore = scale;
      const percentage = totalWeight > 0 ? (totalWeighted / (totalWeight * maxScore)) * 100 : 0;
      return { ...option, weightedScore, percentage, scoredCount: count };
    }).sort((a, b) => b.weightedScore - a.weightedScore);
  }, [options, criteria, scores, scale]);

  const addOption = () => {
    if (newOptionName.trim()) {
      setOptions(prev => [...prev, { id: nextOptionId, name: newOptionName.trim() }]);
      setNewOptionName('');
    }
  };

  const removeOption = (id: number) => {
    setOptions(prev => prev.filter(o => o.id !== id));
    setScores(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(key => {
        if (key.startsWith(`${id}-`)) delete next[key];
      });
      return next;
    });
  };

  const addCriterion = () => {
    if (newCriterionName.trim()) {
      setCriteria(prev => [...prev, { id: nextCriterionId, name: newCriterionName.trim(), weight: 1 }]);
      setNewCriterionName('');
    }
  };

  const removeCriterion = (id: number) => {
    setCriteria(prev => prev.filter(c => c.id !== id));
    setScores(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(key => {
        if (key.endsWith(`-${id}`)) delete next[key];
      });
      return next;
    });
  };

  const updateWeight = (id: number, weight: number) => {
    setCriteria(prev => prev.map(c => c.id === id ? { ...c, weight: Math.max(1, Math.min(10, weight)) } : c));
  };

  const exportJSON = () => {
    const data = { title, options, criteria, scores, scale, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `decision-matrix-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    let csv = `Option,${criteria.map(c => `${c.name} (w:${c.weight})`).join(',')},Weighted Score,Rank\n`;
    results.forEach((opt, i) => {
      const row = criteria.map(c => getScore(opt.id, c.id) ?? '').join(',');
      csv += `"${opt.name}",${row},${opt.weightedScore.toFixed(2)},${i + 1}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `decision-matrix-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetAll = () => {
    setScores({});
    setOptions([{ id: 1, name: 'Option A' }, { id: 2, name: 'Option B' }, { id: 3, name: 'Option C' }]);
    setCriteria([{ id: 1, name: 'Cost', weight: 3 }, { id: 2, name: 'Impact', weight: 5 }, { id: 3, name: 'Effort', weight: 2 }]);
    setTitle('Project Decision');
  };

  const allScored = options.every(o => criteria.every(c => getScore(o.id, c.id) !== null));

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-green-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-teal-600 to-emerald-600 mb-4">
            <BarChart3 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
            Decision Matrix
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Evaluate options against weighted criteria to make better decisions
          </p>
        </div>

        {/* Title and Scale */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Decision Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div className="w-32">
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Scale (1–{scale})</label>
              <select value={scale} onChange={(e) => setScale(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-emerald-500 outline-none">
                <option value={3}>1–3</option>
                <option value={5}>1–5</option>
                <option value={10}>1–10</option>
              </select>
            </div>
            <div className="flex gap-2 ml-auto">
              <button onClick={exportJSON} className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-colors text-sm flex items-center gap-1"><Download className="w-4 h-4" /> JSON</button>
              <button onClick={exportCSV} className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors text-sm flex items-center gap-1"><Download className="w-4 h-4" /> CSV</button>
              <button onClick={resetAll} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors text-sm flex items-center gap-1"><RotateCcw className="w-4 h-4" /> Reset</button>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr,300px] gap-6">
          {/* Matrix */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white">
                    <th className="p-4 text-left font-semibold min-w-[160px]">Options</th>
                    {criteria.map(c => (
                      <th key={c.id} className="p-4 text-center font-semibold min-w-[120px]">
                        <div className="flex items-center justify-center gap-2">
                          <span>{c.name}</span>
                          <span className="text-xs text-white/70">w:{c.weight}</span>
                          <button onClick={() => removeCriterion(c.id)} className="p-0.5 rounded hover:bg-white/20 transition-colors"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      </th>
                    ))}
                    <th className="p-4 text-center font-semibold min-w-[100px] bg-teal-700">Score</th>
                    <th className="p-4 text-center font-semibold min-w-[80px] bg-teal-800">Rank</th>
                  </tr>
                </thead>
                <tbody>
                  {options.map((option, idx) => {
                    const result = results.find(r => r.id === option.id)!;
                    const isBest = idx === 0 && allScored && result.weightedScore > 0;
                    return (
                      <tr key={option.id} className={`border-t border-gray-200 dark:border-gray-700 ${isBest ? 'bg-emerald-50 dark:bg-emerald-900/20' : idx % 2 === 1 ? 'bg-gray-50 dark:bg-gray-800/50' : ''}`}>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                            <input
                              type="text"
                              value={option.name}
                              onChange={(e) => setOptions(prev => prev.map(o => o.id === option.id ? { ...o, name: e.target.value } : o))}
                              className="flex-1 px-2 py-1 rounded border border-gray-200 dark:border-gray-600 bg-transparent font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                            <button onClick={() => removeOption(option.id)} className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900 transition-colors"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
                          </div>
                        </td>
                        {criteria.map(c => {
                          const score = getScore(option.id, c.id);
                          return (
                            <td key={c.id} className="p-3 text-center">
                              <div className="flex gap-1 justify-center">
                                {Array.from({ length: scale }, (_, i) => i + 1).map(v => (
                                  <button
                                    key={v}
                                    onClick={() => setScore(option.id, c.id, score === v ? null : v)}
                                    className={`w-7 h-7 rounded text-xs font-medium transition-all ${
                                      score === v
                                        ? 'bg-emerald-500 text-white shadow-sm scale-110'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                                  >
                                    {v}
                                  </button>
                                ))}
                              </div>
                            </td>
                          );
                        })}
                        <td className={`p-3 text-center font-bold text-lg ${isBest ? 'text-emerald-600' : ''}`}>
                          {result.weightedScore > 0 ? result.weightedScore.toFixed(1) : '—'}
                        </td>
                        <td className="p-3 text-center">
                          {allScored && result.weightedScore > 0 ? (
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${isBest ? 'bg-emerald-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                              {idx + 1}
                            </span>
                          ) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Add Option */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newOptionName}
                  onChange={(e) => setNewOptionName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addOption()}
                  placeholder="Add new option..."
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <button onClick={addOption} className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors text-sm flex items-center gap-1"><Plus className="w-4 h-4" /> Add</button>
              </div>
            </div>
          </div>

          {/* Sidebar: Criteria Management */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Criteria</h3>
            <div className="space-y-3 mb-4">
              {criteria.map(c => (
                <div key={c.id} className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700">
                  <input
                    type="text"
                    value={c.name}
                    onChange={(e) => setCriteria(prev => prev.map(cr => cr.id === c.id ? { ...cr, name: e.target.value } : cr))}
                    className="flex-1 px-2 py-1 rounded border border-gray-200 dark:border-gray-600 bg-transparent text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateWeight(c.id, c.weight - 1)} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-xs font-bold">−</button>
                    <span className="w-6 text-center text-sm font-bold text-emerald-600">{c.weight}</span>
                    <button onClick={() => updateWeight(c.id, c.weight + 1)} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-xs font-bold">+</button>
                  </div>
                  <button onClick={() => removeCriterion(c.id)} className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900 transition-colors"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCriterionName}
                onChange={(e) => setNewCriterionName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCriterion()}
                placeholder="New criterion..."
                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
              <button onClick={addCriterion} className="px-3 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-colors text-sm"><Plus className="w-4 h-4" /></button>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        {allScored && (
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Results Summary</h3>
            <div className="space-y-3">
              {results.map((r, i) => (
                <div key={r.id} className="flex items-center gap-4">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i === 0 ? 'bg-emerald-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">{r.name}</span>
                      <span className="text-sm text-gray-500">{r.weightedScore.toFixed(1)} ({r.percentage.toFixed(0)}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${i === 0 ? 'bg-emerald-500' : 'bg-teal-400'}`}
                        style={{ width: `${r.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DecisionMatrix;
