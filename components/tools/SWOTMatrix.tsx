'use client'

import React, { useMemo, useState } from 'react';
import {
  Target,
  TrendingUp,
  TrendingDown,
  Shield,
  AlertTriangle,
  Download,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  BarChart3,
  Grid3x3,
  FileText,
  Upload,
} from 'lucide-react';
import { type Locale } from '@/lib/i18n/config';
import { usePersistentState } from '@/lib/tools/use-persistent-state';
import { interpolate } from '@/lib/tools/template';
import { csvToRecords, toCsv } from '@/lib/tools/csv';
import { downloadCsv, downloadJson, downloadText, sanitizeFilename } from '@/lib/tools/download';
import { ToolHeader } from './shared/ToolHeader';
import { ImportDialog } from './shared/ImportDialog';

interface SWOTMatrixProps {
  lang: Locale;
  dict: any;
}

type QuadrantKey = 'strengths' | 'weaknesses' | 'opportunities' | 'threats';
type StrategyKey = 'so' | 'wo' | 'st' | 'wt';

interface SWOTState {
  projectName: string;
  description: string;
  swot: Record<QuadrantKey, string[]>;
}

const QUADRANT_KEYS: QuadrantKey[] = ['strengths', 'weaknesses', 'opportunities', 'threats'];
const MAX_STRATEGIES_PER_TYPE = 6;

const EMPTY_SWOT: Record<QuadrantKey, string[]> = {
  strengths: [],
  weaknesses: [],
  opportunities: [],
  threats: [],
};

const EMPTY_STATE: SWOTState = { projectName: '', description: '', swot: EMPTY_SWOT };

function validateState(raw: unknown): SWOTState | null {
  if (!raw || typeof raw !== 'object') return null;
  const value = raw as Partial<SWOTState>;
  if (!value.swot || typeof value.swot !== 'object') return null;
  const swot: Record<QuadrantKey, string[]> = { ...EMPTY_SWOT };
  for (const quadrant of QUADRANT_KEYS) {
    const list = value.swot[quadrant];
    if (!Array.isArray(list)) continue;
    swot[quadrant] = list.filter((item): item is string => typeof item === 'string');
  }
  return {
    projectName: typeof value.projectName === 'string' ? value.projectName : '',
    description: typeof value.description === 'string' ? value.description : '',
    swot,
  };
}

