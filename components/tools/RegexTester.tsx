'use client'

import React, { useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, HelpCircle, Copy, RotateCcw } from 'lucide-react';
import { usePersistentState, useCopyToClipboard } from '@/lib/tools/use-persistent-state';
import { useRegexEvaluator } from '@/lib/tools/use-regex-evaluator';
import { highlightMatches, type RegexRequest } from '@/lib/tools/regex';
import { interpolate as tpl } from '@/lib/tools/template';
import { ToolHeader } from './shared/ToolHeader';

interface RegexTesterProps {
  lang: string;
  dict: any;
}

type FlagKey = 'g' | 'i' | 'm' | 's' | 'u' | 'y';

interface RegexState {
  pattern: string;
  testString: string;
  flags: FlagKey[];
  replacement: string;
  showReplace: boolean;
}

const FLAG_KEYS: FlagKey[] = ['g', 'i', 'm', 's', 'u', 'y'];

const DEFAULT_STATE: RegexState = {
  pattern: '(\\w+)@(\\w+)\\.(\\w+)',
  testString: 'john@example.com\njane@test.org\nhello world',
  flags: ['g'],
  replacement: '',
  showReplace: false,
};

function validateState(raw: unknown): RegexState | null {
  if (!raw || typeof raw !== 'object') return null;
  const value = raw as Partial<RegexState>;
  if (typeof value.pattern !== 'string' || typeof value.testString !== 'string') return null;
  const flags: FlagKey[] = Array.isArray(value.flags)
    ? (value.flags as unknown[]).filter(
        (flag): flag is FlagKey => typeof flag === 'string' && (FLAG_KEYS as string[]).includes(flag)
      )
    : ['g'];
  return {
    pattern: value.pattern,
    testString: value.testString,
    flags,
    replacement: typeof value.replacement === 'string' ? value.replacement : '',
    showReplace: Boolean(value.showReplace),
  };
}

const FALLBACK_CHEAT_SHEET = [
  {
    category: 'Anchors',
    items: [
      { pattern: '^', desc: 'Start of string/line' },
      { pattern: '$', desc: 'End of string/line' },
      { pattern: '\\b', desc: 'Word boundary' },
    ],
  },
  {
    category: 'Character Classes',
    items: [
      { pattern: '\\d', desc: 'Digit [0-9]' },
      { pattern: '\\w', desc: 'Word character' },
      { pattern: '\\s', desc: 'Whitespace' },
    ],
  },
  {
    category: 'Quantifiers',
    items: [
      { pattern: '*', desc: '0 or more' },
      { pattern: '+', desc: '1 or more' },
      { pattern: '?', desc: '0 or 1' },
      { pattern: '{n,m}', desc: 'n to m repetitions' },
    ],
  },
  {
    category: 'Groups',
    items: [
      { pattern: '(abc)', desc: 'Capturing group' },
      { pattern: '(?:abc)', desc: 'Non-capturing group' },
      { pattern: '(?=abc)', desc: 'Lookahead' },
    ],
  },
];

const FALLBACK_EXAMPLES = [
  { pattern: '\\d+', label: 'Digits' },
  { pattern: '[A-Z][a-z]+', label: 'Capitalized Words' },
  { pattern: 'https?://\\S+', label: 'URLs' },
  { pattern: '[\\w._%+-]+@[\\w.-]+\\.\\w{2,}', label: 'Emails' },
];

