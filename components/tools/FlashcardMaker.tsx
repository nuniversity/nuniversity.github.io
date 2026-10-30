'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, Save, X, BookOpen, Layers, Download, BarChart3, Sparkles, ArrowLeft, Star } from 'lucide-react';
import { usePersistentState } from '@/lib/tools/use-persistent-state';
import { createId } from '@/lib/tools/ids';
import { interpolate as tpl } from '@/lib/tools/template';
import { DEFAULT_EASE, isCardDue, reviewCard } from '@/lib/tools/srs';
import { buildStudyQueue } from '@/lib/tools/flashcards';
import { safeGet, safeSet } from '@/lib/storage/safe-storage';
import { downloadJson, sanitizeFilename } from '@/lib/tools/download';
import { ToolHeader } from './shared/ToolHeader';

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

interface CardDraft {
  front: string;
  back: string;
  hint: string;
}

const EMPTY_DRAFT: CardDraft = { front: '', back: '', hint: '' };
const SEED_MARKER = 'mimir:tools:flashcards_seeded';

function isFlashcard(value: unknown): value is Flashcard {
  if (!value || typeof value !== 'object') return false;
  const card = value as Partial<Flashcard>;
  return typeof card.id === 'number' && typeof card.front === 'string' && typeof card.back === 'string';
}

function normaliseCard(card: Flashcard): Flashcard {
  return {
    id: card.id,
    front: card.front,
    back: card.back,
    hint: typeof card.hint === 'string' ? card.hint : '',
    ease: typeof card.ease === 'number' && Number.isFinite(card.ease) ? card.ease : DEFAULT_EASE,
    interval: typeof card.interval === 'number' && card.interval >= 0 ? card.interval : 0,
    repetitions: typeof card.repetitions === 'number' && card.repetitions >= 0 ? card.repetitions : 0,
    nextReview: typeof card.nextReview === 'number' ? card.nextReview : 0,
    lastReviewed: typeof card.lastReviewed === 'number' ? card.lastReviewed : null,
  };
}

