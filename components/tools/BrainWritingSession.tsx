'use client'

import React, { useState, useEffect, useRef } from 'react';
import { Users, Download, Plus, Trash2, Copy, RefreshCw, Clock, Lightbulb, Grid, List, Save, ChevronRight, CheckCircle2 } from 'lucide-react';
import { type Locale } from '@/lib/i18n/config';

interface BrainWritingSessionProps {
  lang: Locale;
  dict: any;
}

const BrainWritingSession = ({ lang = 'en', dict = {} }: BrainWritingSessionProps) => {
  const [sessionName, setSessionName] = useState('');
  const [method, setMethod] = useState('6-3-5');
  const [participants, setParticipants] = useState<string[]>([]);
  const [newParticipant, setNewParticipant] = useState('');
  const [rounds, setRounds] = useState(3);
  const [timePerRound, setTimePerRound] = useState(5);
  const [currentRound, setCurrentRound] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [ideas, setIdeas] = useState<Record<string, string[]>>({});
  const [completedRounds, setCompletedRounds] = useState<Array<{ round: number; ideas: Record<string, string[]> }>>([]);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const methods = {
    '6-3-5': {
      name: 'Brain-Writing 6-3-5',
      description: '6 participants, 3 ideas each, 5 minutes per round',
      defaultParticipants: 6,
      ideasPerRound: 3,
      defaultTime: 5,
    },
    'constrained': {
      name: 'Constrained Brain-Writing',
      description: 'Ideas must build on or relate to previous ideas',
      defaultParticipants: 4,
      ideasPerRound: 2,
      defaultTime: 7,
    },
    'free': {
      name: 'Free Brain-Writing',
      description: 'Open format with flexible idea generation',
      defaultParticipants: 5,
      ideasPerRound: 3,
      defaultTime: 5,
    },
  };

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      handleRoundComplete();
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeLeft, isActive]);

  const addParticipant = () => {
    if (newParticipant.trim() && !participants.includes(newParticipant.trim())) {
      setParticipants([...participants, newParticipant.trim()]);
      setNewParticipant('');
    }
  };

  const removeParticipant = (name: string) => {
    setParticipants(participants.filter(p => p !== name));
  };

  const startSession = () => {
    if (participants.length === 0 || !sessionName) return;
    
    const initialIdeas: Record<string, string[]> = {};
    participants.forEach(p => {
      initialIdeas[p] = Array(methods[method as keyof typeof methods].ideasPerRound).fill('');
    });
    setIdeas(initialIdeas);
    setCurrentRound(1);
    setTimeLeft(timePerRound * 60);
    setIsActive(true);
  };

  const handleRoundComplete = () => {
    setIsActive(false);
    setCompletedRounds([...completedRounds, { round: currentRound, ideas: JSON.parse(JSON.stringify(ideas)) }]);
    
    if (currentRound < rounds) {
      // Rotate ideas for next round
      const rotatedIdeas: Record<string, string[]> = {};
      const participantsList = Object.keys(ideas);
      participantsList.forEach((participant, index) => {
        const nextIndex = (index + 1) % participantsList.length;
        const nextParticipant = participantsList[nextIndex];
        rotatedIdeas[participant] = [...ideas[nextParticipant]];
      });
      setIdeas(rotatedIdeas);
    }
  };

  const nextRound = () => {
    if (currentRound < rounds) {
      setCurrentRound(currentRound + 1);
      setTimeLeft(timePerRound * 60);
      setIsActive(true);
      
      // Clear ideas for new round
      const clearedIdeas: Record<string, string[]> = {};
      Object.keys(ideas).forEach(p => {
        clearedIdeas[p] = Array(methods[method as keyof typeof methods].ideasPerRound).fill('');
      });
      setIdeas(clearedIdeas);
    }
  };

  const updateIdea = (participant: string, index: number, value: string) => {
    setIdeas({
      ...ideas,
      [participant]: ideas[participant].map((idea, i) => i === index ? value : idea),
    });
  };

  const exportData = (format: 'json' | 'csv') => {
    const data = {
      sessionName,
      method: methods[method as keyof typeof methods].name,
      participants,
      rounds: completedRounds,
      timestamp: new Date().toISOString(),
    };

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `brainwriting-${sessionName.replace(/\s+/g, '-')}-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'csv') {
      let csv = 'Session,Method,Round,Participant,Idea Number,Idea\n';
      completedRounds.forEach(round => {
        Object.entries(round.ideas).forEach(([participant, participantIdeas]) => {
          participantIdeas.forEach((idea, index) => {
            csv += `"${sessionName}","${methods[method as keyof typeof methods].name}",${round.round},"${participant}",${index + 1},"${idea.replace(/"/g, '""')}"\n`;
          });
        });
      });
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `brainwriting-${sessionName.replace(/\s+/g, '-')}-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const resetSession = () => {
    setSessionName('');
    setParticipants([]);
    setIdeas({});
    setCurrentRound(0);
    setIsActive(false);
    setTimeLeft(0);
    setCompletedRounds([]);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (currentRound === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 mb-4">
              <Lightbulb className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Brain-Writing Session
            </h1>
            <p className="text-muted-foreground text-lg">
              Collaborative ideation made simple and structured
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 space-y-8">
            <div>
              <label className="block text-sm font-semibold mb-2">Session Name *</label>
              <input
                type="text"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="e.g., Product Innovation Workshop"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Brain-Writing Method</label>
              <div className="grid gap-3">
                {Object.entries(methods).map(([key, m]) => (
                  <label
                    key={key}
                    className={`flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      method === key
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="method"
                      value={key}
                      checked={method === key}
                      onChange={(e) => setMethod(e.target.value)}
                      className="mt-1 mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-semibold">{m.name}</div>
                      <div className="text-sm text-muted-foreground">{m.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Number of Rounds</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={rounds}
                  onChange={(e) => setRounds(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Time per Round (minutes)</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={timePerRound}
                  onChange={(e) => setTimePerRound(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Participants *</label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newParticipant}
                  onChange={(e) => setNewParticipant(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addParticipant()}
                  placeholder="Enter participant name"
                  className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-purple-500 outline-none"
                />
                <button
                  onClick={addParticipant}
                  className="px-6 py-3 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
              
              {participants.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {participants.map((p) => (
                    <div
                      key={p}
                      className="flex items-center gap-2 px-3 py-2 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                    >
                      <Users className="w-4 h-4" />
                      <span>{p}</span>
                      <button
                        onClick={() => removeParticipant(p)}
                        className="hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <p className="text-sm text-muted-foreground mt-2">
                Recommended: {methods[method as keyof typeof methods].defaultParticipants} participants
              </p>
            </div>

            <button
              onClick={startSession}
              disabled={participants.length === 0 || !sessionName}
              className="w-full py-4 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Start Brain-Writing Session
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">{sessionName}</h2>
              <p className="text-muted-foreground">{methods[method as keyof typeof methods].name}</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <span className="font-mono text-xl font-bold">{formatTime(timeLeft)}</span>
              </div>
              
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <span className="text-sm font-semibold">Round {currentRound} / {rounds}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            <button
              onClick={() => setIsActive(!isActive)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isActive
                  ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              {isActive ? 'Pause' : 'Resume'}
            </button>
            
            <button
              onClick={() => setView(view === 'grid' ? 'list' : 'grid')}
              className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
            >
              {view === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
              {view === 'grid' ? 'List View' : 'Grid View'}
            </button>
            
            {completedRounds.length > 0 && (
              <>
                <button
                  onClick={() => exportData('json')}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  JSON
                </button>
                <button
                  onClick={() => exportData('csv')}
                  className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  CSV
                </button>
              </>
            )}
            
            <button
              onClick={resetSession}
              className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reset
            </button>
          </div>
        </div>

        <div className={view === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
          {Object.entries(ideas).map(([participant, participantIdeas]) => (
            <div
              key={participant}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-2 border-purple-200 dark:border-purple-800"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold">
                  {participant.charAt(0).toUpperCase()}
                </div>
                <h3 className="font-semibold text-lg">{participant}</h3>
              </div>
              
              <div className="space-y-3">
                {participantIdeas.map((idea, index) => (
                  <div key={index}>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">
                      Idea {index + 1}
                    </label>
                    <textarea
                      value={idea}
                      onChange={(e) => updateIdea(participant, index, e.target.value)}
                      placeholder="Enter your idea..."
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                      rows={3}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {!isActive && currentRound < rounds && (
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <h3 className="text-xl font-bold mb-2">Round {currentRound} Complete!</h3>
            <p className="text-muted-foreground mb-4">Ready to move to the next round?</p>
            <button
              onClick={nextRound}
              className="px-8 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:shadow-lg transition-all flex items-center gap-2 mx-auto"
            >
              Start Round {currentRound + 1}
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {currentRound === rounds && !isActive && (
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Session Complete! 🎉</h3>
            <p className="text-muted-foreground mb-6">
              Great work! You've completed all {rounds} rounds with {participants.length} participants.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => exportData('json')}
                className="px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                Export JSON
              </button>
              <button
                onClick={() => exportData('csv')}
                className="px-6 py-3 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                Export CSV
              </button>
              <button
                onClick={resetSession}
                className="px-6 py-3 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                New Session
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrainWritingSession;