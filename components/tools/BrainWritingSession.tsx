'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Users, Download, Plus, Trash2, RefreshCw, Clock, Lightbulb, Grid3x3, List, ChevronRight, CheckCircle2 } from 'lucide-react';
import { type Locale } from '@/lib/i18n/config';
import { usePersistentState } from '@/lib/tools/use-persistent-state';
import { interpolate as tpl } from '@/lib/tools/template';
import { prepareNextRound, trimIdeas } from '@/lib/tools/brainwriting';
import { toCsv } from '@/lib/tools/csv';
import { downloadCsv, downloadJson, sanitizeFilename } from '@/lib/tools/download';
import { ToolHeader } from './shared/ToolHeader';

interface BrainWritingSessionProps {
  lang: Locale;
  dict: any;
}

interface CompletedRound {
  round: number;
  ideas: Record<string, string[]>;
}

interface BrainWritingState {
  sessionName: string;
  method: string;
  participants: string[];
  rounds: number;
  timePerRound: number;
  currentRound: number;
  ideas: Record<string, string[]>;
  completedRounds: CompletedRound[];
  isActive: boolean;
  deadline: number | null;
  remaining: number;
}

const METHOD_DEFINITIONS: Record<string, { ideasPerRound: number; defaultParticipants: number; defaultTime: number }> = {
  '6-3-5': { ideasPerRound: 3, defaultParticipants: 6, defaultTime: 5 },
  constrained: { ideasPerRound: 2, defaultParticipants: 4, defaultTime: 7 },
  free: { ideasPerRound: 3, defaultParticipants: 5, defaultTime: 5 },
};

const DEFAULT_STATE: BrainWritingState = {
  sessionName: '',
  method: '6-3-5',
  participants: [],
  rounds: 3,
  timePerRound: 5,
  currentRound: 0,
  ideas: {},
  completedRounds: [],
  isActive: false,
  deadline: null,
  remaining: 0,
};

function methodConfig(method: string) {
  return METHOD_DEFINITIONS[method] ?? METHOD_DEFINITIONS['6-3-5'];
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, Math.round(number)));
}

function validateState(raw: unknown): BrainWritingState | null {
  if (!raw || typeof raw !== 'object') return null;
  const value = raw as Partial<BrainWritingState>;
  const method = typeof value.method === 'string' && METHOD_DEFINITIONS[value.method] ? value.method : '6-3-5';
  const participants = Array.isArray(value.participants)
    ? value.participants.filter((p): p is string => typeof p === 'string')
    : [];
  const ideas: Record<string, string[]> = {};
  if (value.ideas && typeof value.ideas === 'object') {
    for (const [participant, list] of Object.entries(value.ideas)) {
      if (Array.isArray(list)) {
        ideas[participant] = list.filter((idea): idea is string => typeof idea === 'string');
      }
    }
  }
  const completedRounds = Array.isArray(value.completedRounds)
    ? value.completedRounds.filter(
        (round): round is CompletedRound =>
          Boolean(round) && typeof round === 'object' && typeof (round as CompletedRound).round === 'number'
      )
    : [];

  return {
    sessionName: typeof value.sessionName === 'string' ? value.sessionName : '',
    method,
    participants,
    rounds: clampInt(value.rounds, 1, 10, 3),
    timePerRound: clampInt(value.timePerRound, 1, 60, 5),
    currentRound: clampInt(value.currentRound, 0, 10, 0),
    ideas,
    completedRounds,
    isActive: Boolean(value.isActive),
    deadline: typeof value.deadline === 'number' && Number.isFinite(value.deadline) ? value.deadline : null,
    remaining: clampInt(value.remaining, 0, 3600, 0),
  };
}

