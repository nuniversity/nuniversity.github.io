'use client'

import React, { useMemo, useState } from 'react';
import { Plus, Trash2, Download, RotateCcw, BarChart3, GripVertical } from 'lucide-react';
import { usePersistentState } from '@/lib/tools/use-persistent-state';
import { createId } from '@/lib/tools/ids';
import { interpolate as tpl } from '@/lib/tools/template';
import { toCsv } from '@/lib/tools/csv';
import { downloadCsv, downloadJson } from '@/lib/tools/download';
import { ToolHeader } from './shared/ToolHeader';

interface Option {
  id: number;
  name: string;
}

interface Criterion {
  id: number;
  name: string;
  weight: number;
}

interface DecisionState {
  title: string;
  options: Option[];
  criteria: Criterion[];
  /** Keyed `${optionId}-${criterionId}`. */
  scores: Record<string, number>;
  scale: number;
}

interface DecisionMatrixProps {
  lang: string;
  dict: any;
}

const SCALES = [3, 5, 10];

function validateState(raw: unknown): DecisionState | null {
  if (!raw || typeof raw !== 'object') return null;
  const value = raw as Partial<DecisionState>;
  if (!Array.isArray(value.options) || !Array.isArray(value.criteria)) return null;

  const options = value.options
    .filter((option): option is Option => Boolean(option) && typeof (option as Option).id === 'number' && typeof (option as Option).name === 'string')
    .map((option) => ({ id: option.id, name: option.name }));
  const criteria = value.criteria
    .filter(
      (criterion): criterion is Criterion =>
        Boolean(criterion) &&
        typeof (criterion as Criterion).id === 'number' &&
        typeof (criterion as Criterion).name === 'string'
    )
    .map((criterion) => ({
      id: criterion.id,
      name: criterion.name,
      weight: Math.max(1, Math.min(10, Math.round(criterion.weight) || 1)),
    }));

  const scale = SCALES.includes(Number(value.scale)) ? Number(value.scale) : 5;
  const scores: Record<string, number> = {};
  if (value.scores && typeof value.scores === 'object') {
    for (const [key, score] of Object.entries(value.scores)) {
      if (typeof score === 'number' && score >= 1 && score <= scale) scores[key] = score;
    }
  }

  return {
    title: typeof value.title === 'string' ? value.title : '',
    options,
    criteria,
    scores,
    scale,
  };
}

