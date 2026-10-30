'use client'

import React, { useState } from 'react';
import { Clock, Zap, Calendar, Trash2, Plus, Edit2, Save, X, Download, CheckCircle2, Circle, Grid3x3, List, Upload } from 'lucide-react';
import { type Locale } from '@/lib/i18n/config';
import { usePersistentState } from '@/lib/tools/use-persistent-state';
import { createId } from '@/lib/tools/ids';
import { csvToRecords, toCsv } from '@/lib/tools/csv';
import { downloadCsv, downloadJson } from '@/lib/tools/download';
import { ToolHeader } from './shared/ToolHeader';
import { ImportDialog } from './shared/ImportDialog';

interface EisenhowerMatrixProps {
  lang: Locale;
  dict: any;
}

type QuadrantKey = 'doFirst' | 'schedule' | 'delegate' | 'eliminate';

interface Task {
  id: number;
  text: string;
  completed: boolean;
  createdAt: string;
}

type TaskBoard = Record<QuadrantKey, Task[]>;

const QUADRANT_KEYS: QuadrantKey[] = ['doFirst', 'schedule', 'delegate', 'eliminate'];

const EMPTY_BOARD: TaskBoard = {
  doFirst: [],
  schedule: [],
  delegate: [],
  eliminate: [],
};

function isQuadrantKey(value: unknown): value is QuadrantKey {
  return typeof value === 'string' && (QUADRANT_KEYS as string[]).includes(value);
}

function validateBoard(raw: unknown): TaskBoard | null {
  if (!raw || typeof raw !== 'object') return null;
  const source = raw as Partial<TaskBoard>;
  const board: TaskBoard = { doFirst: [], schedule: [], delegate: [], eliminate: [] };
  let found = false;
  for (const quadrant of QUADRANT_KEYS) {
    const list = source[quadrant];
    if (!Array.isArray(list)) continue;
    found = true;
    board[quadrant] = list
      .filter(
        (task): task is Task =>
          Boolean(task) &&
          typeof task === 'object' &&
          typeof (task as Task).id === 'number' &&
          typeof (task as Task).text === 'string'
      )
      .map((task) => ({
        id: task.id,
        text: task.text,
        completed: Boolean(task.completed),
        createdAt: typeof task.createdAt === 'string' ? task.createdAt : new Date().toISOString(),
      }));
  }
  return found ? board : null;
}

