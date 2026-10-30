'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Clock, Plus, Trash2, ListChecks, BarChart3, Timer } from 'lucide-react';
import { usePersistentState } from '@/lib/tools/use-persistent-state';
import { createId } from '@/lib/tools/ids';
import { interpolate as tpl } from '@/lib/tools/template';
import { calculateStreak } from '@/lib/tools/streak';
import { breakMinutesFor, cycleProgress, isLongBreakDue } from '@/lib/tools/pomodoro';
import { localDateKey } from '@/lib/tools/date';
import { ToolHeader } from './shared/ToolHeader';

interface PomodoroTimerProps {
  lang: string;
  dict: any;
}

interface Task {
  id: number;
  text: string;
  completed: boolean;
}

interface SessionLog {
  date: string;
  workDuration: number;
  tasksCompleted: number;
}

interface TimerSettings {
  workMinutes: number;
  breakMinutes: number;
  longBreakMinutes: number;
  /** Completed work sessions, used for the 4-session long-break cadence. */
  sessionCount: number;
}

type Phase = 'work' | 'break';

interface TimerRuntime {
  phase: Phase;
  remaining: number;
  isActive: boolean;
  /** Absolute wall-clock deadline; null while paused/idle. */
  deadline: number | null;
}

const DEFAULT_SETTINGS: TimerSettings = {
  workMinutes: 25,
  breakMinutes: 5,
  longBreakMinutes: 15,
  sessionCount: 0,
};

const DEFAULT_RUNTIME: TimerRuntime = {
  phase: 'work',
  remaining: DEFAULT_SETTINGS.workMinutes * 60,
  isActive: false,
  deadline: null,
};

const MAX_MINUTES = 180;

function clampMinutes(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.min(MAX_MINUTES, Math.round(value)));
}

function validateSettings(raw: unknown): TimerSettings | null {
  if (!raw || typeof raw !== 'object') return null;
  const value = raw as Partial<TimerSettings>;
  if (
    typeof value.workMinutes !== 'number' ||
    typeof value.breakMinutes !== 'number' ||
    typeof value.longBreakMinutes !== 'number'
  ) {
    return null;
  }
  return {
    workMinutes: clampMinutes(value.workMinutes),
    breakMinutes: clampMinutes(value.breakMinutes),
    longBreakMinutes: clampMinutes(value.longBreakMinutes),
    sessionCount: typeof value.sessionCount === 'number' && value.sessionCount >= 0
      ? Math.floor(value.sessionCount)
      : 0,
  };
}

function validateRuntime(raw: unknown): TimerRuntime | null {
  if (!raw || typeof raw !== 'object') return null;
  const value = raw as Partial<TimerRuntime>;
  if (value.phase !== 'work' && value.phase !== 'break') return null;
  if (typeof value.remaining !== 'number' || !Number.isFinite(value.remaining)) return null;
  return {
    phase: value.phase,
    remaining: Math.max(0, value.remaining),
    isActive: Boolean(value.isActive),
    deadline: typeof value.deadline === 'number' && Number.isFinite(value.deadline) ? value.deadline : null,
  };
}

function validateTasks(raw: unknown): Task[] | null {
  if (!Array.isArray(raw)) return null;
  return raw
    .filter(
      (task): task is Task =>
        Boolean(task) &&
        typeof task === 'object' &&
        typeof (task as Task).id === 'number' &&
        typeof (task as Task).text === 'string'
    )
    .map((task) => ({ id: task.id, text: task.text, completed: Boolean(task.completed) }));
}

function validateLogs(raw: unknown): SessionLog[] | null {
  if (!Array.isArray(raw)) return null;
  return raw.filter(
    (log): log is SessionLog =>
      Boolean(log) &&
      typeof log === 'object' &&
      typeof (log as SessionLog).date === 'string' &&
      typeof (log as SessionLog).workDuration === 'number'
  );
}