const DecisionMatrix = ({ lang = 'en', dict = {} }: DecisionMatrixProps) => {
  const t = dict.tools?.decision_matrix || {};
  const tc = dict.tools?.common || {};
  const c = dict.common || {};

  const defaults: DecisionState = {
    title: t.default_title || 'Project Decision',
    options: [
      { id: 1, name: t.option_a || 'Option A' },
      { id: 2, name: t.option_b || 'Option B' },
      { id: 3, name: t.option_c || 'Option C' },
    ],
    criteria: [
      { id: 1, name: t.criterion_cost || 'Cost', weight: 3 },
      { id: 2, name: t.criterion_impact || 'Impact', weight: 5 },
      { id: 3, name: t.criterion_effort || 'Effort', weight: 2 },
    ],
    scores: {},
    scale: 5,
  };

  const [state, setState] = usePersistentState<DecisionState>(
    'mimir:tools:decision_matrix',
    defaults,
    validateState
  );
  const [newOptionName, setNewOptionName] = useState('');
  const [newCriterionName, setNewCriterionName] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  // Once hydrated an empty decision starts from the localised defaults.
  const title = state.title || defaults.title;

  const getScore = (optionId: number, criterionId: number): number | null =>
    state.scores[`${optionId}-${criterionId}`] ?? null;

  const setScore = (optionId: number, criterionId: number, value: number | null) => {
    const key = `${optionId}-${criterionId}`;
    setState((prev) => {
      const next = { ...prev.scores };
      if (value === null) delete next[key];
      else next[key] = value;
      return { ...prev, scores: next };
    });
  };

  const results = useMemo(() => {
    return state.options
      .map((option) => {
        let totalWeighted = 0;
        let totalWeight = 0;
        let scoredCount = 0;
        for (const criterion of state.criteria) {
          const score = state.scores[`${option.id}-${criterion.id}`] ?? null;
          if (score !== null) {
            totalWeighted += score * criterion.weight;
            totalWeight += criterion.weight;
            scoredCount += 1;
          }
        }
        const weightedScore = totalWeight > 0 ? totalWeighted / totalWeight : 0;
        const percentage = totalWeight > 0 ? Math.min(100, (totalWeighted / (totalWeight * state.scale)) * 100) : 0;
        return { ...option, weightedScore, percentage, scoredCount };
      })
      .sort((a, b) => b.weightedScore - a.weightedScore);
  }, [state.options, state.criteria, state.scores, state.scale]);

  const addOption = () => {
    if (!newOptionName.trim()) return;
    setState((prev) => ({
      ...prev,
      options: [...prev.options, { id: createId(), name: newOptionName.trim() }],
    }));
    setNewOptionName('');
  };

  const removeOption = (id: number) => {
    setState((prev) => {
      const nextScores = { ...prev.scores };
      Object.keys(nextScores).forEach((key) => {
        if (key.startsWith(`${id}-`)) delete nextScores[key];
      });
      return { ...prev, options: prev.options.filter((option) => option.id !== id), scores: nextScores };
    });
  };

  const addCriterion = () => {
    if (!newCriterionName.trim()) return;
    setState((prev) => ({
      ...prev,
      criteria: [...prev.criteria, { id: createId(), name: newCriterionName.trim(), weight: 1 }],
    }));
    setNewCriterionName('');
  };

  const removeCriterion = (id: number) => {
    setState((prev) => {
      const nextScores = { ...prev.scores };
      Object.keys(nextScores).forEach((key) => {
        if (key.endsWith(`-${id}`)) delete nextScores[key];
      });
      return {
        ...prev,
        criteria: prev.criteria.filter((criterion) => criterion.id !== id),
        scores: nextScores,
      };
    });
  };

  const updateWeight = (id: number, weight: number) => {
    setState((prev) => ({
      ...prev,
      criteria: prev.criteria.map((criterion) =>
        criterion.id === id ? { ...criterion, weight: Math.max(1, Math.min(10, weight)) } : criterion
      ),
    }));
  };

  const changeScale = (scale: number) => {
    setState((prev) => {
      // Clamp to the new maximum so percentages stay valid.
      const scores: Record<string, number> = {};
      for (const [key, score] of Object.entries(prev.scores)) {
        scores[key] = Math.min(score, scale);
      }
      return { ...prev, scale, scores };
    });
  };

  const moveOption = (from: number, to: number) => {
    if (from === to) return;
    setState((prev) => {
      const options = [...prev.options];
      const [moved] = options.splice(from, 1);
      options.splice(to, 0, moved);
      return { ...prev, options };
    });
  };

  const exportJSON = () => downloadJson({ ...state, title, exportedAt: new Date().toISOString() }, 'decision-matrix.json');

  const exportCSV = () => {
    const header = ['Option', ...state.criteria.map((criterion) => `${criterion.name} (w:${criterion.weight})`), 'Weighted Score', 'Rank'];
    const rows = results.map((option, index) => [
      option.name,
      ...state.criteria.map((criterion) => getScore(option.id, criterion.id) ?? ''),
      option.weightedScore.toFixed(2),
      index + 1,
    ]);
    downloadCsv(toCsv([header, ...rows]), 'decision-matrix.csv');
  };

  const resetAll = () => {
    setState(defaults);
    setConfirmReset(false);
  };

  const allScored =
    state.options.length > 0 &&
    state.options.every((option) => state.criteria.every((criterion) => getScore(option.id, criterion.id) !== null));

  const bestOptionId = allScored && (results[0]?.weightedScore ?? 0) > 0 ? results[0].id : null;
  const rankOf = (optionId: number): number => results.findIndex((result) => result.id === optionId) + 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-green-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <ToolHeader
          icon={BarChart3}
          title={t.title || 'Decision Matrix'}
          subtitle={t.subtitle || 'Evaluate options against weighted criteria to make better decisions'}
          gradient="from-teal-600 to-emerald-600"
        />

        <div className="bg-card border border-border rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label htmlFor="decision-title" className="block text-sm font-medium text-muted-foreground mb-1">
                {t.decision_title || 'Decision Title'}
              </label>
              <input
                id="decision-title"
                type="text"
                value={title}
                onChange={(event) => setState((prev) => ({ ...prev, title: event.target.value }))}
                className="w-full px-4 py-2 rounded-lg border border-border bg-background font-semibold focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div className="w-32">
              <label htmlFor="decision-scale" className="block text-sm font-medium text-muted-foreground mb-1">
                {tpl(t.scale || 'Scale (1–{n})', { n: state.scale })}
              </label>
              <select
                id="decision-scale"
                value={state.scale}
                onChange={(event) => changeScale(Number(event.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary outline-none"
              >
                {SCALES.map((scale) => (
                  <option key={scale} value={scale}>
                    1–{scale}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap gap-2 ml-auto">
              <button
                onClick={exportJSON}
                className="px-4 py-2 rounded-lg bg-teal-700 text-white hover:bg-teal-800 transition-colors text-sm flex items-center gap-1"
              >
                <Download className="w-4 h-4" aria-hidden="true" /> {tc.json || 'JSON'}
              </button>
              <button
                onClick={exportCSV}
                className="px-4 py-2 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 transition-colors text-sm flex items-center gap-1"
              >
                <Download className="w-4 h-4" aria-hidden="true" /> {tc.csv || 'CSV'}
              </button>
              {confirmReset ? (
                <span className="flex gap-1">
                  <button
                    onClick={resetAll}
                    className="px-3 py-2 rounded-lg bg-red-600 text-white text-sm"
                  >
                    {tc.reset || 'Reset'}
                  </button>
                  <button
                    onClick={() => setConfirmReset(false)}
                    className="px-3 py-2 rounded-lg bg-muted text-sm"
                  >
                    {c.cancel || 'Cancel'}
                  </button>
                </span>
              ) : (
                <button
                  onClick={() => setConfirmReset(true)}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors text-sm flex items-center gap-1"
                >
                  <RotateCcw className="w-4 h-4" aria-hidden="true" /> {tc.reset || 'Reset'}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr,300px] gap-6">
          <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <caption className="sr-only">{tpl(t.results_summary || 'Results Summary', {})}</caption>
                <thead>
                  <tr className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white">
                    <th scope="col" className="p-4 text-left font-semibold min-w-[160px]">
                      {t.options || 'Options'}
                    </th>
                    {state.criteria.map((criterion) => (
                      <th key={criterion.id} scope="col" className="p-4 text-center font-semibold min-w-[130px]">
                        <div className="flex items-center justify-center gap-2">
                          <span>{criterion.name}</span>
                          <span className="text-xs text-white/70">w:{criterion.weight}</span>
                          <button
                            onClick={() => removeCriterion(criterion.id)}
                            aria-label={`${c.delete || 'Delete'} ${criterion.name}`}
                            className="p-0.5 rounded hover:bg-white/20 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" aria-hidden="true" />
                          </button>
                        </div>
                      </th>
                    ))}
                    <th scope="col" className="p-4 text-center font-semibold min-w-[100px] bg-teal-700">
                      {t.score || 'Score'}
                    </th>
                    <th scope="col" className="p-4 text-center font-semibold min-w-[80px] bg-teal-800">
                      {t.rank || 'Rank'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {state.options.map((option, index) => {
                    const result = results.find((item) => item.id === option.id);
                    const isBest = option.id === bestOptionId;
                    return (
                      <tr
                        key={option.id}
                        draggable
                        onDragStart={() => setDragIndex(index)}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={() => {
                          if (dragIndex !== null) moveOption(dragIndex, index);
                          setDragIndex(null);
                        }}
                        className={`border-t border-border ${isBest ? 'bg-emerald-50 dark:bg-emerald-900/20' : index % 2 === 1 ? 'bg-muted/30' : ''}`}
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" aria-hidden="true" />
                            <input
                              type="text"
                              value={option.name}
                              onChange={(event) =>
                                setState((prev) => ({
                                  ...prev,
                                  options: prev.options.map((item) =>
                                    item.id === option.id ? { ...item, name: event.target.value } : item
                                  ),
                                }))
                              }
                              aria-label={`${t.options || 'Options'} ${index + 1}`}
                              className="flex-1 px-2 py-1 rounded border border-border bg-transparent font-medium focus:ring-2 focus:ring-primary outline-none"
                            />
                            <button
                              onClick={() => removeOption(option.id)}
                              aria-label={`${c.delete || 'Delete'} ${option.name}`}
                              className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-500" aria-hidden="true" />
                            </button>
                          </div>
                        </td>
                        {state.criteria.map((criterion) => {
                          const score = getScore(option.id, criterion.id);
                          return (
                            <td key={criterion.id} className="p-3 text-center">
                              <div className="flex gap-1 justify-center flex-wrap">
                                {Array.from({ length: state.scale }, (_, i) => i + 1).map((value) => (
                                  <button
                                    key={value}
                                    onClick={() => setScore(option.id, criterion.id, score === value ? null : value)}
                                    aria-pressed={score === value}
                                    aria-label={`${option.name} — ${criterion.name}: ${value}`}
                                    className={`w-7 h-7 rounded text-xs font-medium transition-all ${
                                      score === value
                                        ? 'bg-emerald-700 text-white shadow-sm scale-110'
                                        : 'bg-muted text-muted-foreground hover:opacity-80'
                                    }`}
                                  >
                                    {value}
                                  </button>
                                ))}
                              </div>
                            </td>
                          );
                        })}
                        <td className={`p-3 text-center font-bold text-lg ${isBest ? 'text-emerald-600' : ''}`}>
                          {(result?.weightedScore ?? 0) > 0 ? result?.weightedScore.toFixed(1) : ''}
                        </td>
                        <td className="p-3 text-center">
                          {allScored && (result?.weightedScore ?? 0) > 0 ? (
                            <span
                              className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                                isBest ? 'bg-emerald-700 text-white' : 'bg-muted text-foreground'
                              }`}
                            >
                              {rankOf(option.id)}
                            </span>
                          ) : (
                            ''
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <label htmlFor="decision-new-option" className="sr-only">
                  {t.add_option_placeholder || 'Add new option...'}
                </label>
                <input
                  id="decision-new-option"
                  type="text"
                  value={newOptionName}
                  onChange={(event) => setNewOptionName(event.target.value)}
                  onKeyDown={(event) => event.key === 'Enter' && addOption()}
                  placeholder={t.add_option_placeholder || 'Add new option...'}
                  className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:ring-2 focus:ring-primary outline-none"
                />
                <button
                  onClick={addOption}
                  className="px-4 py-2 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 transition-colors text-sm flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" /> {tc.add || 'Add'}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl shadow-xl p-6">
            <h2 className="text-lg font-semibold mb-4">{t.criteria || 'Criteria'}</h2>
            <div className="space-y-3 mb-4">
              {state.criteria.map((criterion) => (
                <div key={criterion.id} className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
                  <input
                    type="text"
                    value={criterion.name}
                    onChange={(event) =>
                      setState((prev) => ({
                        ...prev,
                        criteria: prev.criteria.map((item) =>
                          item.id === criterion.id ? { ...item, name: event.target.value } : item
                        ),
                      }))
                    }
                    aria-label={`${t.criteria || 'Criteria'} ${criterion.name}`}
                    className="flex-1 min-w-0 px-2 py-1 rounded border border-border bg-transparent text-sm font-medium focus:ring-2 focus:ring-primary outline-none"
                  />
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateWeight(criterion.id, criterion.weight - 1)}
                      aria-label={`${criterion.name}: ${t.weight || 'weight'} -1`}
                      className="p-1 rounded hover:bg-muted text-xs font-bold"
                    >
                      −
                    </button>
                    <span className="w-6 text-center text-sm font-bold text-emerald-600">{criterion.weight}</span>
                    <button
                      onClick={() => updateWeight(criterion.id, criterion.weight + 1)}
                      aria-label={`${criterion.name}: ${t.weight || 'weight'} +1`}
                      className="p-1 rounded hover:bg-muted text-xs font-bold"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => removeCriterion(criterion.id)}
                    aria-label={`${c.delete || 'Delete'} ${criterion.name}`}
                    className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-500" aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <label htmlFor="decision-new-criterion" className="sr-only">
                {t.new_criterion_placeholder || 'New criterion...'}
              </label>
              <input
                id="decision-new-criterion"
                type="text"
                value={newCriterionName}
                onChange={(event) => setNewCriterionName(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && addCriterion()}
                placeholder={t.new_criterion_placeholder || 'New criterion...'}
                className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:ring-2 focus:ring-primary outline-none"
              />
              <button
                onClick={addCriterion}
                aria-label={tc.add || 'Add'}
                className="px-3 py-2 rounded-lg bg-teal-700 text-white hover:bg-teal-800 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        {allScored && (
          <div className="mt-6 bg-card border border-border rounded-2xl shadow-xl p-6">
            <h2 className="text-lg font-semibold mb-4">{t.results_summary || 'Results Summary'}</h2>
            <div className="space-y-3">
              {results.map((result, index) => (
                <div key={result.id} className="flex items-center gap-4">
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-emerald-700 text-white' : 'bg-muted text-foreground'
                    }`}
                  >
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">{result.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {result.weightedScore.toFixed(1)} ({result.percentage.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${index === 0 ? 'bg-emerald-500' : 'bg-teal-400'}`}
                        style={{ width: `${result.percentage}%` }}
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