const EisenhowerMatrix = ({ dict = {} }: EisenhowerMatrixProps) => {
  const t = dict.tools?.eisenhower_matrix || {};
  const tc = dict.tools?.common || {};
  const c = dict.common || {};

  const [tasks, setTasks] = usePersistentState<TaskBoard>(
    'mimir:tools:eisenhower_matrix',
    EMPTY_BOARD,
    validateBoard
  );
  const [newTask, setNewTask] = useState<Record<QuadrantKey, string>>({
    doFirst: '',
    schedule: '',
    delegate: '',
    eliminate: '',
  });
  const [editing, setEditing] = useState<{ quadrant: QuadrantKey; id: number; text: string; target: QuadrantKey } | null>(null);
  const [view, setView] = useState<'matrix' | 'list'>('matrix');
  const [showCompleted, setShowCompleted] = useState(true);
  const [showImport, setShowImport] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const quadrants = [
    {
      key: 'doFirst' as const,
      title: t.doFirst || 'Do First',
      desc: t.doFirstDesc,
      explain: t.doFirstExplain,
      icon: Zap,
      gradient: 'from-red-500 to-rose-600',
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-300 dark:border-red-800',
      text: 'text-red-700 dark:text-red-300',
      badge: 'bg-red-500',
    },
    {
      key: 'schedule' as const,
      title: t.schedule || 'Schedule',
      desc: t.scheduleDesc,
      explain: t.scheduleExplain,
      icon: Calendar,
      gradient: 'from-blue-500 to-cyan-600',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-300 dark:border-blue-800',
      text: 'text-blue-700 dark:text-blue-300',
      badge: 'bg-blue-500',
    },
    {
      key: 'delegate' as const,
      title: t.delegate || 'Delegate',
      desc: t.delegateDesc,
      explain: t.delegateExplain,
      icon: Clock,
      gradient: 'from-amber-500 to-yellow-600',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      border: 'border-amber-300 dark:border-amber-800',
      text: 'text-amber-700 dark:text-amber-300',
      badge: 'bg-amber-500',
    },
    {
      key: 'eliminate' as const,
      title: t.eliminate || 'Eliminate',
      desc: t.eliminateDesc,
      explain: t.eliminateExplain,
      icon: Trash2,
      gradient: 'from-slate-500 to-slate-600',
      bg: 'bg-slate-50 dark:bg-slate-800/60',
      border: 'border-slate-300 dark:border-slate-700',
      text: 'text-slate-700 dark:text-slate-300',
      badge: 'bg-slate-500',
    },
  ];

  const addTask = (quadrant: QuadrantKey) => {
    const text = newTask[quadrant].trim();
    if (!text) return;
    const task: Task = { id: createId(), text, completed: false, createdAt: new Date().toISOString() };
    setTasks((prev) => ({ ...prev, [quadrant]: [...prev[quadrant], task] }));
    setNewTask((prev) => ({ ...prev, [quadrant]: '' }));
  };

  const removeTask = (quadrant: QuadrantKey, id: number) => {
    setTasks((prev) => ({ ...prev, [quadrant]: prev[quadrant].filter((task) => task.id !== id) }));
  };

  const toggleComplete = (quadrant: QuadrantKey, id: number) => {
    setTasks((prev) => ({
      ...prev,
      [quadrant]: prev[quadrant].map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      ),
    }));
  };

  const saveEdit = () => {
    if (!editing || !editing.text.trim()) {
      setEditing(null);
      return;
    }
    const { quadrant, id, text, target } = editing;
    setTasks((prev) => {
      const current = prev[quadrant].find((task) => task.id === id);
      if (!current) return prev;
      const updated = { ...current, text: text.trim() };
      if (quadrant === target) {
        return { ...prev, [quadrant]: prev[quadrant].map((task) => (task.id === id ? updated : task)) };
      }
      return {
        ...prev,
        [quadrant]: prev[quadrant].filter((task) => task.id !== id),
        [target]: [...prev[target], updated],
      };
    });
    setEditing(null);
  };

  const clearAll = () => {
    setTasks(EMPTY_BOARD);
    setConfirmClear(false);
  };

  const importData = (content: string, filename: string): string | null => {
    const board: TaskBoard = { doFirst: [], schedule: [], delegate: [], eliminate: [] };

    try {
      if (filename.toLowerCase().endsWith('.json')) {
        const data = JSON.parse(content) as { tasks?: unknown };
        if (!Array.isArray(data.tasks)) return t.importError || 'Invalid import file';
        for (const item of data.tasks) {
          if (!item || typeof item !== 'object') continue;
          const record = item as Record<string, unknown>;
          if (!isQuadrantKey(record.quadrant) || typeof record.task !== 'string') continue;
          board[record.quadrant].push({
            id: createId(),
            text: record.task,
            completed: record.completed === true,
            createdAt: typeof record.createdAt === 'string' ? record.createdAt : new Date().toISOString(),
          });
        }
      } else if (filename.toLowerCase().endsWith('.csv')) {
        for (const record of csvToRecords(content)) {
          const quadrant = record.quadrant;
          if (!isQuadrantKey(quadrant) || !record.task) continue;
          board[quadrant].push({
            id: createId(),
            text: record.task,
            completed: record.completed?.toLowerCase() === 'true',
            createdAt: record['created at'] || new Date().toISOString(),
          });
        }
      } else {
        return t.importError || 'Invalid import file';
      }

      const total = QUADRANT_KEYS.reduce((sum, key) => sum + board[key].length, 0);
      if (total === 0) return t.importError || 'Invalid import file';
      setTasks(board);
      return null;
    } catch {
      return t.importError || 'Invalid import file';
    }
  };

  const exportJSON = () => {
    const allTasks = QUADRANT_KEYS.flatMap((quadrant) =>
      tasks[quadrant].map((task) => ({ quadrant, task: task.text, completed: task.completed, createdAt: task.createdAt }))
    );
    downloadJson({ tasks: allTasks, exportedAt: new Date().toISOString() }, 'eisenhower-matrix.json');
  };

  const exportCSV = () => {
    const rows: Array<Array<string | boolean>> = [['Quadrant', 'Task', 'Completed', 'Created At']];
    for (const quadrant of QUADRANT_KEYS) {
      for (const task of tasks[quadrant]) {
        rows.push([quadrant, task.text, task.completed, task.createdAt]);
      }
    }
    downloadCsv(toCsv(rows), 'eisenhower-matrix.csv');
  };

  const totalTasks = QUADRANT_KEYS.reduce((sum, key) => sum + tasks[key].length, 0);
  const completedTasks = QUADRANT_KEYS.reduce(
    (sum, key) => sum + tasks[key].filter((task) => task.completed).length,
    0
  );
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const visibleTasks = (list: Task[]) => (showCompleted ? list : list.filter((task) => !task.completed));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <ToolHeader
          icon={Grid3x3}
          title={t.title || 'Eisenhower Matrix'}
          subtitle={t.subtitle || 'Prioritise by urgency and importance'}
          variant="brand"
        />

        <div className="bg-card border border-border rounded-2xl shadow-xl p-6 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
              <div className="text-sm text-muted-foreground mb-1">{t.totalTasks || 'Total Tasks'}</div>
              <div className="text-2xl font-bold text-primary">{totalTasks}</div>
            </div>
            <div className="bg-success/10 rounded-xl p-4 border border-success/20">
              <div className="text-sm text-muted-foreground mb-1">{t.completed || 'Completed'}</div>
              <div className="text-2xl font-bold text-success-foreground">{completedTasks}</div>
            </div>
            <div className="bg-warning/10 rounded-xl p-4 border border-warning/20">
              <div className="text-sm text-muted-foreground mb-1">{t.pending || 'Pending'}</div>
              <div className="text-2xl font-bold text-warning-foreground">{totalTasks - completedTasks}</div>
            </div>
            <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
              <div className="text-sm text-muted-foreground mb-1">{t.completionRate || 'Completion Rate'}</div>
              <div className="text-2xl font-bold text-primary">{completionRate}%</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setView((prev) => (prev === 'matrix' ? 'list' : 'matrix'))}
              className="px-4 py-2 rounded-lg bg-muted hover:opacity-80 transition-opacity flex items-center gap-2"
            >
              {view === 'matrix' ? <List className="w-4 h-4" aria-hidden="true" /> : <Grid3x3 className="w-4 h-4" aria-hidden="true" />}
              {view === 'matrix' ? t.listView || 'List View' : t.matrixView || 'Matrix View'}
            </button>

            <button
              onClick={() => setShowCompleted((prev) => !prev)}
              aria-pressed={!showCompleted}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                showCompleted ? 'bg-muted text-foreground' : 'bg-success-soft text-success-foreground'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              {showCompleted ? t.hideCompleted || 'Hide Completed' : t.showCompleted || 'Show Completed'}
            </button>

            {totalTasks > 0 && (
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
              </>
            )}

            <button
              onClick={() => setShowImport(true)}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover transition-colors flex items-center gap-2"
            >
              <Upload className="w-4 h-4" aria-hidden="true" />
              {t.import || 'Import'}
            </button>

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
                disabled={totalTasks === 0}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center gap-2 ml-auto disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" aria-hidden="true" />
                {t.clear || 'Clear All'}
              </button>
            )}
          </div>
        </div>

        {view === 'matrix' && (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <div className="inline-block px-4 py-2 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-bold text-sm">
                {t.urgent || 'URGENT'}
              </div>
            </div>
            <div className="text-center">
              <div className="inline-block px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm">
                {t.notUrgent || 'NOT URGENT'}
              </div>
            </div>
          </div>
        )}

        <div className={view === 'matrix' ? 'grid md:grid-cols-2 gap-6 relative' : 'space-y-6'}>
          {view === 'matrix' && (
            <>
              <div className="absolute -left-24 top-1/4 hidden lg:block" aria-hidden="true">
                <div className="-rotate-90 px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-bold text-sm whitespace-nowrap">
                  {t.important || 'IMPORTANT'}
                </div>
              </div>
              <div className="absolute -left-24 bottom-1/4 hidden lg:block" aria-hidden="true">
                <div className="-rotate-90 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm whitespace-nowrap">
                  {t.notImportant || 'NOT IMPORTANT'}
                </div>
              </div>
            </>
          )}

          {quadrants.map(({ key, title, desc, explain, icon: Icon, gradient, bg, border, text, badge }) => (
            <div key={key} className={`bg-card rounded-2xl shadow-xl overflow-hidden border-2 ${border}`}>
              <div className={`bg-gradient-to-r ${gradient} p-4`}>
                <div className="flex items-center gap-3">
                  <Icon className="w-6 h-6 text-white" aria-hidden="true" />
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-white">{title}</h2>
                    <p className="text-xs text-white/80">{desc}</p>
                  </div>
                  <div className={`${badge} text-white px-3 py-1 rounded-full text-xs font-bold`}>
                    {tasks[key].length}
                  </div>
                </div>
                <p className="text-xs text-white/70 mt-2">{explain}</p>
              </div>

              <div className="p-4">
                <div className="flex gap-2 mb-4">
                  <label htmlFor={`eisenhower-${key}`} className="sr-only">
                    {`${t.addTask || 'Add task'} — ${title}`}
                  </label>
                  <input
                    id={`eisenhower-${key}`}
                    type="text"
                    value={newTask[key]}
                    onChange={(event) => setNewTask((prev) => ({ ...prev, [key]: event.target.value }))}
                    onKeyDown={(event) => event.key === 'Enter' && addTask(key)}
                    placeholder={`${t.addTask || 'Add task'}...`}
                    className="flex-1 px-3 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary outline-none text-sm"
                  />
                  <button
                    onClick={() => addTask(key)}
                    aria-label={`${t.addTask || 'Add task'} — ${title}`}
                    className={`px-4 py-2 rounded-lg bg-gradient-to-r ${gradient} text-white hover:shadow-lg transition-all flex items-center gap-2`}
                  >
                    <Plus className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>

                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {visibleTasks(tasks[key]).length === 0 ? (
                    <div className={`${bg} rounded-lg p-8 text-center`}>
                      <p className={`${text} text-sm font-medium`}>{t.noTasks || 'No tasks yet'}</p>
                      <p className="text-xs text-muted-foreground mt-1">{t.clickToAdd || 'Add your first task'}</p>
                    </div>
                  ) : (
                    visibleTasks(tasks[key]).map((task) => (
                      <div
                        key={task.id}
                        className={`${bg} rounded-lg p-3 border ${border} group hover:shadow-md transition-all ${
                          task.completed ? 'opacity-70' : ''
                        }`}
                      >
                        {editing?.quadrant === key && editing.id === task.id ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editing.text}
                              onChange={(event) => setEditing((prev) => (prev ? { ...prev, text: event.target.value } : prev))}
                              onKeyDown={(event) => event.key === 'Enter' && saveEdit()}
                              aria-label={c.edit || 'Edit task'}
                              className="w-full px-2 py-1 rounded border border-border bg-background focus:ring-2 focus:ring-primary outline-none text-sm"
                              autoFocus
                            />
                            <label className="flex items-center gap-2 text-xs text-muted-foreground">
                              {t.moveTo || 'Move to'}
                              <select
                                value={editing.target}
                                onChange={(event) =>
                                  setEditing((prev) =>
                                    prev ? { ...prev, target: event.target.value as QuadrantKey } : prev
                                  )
                                }
                                className="flex-1 px-2 py-1 rounded border border-border bg-background"
                              >
                                {quadrants.map((quadrant) => (
                                  <option key={quadrant.key} value={quadrant.key}>
                                    {quadrant.title}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <div className="flex gap-2">
                              <button onClick={saveEdit} className="p-1 rounded bg-green-500 text-white hover:bg-green-600" aria-label={c.save || 'Save'}>
                                <Save className="w-4 h-4" aria-hidden="true" />
                              </button>
                              <button onClick={() => setEditing(null)} className="p-1 rounded bg-muted text-foreground hover:opacity-80" aria-label={c.cancel || 'Cancel'}>
                                <X className="w-4 h-4" aria-hidden="true" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start gap-2">
                            <button
                              onClick={() => toggleComplete(key, task.id)}
                              aria-pressed={task.completed}
                              aria-label={`${task.completed ? t.completed || 'Completed' : t.pending || 'Pending'}: ${task.text}`}
                              className="mt-0.5 flex-shrink-0"
                            >
                              {task.completed ? (
                                <CheckCircle2 className="w-5 h-5 text-green-500" aria-hidden="true" />
                              ) : (
                                <Circle className="w-5 h-5 text-muted-foreground hover:text-foreground" aria-hidden="true" />
                              )}
                            </button>
                            <p className={`${text} text-sm flex-1 ${task.completed ? 'line-through' : ''}`}>{task.text}</p>
                            <div className="flex gap-1 opacity-60 sm:opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                              <button
                                onClick={() => setEditing({ quadrant: key, id: task.id, text: task.text, target: key })}
                                aria-label={`${c.edit || 'Edit'}: ${task.text}`}
                                className="p-1 rounded hover:bg-white/50 dark:hover:bg-slate-700"
                              >
                                <Edit2 className="w-3 h-3" aria-hidden="true" />
                              </button>
                              <button
                                onClick={() => removeTask(key, task.id)}
                                aria-label={`${c.delete || 'Delete'}: ${task.text}`}
                                className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/40"
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

export default EisenhowerMatrix;
