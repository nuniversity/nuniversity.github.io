'use client'

import React, { useMemo, useState } from 'react';
import { Plus, Trash2, Check, Calendar, Flame, BarChart3, Target } from 'lucide-react';
import { usePersistentState } from '@/lib/tools/use-persistent-state';
import { createId } from '@/lib/tools/ids';
import { interpolate as tpl } from '@/lib/tools/template';
import { calculateStreak } from '@/lib/tools/streak';
import { daysSince, localDateKey } from '@/lib/tools/date';
import { ToolHeader } from './shared/ToolHeader';

interface Habit {
  id: number;
  name: string;
  color: string;
  frequency: 'daily' | 'weekdays' | 'weekly';
  created: number;
}

interface HabitLog {
  habitId: number;
  date: string;
  completed: boolean;
}

interface HabitTrackerProps {
  lang: string;
  dict: any;
}

interface HabitStats extends Habit {
  total: number;
  currentStreak: number;
  bestStreak: number;
  rate: number | null;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

function validateHabits(raw: unknown): Habit[] | null {
  if (!Array.isArray(raw)) return null;
  return raw
    .filter(
      (habit): habit is Habit =>
        Boolean(habit) &&
        typeof habit === 'object' &&
        typeof (habit as Habit).id === 'number' &&
        typeof (habit as Habit).name === 'string'
    )
    .map((habit) => ({
      id: habit.id,
      name: habit.name,
      color: typeof habit.color === 'string' ? habit.color : COLORS[0],
      frequency:
        habit.frequency === 'weekdays' || habit.frequency === 'weekly' ? habit.frequency : 'daily',
      created: typeof habit.created === 'number' ? habit.created : Date.now(),
    }));
}

function validateLogs(raw: unknown): HabitLog[] | null {
  if (!Array.isArray(raw)) return null;
  return raw
    .filter(
      (log): log is HabitLog =>
        Boolean(log) &&
        typeof log === 'object' &&
        typeof (log as HabitLog).habitId === 'number' &&
        typeof (log as HabitLog).date === 'string'
    )
    .map((log) => ({ habitId: log.habitId, date: log.date, completed: log.completed !== false }));
}

/** Longest run of consecutive days in a sorted-unique list of date keys. */
function bestStreakFor(dates: string[]): number {
  const sorted = Array.from(new Set(dates)).sort();
  let best = 0;
  let run = 0;
  let previous: Date | null = null;
  for (const key of sorted) {
    const [year, month, day] = key.split('-').map(Number);
    const current = new Date(year, month - 1, day);
    if (previous && Math.round((current.getTime() - previous.getTime()) / 86_400_000) === 1) {
      run += 1;
    } else {
      run = 1;
    }
    best = Math.max(best, run);
    previous = current;
  }
  return best;
}

const HabitTracker = ({ lang = 'en', dict = {} }: HabitTrackerProps) => {
  const t = dict.tools?.habit_tracker || {};
  const tc = dict.tools?.common || {};
  const c = dict.common || {};

  const [habits, setHabits] = usePersistentState<Habit[]>(
    'mimir:tools:habits',
    [],
    validateHabits,
    { legacyKeys: ['habits'] }
  );
  const [logs, setLogs] = usePersistentState<HabitLog[]>(
    'mimir:tools:habit_logs',
    [],
    validateLogs,
    { legacyKeys: ['habit_logs'] }
  );
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitFreq, setNewHabitFreq] = useState<Habit['frequency']>('daily');
  const [viewDate, setViewDate] = useState(new Date());
  const [pendingDelete, setPendingDelete] = useState<number | null>(null);

  const today = localDateKey();

  /** habitId -> set of completed local date keys. */
  const completionIndex = useMemo(() => {
    const index = new Map<number, Set<string>>();
    for (const log of logs) {
      if (!log.completed) continue;
      const set = index.get(log.habitId) ?? new Set<string>();
      set.add(log.date);
      index.set(log.habitId, set);
    }
    return index;
  }, [logs]);

  const isCompleted = (habitId: number, date: string): boolean =>
    completionIndex.get(habitId)?.has(date) ?? false;

  const addHabit = () => {
    if (!newHabitName.trim()) return;
    const habit: Habit = {
      id: createId(),
      name: newHabitName.trim(),
      color: COLORS[habits.length % COLORS.length],
      frequency: newHabitFreq,
      created: Date.now(),
    };
    setHabits((prev) => [...prev, habit]);
    setNewHabitName('');
  };

  const removeHabit = (id: number) => {
    setHabits((prev) => prev.filter((habit) => habit.id !== id));
    setLogs((prev) => prev.filter((log) => log.habitId !== id));
    setPendingDelete(null);
  };

  const toggleLog = (habitId: number, date: string) => {
    if (date > today) return;
    setLogs((prev) => {
      const existing = prev.find((log) => log.habitId === habitId && log.date === date);
      if (existing) {
        return prev.filter((log) => !(log.habitId === habitId && log.date === date));
      }
      return [...prev, { habitId, date, completed: true }];
    });
  };