const RegexTester = ({ lang = 'en', dict = {} }: RegexTesterProps) => {
  const t = dict.tools?.regex || {};
  const tc = dict.tools?.common || {};

  const [state, setState] = usePersistentState<RegexState>(
    'mimir:tools:regex_tester',
    DEFAULT_STATE,
    validateState
  );
  const [showCheat, setShowCheat] = useState(false);
  const { copied, copy } = useCopyToClipboard();
  const [showAllMatches, setShowAllMatches] = useState(false);

  const graph = {
    g: t.flag_desc_g || 'Global - find all matches',
    i: t.flag_desc_i || 'Case-insensitive',
    m: t.flag_desc_m || 'Multiline - ^ and $ match line start/end',
    s: t.flag_desc_s || 'Dotall - . matches newlines',
    u: t.flag_desc_u || 'Unicode - enable Unicode features',
    y: t.flag_desc_y || 'Sticky - match from lastIndex',
  };

  const cheatSource = (
    Array.isArray(t.cheat_categories) ? t.cheat_categories : FALLBACK_CHEAT_SHEET
  ) as Array<{ name?: string; category?: string; items: Array<{ pattern: string; desc: string }> }>;

  const cheatSections = cheatSource.map((section) => ({
    name: section.name ?? section.category ?? '',
    items: section.items,
  }));

  const examples: { label: string; pattern: string }[] = t.examples ?? FALLBACK_EXAMPLES;

  const flagString = useMemo(() => FLAG_KEYS.filter((flag) => state.flags.includes(flag)).join(''), [state.flags]);

  const request: RegexRequest = useMemo(
    () => ({
      pattern: state.pattern,
      flags: flagString,
      testString: state.testString,
      replacement: state.replacement,
      showReplace: state.showReplace,
    }),
    [state.pattern, state.testString, state.replacement, state.showReplace, flagString]
  );

  const { result, timedOut } = useRegexEvaluator(request);

  const toggleFlag = (flag: FlagKey) => {
    setState((prev) => ({
      ...prev,
      flags: prev.flags.includes(flag)
        ? prev.flags.filter((item) => item !== flag)
        : FLAG_KEYS.filter((item) => prev.flags.includes(item) || item === flag),
    }));
  };

  const reset = () => {
    setState(DEFAULT_STATE);
    setShowAllMatches(false);
  };

  const visibleMatches = showAllMatches ? result.matches.slice(0, 500) : result.matches.slice(0, 50);
  const capturedGroups = result.matches
    .map((match, index) => ({ matchIndex: index, values: match.groups }))
    .filter((group) => group.values.length > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <ToolHeader
          icon={HelpCircle}
          title={t.title || 'Regex Tester'}
          subtitle={t.subtitle || 'Test and debug regular expressions in real-time'}
          gradient="from-green-600 to-emerald-600"
        />

        <div className="bg-card border border-border rounded-2xl shadow-xl p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="regex-pattern" className="block text-sm font-medium text-muted-foreground mb-2">
                {t.pattern_label || 'Regular Expression'}{' '}
                {result.valid ? (
                  <CheckCircle2 className="w-4 h-4 inline text-green-500" aria-hidden="true" />
                ) : null}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-lg" aria-hidden="true">
                  /
                </span>
                <input
                  id="regex-pattern"
                  type="text"
                  value={state.pattern}
                  onChange={(event) => setState((prev) => ({ ...prev, pattern: event.target.value }))}
                  placeholder={t.pattern_placeholder || 'Enter regex pattern...'}
                  aria-invalid={!result.valid}
                  aria-describedby={result.error ? 'regex-error' : undefined}
                  className="w-full pl-8 pr-16 py-3 rounded-lg border border-border bg-background font-mono text-lg focus:ring-2 focus:ring-primary outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-lg">
                  /{flagString}
                </span>
              </div>
              {timedOut && (
                <div id="regex-error" role="alert" className="mt-2 p-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                  {t.timeout || 'Evaluation timed out. Simplify the pattern to avoid catastrophic backtracking.'}
                </div>
              )}
              {!timedOut && result.error && (
                <div id="regex-error" role="alert" className="mt-2 p-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                  {result.error}
                </div>
              )}
            </div>
            <div>
              <span className="block text-sm font-medium text-muted-foreground mb-2">{t.flags || 'Flags'}</span>
              <div className="flex flex-wrap gap-2">
                {FLAG_KEYS.map((flag) => (
                  <button
                    key={flag}
                    onClick={() => toggleFlag(flag)}
                    aria-pressed={state.flags.includes(flag)}
                    aria-label={`${flag}: ${graph[flag]}`}
                    className={`px-3 py-1.5 rounded-lg text-sm font-mono font-bold transition-all ${
                      state.flags.includes(flag)
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-muted text-muted-foreground hover:opacity-80'
                    }`}
                  >
                    {flag}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <button
                  onClick={() => setState((prev) => ({ ...prev, showReplace: !prev.showReplace }))}
                  aria-pressed={state.showReplace}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    state.showReplace ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {state.showReplace ? t.hide_replace || 'Hide Replace' : t.replace || 'Replace'}
                </button>
                <button
                  onClick={() => setShowCheat((prev) => !prev)}
                  aria-pressed={showCheat}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-muted text-muted-foreground hover:opacity-80 transition-all"
                >
                  {showCheat ? t.hide_cheat_sheet || 'Hide Cheat Sheet' : t.cheat_sheet || 'Cheat Sheet'}
                </button>
                <button
                  onClick={reset}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-600 hover:bg-red-200 dark:hover:bg-red-900 transition-all flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" aria-hidden="true" /> {tc.reset || 'Reset'}
                </button>
              </div>
            </div>
          </div>

          {state.showReplace && (
            <div className="mb-4">
              <label htmlFor="regex-replacement" className="block text-sm font-medium text-muted-foreground mb-2">
                {t.replacement_label || 'Replacement'}
              </label>
              <input
                id="regex-replacement"
                type="text"
                value={state.replacement}
                onChange={(event) => setState((prev) => ({ ...prev, replacement: event.target.value }))}
                placeholder={t.replacement_placeholder || 'Replacement text (use $1, $2 for groups)'}
                className="w-full px-4 py-2 rounded-lg border border-border bg-background font-mono text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-card border border-border rounded-2xl shadow-xl p-6">
            <label htmlFor="regex-test-string" className="block text-sm font-medium text-muted-foreground mb-2">
              {t.test_string || 'Test String'}
            </label>
            <textarea
              id="regex-test-string"
              value={state.testString}
              onChange={(event) => setState((prev) => ({ ...prev, testString: event.target.value }))}
              placeholder={t.test_string_placeholder || 'Enter text to test against...'}
              rows={10}
              className="w-full px-4 py-3 rounded-lg border border-border bg-background font-mono text-sm focus:ring-2 focus:ring-primary outline-none resize-none"
            />
          </div>

          <div className="bg-card border border-border rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-3 gap-2">
              <span className="text-sm font-medium text-muted-foreground">{t.match_results || 'Match Results'}</span>
              {result.valid && !timedOut && (
                <div className="flex gap-3 text-sm" aria-live="polite" aria-atomic="true">
                  <span className="text-emerald-600 font-medium">
                    {tpl(t.matches_count || '{n} matches', { n: result.matchCount })}
                  </span>
                  <span className="text-muted-foreground">
                    {tpl(t.chars_count || '({n} chars)', { n: result.totalLength })}
                  </span>
                </div>
              )}
            </div>

            <div className="mb-3">
              {result.valid && !timedOut ? (
                <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm whitespace-pre-wrap border border-border min-h-[200px] max-h-[300px] overflow-y-auto" data-testid="regex-highlighted">
                  {highlightMatches(state.testString, result.matches).length > 0 ? (
                    highlightMatches(state.testString, result.matches).map((segment, index) => (
                      <span
                        key={index}
                        className={segment.isMatch ? 'bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-200 rounded px-0.5' : ''}
                      >
                        {segment.text}
                      </span>
                    ))
                  ) : (
                    <span className="text-muted-foreground">{t.no_matches || 'No matches found'}</span>
                  )}
                </div>
              ) : (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-red-600 text-sm min-h-[200px]">
                  {timedOut ? t.timeout || 'Evaluation timed out.' : t.invalid_pattern || 'Invalid regex pattern'}
                </div>
              )}
            </div>

            {result.valid && result.matchCount > 0 && (
              <div className="max-h-40 overflow-y-auto space-y-1">
                {visibleMatches.map((match, index) => (
                  <div key={`${match.index}-${index}`} className="flex items-center justify-between p-2 rounded bg-muted/50 text-xs font-mono">
                    <span className="text-emerald-700 dark:text-emerald-300 font-medium">#{index + 1}</span>
                    <span className="truncate mx-2 flex-1">
                      {match.full.length > 60 ? `${match.full.slice(0, 60)}...` : match.full || '∅'}
                    </span>
                    <span className="text-muted-foreground">@{match.index}</span>
                  </div>
                ))}
                {!showAllMatches && result.matchCount > 50 && (
                  <button
                    onClick={() => setShowAllMatches(true)}
                    className="w-full text-xs text-primary hover:underline py-1"
                  >
                    {tpl(t.more_matches || '...and {n} more matches', { n: result.matchCount - 50 })}
                  </button>
                )}
              </div>
            )}

            {capturedGroups.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  {t.captured_groups || 'Captured Groups'}
                </p>
                {capturedGroups.slice(0, 10).map((group, index) => (
                  <div key={index} className="flex gap-2 text-xs font-mono mb-1">
                    <span className="text-muted-foreground">#{index + 1}:</span>
                    {group.values.map((value, groupIndex) => (
                      <span key={groupIndex} className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 rounded">
                        ${groupIndex + 1}={value}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {state.showReplace && result.replaced !== null && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-medium text-muted-foreground">{t.replaced || 'Replaced'}</p>
                  <button
                    onClick={() => result.replaced !== null && copy(result.replaced)}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" aria-hidden="true" />{' '}
                    {copied ? tc.copied || 'Copied!' : tc.copy || 'Copy'}
                  </button>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-sm font-mono whitespace-pre-wrap border border-green-200 dark:border-green-800 max-h-24 overflow-y-auto">
                  {result.replaced}
                </div>
              </div>
            )}
          </div>
        </div>

        {showCheat && (
          <div className="bg-card border border-border rounded-2xl shadow-xl p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">{t.cheat_title || 'Regex Cheat Sheet'}</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
              {cheatSections.map((section) => (
                <div key={section.name}>
                  <h3 className="font-medium text-emerald-600 mb-3 text-sm uppercase tracking-wide">{section.name}</h3>
                  <div className="space-y-2">
                    {section.items.map((item) => (
                      <div key={item.pattern} className="flex items-center gap-2 text-sm">
                        <code className="px-2 py-0.5 rounded bg-muted font-mono text-emerald-700 dark:text-emerald-300 text-xs">
                          {item.pattern}
                        </code>
                        <span className="text-muted-foreground">{item.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-card border border-border rounded-2xl shadow-xl p-6">
          <h2 className="text-lg font-semibold mb-3">{t.quick_examples || 'Quick Examples'}</h2>
          <div className="flex flex-wrap gap-2">
            {examples.map((example) => (
              <button
                key={example.pattern}
                onClick={() => setState((prev) => ({ ...prev, pattern: example.pattern }))}
                className="px-3 py-1.5 rounded-lg bg-muted hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-sm font-mono transition-colors"
              >
                {example.label}: <span className="text-emerald-600">/{example.pattern}/</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegexTester;
