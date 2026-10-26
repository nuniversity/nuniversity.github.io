'use client'

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, Save, X, RotateCcw, BookOpen, ChevronLeft, ChevronRight, Star, Layers, Download, Upload, BarChart3, Sparkles, ArrowLeft } from 'lucide-react';
import { readJson, writeJson } from '@/lib/storage/safe-storage';

interface Flashcard {
  id: number;
  front: string;
  back: string;
  hint?: string;
  ease: number;
  interval: number;
  repetitions: number;
  nextReview: number;
  lastReviewed: number | null;
}

interface Deck {
  id: number;
  name: string;
  description: string;
  cards: Flashcard[];
  created: number;
}

interface FlashcardMakerProps {
  lang: string;
  dict: any;
}

const easeFactors = [1.3, 1.7, 2.0, 2.5];

function tpl(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template
  return Object.entries(vars).reduce((str, [key, val]) => str.replace(new RegExp(`\\{${key}\\}`, 'g'), String(val)), template)
}

const FlashcardMaker = ({ lang = 'en', dict = {} }: FlashcardMakerProps) => {
  const t = dict.tools?.flashcards || {};
  const tc = dict.tools?.common || {};
  const c = dict.common || {};

  const [decks, setDecks] = useState<Deck[]>([]);
  const [activeDeck, setActiveDeck] = useState<number | null>(null);
  const [view, setView] = useState<string>('decks');
  const [newDeckName, setNewDeckName] = useState('');
  const [newDeckDesc, setNewDeckDesc] = useState('');
  const [editingCard, setEditingCard] = useState<{ front: string; back: string; hint: string }>({ front: '', back: '', hint: '' });
  const [editingCardId, setEditingCardId] = useState<number | null>(null);

  // Study mode state
  const [studyQueue, setStudyQueue] = useState<Flashcard[]>([]);
  const [studyIndex, setStudyIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [studiedCount, setStudiedCount] = useState(0);

  useEffect(() => {
    const saved = readJson('flashcard_decks', (raw) => {
      if (!Array.isArray(raw)) return null;
      const decks = raw.filter(
        (d): d is Deck =>
          typeof d === 'object' &&
          d !== null &&
          typeof (d as Deck).id === 'number' &&
          typeof (d as Deck).name === 'string' &&
          Array.isArray((d as Deck).cards)
      );
      return decks;
    });
    if (saved && saved.length > 0) {
      setDecks(saved);
    } else {
      const demo: Deck = {
        id: 1,
        name: t.demo_name || 'Sample Deck',
        description: t.demo_description || 'A demo deck to get started',
        cards: (t.demo_cards ?? [
          { front: 'What is a variable?', back: 'A named storage location in memory that holds a value', hint: 'Storage' },
          { front: 'What is a function?', back: 'A reusable block of code that performs a specific task', hint: 'Reusable code' },
          { front: 'What is an array?', back: 'An ordered collection of elements stored in contiguous memory', hint: 'Collection' },
        ]).map((card: any, i: number) => ({ id: i + 1, front: card.front, back: card.back, hint: card.hint, ease: 2.5, interval: 0, repetitions: 0, nextReview: 0, lastReviewed: null })),
        created: Date.now(),
      };
      setDecks([demo]);
    }
  }, [t.demo_cards, t.demo_description, t.demo_name]);

  useEffect(() => {
    if (decks.length > 0) writeJson('flashcard_decks', decks);
  }, [decks]);

  const currentDeck = useMemo(() => decks.find(d => d.id === activeDeck), [decks, activeDeck]);

  const createDeck = () => {
    if (newDeckName.trim()) {
      const deck: Deck = {
        id: Date.now(),
        name: newDeckName.trim(),
        description: newDeckDesc.trim(),
        cards: [],
        created: Date.now(),
      };
      setDecks(prev => [...prev, deck]);
      setActiveDeck(deck.id);
      setView('edit');
      setNewDeckName('');
      setNewDeckDesc('');
    }
  };

  const deleteDeck = (id: number) => {
    if (confirm(t.confirm_delete_deck || 'Delete this deck and all its cards?')) {
      setDecks(prev => prev.filter(d => d.id !== id));
      if (activeDeck === id) { setActiveDeck(null); setView('decks'); }
    }
  };

  const addCard = () => {
    if (!currentDeck || !editingCard.front.trim() || !editingCard.back.trim()) return;
    const card: Flashcard = {
      id: Date.now(),
      front: editingCard.front.trim(),
      back: editingCard.back.trim(),
      hint: editingCard.hint.trim(),
      ease: 2.5,
      interval: 0,
      repetitions: 0,
      nextReview: 0,
      lastReviewed: null,
    };
    setDecks(prev => prev.map(d => d.id === activeDeck ? { ...d, cards: [...d.cards, card] } : d));
    setEditingCard({ front: '', back: '', hint: '' });
  };

  const updateCard = (cardId: number) => {
    if (!editingCard.front.trim() || !editingCard.back.trim()) return;
    setDecks(prev => prev.map(d => d.id === activeDeck ? {
      ...d,
      cards: d.cards.map(c => c.id === cardId ? { ...c, front: editingCard.front.trim(), back: editingCard.back.trim(), hint: editingCard.hint.trim() } : c),
    } : d));
    setEditingCardId(null);
    setEditingCard({ front: '', back: '', hint: '' });
  };

  const removeCard = (id: number) => {
    setDecks(prev => prev.map(d => d.id === activeDeck ? { ...d, cards: d.cards.filter(c => c.id !== id) } : d));
  };

  const startStudy = () => {
    if (!currentDeck) return;
    const due = currentDeck.cards.filter(c => c.nextReview <= Date.now());
    const newCards = currentDeck.cards.filter(c => c.repetitions === 0);
    const toStudy = [...due, ...newCards];
    const queue = toStudy.length > 0 ? toStudy.sort(() => Math.random() - 0.5) : [...currentDeck.cards].sort(() => Math.random() - 0.5);
    setStudyQueue(queue);
    setStudyIndex(0);
    setFlipped(false);
    setStudiedCount(0);
    setView('study');
  };

  const rateCard = (quality: number) => {
    const card = studyQueue[studyIndex];
    if (!card) return;

    let ease = card.ease;
    let interval = card.interval;
    let repetitions = card.repetitions;

    if (quality >= 3) {
      if (repetitions === 0) interval = 1;
      else if (repetitions === 1) interval = 6;
      else interval = Math.round(interval * ease);
      repetitions++;
    } else {
      repetitions = 0;
      interval = 0;
    }

    ease = Math.max(1.3, ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
    ease = Math.min(3.0, ease);

    const nextReview = Date.now() + interval * 86400000;

    setDecks(prev => prev.map(d => d.id === activeDeck ? {
      ...d,
      cards: d.cards.map(c => c.id === card.id ? { ...c, ease, interval, repetitions, nextReview, lastReviewed: Date.now() } : c),
    } : d));

    setStudiedCount(prev => prev + 1);
    setFlipped(false);
    if (studyIndex < studyQueue.length - 1) {
      setStudyIndex(prev => prev + 1);
    } else {
      setView('stats');
    }
  };

  const cardsToReview = useMemo(() => {
    if (!currentDeck) return 0;
    return currentDeck.cards.filter(c => c.nextReview <= Date.now() || c.repetitions === 0).length;
  }, [currentDeck]);

  const totalCards = currentDeck?.cards.length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 dark:from-slate-950 dark:to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-mark mb-4">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2 bg-brand bg-clip-text text-transparent">
            {t.title || 'Flashcard Maker'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t.subtitle || 'Create, study, and master with spaced repetition'}
          </p>
        </div>

        {/* Deck Selection Bar */}
        {view !== 'study' && view !== 'decks' && currentDeck && (
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            <button onClick={() => setView('decks')} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm"><ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />{t.back_to_decks || 'Decks'}</button>
            <span className="font-semibold text-lg">{currentDeck.name}</span>
            <div className="flex gap-1 ml-auto">
              <button onClick={() => setView('edit')} className={`px-4 py-2 rounded-lg text-sm font-medium ${view === 'edit' ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>{c.edit || 'Edit'}</button>
              <button onClick={startStudy} className={`px-4 py-2 rounded-lg text-sm font-medium ${view === 'study' ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>
                {t.study || 'Study'} {cardsToReview > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-xs">{cardsToReview}</span>}
              </button>
              <button onClick={() => setView('stats')} className={`px-4 py-2 rounded-lg text-sm font-medium ${view === 'stats' ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>{tc.stats || 'Stats'}</button>
            </div>
          </div>
        )}

        {/* Deck List */}
        {view === 'decks' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Layers className="w-5 h-5 text-primary" /> {t.your_decks || 'Your Decks'}</h2>
              {decks.map(deck => (
                <div key={deck.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 mb-3 hover:shadow-md transition-shadow">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{deck.name}</h3>
                    <p className="text-sm text-gray-500">{deck.description}</p>
                    <p className="text-xs text-gray-400 mt-1">{tpl(t.cards_to_review || '{n} cards · {m} to review', { n: deck.cards.length, m: deck.cards.filter(c => c.nextReview <= Date.now() || c.repetitions === 0).length })}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setActiveDeck(deck.id); setView('edit'); }} className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-hover text-sm">{t.open || 'Open'}</button>
                    <button onClick={() => deleteDeck(deck.id)} className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900 text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>

            {/* Create Deck */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Plus className="w-5 h-5 text-primary" /> {t.new_deck || 'New Deck'}</h3>
              <div className="flex gap-3 mb-3">
                <input type="text" value={newDeckName} onChange={(e) => setNewDeckName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && createDeck()} placeholder={t.deck_name_placeholder || 'Deck name...'} className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary outline-none" />
                <input type="text" value={newDeckDesc} onChange={(e) => setNewDeckDesc(e.target.value)} placeholder={t.description_placeholder || 'Description...'} className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary outline-none" />
                <button onClick={createDeck} className="px-6 py-2 rounded-lg bg-brand text-white hover:shadow-lg transition-all">{t.create || 'Create'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Edit View */}
        {view === 'edit' && currentDeck && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
              <h2 className="text-lg font-semibold mb-4">{tpl(t.cards_count || 'Cards ({n})', { n: currentDeck.cards.length })}</h2>
              {currentDeck.cards.length === 0 ? (
                <p className="text-center text-gray-400 py-8">{t.no_cards || 'No cards yet. Add your first card below!'}</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {currentDeck.cards.map(card => (
                    <div key={card.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700">
                      {editingCardId === card.id ? (
                        <div className="flex-1 space-y-2">
                          <input type="text" value={editingCard.front} onChange={(e) => setEditingCard(prev => ({ ...prev, front: e.target.value }))} placeholder={t.front || 'Front'} className="w-full px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-primary outline-none" />
                          <input type="text" value={editingCard.back} onChange={(e) => setEditingCard(prev => ({ ...prev, back: e.target.value }))} placeholder={t.back || 'Back'} className="w-full px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-primary outline-none" />
                          <input type="text" value={editingCard.hint} onChange={(e) => setEditingCard(prev => ({ ...prev, hint: e.target.value }))} placeholder={t.hint || 'Hint (optional)'} className="w-full px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-primary outline-none" />
                          <div className="flex gap-2">
                            <button onClick={() => updateCard(card.id)} className="px-3 py-1 rounded bg-green-600 text-white text-xs flex items-center gap-1"><Save className="w-3 h-3" /> {c.save || 'Save'}</button>
                            <button onClick={() => setEditingCardId(null)} className="px-3 py-1 rounded bg-gray-400 text-white text-xs flex items-center gap-1"><X className="w-3 h-3" /> {c.cancel || 'Cancel'}</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{card.front}</p>
                            <p className="text-sm text-gray-500 truncate">{card.back}</p>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => { setEditingCardId(card.id); setEditingCard({ front: card.front, back: card.back, hint: card.hint || '' }); }} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600"><Edit2 className="w-3.5 h-3.5" /></button>
                            <button onClick={() => removeCard(card.id)} className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Plus className="w-5 h-5 text-primary" /> {t.add_card || 'Add Card'}</h3>
              <div className="space-y-3">
                <input type="text" value={editingCard.front} onChange={(e) => setEditingCard(prev => ({ ...prev, front: e.target.value }))} onKeyDown={(e) => e.key === 'Enter' && addCard()} placeholder={t.front_question || 'Front (question)'} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary outline-none" />
                <textarea value={editingCard.back} onChange={(e) => setEditingCard(prev => ({ ...prev, back: e.target.value }))} placeholder={t.back_answer || 'Back (answer)'} rows={2} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary outline-none resize-none" />
                <input type="text" value={editingCard.hint} onChange={(e) => setEditingCard(prev => ({ ...prev, hint: e.target.value }))} placeholder={t.hint || 'Hint (optional)'} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary outline-none" />
                <button onClick={addCard} className="px-6 py-2 rounded-lg bg-brand text-white hover:shadow-lg transition-all flex items-center gap-2"><Plus className="w-4 h-4" /> {t.add_card || 'Add Card'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Study View */}
        {view === 'study' && studyQueue.length > 0 && studyIndex < studyQueue.length && (
          <div className="max-w-lg mx-auto">
            <div className="text-center mb-4">
              <span className="text-sm text-gray-500">{tpl(t.card_progress || 'Card {i} of {n} · Studied: {s}', { i: studyIndex + 1, n: studyQueue.length, s: studiedCount })}</span>
              <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full mt-2">
                <div className="h-1 bg-primary rounded-full transition-all" style={{ width: `${((studyIndex + 1) / studyQueue.length) * 100}%` }} />
              </div>
            </div>

            <div className="perspective-1000 cursor-pointer mb-6" onClick={() => setFlipped(!flipped)}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={flipped ? 'back' : 'front'}
                  initial={{ rotateY: flipped ? -90 : 90, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  exit={{ rotateY: -90, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-10 min-h-[280px] flex flex-col items-center justify-center text-center border-2 border-primary/25 dark:border-primary/30"
                >
                  {!flipped ? (
                    <>
                      <Sparkles className="w-6 h-6 text-primary mb-4" />
                      <p className="text-2xl font-semibold mb-4">{studyQueue[studyIndex].front}</p>
                      <p className="text-sm text-gray-400">{t.tap_to_reveal || 'Tap to reveal answer'}</p>
                    </>
                  ) : (
                    <>
                      <Star className="w-6 h-6 text-primary mb-4" />
                      <p className="text-2xl font-semibold mb-4">{studyQueue[studyIndex].back}</p>
                      {studyQueue[studyIndex].hint && (
                        <p className="text-sm text-gray-500 italic">💡 {studyQueue[studyIndex].hint}</p>
                      )}
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {flipped && (
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: t.rating_again || 'Again', desc: t.rating_again_sub || 'Forgot', color: 'bg-red-600', quality: 1 },
                  { label: t.rating_hard || 'Hard', desc: t.rating_hard_sub || 'Difficult', color: 'bg-orange-500', quality: 2 },
                  { label: t.rating_good || 'Good', desc: t.rating_good_sub || 'Recalled', color: 'bg-blue-600', quality: 3 },
                  { label: t.rating_easy || 'Easy', desc: t.rating_easy_sub || 'Perfect', color: 'bg-green-600', quality: 5 },
                ].map(btn => (
                  <button key={btn.quality} onClick={() => rateCard(btn.quality)} className={`${btn.color} text-white p-3 rounded-xl hover:shadow-lg transition-all text-center`}>
                    <div className="font-bold text-sm">{btn.label}</div>
                    <div className="text-xs opacity-80">{btn.desc}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Stats View */}
        {view === 'stats' && currentDeck && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-primary" /> {t.deck_statistics || 'Deck Statistics'}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-primary-soft to-cyan-50 dark:from-primary/10 rounded-xl p-4 border border-primary/25 dark:border-primary/30">
                <div className="text-xs text-gray-500 mb-1">{t.total_cards || 'Total Cards'}</div>
                <div className="text-2xl font-bold text-primary">{currentDeck.cards.length}</div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                <div className="text-xs text-gray-500 mb-1">{t.stat_new || 'New (unstudied)'}</div>
                <div className="text-2xl font-bold text-green-600">{currentDeck.cards.filter(c => c.repetitions === 0).length}</div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                <div className="text-xs text-gray-500 mb-1">{t.learning || 'Learning'}</div>
                <div className="text-2xl font-bold text-blue-600">{currentDeck.cards.filter(c => c.repetitions > 0 && c.repetitions < 3).length}</div>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
                <div className="text-xs text-gray-500 mb-1">{t.to_review || 'To Review'}</div>
                <div className="text-2xl font-bold text-amber-600">{cardsToReview}</div>
              </div>
            </div>

            {currentDeck.cards.filter(c => c.lastReviewed).length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">{t.recently_studied || 'Recently Studied'}</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {currentDeck.cards.filter(c => c.lastReviewed).sort((a, b) => (b.lastReviewed || 0) - (a.lastReviewed || 0)).slice(0, 10).map(card => {
                    const nextReviewDate = new Date(card.nextReview);
                    return (
                      <div key={card.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-sm">
                        <span className="font-medium truncate flex-1">{card.front}</span>
                        <span className="text-gray-500 mx-4">{tpl(t.ease || 'Ease: {e}', { e: card.ease.toFixed(1) })}</span>
                        <span className="text-gray-500">{nextReviewDate.toLocaleDateString()}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <button onClick={() => setView('decks')} className="mt-6 px-6 py-2 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors">{t.back_to_decks || '← Back to Decks'}</button>
          </div>
        )}

        {/* Empty study state */}
        {view === 'study' && (studyQueue.length === 0 || studyIndex >= studyQueue.length) && (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
            <Sparkles className="w-16 h-16 mx-auto mb-4 text-primary" />
            <h2 className="text-2xl font-bold mb-2">{t.study_complete || 'Study Complete!'}</h2>
            <p className="text-gray-500 mb-6">{tpl(t.study_complete_text || 'You reviewed {n} cards in this session.', { n: studiedCount })}</p>
            <button onClick={() => setView('edit')} className="px-6 py-3 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors">{t.back_to_deck || 'Back to Deck'}</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlashcardMaker;