  const getWeekDays = (date: Date) => {
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay());
    const days: Date[] = [];
    for (let i = 0; i < 7; i += 1) {
      days.push(new Date(start));
      start.setDate(start.getDate() + 1);
    }
    return days;
  };

  const getMonthDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Date[] = [];
    const startPad = firstDay.getDay();
    for (let i = 0; i < startPad; i += 1) {
      days.push(new Date(year, month, -startPad + i + 1));
    }
    for (let i = 1; i <= lastDay.getDate(); i += 1) {
      days.push(new Date(year, month, i));
    }
    while (days.length < 42) {
      days.push(new Date(year, month + 1, days.length - lastDay.getDate() - startPad + 1));
    }
    return days;
  };

  const weekDays = getWeekDays(viewDate);
  const monthDays = getMonthDays(viewDate);

  const stats = useMemo<HabitStats[]>(() => {
    return habits.map((habit) => {
      const dates = Array.from(completionIndex.get(habit.id) ?? []);
      const total = dates.length;
      const elapsed = Math.max(1, daysSince(habit.created) + 1);
      const rate = habit.frequency === 'daily' ? Math.min(100, Math.round((total / elapsed) * 100)) : null;
      return {
        ...habit,
        total,
        currentStreak: calculateStreak(dates),
        bestStreak: bestStreakFor(dates),
        rate,
      };
    });
  }, [habits, completionIndex]);

  const totalToday = habits.filter((habit) => isCompleted(habit.id, today)).length;
  const activeStreak = stats.reduce((sum, habit) => sum + habit.currentStreak, 0);
  const gridTemplate = 'grid-cols-[minmax(150px,200px)_repeat(7,minmax(36px,1fr))]';

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <ToolHeader
          icon={Target}
          title={t.title || 'Habit Tracker'}
          subtitle={t.subtitle || 'Build better habits, one day at a time'}
          gradient="from-rose-600 to-pink-600"
        />

        <div className="bg-card border border-border rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
                <Check className="w-6 h-6 text-white" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{tc.today || 'Today'}</p>
                <p className="text-2xl font-bold">
                  {tpl(t.habits_done || '{done}/{total} habits done', {
                    done: totalToday,
                    total: habits.length,
                  })}
                </p>
              </div>
            </div>
            {activeStreak > 0 && (
              <div className="flex items-center gap-1 px-4 py-2 rounded-lg bg-warning-soft text-warning-foreground">
                <Flame className="w-5 h-5" aria-hidden="true" />
                <span className="font-bold">{activeStreak}</span>
                <span className="text-sm">{t.total_days || 'total days'}</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <label htmlFor="habit-name" className="sr-only">
              {t.new_habit_placeholder || 'New habit name...'}
            </label>
            <input
              id="habit-name"
              type="text"
              value={newHabitName}
              onChange={(event) => setNewHabitName(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && addHabit()}
              placeholder={t.new_habit_placeholder || 'New habit name...'}
              className="flex-1 px-4 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary outline-none"
            />
            <label htmlFor="habit-frequency" className="sr-only">
              {t.frequency_daily || 'Daily'}
            </label>
            <select
              id="habit-frequency"
              value={newHabitFreq}
              onChange={(event) => setNewHabitFreq(event.target.value as Habit['frequency'])}
              className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:ring-2 focus:ring-primary outline-none"
            >
              <option value="daily">{t.frequency_daily || 'Daily'}</option>
              <option value="weekdays">{t.frequency_weekdays || 'Weekdays'}</option>
              <option value="weekly">{t.frequency_weekly || 'Weekly'}</option>
            </select>
            <button
              onClick={addHabit}
              className="px-6 py-2 rounded-lg bg-gradient-to-r from-rose-600 to-pink-600 text-white hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" aria-hidden="true" /> {tc.add || 'Add'}
            </button>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <div className="min-w-[520px]">
              <div className={`grid ${gridTemplate} border-b border-border`}>
                <div className="p-3 font-medium text-sm text-muted-foreground border-r border-border">
                  {t.habits_column || 'Habits'}
                </div>
                {weekDays.map((day) => {
                  const key = localDateKey(day);
                  const isToday = key === today;
                  return (
                    <div
                      key={key}
                      className={`p-2 text-center text-sm font-medium ${isToday ? 'text-rose-600' : 'text-muted-foreground'}`}
                    >
                      <div className="text-xs uppercase">{day.toLocaleDateString(lang, { weekday: 'short' })}</div>
                      <div className={`text-lg font-bold ${isToday ? 'text-rose-600' : ''}`}>{day.getDate()}</div>
                    </div>
                  );
                })}
              </div>

              {habits.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  <Target className="w-12 h-12 mx-auto mb-3 opacity-50" aria-hidden="true" />
                  <p>{t.no_habits || 'No habits yet. Add your first habit to start tracking!'}</p>
                </div>
              ) : (
                habits.map((habit) => (
                  <div key={habit.id} className={`group grid ${gridTemplate} border-b border-border last:border-b-0`}>
                    <div className="p-3 flex items-center gap-2 border-r border-border">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: habit.color }} />
                      <span className="font-medium text-sm truncate">{habit.name}</span>
                      <span className="text-xs text-muted-foreground ml-auto hidden sm:inline">
                        {habit.frequency === 'daily'
                          ? t.frequency_daily || 'Daily'
                          : habit.frequency === 'weekdays'
                            ? t.frequency_weekdays || 'Weekdays'
                            : t.frequency_weekly || 'Weekly'}
                      </span>
                      {pendingDelete === habit.id ? (
                        <span className="flex gap-1 flex-shrink-0">
                          <button
                            onClick={() => removeHabit(habit.id)}
                            className="px-1.5 py-0.5 rounded bg-red-600 text-white text-[10px]"
                          >
                            {c.delete || 'Delete'}
                          </button>
                          <button
                            onClick={() => setPendingDelete(null)}
                            className="px-1.5 py-0.5 rounded bg-muted text-[10px]"
                          >
                            {c.cancel || 'Cancel'}
                          </button>
                        </span>
                      ) : (
                        <button
                          onClick={() => setPendingDelete(habit.id)}
                          aria-label={`${t.confirm_delete || 'Delete this habit'} — ${habit.name}`}
                          className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/40 flex-shrink-0 opacity-60 sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100"
                        >
                          <Trash2 className="w-3 h-3 text-red-500" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                    {weekDays.map((day) => {
                      const key = localDateKey(day);
                      const done = isCompleted(habit.id, key);
                      const isFuture = key > today;
                      return (
                        <div key={key} className="p-2 flex items-center justify-center">
                          <button
                            onClick={() => toggleLog(habit.id, key)}
                            disabled={isFuture}
                            aria-pressed={done}
                            aria-label={`${habit.name} — ${day.toLocaleDateString(lang)}`}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                              done
                                ? 'scale-110'
                                : isFuture
                                  ? 'opacity-20 cursor-not-allowed'
                                  : 'hover:bg-muted'
                            }`}
                            style={done ? { backgroundColor: habit.color } : {}}
                          >
                            {done && <Check className="w-4 h-4 text-white" aria-hidden="true" />}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl shadow-xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-pink-600" aria-hidden="true" />
            {t.monthly_overview || 'Monthly Overview'}
          </h2>
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
              className="px-3 py-1 rounded-lg bg-muted hover:opacity-80 text-sm"
            >
              ← {t.prev || 'Prev'}
            </button>
            <span className="font-semibold">{viewDate.toLocaleDateString(lang, { month: 'long', year: 'numeric' })}</span>
            <button
              onClick={() => setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
              className="px-3 py-1 rounded-lg bg-muted hover:opacity-80 text-sm"
            >
              {t.next || 'Next'} →
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((day) => (
              <div key={day.toISOString()} className="text-center text-xs text-muted-foreground font-medium py-1">
                {day.toLocaleDateString(lang, { weekday: 'short' })}
              </div>
            ))}
            {monthDays.map((day) => {
              const key = localDateKey(day);
              const isThisMonth = day.getMonth() === viewDate.getMonth();
              const isToday = key === today;
              const completedToday = habits.filter((habit) => isCompleted(habit.id, key)).length;
              const total = habits.length;
              const ratio = total > 0 ? completedToday / total : 0;
              const intensity =
                ratio === 0
                  ? ''
                  : ratio <= 0.33
                    ? 'bg-rose-200 dark:bg-rose-800'
                    : ratio <= 0.66
                      ? 'bg-rose-400 dark:bg-rose-600'
                      : 'bg-rose-600 dark:bg-rose-400';
              return (
                <div
                  key={key}
                  className={`aspect-square rounded-md flex items-center justify-center text-xs ${
                    isThisMonth
                      ? isToday
                        ? 'ring-2 ring-pink-500 font-bold'
                        : intensity || 'bg-muted'
                      : 'bg-transparent'
                  } ${isThisMonth ? 'text-foreground' : 'text-muted-foreground/40'}`}
                  title={`${key}: ${completedToday}/${total}`}
                >
                  {isThisMonth ? day.getDate() : ''}
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl shadow-xl p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-pink-600" aria-hidden="true" />
            {t.statistics || 'Habit Statistics'}
          </h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {stats.map((habit) => (
              <div key={habit.id} className="rounded-xl bg-muted/50 border border-border p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: habit.color }} />
                  <span className="font-medium text-sm">{habit.name}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-lg font-bold text-rose-600">{habit.total}</div>
                    <div className="text-xs text-muted-foreground">{t.total || 'Total'}</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-amber-600">{habit.currentStreak}</div>
                    <div className="text-xs text-muted-foreground">{t.streak || 'Streak'}</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-green-600">
                      {habit.rate === null ? habit.total : `${habit.rate}%`}
                    </div>
                    <div className="text-xs text-muted-foreground">{t.rate || 'Rate'}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HabitTracker;