const SWOTMatrix = ({ dict = {} }: SWOTMatrixProps) => {
  const t = dict.tools?.swot_matrix || {};
  const tc = dict.tools?.common || {};
  const c = dict.common || {};

  const [state, setState] = usePersistentState<SWOTState>(
    'mimir:tools:swot_matrix',
    EMPTY_STATE,
    validateState
  );
  const [newItem, setNewItem] = useState<Record<QuadrantKey, string>>({
    strengths: '',
    weaknesses: '',
    opportunities: '',
    threats: '',
  });
  const [editing, setEditing] = useState<{ quadrant: QuadrantKey; index: number; text: string } | null>(null);
  const [view, setView] = useState<'matrix' | 'list'>('matrix');
  const [showStrategy, setShowStrategy] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const addItem = (quadrant: QuadrantKey) => {
    const text = newItem[quadrant].trim();
    if (!text) return;
    setState((prev) => ({
      ...prev,
      swot: { ...prev.swot, [quadrant]: [...prev.swot[quadrant], text] },
    }));
    setNewItem((prev) => ({ ...prev, [quadrant]: '' }));
  };

  const removeItem = (quadrant: QuadrantKey, index: number) => {
    setState((prev) => ({
      ...prev,
      swot: { ...prev.swot, [quadrant]: prev.swot[quadrant].filter((_, i) => i !== index) },
    }));
    if (editing?.quadrant === quadrant) setEditing(null);
  };

  const saveEdit = () => {
    if (!editing || !editing.text.trim()) {
      setEditing(null);
      return;
    }
    const { quadrant, index, text } = editing;
    setState((prev) => ({
      ...prev,
      swot: {
        ...prev.swot,
        [quadrant]: prev.swot[quadrant].map((item, i) => (i === index ? text.trim() : item)),
      },
    }));
    setEditing(null);
  };

  const strategies = useMemo(() => {
    const templates: Record<StrategyKey, string> = {
      so: t.strategyTemplates?.so || 'Use {strength} to pursue {opportunity}.',
      wo: t.strategyTemplates?.wo || 'Address {weakness} to unlock {opportunity}.',
      st: t.strategyTemplates?.st || 'Use {strength} to mitigate {threat}.',
      wt: t.strategyTemplates?.wt || 'Reduce {weakness} to avoid {threat}.',
    };
    const result: Record<StrategyKey, string[]> = { so: [], wo: [], st: [], wt: [] };
    const pairs: Array<[StrategyKey, QuadrantKey, string, QuadrantKey, string]> = [
      ['so', 'strengths', 'strength', 'opportunities', 'opportunity'],
      ['wo', 'weaknesses', 'weakness', 'opportunities', 'opportunity'],
      ['st', 'strengths', 'strength', 'threats', 'threat'],
      ['wt', 'weaknesses', 'weakness', 'threats', 'threat'],
    ];

    for (const [type, firstKey, firstPlaceholder, secondKey, secondPlaceholder] of pairs) {
      for (const first of state.swot[firstKey]) {
        for (const second of state.swot[secondKey]) {
          if (result[type].length >= MAX_STRATEGIES_PER_TYPE) break;
          result[type].push(
            interpolate(templates[type], {
              [firstPlaceholder]: first,
              [secondPlaceholder]: second,
            })
          );
        }
      }
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.swot, t.strategyTemplates]);

  const importData = (content: string, filename: string): string | null => {
    const next: Record<QuadrantKey, string[]> = { ...EMPTY_SWOT };
    try {
      if (filename.toLowerCase().endsWith('.json')) {
        const parsed = JSON.parse(content) as { swot?: Record<string, unknown> } | Record<string, unknown>;
        const source = (parsed as { swot?: Record<string, unknown> }).swot ?? parsed;
        for (const quadrant of QUADRANT_KEYS) {
          const list = (source as Record<string, unknown>)[quadrant];
          if (!Array.isArray(list)) continue;
          next[quadrant] = list.filter((item): item is string => typeof item === 'string' && item.trim() !== '');
        }
      } else if (filename.toLowerCase().endsWith('.csv')) {
        for (const record of csvToRecords(content)) {
          const quadrant = record.quadrant as QuadrantKey;
          if (QUADRANT_KEYS.includes(quadrant) && record.item?.trim()) {
            next[quadrant].push(record.item.trim());
          }
        }
      } else {
        return t.importError || 'Invalid import file';
      }
    } catch {
      return t.importError || 'Invalid import file';
    }

    const total = QUADRANT_KEYS.reduce((sum, key) => sum + next[key].length, 0);
    if (total === 0) return t.importError || 'Invalid import file';
    setState((prev) => ({ ...prev, swot: next }));
    return null;
  };

  const totalItems = QUADRANT_KEYS.reduce((sum, key) => sum + state.swot[key].length, 0);
  const fileStem = sanitizeFilename(state.projectName, 'swot-analysis');

  const exportJSON = () => {
    downloadJson(
      {
        projectName: state.projectName,
        description: state.description,
        timestamp: new Date().toISOString(),
        swot: state.swot,
        strategies,
      },
      `swot-analysis-${fileStem}.json`
    );
  };

  const exportCSV = () => {
    const rows: string[][] = [['Quadrant', 'Item']];
    for (const quadrant of QUADRANT_KEYS) {
      for (const item of state.swot[quadrant]) rows.push([quadrant, item]);
    }
    downloadCsv(toCsv(rows), `swot-analysis-${fileStem}.csv`);
  };

  const exportReport = () => {
    const reportTitle = t.report?.title || 'SWOT Analysis Report';
    let report = `${reportTitle}\n${'='.repeat(reportTitle.length)}\n\n`;
    report += `${t.report?.project || 'Project:'} ${state.projectName}\n`;
    report += `${t.report?.description || 'Description:'} ${state.description}\n`;
    report += `${t.report?.date || 'Date:'} ${new Date().toLocaleDateString()}\n\n`;

    for (const quadrant of QUADRANT_KEYS) {
      report += `\n${(t[quadrant] || quadrant).toUpperCase()}\n${'-'.repeat(20)}\n`;
      state.swot[quadrant].forEach((item, index) => {
        report += `${index + 1}. ${item}\n`;
      });
    }

    report += `\n\n${t.report?.recommendations || 'Strategic Recommendations'}\n${'='.repeat(31)}\n\n`;
    for (const type of Object.keys(strategies) as StrategyKey[]) {
      if (strategies[type].length === 0) continue;
      report += `${t.report?.strategy_line ? interpolate(t.report.strategy_line, { type: type.toUpperCase() }) : type.toUpperCase()}\n`;
      for (const strategy of strategies[type]) report += `- ${strategy}\n`;
      report += '\n';
    }

    downloadText(report, `swot-report-${fileStem}.txt`);
  };

  const clearAll = () => {
    setState(EMPTY_STATE);
    setEditing(null);
    setShowStrategy(false);
    setConfirmClear(false);
  };

  const quadrants = [
    {
      key: 'strengths' as const,
      title: t.strengths || 'Strengths',
      desc: t.strengthsDesc,
      icon: TrendingUp,
      gradient: 'from-green-500 to-emerald-600',
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-300 dark:border-green-800',
      text: 'text-green-700 dark:text-green-300',
    },
    {
      key: 'weaknesses' as const,
      title: t.weaknesses || 'Weaknesses',
      desc: t.weaknessesDesc,
      icon: TrendingDown,
      gradient: 'from-red-500 to-rose-600',
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-300 dark:border-red-800',
      text: 'text-red-700 dark:text-red-300',
    },
    {
      key: 'opportunities' as const,
      title: t.opportunities || 'Opportunities',
      desc: t.opportunitiesDesc,
      icon: Target,
      gradient: 'from-blue-500 to-cyan-600',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-300 dark:border-blue-800',
      text: 'text-blue-700 dark:text-blue-300',
    },
    {
      key: 'threats' as const,
      title: t.threats || 'Threats',
      desc: t.threatsDesc,
      icon: AlertTriangle,
      gradient: 'from-orange-500 to-amber-600',
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      border: 'border-orange-300 dark:border-orange-800',
      text: 'text-orange-700 dark:text-orange-300',
    },
  ];

  const strategyCards = [
    { type: 'so' as const, title: t.soStrategies, desc: t.soDesc, gradient: 'from-green-500 to-blue-500' },
    { type: 'wo' as const, title: t.woStrategies, desc: t.woDesc, gradient: 'from-red-500 to-blue-500' },
    { type: 'st' as const, title: t.stStrategies, desc: t.stDesc, gradient: 'from-green-500 to-orange-500' },
    { type: 'wt' as const, title: t.wtStrategies, desc: t.wtDesc, gradient: 'from-red-500 to-orange-500' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <ToolHeader
          icon={BarChart3}
          title={t.title || 'SWOT Analysis'}
          subtitle={t.subtitle || 'Assess strengths, weaknesses, opportunities and threats'}
          variant="brand"
        />

        <div className="bg-card border border-border rounded-2xl shadow-xl p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="swot-project" className="block text-sm font-semibold mb-2">
                {t.projectName || 'Project Name'}
              </label>
              <input
                id="swot-project"
                type="text"
                value={state.projectName}
                onChange={(event) => setState((prev) => ({ ...prev, projectName: event.target.value }))}
                placeholder={t.projectNamePlaceholder || 'Project name...'}
                className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label htmlFor="swot-description" className="block text-sm font-semibold mb-2">
                {t.description || 'Description'}
              </label>
              <input
                id="swot-description"
                type="text"
                value={state.description}
                onChange={(event) => setState((prev) => ({ ...prev, description: event.target.value }))}
                placeholder={t.descriptionPlaceholder || 'Short description...'}
                className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setView((prev) => (prev === 'matrix' ? 'list' : 'matrix'))}
              className="px-4 py-2 rounded-lg bg-muted hover:opacity-80 transition-opacity flex items-center gap-2"
            >
              {view === 'matrix' ? <FileText className="w-4 h-4" aria-hidden="true" /> : <Grid3x3 className="w-4 h-4" aria-hidden="true" />}
              {view === 'matrix' ? t.listView || 'List View' : t.matrixView || 'Matrix View'}
            </button>

            <button
              onClick={() => setShowStrategy((prev) => !prev)}
              aria-pressed={showStrategy}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                showStrategy
                  ? 'bg-primary text-primary-foreground hover:bg-primary-hover'
                  : 'bg-primary-soft text-primary-soft-foreground hover:bg-primary/15'
              }`}
            >
              <Shield className="w-4 h-4" aria-hidden="true" />
              {showStrategy ? t.hideStrategies || 'Hide Strategies' : t.strategies || 'Strategies'}
            </button>

            <button
              onClick={() => setShowImport(true)}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover transition-colors flex items-center gap-2"
            >
              <Upload className="w-4 h-4" aria-hidden="true" />
              {t.import || 'Import'}
            </button>

            {totalItems > 0 && (
              <>
                <button
                  onClick={exportJSON}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" aria-hidden="true" />
                  {tc.json || 'JSON'}
                </button>
                <button
                  onClick={exportCSV}
                  className="px-4 py-2 rounded-lg bg-green-700 text-white hover:bg-green-800 transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" aria-hidden="true" />
                  {tc.csv || 'CSV'}
                </button>
                <button
                  onClick={exportReport}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover transition-colors flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" aria-hidden="true" />
                  {t.exportPdf || 'Export Report'}
                </button>
              </>
            )}

            {confirmClear ? (
              <span className="flex gap-1 ml-auto">
                <button onClick={clearAll} className="px-4 py-2 rounded-lg bg-red-600 text-white transition-colors">
                  {c.delete || 'Delete'}
                </button>
                <button onClick={() => setConfirmClear(false)} className="px-4 py-2 rounded-lg bg-muted transition-colors">
                  {c.cancel || 'Cancel'}
                </button>
              </span>
            ) : (
              <button
                onClick={() => setConfirmClear(true)}
                disabled={totalItems === 0 && !state.projectName && !state.description}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center gap-2 ml-auto disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" aria-hidden="true" />
                {t.clear || 'Clear All'}
              </button>
            )}
          </div>

          {totalItems > 0 && (
            <div className="mt-4 px-4 py-2 rounded-lg bg-primary/5 border border-primary/20 text-center">
              <span className="text-sm font-semibold text-primary">
                {t.totalLabel || 'Total:'} {totalItems} {t.itemsCount || 'items'}
              </span>
            </div>
          )}
        </div>

        <div className={view === 'matrix' ? 'grid md:grid-cols-2 gap-6 mb-6' : 'space-y-6 mb-6'}>
          {quadrants.map(({ key, title, desc, icon: Icon, gradient, bg, border, text }) => (
            <div key={key} className={`bg-card rounded-2xl shadow-xl overflow-hidden border-2 ${border}`}>
              <div className={`bg-gradient-to-r ${gradient} p-4`}>
                <div className="flex items-center gap-3">
                  <Icon className="w-6 h-6 text-white" aria-hidden="true" />
                  <div>
                    <h2 className="text-xl font-bold text-white">{title}</h2>
                    <p className="text-xs text-white/80">{desc}</p>
                  </div>
                </div>
              </div>

              <div className="p-4">
                <div className="flex gap-2 mb-4">
                  <label htmlFor={`swot-${key}`} className="sr-only">
                    {`${t.addItem || 'Add item'} — ${title}`}
                  </label>
                  <input
                    id={`swot-${key}`}
                    type="text"
                    value={newItem[key]}
                    onChange={(event) => setNewItem((prev) => ({ ...prev, [key]: event.target.value }))}
                    onKeyDown={(event) => event.key === 'Enter' && addItem(key)}
                    placeholder={`${t.addItem || 'Add item'}...`}
                    className="flex-1 px-3 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary outline-none text-sm"
                  />
                  <button
                    onClick={() => addItem(key)}
                    aria-label={`${t.addItem || 'Add item'} — ${title}`}
                    className={`px-4 py-2 rounded-lg bg-gradient-to-r ${gradient} text-white hover:shadow-lg transition-all flex items-center gap-2`}
                  >
                    <Plus className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {state.swot[key].length === 0 ? (
                    <div className={`${bg} rounded-lg p-8 text-center`}>
                      <p className={`${text} text-sm font-medium`}>{t.noItems || 'No items added yet'}</p>
                      <p className="text-xs text-muted-foreground mt-1">{t.clickToAdd || 'Click to add your first item'}</p>
                    </div>
                  ) : (
                    state.swot[key].map((item, index) => (
                      <div
                        key={`${index}-${item}`}
                        className={`${bg} rounded-lg p-3 border ${border} group hover:shadow-md transition-all`}
                      >
                        {editing?.quadrant === key && editing.index === index ? (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={editing.text}
                              onChange={(event) => setEditing((prev) => (prev ? { ...prev, text: event.target.value } : prev))}
                              onKeyDown={(event) => event.key === 'Enter' && saveEdit()}
                              aria-label={c.edit || 'Edit item'}
                              className="flex-1 px-2 py-1 rounded border border-border bg-background focus:ring-2 focus:ring-primary outline-none text-sm"
                              autoFocus
                            />
                            <button onClick={saveEdit} aria-label={c.save || 'Save'} className="p-1 rounded bg-green-500 text-white hover:bg-green-600">
                              <Save className="w-4 h-4" aria-hidden="true" />
                            </button>
                            <button onClick={() => setEditing(null)} aria-label={c.cancel || 'Cancel'} className="p-1 rounded bg-muted text-foreground hover:opacity-80">
                              <X className="w-4 h-4" aria-hidden="true" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between gap-2">
                            <p className={`${text} text-sm flex-1`}>{item}</p>
                            <div className="flex gap-1 opacity-60 sm:opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                              <button
                                onClick={() => setEditing({ quadrant: key, index, text: item })}
                                aria-label={`${c.edit || 'Edit'}: ${item}`}
                                className="p-1 rounded hover:bg-white/50 dark:hover:bg-slate-700"
                              >
                                <Edit2 className="w-3 h-3" aria-hidden="true" />
                              </button>
                              <button
                                onClick={() => removeItem(key, index)}
                                aria-label={`${c.delete || 'Delete'}: ${item}`}
                                className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30"
                              >
                                <Trash2 className="w-3 h-3 text-red-600" aria-hidden="true" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {showStrategy && totalItems > 0 && (
          <div className="bg-card border border-border rounded-2xl shadow-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-6 h-6 text-primary" aria-hidden="true" />
              <h2 className="text-2xl font-bold">{t.generateStrategies || 'Generate Strategic Recommendations'}</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {strategyCards.map(({ type, title, desc, gradient }) => (
                <div key={type} className="bg-muted/30 rounded-xl p-4 border border-border">
                  <div className={`inline-block bg-gradient-to-r ${gradient} text-white px-3 py-1 rounded-full text-xs font-bold mb-2`}>
                    {type.toUpperCase()}
                  </div>
                  <h3 className="font-bold mb-1">{title}</h3>
                  <p className="text-xs text-muted-foreground mb-3">{desc}</p>
                  <div className="space-y-2">
                    {strategies[type].length > 0 ? (
                      strategies[type].map((strategy, index) => (
                        <div key={index} className="bg-card rounded-lg p-2 text-sm border border-border">
                          {strategy}
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground italic">
                        {t.addItemsHint || 'Add items to generate strategies'}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <ImportDialog
          open={showImport}
          onClose={() => setShowImport(false)}
          onImport={importData}
          title={t.importData || 'Import'}
          description={t.importDesc || ''}
          cancelLabel={t.cancel || 'Cancel'}
          selectLabel={t.selectFile || 'Select file'}
          dragDropLabel={t.dragDrop || 'Drag & drop or click to choose a file'}
          supportedLabel={t.supportedFormats || 'JSON or CSV'}
        />
      </div>
    </div>
  );
};

export default SWOTMatrix;
