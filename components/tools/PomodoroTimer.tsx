'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Clock, Plus, Trash2, ListChecks, BarChart3, Timer } from 'lucide-react';

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

const PomodoroTimer = ({ lang = 'en' }: PomodoroTimerProps) => {
  const [workMinutes, setWorkMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [longBreakMinutes, setLongBreakMinutes] = useState(15);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [sessionLogs, setSessionLogs] = useState<SessionLog[]>([]);
  const [activeTab, setActiveTab] = useState<'timer' | 'tasks' | 'stats'>('timer');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentMinutes = isBreak ? (sessionCount > 0 && sessionCount % 4 === 0 ? longBreakMinutes : breakMinutes) : workMinutes;
  const totalSeconds = currentMinutes * 60;
  const elapsedSeconds = totalSeconds - (seconds + (isActive ? 0 : 0));
  const progress = seconds > 0 ? (seconds / totalSeconds) * 100 : 100;

  useEffect(() => {
    const saved = localStorage.getItem('pomodoro_logs');
    if (saved) {
      try { setSessionLogs(JSON.parse(saved)); } catch {}
    }
    const savedTasks = localStorage.getItem('pomodoro_tasks');
    if (savedTasks) {
      try { setTasks(JSON.parse(savedTasks)); } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('pomodoro_logs', JSON.stringify(sessionLogs));
  }, [sessionLogs]);

  useEffect(() => {
    localStorage.setItem('pomodoro_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setSeconds(prev => {
          if (prev <= 0) {
            handleSessionEnd();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive]);

  const handleSessionEnd = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsActive(false);
    if (!isBreak) {
      const completedTasks = tasks.filter(t => t.completed).length;
      setSessionLogs(prev => [...prev, {
        date: new Date().toISOString(),
        workDuration: workMinutes,
        tasksCompleted: completedTasks
      }]);
      setSessionCount(prev => prev + 1);
    }
    setIsBreak(prev => !prev);
    setSeconds(isBreak ? workMinutes * 60 : (sessionCount > 0 && sessionCount % 4 === 0 ? longBreakMinutes : breakMinutes) * 60);
  }, [isBreak, workMinutes, breakMinutes, longBreakMinutes, sessionCount, tasks]);

  const startTimer = () => {
    if (seconds === 0) {
      setSeconds(totalSeconds);
    }
    setIsActive(true);
  };

  const pauseTimer = () => {
    setIsActive(false);
  };

  const resetTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsActive(false);
    setIsBreak(false);
    setSeconds(0);
    setSessionCount(0);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const addTask = () => {
    if (newTask.trim()) {
      setTasks(prev => [...prev, { id: Date.now(), text: newTask.trim(), completed: false }]);
      setNewTask('');
    }
  };

  const toggleTask = (id: number) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const removeTask = (id: number) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const clearLogs = () => {
    setSessionLogs([]);
  };

  const totalFocusMinutes = sessionLogs.reduce((sum, log) => sum + log.workDuration, 0);
  const todayLogs = sessionLogs.filter(log => {
    const logDate = new Date(log.date).toDateString();
    return logDate === new Date().toDateString();
  });
  const todaySessions = todayLogs.length;
  const todayTasks = todayLogs.reduce((sum, log) => sum + log.tasksCompleted, 0);
  const streak = calculateStreak(sessionLogs);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 mb-4">
            <Timer className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            Pomodoro Study Timer
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Focus on what matters, one interval at a time
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 justify-center">
          <button
            onClick={() => setActiveTab('timer')}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${activeTab === 'timer' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
          >
            <Timer className="w-4 h-4 inline mr-2" />
            Timer
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${activeTab === 'tasks' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
          >
            <ListChecks className="w-4 h-4 inline mr-2" />
            Tasks
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${activeTab === 'stats' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
          >
            <BarChart3 className="w-4 h-4 inline mr-2" />
            Stats
          </button>
        </div>

        {activeTab === 'timer' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-6">
            {/* Status */}
            <div className="text-center mb-6">
              <span className={`inline-block px-4 py-1 rounded-full text-sm font-medium ${isBreak ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'}`}>
                {isBreak ? (sessionCount > 0 && sessionCount % 4 === 0 ? 'Long Break' : 'Break Time') : 'Focus Time'}
              </span>
              {!isBreak && sessionCount > 0 && (
                <span className="ml-2 text-sm text-gray-500">Session #{sessionCount + 1}</span>
              )}
            </div>

            {/* Timer Display */}
            <div className="relative w-64 h-64 mx-auto mb-8">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="6" className="text-gray-200 dark:text-gray-700" />
                <circle cx="50" cy="50" r="45" fill="none" stroke={isBreak ? '#10b981' : '#3b82f6'} strokeWidth="6" strokeDasharray={`${progress * 2.827} 282.7`} strokeLinecap="round" className="transition-all duration-1000" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-bold tabular-nums">{formatTime(seconds)}</span>
                <span className="text-sm text-gray-500 mt-2">{isBreak ? 'Break' : 'Work'}</span>
              </div>
            </div>

            {/* Timer Controls */}
            <div className="flex justify-center gap-4 mb-6">
              {!isActive ? (
                <button onClick={startTimer} className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold hover:shadow-lg transition-all flex items-center gap-2">
                  <Play className="w-5 h-5" /> Start
                </button>
              ) : (
                <button onClick={pauseTimer} className="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold hover:shadow-lg transition-all flex items-center gap-2">
                  <Pause className="w-5 h-5" /> Pause
                </button>
              )}
              <button onClick={resetTimer} className="px-6 py-3 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all flex items-center gap-2">
                <RotateCcw className="w-5 h-5" /> Reset
              </button>
            </div>

            {/* Timer Settings */}
            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1 text-center">Work (min)</label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={workMinutes}
                  onChange={(e) => { setWorkMinutes(Number(e.target.value)); if (!isActive && !isBreak) setSeconds(Number(e.target.value) * 60); }}
                  disabled={isActive}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-center font-semibold focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1 text-center">Break (min)</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={breakMinutes}
                  onChange={(e) => setBreakMinutes(Number(e.target.value))}
                  disabled={isActive}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-center font-semibold focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1 text-center">Long (min)</label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={longBreakMinutes}
                  onChange={(e) => setLongBreakMinutes(Number(e.target.value))}
                  disabled={isActive}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-center font-semibold focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
                />
              </div>
            </div>

            {/* Sessions completed */}
            <div className="mt-6 flex justify-center gap-2">
              {Array.from({ length: Math.min(sessionCount % 4, 4) }).map((_, i) => (
                <div key={i} className="w-3 h-3 rounded-full bg-blue-500" />
              ))}
              {Array.from({ length: 4 - Math.min(sessionCount % 4, 4) }).map((_, i) => (
                <div key={i + 4} className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600" />
              ))}
              <span className="text-xs text-gray-500 ml-2">({sessionCount} sessions)</span>
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-blue-600" />
              Session Tasks
            </h2>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTask()}
                placeholder="Add a task for this session..."
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <button onClick={addTask} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              {tasks.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No tasks yet. Add tasks for your study session!</p>
              ) : (
                tasks.map(task => (
                  <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 group hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTask(task.id)}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className={`flex-1 ${task.completed ? 'line-through text-gray-400' : ''}`}>{task.text}</span>
                    <button onClick={() => removeTask(task.id)} className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900 opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {tasks.filter(t => t.completed).length > 0 && (
              <div className="mt-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-sm text-center">
                {tasks.filter(t => t.completed).length} of {tasks.length} tasks completed
              </div>
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Statistics
              </h2>
              {sessionLogs.length > 0 && (
                <button onClick={clearLogs} className="text-sm text-red-500 hover:text-red-700 transition-colors">Clear History</button>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Sessions</div>
                <div className="text-2xl font-bold text-blue-600">{sessionLogs.length}</div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Focus Time</div>
                <div className="text-2xl font-bold text-green-600">{Math.floor(totalFocusMinutes / 60)}h {totalFocusMinutes % 60}m</div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Today</div>
                <div className="text-2xl font-bold text-purple-600">{todaySessions} sess</div>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Day Streak</div>
                <div className="text-2xl font-bold text-amber-600">{streak} days</div>
              </div>
            </div>

            {sessionLogs.length > 0 ? (
              <div className="max-h-60 overflow-y-auto">
                <h3 className="text-sm font-medium text-gray-500 mb-3">Recent Sessions</h3>
                <div className="space-y-2">
                  {[...sessionLogs].reverse().slice(0, 20).map((log, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-sm">
                      <span className="text-gray-600 dark:text-gray-400">{new Date(log.date).toLocaleDateString()} {new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="flex gap-4">
                        <span className="text-blue-600 font-medium">{log.workDuration}m</span>
                        <span className="text-green-600 font-medium">{log.tasksCompleted} tasks</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No sessions completed yet</p>
                <p className="text-sm">Start the timer to build your study history!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

function calculateStreak(logs: SessionLog[]): number {
  if (logs.length === 0) return 0;
  const dates = Array.from(new Set(logs.map(log => new Date(log.date).toDateString()))).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  let streak = 0;
  const today = new Date().toDateString();
  const checkDate = new Date(today);
  for (const date of dates) {
    if (date === checkDate.toDateString()) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export default PomodoroTimer;