const BrainWritingSession = ({ lang = 'en', dict = {} }: BrainWritingSessionProps) => {
  const t = dict.tools?.brain_writing || {};
  const tc = dict.tools?.common || {};
  const [state, setState, hydrated] = usePersistentState<BrainWritingState>(
    'mimir:tools:brainwriting',
    DEFAULT_STATE,
    validateState
  );
  const [newParticipant, setNewParticipant] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [now, setNow] = useState(() => Date.now());

  const methods = {
    '6-3-5': {
      name: t.method_635_name || 'Brain-Writing 6-3-5',
      description: t.method_635_desc || '6 participants, 3 ideas each, 5 minutes per round',
      ...METHOD_DEFINITIONS['6-3-5'],
    },
    constrained: {
      name: t.method_constrained_name || 'Constrained Brain-Writing',
      description: t.method_constrained_desc || 'Ideas must build on or relate to previous ideas',
      ...METHOD_DEFINITIONS.constrained,
    },
    free: {
      name: t.method_free_name || 'Free Brain-Writing',
      description: t.method_free_desc || 'Open format with flexible idea generation',
      ...METHOD_DEFINITIONS.free,
    },
  };

  const activeMethod = methods[state.method as keyof typeof methods] ?? methods['6-3-5'];
  const ideasPerRound = activeMethod.ideasPerRound;

  const completeRound = useCallback(() => {
    setState((prev) => {
      if (!prev.isActive || !prev.deadline) return prev;
      const slots = methodConfig(prev.method).ideasPerRound;
      // Snapshot only the ideas written this round; inherited sheets are
      // carried forward by rotation, not duplicated in every export.
      const fresh: Record<string, string[]> = {};
      for (const [participant, ideas] of Object.entries(prev.ideas)) {
        fresh[participant] = ideas.slice(-Math.min(slots, ideas.length));
      }
      return {
        ...prev,
        isActive: false,
        deadline: null,
        remaining: 0,
        completedRounds: [...prev.completedRounds, { round: prev.currentRound, ideas: fresh }],
      };
    });
  }, [setState]);

  // Wall-clock timer: refreshing the tab cannot add or lose seconds. The
  // persisted state keeps the deadline, not a ticking counter.
  useEffect(() => {
    if (!state.isActive || !state.deadline) return;
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(interval);
  }, [state.isActive, state.deadline]);

  const displayRemaining =
    state.isActive && state.deadline
      ? Math.max(0, Math.round((state.deadline - now) / 1000))
      : state.remaining;

  useEffect(() => {
    if (state.isActive && state.deadline && displayRemaining <= 0) completeRound();
  }, [state.isActive, state.deadline, displayRemaining, completeRound]);

  // Resume an interrupted round after a refresh.
  useEffect(() => {
    if (!hydrated) return;
    setNow(Date.now());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  const addParticipant = () => {
    const name = newParticipant.trim();
    if (name && !state.participants.includes(name)) {
      setState((prev) => ({ ...prev, participants: [...prev.participants, name] }));
      setNewParticipant('');
    }
  };

  const removeParticipant = (name: string) => {
    setState((prev) => ({ ...prev, participants: prev.participants.filter((p) => p !== name) }));
  };

  const startSession = () => {
    if (state.participants.length === 0 || !state.sessionName.trim()) return;
    const ideas: Record<string, string[]> = {};
    state.participants.forEach((participant) => {
      ideas[participant] = Array(ideasPerRound).fill('');
    });
    const seconds = state.timePerRound * 60;
    setState((prev) => ({
      ...prev,
      currentRound: 1,
      ideas,
      completedRounds: [],
      isActive: true,
      remaining: seconds,
      deadline: Date.now() + seconds * 1000,
    }));
  };

  const nextRound = () => {
    if (state.currentRound >= state.rounds) return;
    const nextIdeas = prepareNextRound(state.ideas, ideasPerRound);
    const seconds = state.timePerRound * 60;
    setState((prev) => ({
      ...prev,
      currentRound: Math.min(prev.rounds, prev.currentRound + 1),
      ideas: nextIdeas,
      remaining: seconds,
      isActive: true,
      deadline: Date.now() + seconds * 1000,
    }));
  };

  const toggleTimer = () => {
    setState((prev) => {
      if (prev.isActive) {
        return { ...prev, isActive: false, deadline: null, remaining: displayRemaining };
      }
      if (prev.remaining <= 0 && displayRemaining <= 0) return prev;
      const remaining = displayRemaining > 0 ? displayRemaining : prev.remaining;
      return { ...prev, remaining, isActive: true, deadline: Date.now() + remaining * 1000 };
    });
  };

  const updateIdea = (participant: string, index: number, value: string) => {
    setState((prev) => {
      const list = prev.ideas[participant];
      if (!list) return prev;
      return {
        ...prev,
        ideas: {
          ...prev.ideas,
          [participant]: list.map((idea, i) => (i === index ? value : idea)),
        },
      };
    });
  };

  const buildExportData = () => ({
    sessionName: state.sessionName,
    method: activeMethod.name,
    participants: state.participants,
    rounds: state.completedRounds.map((round) => ({
      ...round,
      ideas: trimIdeas(round.ideas),
    })),
    timestamp: new Date().toISOString(),
  });

  const exportData = (format: 'json' | 'csv') => {
    const stem = sanitizeFilename(state.sessionName, 'brainwriting');
    if (format === 'json') {
      downloadJson(buildExportData(), `brainwriting-${stem}.json`);
      return;
    }
    const rows: Array<Array<string | number>> = [
      ['Session', 'Method', 'Round', 'Participant', 'Idea Number', 'Idea'],
    ];
    for (const round of state.completedRounds) {
      const ideas = trimIdeas(round.ideas);
      for (const [participant, participantIdeas] of Object.entries(ideas)) {
        participantIdeas.forEach((idea, index) => {
          rows.push([state.sessionName, activeMethod.name, round.round, participant, index + 1, idea]);
        });
      }
    }
    downloadCsv(toCsv(rows), `brainwriting-${stem}.csv`);
  };

  const resetSession = () => {
    setState({
      ...DEFAULT_STATE,
      method: state.method,
      timePerRound: state.timePerRound,
      rounds: state.rounds,
    });
  };

  const formatTime = (seconds: number) => {
    const safe = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
    const minutes = Math.floor(safe / 60);
    return `${minutes}:${String(safe % 60).padStart(2, '0')}`;
  };

  if (state.currentRound === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <ToolHeader
            icon={Lightbulb}
            title={t.title || 'Brain-Writing Session'}
            subtitle={t.subtitle || 'Collaborative ideation made simple and structured'}
            variant="brand"
          />

          <div className="bg-card border border-border rounded-2xl shadow-xl p-6 sm:p-8 space-y-8">
            <div>
              <label htmlFor="brainwriting-name" className="block text-sm font-semibold mb-2">
                {t.session_name || 'Session Name *'}
              </label>
              <input
                id="brainwriting-name"
                type="text"
                value={state.sessionName}
                onChange={(event) => setState((prev) => ({ ...prev, sessionName: event.target.value }))}
                placeholder={t.session_name_placeholder || 'e.g., Product Innovation Workshop'}
                className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <fieldset>
              <legend className="block text-sm font-semibold mb-2">
                {t.method_label || 'Brain-Writing Method'}
              </legend>
              <div className="grid gap-3">
                {Object.entries(methods).map(([key, method]) => (
                  <label
                    key={key}
                    className={`flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      state.method === key
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="method"
                      value={key}
                      checked={state.method === key}
                      onChange={(event) => setState((prev) => ({ ...prev, method: event.target.value }))}
                      className="mt-1 mr-3"
                    />
                    <span className="flex-1">
                      <span className="block font-semibold">{method.name}</span>
                      <span className="block text-sm text-muted-foreground">{method.description}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="brainwriting-rounds" className="block text-sm font-semibold mb-2">
                  {t.rounds || 'Number of Rounds'}
                </label>
                <input
                  id="brainwriting-rounds"
                  type="number"
                  min={1}
                  max={10}
                  value={state.rounds}
                  onChange={(event) =>
                    setState((prev) => ({ ...prev, rounds: clampInt(event.target.value, 1, 10, prev.rounds) }))
                  }
                  className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
              <div>
                <label htmlFor="brainwriting-minutes" className="block text-sm font-semibold mb-2">
                  {t.time_per_round || 'Time per Round (minutes)'}
                </label>
                <input
                  id="brainwriting-minutes"
                  type="number"
                  min={1}
                  max={60}
                  value={state.timePerRound}
                  onChange={(event) =>
                    setState((prev) => ({
                      ...prev,
                      timePerRound: clampInt(event.target.value, 1, 60, prev.timePerRound),
                    }))
                  }
                  className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="brainwriting-participant" className="block text-sm font-semibold mb-2">
                {t.participants || 'Participants *'}
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  id="brainwriting-participant"
                  type="text"
                  value={newParticipant}
                  onChange={(event) => setNewParticipant(event.target.value)}
                  onKeyDown={(event) => event.key === 'Enter' && addParticipant()}
                  placeholder={t.participant_placeholder || 'Enter participant name'}
                  className="flex-1 px-4 py-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary outline-none"
                />
                <button
                  onClick={addParticipant}
                  className="px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  {tc.add || 'Add'}
                </button>
              </div>

              {state.participants.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {state.participants.map((participant) => (
                    <div
                      key={participant}
                      className="flex items-center gap-2 px-3 py-2 rounded-full bg-primary-soft text-primary-soft-foreground"
                    >
                      <Users className="w-4 h-4" aria-hidden="true" />
                      <span>{participant}</span>
                      <button
                        onClick={() => removeParticipant(participant)}
                        aria-label={`${t.remove || 'Remove'} ${participant}`}
                        className="hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-sm text-muted-foreground mt-2">
                {tpl(t.recommended_participants || 'Recommended: {n} participants', {
                  n: activeMethod.defaultParticipants,
                })}
              </p>
            </div>

            <button
              onClick={startSession}
              disabled={state.participants.length === 0 || !state.sessionName.trim()}
              className="w-full py-4 rounded-lg bg-brand text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {t.start_session || 'Start Brain-Writing Session'}
              <ChevronRight className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const inheritedCount = Math.max(0, (state.ideas[state.participants[0]]?.length ?? 0) - ideasPerRound);
  const roundComplete = !state.isActive && displayRemaining === 0 && state.currentRound < state.rounds;
  const sessionComplete = !state.isActive && displayRemaining === 0 && state.currentRound >= state.rounds;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-card border border-border rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">{state.sessionName}</h1>
              <p className="text-muted-foreground">{activeMethod.name}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10">
                <Clock className="w-5 h-5 text-primary" aria-hidden="true" />
                <span className="font-mono text-xl font-bold" role="timer" aria-live="off">
                  {formatTime(displayRemaining)}
                </span>
              </div>

              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10">
                <span className="text-sm font-semibold">
                  {tpl(t.round_counter || 'Round {current} / {total}', {
                    current: state.currentRound,
                    total: state.rounds,
                  })}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            <button
              onClick={toggleTimer}
              disabled={displayRemaining <= 0 && !state.isActive}
              className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                state.isActive ? 'bg-amber-700 text-white hover:opacity-90' : 'bg-success text-white hover:opacity-90'
              }`}
            >
              {state.isActive ? tc.pause || 'Pause' : tc.resume || 'Resume'}
            </button>

            <button
              onClick={() => setView((prev) => (prev === 'grid' ? 'list' : 'grid'))}
              className="px-4 py-2 rounded-lg bg-muted hover:opacity-80 transition-colors flex items-center gap-2"
            >
              {view === 'grid' ? <List className="w-4 h-4" aria-hidden="true" /> : <Grid3x3 className="w-4 h-4" aria-hidden="true" />}
              {view === 'grid' ? tc.list_view || 'List View' : tc.grid_view || 'Grid View'}
            </button>

            {state.completedRounds.length > 0 && (
              <>
                <button
                  onClick={() => exportData('json')}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" aria-hidden="true" />
                  {tc.json || 'JSON'}
                </button>
                <button
                  onClick={() => exportData('csv')}
                  className="px-4 py-2 rounded-lg bg-green-700 text-white hover:bg-green-800 transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" aria-hidden="true" />
                  {tc.csv || 'CSV'}
                </button>
              </>
            )}

            <button
              onClick={resetSession}
              className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              {tc.reset || 'Reset'}
            </button>
          </div>
        </div>

        {inheritedCount > 0 && (
          <p className="mb-3 text-sm text-muted-foreground">
            {t.inherited_hint ||
              'Ideas from the previous round were passed to the next participant — build on them and add yours below.'}
          </p>
        )}

        <div className={view === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
          {Object.entries(state.ideas).map(([participant, participantIdeas]) => (
            <div
              key={participant}
              className="bg-card border border-border rounded-xl shadow-lg p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-full bg-brand-mark flex items-center justify-center text-white font-bold">
                  {participant.charAt(0).toUpperCase()}
                </div>
                <h2 className="font-semibold text-lg">{participant}</h2>
              </div>

              <div className="space-y-3">
                {participantIdeas.map((idea, index) => {
                  const inherited = index < inheritedCount;
                  return (
                    <div key={index}>
                      <label
                        htmlFor={`idea-${participant}-${index}`}
                        className="block text-xs font-semibold text-muted-foreground mb-1"
                      >
                        {tpl(t.idea_label || 'Idea {n}', { n: index + 1 })}
                        {inherited && (
                          <span className="ml-2 font-normal">
                            {t.inherited_idea || 'from previous round'}
                          </span>
                        )}
                      </label>
                      <textarea
                        id={`idea-${participant}-${index}`}
                        value={idea}
                        onChange={(event) => updateIdea(participant, index, event.target.value)}
                        placeholder={t.idea_placeholder || 'Enter your idea...'}
                        className={`w-full px-3 py-2 rounded-lg border bg-background focus:ring-2 focus:ring-primary outline-none resize-none ${
                          inherited ? 'border-primary/30' : 'border-border'
                        }`}
                        rows={3}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {roundComplete && (
          <div className="mt-6 bg-card border border-border rounded-xl shadow-lg p-6 text-center">
            <CheckCircle2 className="w-12 h-12 text-success-foreground mx-auto mb-3" aria-hidden="true" />
            <h2 className="text-xl font-bold mb-2">
              {tpl(t.round_complete || 'Round {n} Complete!', { n: state.currentRound })}
            </h2>
            <p className="text-muted-foreground mb-4">{t.ready_next_round || 'Ready to move to the next round?'}</p>
            <button
              onClick={nextRound}
              className="px-8 py-3 rounded-lg bg-brand text-white font-semibold hover:shadow-lg transition-all flex items-center gap-2 mx-auto"
            >
              {tpl(t.start_round || 'Start Round {n}', { n: state.currentRound + 1 })}
              <ChevronRight className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        )}

        {sessionComplete && (
          <div className="mt-6 bg-card border border-border rounded-xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-white" aria-hidden="true" />
            </div>
            <h2 className="text-2xl font-bold mb-2">{t.session_complete || 'Session Complete! 🎉'}</h2>
            <p className="text-muted-foreground mb-6">
              {tpl(
                t.session_complete_text ||
                  "Great work! You've completed all {rounds} rounds with {participants} participants.",
                { rounds: state.rounds, participants: state.participants.length }
              )}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => exportData('json')}
                className="px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover transition-colors flex items-center gap-2"
              >
                <Download className="w-5 h-5" aria-hidden="true" />
                {tc.export_json || 'Export JSON'}
              </button>
              <button
                onClick={() => exportData('csv')}
                className="px-6 py-3 rounded-lg bg-green-700 text-white hover:bg-green-800 transition-colors flex items-center gap-2"
              >
                <Download className="w-5 h-5" aria-hidden="true" />
                {tc.export_csv || 'Export CSV'}
              </button>
              <button
                onClick={resetSession}
                className="px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-5 h-5" aria-hidden="true" />
                {t.new_session || 'New Session'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrainWritingSession;