const PomodoroTimer = ({ lang = 'en', dict = {} }: PomodoroTimerProps) => {
  const t = dict.tools?.pomodoro || {};
  const tc = dict.tools?.common || {};
  const c = dict.common || {};

  const [settings, setSettings, settingsReady] = usePersistentState<TimerSettings>(
    'mimir:tools:pomodoro_settings',
    DEFAULT_SETTINGS,
    validateSettings,
    { legacyKeys: [] }
  );
  const [runtime, setRuntime, runtimeReady] = usePersistentState<TimerRuntime>(
    'mimir:tools:pomodoro_runtime',
    DEFAULT_RUNTIME,
    validateRuntime
  );
  const [tasks, setTasks, tasksReady] = usePersistentState<Task[]>(
    'mimir:tools:pomodoro_tasks',
    [],
    validateTasks,
    { legacyKeys: ['pomodoro_tasks'] }
  );
  const [sessionLogs, setSessionLogs, logsReady] = usePersistentState<SessionLog[]>(
    'mimir:tools:pomodoro_logs',
    [],
    validateLogs,
    { legacyKeys: ['pomodoro_logs'] }
  );
  const [newTask, setNewTask] = useState('');
  const [activeTab, setActiveTab] = useState<'timer' | 'tasks' | 'stats'>('timer');
  const [now, setNow] = useState(() => Date.now());
  const finishedDeadline = useRef<number | null>(null);

  const ready = settingsReady && runtimeReady && tasksReady && logsReady;

  const phaseMinutes = useCallback(
    (phase: Phase, sessionCount: number): number => {
      if (phase === 'work') return settings.workMinutes;
      return breakMinutesFor(sessionCount, settings.breakMinutes, settings.longBreakMinutes);
    },
    [settings.workMinutes, settings.breakMinutes, settings.longBreakMinutes]
  );

  const totalSeconds = phaseMinutes(runtime.phase, settings.sessionCount) * 60;

  const finishPhase = useCallback(() => {
    const deadline = runtime.deadline;
    if (!deadline || finishedDeadline.current === deadline) return;
    finishedDeadline.current = deadline;

    if (runtime.phase === 'work') {
      const completedTasks = tasks.filter((task) => task.completed).length;
      setSessionLogs((prev) => [
        ...prev,
        {
          date: new Date().toISOString(),
          workDuration: settings.workMinutes,
          tasksCompleted: completedTasks,
        },
      ]);
      const nextCount = settings.sessionCount + 1;
      setSettings((prev) => ({ ...prev, sessionCount: nextCount }));
      setRuntime({
        phase: 'break',
        remaining: phaseMinutes('break', nextCount) * 60,
        isActive: false,
        deadline: null,
      });
    } else {
      setRuntime({
        phase: 'work',
        remaining: settings.workMinutes * 60,
        isActive: false,
        deadline: null,
      });
    }
  }, [phaseMinutes, runtime.deadline, runtime.phase, setRuntime, setSessionLogs, setSettings, settings.workMinutes, settings.sessionCount, tasks]);

  // Resume an interrupted session after a refresh, using the absolute deadline.
  useEffect(() => {
    if (!ready) return;
    if (!runtime.isActive && runtime.phase === 'work' && runtime.remaining === DEFAULT_RUNTIME.remaining) {
      // No saved runtime yet: align the idle clock with saved work settings.
      setRuntime((prev) => ({ ...prev, remaining: settings.workMinutes * 60 }));
      return;
    }
    if (!runtime.isActive || !runtime.deadline) return;
    const left = Math.max(0, Math.round((runtime.deadline - Date.now()) / 1000));
    if (left <= 0) finishPhase();
    else setRuntime((prev) => (prev.isActive ? { ...prev, remaining: left } : prev));
    // Only when hydration completes; the tick effect owns the rest.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // One interval keeps a local clock moving; the persisted state is *not*
  // rewritten every second. Remaining time is derived from the saved deadline.
  useEffect(() => {
    if (!runtime.isActive || !runtime.deadline) return;
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(interval);
  }, [runtime.isActive, runtime.deadline]);

  const displayRemaining =
    runtime.isActive && runtime.deadline
      ? Math.max(0, Math.round((runtime.deadline - now) / 1000))
      : runtime.remaining;

  useEffect(() => {
    if (runtime.isActive && runtime.deadline && displayRemaining <= 0) finishPhase();
  }, [runtime.isActive, runtime.deadline, displayRemaining, finishPhase]);

  const startTimer = () => {
    setRuntime((prev) => {
      if (prev.isActive) return prev;
      const remaining = prev.remaining > 0 ? prev.remaining : phaseMinutes(prev.phase, settings.sessionCount) * 60;
      return { ...prev, remaining, isActive: true, deadline: Date.now() + remaining * 1000 };
    });
  };

  const pauseTimer = () => {
    setRuntime((prev) => {
      if (!prev.isActive || !prev.deadline) return prev;
      const remaining = Math.max(0, Math.round((prev.deadline - Date.now()) / 1000));
      return { ...prev, remaining, isActive: false, deadline: null };
    });
  };

  const resetTimer = () => {
    finishedDeadline.current = null;
    setSettings((prev) => ({ ...prev, sessionCount: 0 }));
    setRuntime({ phase: 'work', remaining: settings.workMinutes * 60, isActive: false, deadline: null });
  };

  const updateMinutes = (key: 'workMinutes' | 'breakMinutes' | 'longBreakMinutes', raw: string) => {
    const minutes = clampMinutes(Number(raw));
    setSettings((prev) => ({ ...prev, [key]: minutes }));
    if (!runtime.isActive && key === 'workMinutes' && runtime.phase === 'work') {
      setRuntime((prev) => ({ ...prev, remaining: minutes * 60 }));
    }
  };

  const formatTime = (seconds: number) => {
    const safe = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
    const minutes = Math.floor(safe / 60);
    const rest = safe % 60;
    return `${minutes.toString().padStart(2, '0')}:${rest.toString().padStart(2, '0')}`;
  };

  const addTask = () => {
    if (newTask.trim()) {
      setTasks((prev) => [...prev, { id: createId(), text: newTask.trim(), completed: false }]);
      setNewTask('');
    }
  };

  const toggleTask = (id: number) => {
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task)));
  };

  const removeTask = (id: number) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  const totalFocusMinutes = sessionLogs.reduce((sum, log) => sum + log.workDuration, 0);
  const todayKey = localDateKey();
  const todayLogs = useMemo(
    () => sessionLogs.filter((log) => localDateKey(new Date(log.date)) === todayKey),
    [sessionLogs, todayKey]
  );
  const streak = useMemo(
    () => calculateStreak(sessionLogs.map((log) => localDateKey(new Date(log.date)))),
    [sessionLogs]
  );

  const progress = totalSeconds > 0 ? (displayRemaining / totalSeconds) * 100 : 0;
  const isLongBreak = isLongBreakDue(settings.sessionCount);
  const cycleDots = cycleProgress(settings.sessionCount);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <ToolHeader
          icon={Timer}
          title={t.title || 'Pomodoro Study Timer'}
          subtitle={t.subtitle || 'Focus on what matters, one interval at a time'}
          gradient="from-blue-600 to-cyan-600"
        />

        <div className="flex gap-2 mb-6 justify-center overflow-x-auto" role="tablist" aria-label={t.title || 'Pomodoro'}>
          {([
            { id: 'timer', label: t.tab_timer || 'Timer', Icon: Timer },
            { id: 'tasks', label: t.tab_tasks || 'Tasks', Icon: ListChecks },
            { id: 'stats', label: tc.stats || 'Stats', Icon: BarChart3 },
          ] as const).map(({ id, label, Icon }) => (
            <button
              key={id}
              role="tab"
              aria-selected={activeTab === id}
              onClick={() => setActiveTab(id)}
              className={`px-5 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                activeTab === id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-card border border-border text-foreground hover:bg-muted'
              }`}
            >
              <Icon className="w-4 h-4 inline mr-2" aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'timer' && (
          <div className="bg-card border border-border rounded-2xl shadow-xl p-6 sm:p-8 mb-6" role="tabpanel">
            <div className="text-center mb-6">
              <span
                className={`inline-block px-4 py-1 rounded-full text-sm font-medium ${
                  runtime.phase === 'break'
                    ? 'bg-success-soft text-success-foreground'
                    : 'bg-primary-soft text-primary-soft-foreground'
                }`}
              >
                {runtime.phase === 'break'
                  ? isLongBreak
                    ? t.status_long_break || 'Long Break'
                    : t.status_break || 'Break Time'
                  : t.status_focus || 'Focus Time'}
              </span>
              {runtime.phase === 'work' && settings.sessionCount > 0 && (
                <span className="ml-2 text-sm text-muted-foreground">
                  {tpl(t.session_number || 'Session #{n}', { n: settings.sessionCount + 1 })}
                </span>
              )}
            </div>

            <div className="relative w-56 h-56 sm:w-64 sm:h-64 mx-auto mb-8">
              <svg
                className="w-full h-full -rotate-90"
                viewBox="0 0 100 100"
                role="img"
                aria-label={`${formatTime(displayRemaining)} ${runtime.phase === 'break' ? (t.mode_break || 'Break') : (t.mode_work || 'Work')}`}
              >
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="6" className="text-muted" />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke={runtime.phase === 'break' ? '#10b981' : '#3b82f6'}
                  strokeWidth="6"
                  strokeDasharray={`${Math.max(0, Math.min(100, progress)) * 2.827} 282.7`}
                  strokeLinecap="round"
                  className="transition-all duration-300"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-bold tabular-nums" aria-live="off">
                  {formatTime(displayRemaining)}
                </span>
                <span className="text-sm text-muted-foreground mt-2">
                  {runtime.phase === 'break' ? t.mode_break || 'Break' : t.mode_work || 'Work'}
                </span>
              </div>
            </div>

            <div className="flex justify-center gap-3 mb-6">
              {!runtime.isActive ? (
                <button
                  onClick={startTimer}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <Play className="w-5 h-5" aria-hidden="true" /> {tc.start || 'Start'}
                </button>
              ) : (
                <button
                  onClick={pauseTimer}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <Pause className="w-5 h-5" aria-hidden="true" /> {tc.pause || 'Pause'}
                </button>
              )}
              <button
                onClick={resetTimer}
                className="px-6 py-3 rounded-xl bg-muted text-foreground font-semibold hover:opacity-80 transition-all flex items-center gap-2"
              >
                <RotateCcw className="w-5 h-5" aria-hidden="true" /> {tc.reset || 'Reset'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto">
              {([
                { key: 'workMinutes', value: settings.workMinutes, label: t.work_min || 'Work (min)' },
                { key: 'breakMinutes', value: settings.breakMinutes, label: t.break_min || 'Break (min)' },
                { key: 'longBreakMinutes', value: settings.longBreakMinutes, label: t.long_min || 'Long (min)' },
              ] as const).map(({ key, value, label }) => (
                <div key={key}>
                  <label htmlFor={`pomodoro-${key}`} className="block text-xs text-muted-foreground mb-1 text-center">
                    {label}
                  </label>
                  <input
                    id={`pomodoro-${key}`}
                    type="number"
                    min={1}
                    max={MAX_MINUTES}
                    value={value}
                    onChange={(event) => updateMinutes(key, event.target.value)}
                    disabled={runtime.isActive}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-center font-semibold focus:ring-2 focus:ring-primary outline-none disabled:opacity-50"
                  />
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-center gap-2" aria-hidden="true">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full ${index < cycleDots ? 'bg-blue-500' : 'bg-muted'}`}
                />
              ))}
              <span className="text-xs text-muted-foreground ml-2">
                {tpl(t.sessions_count || '({n} sessions)', { n: settings.sessionCount })}
              </span>
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="bg-card border border-border rounded-2xl shadow-xl p-6 mb-6" role="tabpanel">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-blue-600" aria-hidden="true" />
              {t.session_tasks || 'Session Tasks'}
            </h2>

            <div className="flex gap-2 mb-4">
              <label htmlFor="pomodoro-new-task" className="sr-only">
                {t.task_placeholder || 'Add a task for this session...'}
              </label>
              <input
                id="pomodoro-new-task"
                type="text"
                value={newTask}
                onChange={(event) => setNewTask(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && addTask()}
                placeholder={t.task_placeholder || 'Add a task for this session...'}
                className="flex-1 px-4 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary outline-none"
              />
              <button
                onClick={addTask}
                aria-label={tc.add || 'Add'}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover transition-colors"
              >
                <Plus className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-2">
              {tasks.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {t.no_tasks || 'No tasks yet. Add tasks for your study session!'}
                </p>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 group hover:bg-muted transition-colors"
                  >
                    <input
                      id={`pomodoro-task-${task.id}`}
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTask(task.id)}
                      className="w-5 h-5 rounded border-border text-blue-600 focus:ring-primary"
                    />
                    <label
                      htmlFor={`pomodoro-task-${task.id}`}
                      className={`flex-1 cursor-pointer ${task.completed ? 'line-through text-muted-foreground' : ''}`}
                    >
                      {task.text}
                    </label>
                    <button
                      onClick={() => removeTask(task.id)}
                      aria-label={`${t.delete || 'Delete'}: ${task.text}`}
                      className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/40 focus-visible:opacity-100 transition-all opacity-60 sm:opacity-0 sm:group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" aria-hidden="true" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {tasks.filter((task) => task.completed).length > 0 && (
              <div className="mt-4 p-3 rounded-lg bg-success-soft text-success-foreground text-sm text-center">
                {tpl(t.tasks_completed || '{done}/{total} tasks completed', {
                  done: tasks.filter((task) => task.completed).length,
                  total: tasks.length,
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="bg-card border border-border rounded-2xl shadow-xl p-6 mb-6" role="tabpanel">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" aria-hidden="true" />
                {t.statistics || 'Statistics'}
              </h2>
              {sessionLogs.length > 0 && (
                <button
                  onClick={() => setSessionLogs([])}
                  className="text-sm text-red-500 hover:text-red-700 transition-colors"
                >
                  {t.clear_history || 'Clear History'}
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
                <div className="text-xs text-muted-foreground mb-1">{t.total_sessions || 'Total Sessions'}</div>
                <div className="text-2xl font-bold text-primary">{sessionLogs.length}</div>
              </div>
              <div className="bg-success/10 rounded-xl p-4 border border-success/20">
                <div className="text-xs text-muted-foreground mb-1">{t.status_focus || 'Focus Time'}</div>
                <div className="text-2xl font-bold text-success-foreground">
                  {Math.floor(totalFocusMinutes / 60)}h {totalFocusMinutes % 60}m
                </div>
              </div>
              <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
                <div className="text-xs text-muted-foreground mb-1">{tc.today || 'Today'}</div>
                <div className="text-2xl font-bold text-primary">
                  {tpl(t.sessions_short || '{n} sess', { n: todayLogs.length })}
                </div>
              </div>
              <div className="bg-warning/10 rounded-xl p-4 border border-warning/20">
                <div className="text-xs text-muted-foreground mb-1">{t.day_streak || 'Day Streak'}</div>
                <div className="text-2xl font-bold text-warning-foreground">{tpl(t.days || '{n} days', { n: streak })}</div>
              </div>
            </div>

            {sessionLogs.length > 0 ? (
              <div className="max-h-60 overflow-y-auto">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  {t.recent_sessions || 'Recent Sessions'}
                </h3>
                <div className="space-y-2">
                  {[...sessionLogs].reverse().slice(0, 20).map((log, index) => (
                    <div
                      key={`${log.date}-${index}`}
                      className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-lg bg-muted/50 text-sm"
                    >
                      <span className="text-muted-foreground">
                        {new Date(log.date).toLocaleDateString(lang)}{' '}
                        {new Date(log.date).toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="flex gap-4">
                        <span className="text-blue-600 font-medium">
                          {tpl(t.minutes_short || '{n}m', { n: log.workDuration })}
                        </span>
                        <span className="text-success-foreground font-medium">
                          {tpl(t.tasks_short || '{n} tasks', { n: log.tasksCompleted })}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" aria-hidden="true" />
                <p>{t.no_sessions || 'No sessions completed yet'}</p>
                <p className="text-sm">{t.no_sessions_hint || 'Start the timer to build your study history!'}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PomodoroTimer;