function validateDecks(raw: unknown): Deck[] | null {
  if (!Array.isArray(raw)) return null;
  return raw
    .filter(
      (deck): deck is Deck =>
        Boolean(deck) &&
        typeof deck === 'object' &&
        typeof (deck as Deck).id === 'number' &&
        typeof (deck as Deck).name === 'string' &&
        Array.isArray((deck as Deck).cards)
    )
    .map((deck) => ({
      id: deck.id,
      name: deck.name,
      description: typeof deck.description === 'string' ? deck.description : '',
      created: typeof deck.created === 'number' ? deck.created : Date.now(),
      cards: deck.cards.filter(isFlashcard).map(normaliseCard),
    }));
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const FlashcardMaker = ({ lang = 'en', dict = {} }: FlashcardMakerProps) => {
  const t = dict.tools?.flashcards || {};
  const tc = dict.tools?.common || {};
  const c = dict.common || {};

  const [decks, setDecks, hydrated] = usePersistentState<Deck[]>(
    'mimir:tools:flashcard_decks',
    [],
    validateDecks,
    { legacyKeys: ['flashcard_decks'] }
  );
  const [activeDeckId, setActiveDeckId] = useState<number | null>(null);
  const [view, setView] = useState<'decks' | 'edit' | 'study' | 'stats'>('decks');
  const [newDeckName, setNewDeckName] = useState('');
  const [newDeckDesc, setNewDeckDesc] = useState('');
  const [draft, setDraft] = useState<CardDraft>(EMPTY_DRAFT);
  const [editing, setEditing] = useState<(CardDraft & { cardId: number }) | null>(null);
  const [pendingDelete, setPendingDelete] = useState<number | null>(null);

  // Study state
  const [studyQueue, setStudyQueue] = useState<Flashcard[]>([]);
  const [studyIndex, setStudyIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [studiedCount, setStudiedCount] = useState(0);
  const requeued = useRef<Set<number>>(new Set());

  // Seed the sample deck exactly once. Deleting every deck stays deleted.
  useEffect(() => {
    if (!hydrated) return;
    if (decks.length > 0 || safeGet(SEED_MARKER) === '1') return;
    const demoCards = (t.demo_cards ?? [
      { front: 'What is a variable?', back: 'A named storage location in memory that holds a value', hint: 'Storage' },
      { front: 'What is a function?', back: 'A reusable block of code that performs a specific task', hint: 'Reusable code' },
      { front: 'What is an array?', back: 'An ordered collection of elements stored in contiguous memory', hint: 'Collection' },
    ]) as Array<{ front: string; back: string; hint?: string }>;
    const demo: Deck = {
      id: createId(),
      name: t.demo_name || 'Sample Deck',
      description: t.demo_description || 'A demo deck to get started',
      cards: demoCards.map((card) => ({
        id: createId(),
        front: card.front,
        back: card.back,
        hint: card.hint || '',
        ease: DEFAULT_EASE,
        interval: 0,
        repetitions: 0,
        nextReview: 0,
        lastReviewed: null,
      })),
      created: Date.now(),
    };
    safeSet(SEED_MARKER, '1');
    setDecks([demo]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  const currentDeck = useMemo(
    () => decks.find((deck) => deck.id === activeDeckId),
    [decks, activeDeckId]
  );

  const openDeck = (id: number) => {
    setActiveDeckId(id);
    setView('edit');
  };

  const createDeck = () => {
    if (!newDeckName.trim()) return;
    const deck: Deck = {
      id: createId(),
      name: newDeckName.trim(),
      description: newDeckDesc.trim(),
      cards: [],
      created: Date.now(),
    };
    setDecks((prev) => [...prev, deck]);
    setActiveDeckId(deck.id);
    setView('edit');
    setNewDeckName('');
    setNewDeckDesc('');
  };

  const deleteDeck = (id: number) => {
    setDecks((prev) => prev.filter((deck) => deck.id !== id));
    if (activeDeckId === id) {
      setActiveDeckId(null);
      setView('decks');
    }
    setPendingDelete(null);
  };

  const addCard = () => {
    if (!currentDeck || !draft.front.trim() || !draft.back.trim()) return;
    const card: Flashcard = {
      id: createId(),
      front: draft.front.trim(),
      back: draft.back.trim(),
      hint: draft.hint.trim(),
      ease: DEFAULT_EASE,
      interval: 0,
      repetitions: 0,
      nextReview: 0,
      lastReviewed: null,
    };
    setDecks((prev) =>
      prev.map((deck) =>
        deck.id === currentDeck.id ? { ...deck, cards: [...deck.cards, card] } : deck
      )
    );
    setDraft(EMPTY_DRAFT);
  };

  const saveCard = () => {
    if (!editing || !currentDeck) return;
    if (!editing.front.trim() || !editing.back.trim()) return;
    const { cardId, front, back, hint } = editing;
    setDecks((prev) =>
      prev.map((deck) =>
        deck.id === currentDeck.id
          ? {
              ...deck,
              cards: deck.cards.map((card) =>
                card.id === cardId
                  ? { ...card, front: front.trim(), back: back.trim(), hint: hint.trim() }
                  : card
              ),
            }
          : deck
      )
    );
    setEditing(null);
  };

  const removeCard = (id: number) => {
    if (!currentDeck) return;
    setDecks((prev) =>
      prev.map((deck) =>
        deck.id === currentDeck.id
          ? { ...deck, cards: deck.cards.filter((card) => card.id !== id) }
          : deck
      )
    );
    if (editing?.cardId === id) setEditing(null);
  };

  const startStudy = () => {
    if (!currentDeck) return;
    // `buildStudyQueue` guarantees a card is queued at most once; new cards
    // used to appear in both the `due` and `new` buckets.
    const queue = buildStudyQueue(currentDeck.cards, Date.now(), shuffle);
    requeued.current = new Set();
    setStudyQueue(queue);
    setStudyIndex(0);
    setFlipped(false);
    setStudiedCount(0);
    setView('study');
  };

  const rateCard = (quality: number) => {
    const card = studyQueue[studyIndex];
    if (!card || !currentDeck) return;

    const outcome = reviewCard(card, quality);
    setDecks((prev) =>
      prev.map((deck) =>
        deck.id === currentDeck.id
          ? {
              ...deck,
              cards: deck.cards.map((item) =>
                item.id === card.id
                  ? {
                      ...item,
                      ease: outcome.ease,
                      interval: outcome.interval,
                      repetitions: outcome.repetitions,
                      nextReview: outcome.nextReview,
                      lastReviewed: outcome.lastReviewed,
                    }
                  : item
              ),
            }
          : deck
      )
    );

    setStudiedCount((prev) => prev + 1);
    setFlipped(false);

    // Failed cards come back once at the end of the same session.
    let requeue = false;
    if (outcome.relearn && !requeued.current.has(card.id)) {
      requeued.current.add(card.id);
      requeue = true;
      setStudyQueue((prev) => [...prev, { ...card, ...outcome }]);
    }

    const hasNext = studyIndex < studyQueue.length - 1 || requeue;
    if (hasNext) setStudyIndex((prev) => prev + 1);
    else setView('stats');
  };

  const cardsToReview = useMemo(() => {
    if (!currentDeck) return 0;
    const now = Date.now();
    return currentDeck.cards.filter((card) => isCardDue(card, now)).length;
  }, [currentDeck]);

  const exportDeck = () => {
    if (!currentDeck) return;
    downloadJson(currentDeck, `flashcards-${sanitizeFilename(currentDeck.name, 'deck')}.json`);
  };

  const currentCard = studyQueue[studyIndex];
  const progress = studyQueue.length > 0 ? ((studyIndex + 1) / studyQueue.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <ToolHeader
          icon={BookOpen}
          title={t.title || 'Flashcard Maker'}
          subtitle={t.subtitle || 'Create, study, and master with spaced repetition'}
          variant="brand"
        />

        {view !== 'study' && view !== 'decks' && currentDeck && (
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            <button
              onClick={() => setView('decks')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-muted hover:opacity-80 transition-colors text-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              {t.back_to_decks || 'Decks'}
            </button>
            <span className="font-semibold text-lg">{currentDeck.name}</span>
            <div className="flex gap-1 ml-auto">
              <button
                onClick={() => setView('edit')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  view === 'edit' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:opacity-80'
                }`}
              >
                {c.edit || 'Edit'}
              </button>
              <button
                onClick={startStudy}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-muted hover:opacity-80"
              >
                {t.study || 'Study'}
                {cardsToReview > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-600 text-white text-xs">
                    {cardsToReview}
                  </span>
                )}
              </button>
              <button
                onClick={() => setView('stats')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  view === 'stats' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:opacity-80'
                }`}
              >
                {tc.stats || 'Stats'}
              </button>
              <button
                onClick={exportDeck}
                aria-label={t.export_deck || 'Export deck as JSON'}
                className="px-3 py-2 rounded-lg text-sm font-medium bg-muted hover:opacity-80"
              >
                <Download className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}

        {view === 'decks' && (
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" aria-hidden="true" />
                {t.your_decks || 'Your Decks'}
              </h2>
              {decks.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  {t.no_cards || 'No cards yet. Add your first card below!'}
                </p>
              )}
              {decks.map((deck) => (
                <div
                  key={deck.id}
                  className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-muted/50 border border-border mb-3"
                >
                  <div className="flex-1 min-w-[200px]">
                    <h3 className="font-semibold text-lg">{deck.name}</h3>
                    <p className="text-sm text-muted-foreground">{deck.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {tpl(t.cards_to_review || '{n} cards · {m} to review', {
                        n: deck.cards.length,
                        m: deck.cards.filter((card) => isCardDue(card)).length,
                      })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openDeck(deck.id)}
                      className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover text-sm"
                    >
                      {t.open || 'Open'}
                    </button>
                    {pendingDelete === deck.id ? (
                      <div className="flex gap-1">
                        <button
                          onClick={() => deleteDeck(deck.id)}
                          className="px-3 py-2 rounded-lg bg-red-600 text-white text-sm"
                        >
                          {t.confirm_short || 'Delete'}
                        </button>
                        <button
                          onClick={() => setPendingDelete(null)}
                          className="px-3 py-2 rounded-lg bg-muted text-sm"
                        >
                          {c.cancel || 'Cancel'}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setPendingDelete(deck.id)}
                        aria-label={`${t.confirm_delete_deck || 'Delete this deck'} — ${deck.name}`}
                        className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 text-red-500"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-card border border-border rounded-2xl shadow-xl p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" aria-hidden="true" />
                {t.new_deck || 'New Deck'}
              </h2>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  id="flashcard-deck-name"
                  type="text"
                  value={newDeckName}
                  onChange={(event) => setNewDeckName(event.target.value)}
                  onKeyDown={(event) => event.key === 'Enter' && createDeck()}
                  placeholder={t.deck_name_placeholder || 'Deck name...'}
                  aria-label={t.deck_name_placeholder || 'Deck name'}
                  className="flex-1 px-4 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary outline-none"
                />
                <input
                  type="text"
                  value={newDeckDesc}
                  onChange={(event) => setNewDeckDesc(event.target.value)}
                  onKeyDown={(event) => event.key === 'Enter' && createDeck()}
                  placeholder={t.description_placeholder || 'Description...'}
                  aria-label={t.description_placeholder || 'Description'}
                  className="flex-1 px-4 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary outline-none"
                />
                <button
                  onClick={createDeck}
                  className="px-6 py-2 rounded-lg bg-brand text-white hover:shadow-lg transition-all"
                >
                  {t.create || 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}

        {view === 'edit' && currentDeck && (
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-2xl shadow-xl p-6">
              <h2 className="text-lg font-semibold mb-4">
                {tpl(t.cards_count || 'Cards ({n})', { n: currentDeck.cards.length })}
              </h2>
              {currentDeck.cards.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {t.no_cards || 'No cards yet. Add your first card below!'}
                </p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {currentDeck.cards.map((card) => (
                    <div
                      key={card.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border"
                    >
                      {editing?.cardId === card.id ? (
                        <div className="flex-1 space-y-2">
                          <input
                            type="text"
                            value={editing.front}
                            onChange={(event) => setEditing((prev) => (prev ? { ...prev, front: event.target.value } : prev))}
                            aria-label={t.front || 'Front'}
                            className="w-full px-3 py-1.5 rounded border border-border bg-background text-sm focus:ring-2 focus:ring-primary outline-none"
                          />
                          <input
                            type="text"
                            value={editing.back}
                            onChange={(event) => setEditing((prev) => (prev ? { ...prev, back: event.target.value } : prev))}
                            aria-label={t.back || 'Back'}
                            className="w-full px-3 py-1.5 rounded border border-border bg-background text-sm focus:ring-2 focus:ring-primary outline-none"
                          />
                          <input
                            type="text"
                            value={editing.hint}
                            onChange={(event) => setEditing((prev) => (prev ? { ...prev, hint: event.target.value } : prev))}
                            aria-label={t.hint || 'Hint'}
                            className="w-full px-3 py-1.5 rounded border border-border bg-background text-sm focus:ring-2 focus:ring-primary outline-none"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={saveCard}
                              className="px-3 py-1 rounded bg-green-600 text-white text-xs flex items-center gap-1"
                            >
                              <Save className="w-3 h-3" aria-hidden="true" /> {c.save || 'Save'}
                            </button>
                            <button
                              onClick={() => setEditing(null)}
                              className="px-3 py-1 rounded bg-muted text-xs flex items-center gap-1"
                            >
                              <X className="w-3 h-3" aria-hidden="true" /> {c.cancel || 'Cancel'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{card.front}</p>
                            <p className="text-sm text-muted-foreground truncate">{card.back}</p>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => setEditing({ cardId: card.id, front: card.front, back: card.back, hint: card.hint || '' })}
                              aria-label={`${c.edit || 'Edit'} ${card.front}`}
                              className="p-2 rounded hover:bg-muted"
                            >
                              <Edit2 className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                            <button
                              onClick={() => removeCard(card.id)}
                              aria-label={`${t.delete || 'Delete'} ${card.front}`}
                              className="p-2 rounded hover:bg-red-100 dark:hover:bg-red-900/40"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-500" aria-hidden="true" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-card border border-border rounded-2xl shadow-xl p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" aria-hidden="true" />
                {t.add_card || 'Add Card'}
              </h2>
              <div className="space-y-3">
                <input
                  type="text"
                  value={draft.front}
                  onChange={(event) => setDraft((prev) => ({ ...prev, front: event.target.value }))}
                  onKeyDown={(event) => event.key === 'Enter' && addCard()}
                  placeholder={t.front_question || 'Front (question)'}
                  aria-label={t.front_question || 'Front (question)'}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary outline-none"
                />
                <textarea
                  value={draft.back}
                  onChange={(event) => setDraft((prev) => ({ ...prev, back: event.target.value }))}
                  placeholder={t.back_answer || 'Back (answer)'}
                  aria-label={t.back_answer || 'Back (answer)'}
                  rows={2}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary outline-none resize-none"
                />
                <input
                  type="text"
                  value={draft.hint}
                  onChange={(event) => setDraft((prev) => ({ ...prev, hint: event.target.value }))}
                  placeholder={t.hint || 'Hint (optional)'}
                  aria-label={t.hint || 'Hint (optional)'}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary outline-none"
                />
                <button
                  onClick={addCard}
                  disabled={!draft.front.trim() || !draft.back.trim()}
                  className="px-6 py-2 rounded-lg bg-brand text-white hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" /> {t.add_card || 'Add Card'}
                </button>
              </div>
            </div>
          </div>
        )}

        {view === 'study' && currentCard && (
          <div className="max-w-lg mx-auto">
            <div className="text-center mb-4">
              <span className="text-sm text-muted-foreground">
                {tpl(t.card_progress || 'Card {i} of {n} · Studied: {s}', {
                  i: studyIndex + 1,
                  n: studyQueue.length,
                  s: studiedCount,
                })}
              </span>
              <div
                className="w-full h-1 bg-muted rounded-full mt-2"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress)}
              >
                <div className="h-1 bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <div
              role="button"
              tabIndex={0}
              aria-label={flipped ? currentCard.back : `${currentCard.front}. ${t.tap_to_reveal || 'Tap to reveal answer'}`}
              onClick={() => setFlipped((prev) => !prev)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setFlipped((prev) => !prev);
                }
              }}
              className="perspective-1000 cursor-pointer mb-6 rounded-2xl focus-visible:ring-2 focus-visible:ring-primary"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={flipped ? 'back' : 'front'}
                  initial={{ rotateY: flipped ? -90 : 90, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  exit={{ rotateY: -90, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-card rounded-2xl shadow-xl p-8 sm:p-10 min-h-[280px] flex flex-col items-center justify-center text-center border-2 border-primary/25"
                >
                  {!flipped ? (
                    <>
                      <Sparkles className="w-6 h-6 text-primary mb-4" aria-hidden="true" />
                      <p className="text-2xl font-semibold mb-4">{currentCard.front}</p>
                      <p className="text-sm text-muted-foreground">{t.tap_to_reveal || 'Tap to reveal answer'}</p>
                    </>
                  ) : (
                    <>
                      <Star className="w-6 h-6 text-primary mb-4" aria-hidden="true" />
                      <p className="text-2xl font-semibold mb-4">{currentCard.back}</p>
                      {currentCard.hint && (
                        <p className="text-sm text-muted-foreground italic">💡 {currentCard.hint}</p>
                      )}
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {flipped && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: t.rating_again || 'Again', desc: t.rating_again_sub || 'Forgot', color: 'bg-red-600', quality: 1 },
                  { label: t.rating_hard || 'Hard', desc: t.rating_hard_sub || 'Difficult', color: 'bg-orange-500', quality: 2 },
                  { label: t.rating_good || 'Good', desc: t.rating_good_sub || 'Recalled', color: 'bg-blue-600', quality: 3 },
                  { label: t.rating_easy || 'Easy', desc: t.rating_easy_sub || 'Perfect', color: 'bg-green-600', quality: 5 },
                ].map((button) => (
                  <button
                    key={button.quality}
                    onClick={() => rateCard(button.quality)}
                    className={`${button.color} text-white p-3 rounded-xl hover:shadow-lg transition-all text-center`}
                  >
                    <div className="font-bold text-sm">{button.label}</div>
                    <div className="text-xs opacity-80">{button.desc}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {view === 'stats' && currentDeck && (
          <div className="bg-card border border-border rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" aria-hidden="true" />
              {t.deck_statistics || 'Deck Statistics'}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
                <div className="text-xs text-muted-foreground mb-1">{t.total_cards || 'Total Cards'}</div>
                <div className="text-2xl font-bold text-primary">{currentDeck.cards.length}</div>
              </div>
              <div className="bg-success/10 rounded-xl p-4 border border-success/20">
                <div className="text-xs text-muted-foreground mb-1">{t.stat_new || 'New (unstudied)'}</div>
                <div className="text-2xl font-bold text-success-foreground">
                  {currentDeck.cards.filter((card) => card.repetitions === 0).length}
                </div>
              </div>
              <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
                <div className="text-xs text-muted-foreground mb-1">{t.learning || 'Learning'}</div>
                <div className="text-2xl font-bold text-primary">
                  {currentDeck.cards.filter((card) => card.repetitions > 0 && card.repetitions < 3).length}
                </div>
              </div>
              <div className="bg-warning/10 rounded-xl p-4 border border-warning/20">
                <div className="text-xs text-muted-foreground mb-1">{t.to_review || 'To Review'}</div>
                <div className="text-2xl font-bold text-warning-foreground">{cardsToReview}</div>
              </div>
            </div>

            {currentDeck.cards.some((card) => card.lastReviewed) && (
              <div>
                <h3 className="font-semibold mb-3">{t.recently_studied || 'Recently Studied'}</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {currentDeck.cards
                    .filter((card) => card.lastReviewed)
                    .sort((a, b) => (b.lastReviewed || 0) - (a.lastReviewed || 0))
                    .slice(0, 10)
                    .map((card) => (
                      <div
                        key={card.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 text-sm"
                      >
                        <span className="font-medium truncate flex-1">{card.front}</span>
                        <span className="text-muted-foreground mx-4">
                          {tpl(t.ease || 'Ease: {e}', { e: card.ease.toFixed(1) })}
                        </span>
                        <span className="text-muted-foreground">
                          {new Date(card.nextReview).toLocaleDateString(lang)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
            <button
              onClick={() => setView('decks')}
              className="mt-6 px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover transition-colors"
            >
              {t.back_to_decks || '← Back to Decks'}
            </button>
          </div>
        )}

        {view === 'study' && !currentCard && (
          <div className="text-center py-16 bg-card border border-border rounded-2xl shadow-xl">
            <Sparkles className="w-16 h-16 mx-auto mb-4 text-primary" aria-hidden="true" />
            <h2 className="text-2xl font-bold mb-2">{t.study_complete || 'Study Complete!'}</h2>
            <p className="text-muted-foreground mb-6">
              {tpl(t.study_complete_text || 'You reviewed {n} cards in this session.', { n: studiedCount })}
            </p>
            <button
              onClick={() => setView('edit')}
              className="px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover transition-colors"
            >
              {t.back_to_deck || 'Back to Deck'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlashcardMaker;
