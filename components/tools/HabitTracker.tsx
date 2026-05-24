'use client'

import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Check, Calendar, Flame, BarChart3, RotateCcw, Target } from 'lucide-react';

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

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const HabitTracker = ({ lang = 'en' }: HabitTrackerProps) => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitFreq, setNewHabitFreq] = useState<Habit['frequency']>('daily');
  const [viewDate, setViewDate] = useState(new Date());

  useEffect(() => {
    const savedHabits = localStorage.getItem('habits');
    if (savedHabits) { try { setHabits(JSON.parse(savedHabits)); } catch {} }
    const savedLogs = localStorage.getItem('habit_logs');
    if (savedLogs) { try { setLogs(JSON.parse(savedLogs)); } catch {} }
  }, []);

  useEffect(() => { localStorage.setItem('habits', JSON.stringify(habits)); }, [habits]);
  useEffect(() => { localStorage.setItem('habit_logs', JSON.stringify(logs)); }, [logs]);

  const addHabit = () => {
    if (newHabitName.trim()) {
      const habit: Habit = {
        id: Date.now(),
        name: newHabitName.trim(),
        color: COLORS[habits.length % COLORS.length],
        frequency: newHabitFreq,
        created: Date.now(),
      };
      setHabits(prev => [...prev, habit]);
      setNewHabitName('');
    }
  };

  const removeHabit = (id: number) => {
    if (confirm('Delete this habit and all its logs?')) {
      setHabits(prev => prev.filter(h => h.id !== id));
      setLogs(prev => prev.filter(l => l.habitId !== id));
    }
  };

  const toggleLog = (habitId: number, date: string) => {
    setLogs(prev => {
      const existing = prev.find(l => l.habitId === habitId && l.date === date);
      if (existing) {
        return prev.filter(l => !(l.habitId === habitId && l.date === date));
      }
      return [...prev, { habitId, date, completed: true }];
    });
  };

  const isCompleted = (habitId: number, date: string): boolean => {
    return logs.some(l => l.habitId === habitId && l.date === date && l.completed);
  };

  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  const getWeekDays = (date: Date) => {
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay());
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
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
    for (let i = 0; i < startPad; i++) {
      days.push(new Date(year, month, -startPad + i + 1));
    }
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push(new Date(year, month + 1, i));
    }
    return days;
  };

  const weekDays = getWeekDays(viewDate);
  const monthDays = getMonthDays(viewDate);

  const today = formatDate(new Date());

  const stats = useMemo(() => {
    return habits.map(habit => {
      const habitLogs = logs.filter(l => l.habitId === habit.id && l.completed);
      const total = habitLogs.length;
      const currentStreak = calculateStreak(habitLogs.map(l => l.date));
      const bestStreak = 0;
      return { ...habit, total, currentStreak, bestStreak };
    });
  }, [habits, logs]);

  const totalToday = habits.filter(h => isCompleted(h.id, today)).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-rose-600 to-pink-600 mb-4">
            <Target className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
            Habit Tracker
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Build better habits, one day at a time
          </p>
        </div>

        {/* Today's Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
                <Check className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Today</p>
                <p className="text-2xl font-bold">{totalToday}/{habits.length} habits done</p>
              </div>
            </div>
            <div className="flex gap-2">
              {stats.filter(s => s.currentStreak > 0).length > 0 && (
                <div className="flex items-center gap-1 px-4 py-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                  <Flame className="w-5 h-5" />
                  <span className="font-bold">{stats.reduce((sum, s) => sum + s.currentStreak, 0)}</span>
                  <span className="text-sm">total days</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Add Habit */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex gap-3">
            <input
              type="text"
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addHabit()}
              placeholder="New habit name..."
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-pink-500 outline-none"
            />
            <select
              value={newHabitFreq}
              onChange={(e) => setNewHabitFreq(e.target.value as Habit['frequency'])}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-pink-500 outline-none"
            >
              <option value="daily">Daily</option>
              <option value="weekdays">Weekdays</option>
              <option value="weekly">Weekly</option>
            </select>
            <button onClick={addHabit} className="px-6 py-2 rounded-lg bg-gradient-to-r from-rose-600 to-pink-600 text-white hover:shadow-lg transition-all flex items-center gap-2">
              <Plus className="w-5 h-5" /> Add
            </button>
          </div>
        </div>

        {/* Habit Grid */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden mb-6">
          {/* Week Header */}
          <div className="grid grid-cols-[200px,repeat(7,1fr)] border-b border-gray-200 dark:border-gray-700">
            <div className="p-3 font-medium text-sm text-gray-500 border-r border-gray-200 dark:border-gray-700">Habits</div>
            {weekDays.map((day, i) => {
              const isToday = formatDate(day) === today;
              return (
                <div key={i} className={`p-3 text-center text-sm font-medium ${isToday ? 'text-rose-600' : 'text-gray-500'}`}>
                  <div className="text-xs uppercase">{day.toLocaleDateString('en', { weekday: 'short' })}</div>
                  <div className={`text-lg font-bold ${isToday ? 'text-rose-600' : ''}`}>{day.getDate()}</div>
                </div>
              );
            })}
          </div>

          {/* Habit Rows */}
          {habits.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No habits yet. Add your first habit to start tracking!</p>
            </div>
          ) : (
            habits.map(habit => (
              <div key={habit.id} className="grid grid-cols-[200px,repeat(7,1fr)] border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                <div className="p-3 flex items-center gap-2 border-r border-gray-100 dark:border-gray-700">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: habit.color }} />
                  <span className="font-medium text-sm truncate">{habit.name}</span>
                  <span className="text-xs text-gray-400 ml-auto">{habit.frequency}</span>
                  <button onClick={() => removeHabit(habit.id)} className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900 opacity-0 hover:opacity-100 transition-all flex-shrink-0">
                    <Trash2 className="w-3 h-3 text-red-500" />
                  </button>
                </div>
                {weekDays.map((day, i) => {
                  const key = formatDate(day);
                  const done = isCompleted(habit.id, key);
                  const isFuture = new Date(key) > new Date(today);
                  return (
                    <div key={i} className="p-2 flex items-center justify-center">
                      <button
                        onClick={() => !isFuture && toggleLog(habit.id, key)}
                        disabled={isFuture}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                          done ? 'scale-110' : isFuture ? 'opacity-20 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                        style={done ? { backgroundColor: habit.color } : {}}
                      >
                        {done && <Check className="w-4 h-4 text-white" />}
                      </button>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Monthly Calendar Heatmap */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-pink-600" />
            Monthly Overview
          </h3>
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => { const d = new Date(viewDate); d.setMonth(d.getMonth() - 1); setViewDate(d); }} className="px-3 py-1 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-sm">← Prev</button>
            <span className="font-semibold">{viewDate.toLocaleDateString('en', { month: 'long', year: 'numeric' })}</span>
            <button onClick={() => { const d = new Date(viewDate); d.setMonth(d.getMonth() + 1); setViewDate(d); }} className="px-3 py-1 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-sm">Next →</button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-center text-xs text-gray-500 font-medium py-1">{d}</div>
            ))}
            {monthDays.map((day, i) => {
              const key = formatDate(day);
              const isThisMonth = day.getMonth() === viewDate.getMonth();
              const isToday = key === today;
              const completedToday = habits.filter(h => isCompleted(h.id, key)).length;
              const total = habits.length;
              const ratio = total > 0 ? completedToday / total : 0;
              const intensity = ratio === 0 ? '' : ratio <= 0.33 ? 'bg-rose-200 dark:bg-rose-800' : ratio <= 0.66 ? 'bg-rose-400 dark:bg-rose-600' : 'bg-rose-600 dark:bg-rose-400';
              return (
                <div
                  key={i}
                  className={`aspect-square rounded-md flex items-center justify-center text-xs ${
                    isThisMonth ? (isToday ? 'ring-2 ring-pink-500 font-bold' : intensity || 'bg-gray-100 dark:bg-gray-700') : 'bg-transparent'
                  } ${isThisMonth ? 'text-gray-700 dark:text-gray-300' : 'text-gray-300 dark:text-gray-600'}`}
                  title={`${key}: ${completedToday}/${total}`}
                >
                  {isThisMonth ? day.getDate() : ''}
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-pink-600" />
            Habit Statistics
          </h3>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {stats.map(habit => (
              <div key={habit.id} className="rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: habit.color }} />
                  <span className="font-medium text-sm">{habit.name}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-lg font-bold text-rose-600">{habit.total}</div>
                    <div className="text-xs text-gray-500">Total</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-amber-600">{habit.currentStreak}</div>
                    <div className="text-xs text-gray-500">Streak</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-green-600">{habit.frequency === 'daily' ? Math.round((habit.total / Math.max(1, daysSince(habit.created))) * 100) : habit.total}%</div>
                    <div className="text-xs text-gray-500">Rate</div>
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

function calculateStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const uniqueDates = Array.from(new Set(dates)).sort().reverse();
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let checkDate = new Date(today);

  for (const dateStr of uniqueDates) {
    const d = new Date(dateStr + 'T00:00:00');
    const diff = Math.round((checkDate.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0 || diff === 1) {
      streak++;
      checkDate = d;
    } else {
      break;
    }
  }
  return streak;
}

function daysSince(timestamp: number): number {
  return Math.max(1, Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24)));
}

export default HabitTracker;
