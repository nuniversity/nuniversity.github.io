'use client'

import React, { useState, useMemo, useCallback } from 'react';
import { AlertCircle, CheckCircle2, HelpCircle, Copy, RotateCcw } from 'lucide-react';

interface RegexTesterProps {
  lang: string;
  dict: any;
}

type FlagKey = 'g' | 'i' | 'm' | 's' | 'u' | 'y';

function tpl(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template
  return Object.entries(vars).reduce((str, [key, val]) => str.replace(new RegExp(`\\{${key}\\}`, 'g'), String(val)), template)
}

const cheatSheet = [
  { category: 'Anchors', items: [
    { pattern: '^', desc: 'Start of string/line' },
    { pattern: '$', desc: 'End of string/line' },
    { pattern: '\\b', desc: 'Word boundary' },
    { pattern: '\\B', desc: 'Non-word boundary' },
  ]},
  { category: 'Character Classes', items: [
    { pattern: '\\d', desc: 'Digit [0-9]' },
    { pattern: '\\w', desc: 'Word character [a-zA-Z0-9_]' },
    { pattern: '\\s', desc: 'Whitespace' },
    { pattern: '.', desc: 'Any character except newline' },
  ]},
  { category: 'Quantifiers', items: [
    { pattern: '*', desc: '0 or more' },
    { pattern: '+', desc: '1 or more' },
    { pattern: '?', desc: '0 or 1' },
    { pattern: '{n,m}', desc: 'n to m repetitions' },
  ]},
  { category: 'Groups', items: [
    { pattern: '(abc)', desc: 'Capturing group' },
    { pattern: '(?:abc)', desc: 'Non-capturing group' },
    { pattern: '(?=abc)', desc: 'Lookahead' },
    { pattern: '(?!abc)', desc: 'Negative lookahead' },
  ]},
  { category: 'Escapes', items: [
    { pattern: '\\\\', desc: 'Literal backslash' },
    { pattern: '\\.', desc: 'Literal dot' },
    { pattern: '\\*', desc: 'Literal asterisk' },
    { pattern: '\\n', desc: 'Newline' },
  ]},
];

const quickExamples = [
  { pattern: '\\d+', label: 'Digits' },
  { pattern: '[A-Z][a-z]+', label: 'Capitalized Words' },
  { pattern: 'https?://\\S+', label: 'URLs' },
  { pattern: '[\\w._%+-]+@[\\w.-]+\\.\\w{2,}', label: 'Emails' },
  { pattern: '\\b\\w{4,}\\b', label: 'Words ≥4 chars' },
  { pattern: '<[^>]+>', label: 'HTML Tags' },
];

const RegexTester = ({ lang = 'en', dict = {} }: RegexTesterProps) => {
  const t = dict.tools?.regex || {};
  const tc = dict.tools?.common || {};

  const allFlags: { key: FlagKey; label: string; desc: string }[] = [
    { key: 'g', label: 'g', desc: t.flag_desc_g || 'Global - find all matches' },
    { key: 'i', label: 'i', desc: t.flag_desc_i || 'Case-insensitive' },
    { key: 'm', label: 'm', desc: t.flag_desc_m || 'Multiline - ^ and $ match line start/end' },
    { key: 's', label: 's', desc: t.flag_desc_s || 'Dotall - . matches newlines' },
    { key: 'u', label: 'u', desc: t.flag_desc_u || 'Unicode - enable Unicode features' },
    { key: 'y', label: 'y', desc: t.flag_desc_y || 'Sticky - match from lastIndex' },
  ];

  const cheatSections: { name: string; items: { pattern: string; desc: string }[] }[] = (t.cheat_categories ?? cheatSheet).map(
    (section: any) => ({ name: section.name ?? section.category, items: section.items })
  );

  const examples: { label: string; pattern: string }[] = t.examples ?? quickExamples;

  const [pattern, setPattern] = useState('(\\w+)@(\\w+)\\.(\\w+)');
  const [testString, setTestString] = useState('john@example.com\njane@test.org\nhello world');
  const [flags, setFlags] = useState<Set<FlagKey>>(new Set<FlagKey>(['g']));
  const [replacement, setReplacement] = useState('');
  const [showReplace, setShowReplace] = useState(false);
  const [showCheat, setShowCheat] = useState(false);
  const [copied, setCopied] = useState(false);

  const toggleFlag = (flag: FlagKey) => {
    setFlags(prev => {
      const next = new Set(prev);
      if (next.has(flag)) next.delete(flag); else next.add(flag);
      return next;
    });
  };

  const regexResult = useMemo(() => {
    try {
      const flagStr = Array.from(flags).join('');
      const regex = new RegExp(pattern, flagStr);
      const matches: { full: string; groups: string[]; index: number }[] = [];
      let match;
      const isGlobal = flags.has('g');
      const maxMatches = 500;
      let count = 0;

      if (isGlobal) {
        while ((match = regex.exec(testString)) !== null && count < maxMatches) {
          matches.push({ full: match[0], groups: match.slice(1), index: match.index });
          count++;
          if (!regex.lastIndex) break;
        }
      } else {
        match = regex.exec(testString);
        if (match) {
          matches.push({ full: match[0], groups: match.slice(1), index: match.index });
        }
      }

      // Build highlighted text
      const highlighted = highlightMatches(testString, matches);

      // Build groups display
      const allGroups: { matchIndex: number; values: string[] }[] = [];
      matches.forEach((m, i) => {
        if (m.groups.length > 0) {
          allGroups.push({ matchIndex: i, values: m.groups });
        }
      });

      const totalMatches = matches.reduce((sum, m) => sum + m.full.length, 0);
      const replaced = showReplace && replacement ? testString.replace(regex, replacement) : null;

      return { valid: true, matches, matchCount: matches.length, totalLength: totalMatches, highlighted, groups: allGroups, replaced, error: null as string | null };
    } catch (e: any) {
      return { valid: false, matches: [], matchCount: 0, totalLength: 0, highlighted: [], groups: [], replaced: null, error: e.message };
    }
  }, [pattern, testString, flags, replacement, showReplace]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setPattern('');
    setTestString('');
    setFlags(new Set<FlagKey>(['g']));
    setReplacement('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-green-600 to-emerald-600 mb-4">
            <HelpCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            {t.title || 'Regex Tester'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t.subtitle || 'Test and debug regular expressions in real-time'}
          </p>
        </div>

        {/* Regex Input */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                {t.pattern_label || 'Regular Expression'} {regexResult.valid ? <CheckCircle2 className="w-4 h-4 inline text-green-500" /> : null}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-lg">/</span>
                <input
                  type="text"
                  value={pattern}
                  onChange={(e) => setPattern(e.target.value)}
                  placeholder={t.pattern_placeholder || 'Enter regex pattern...'}
                  className="w-full pl-8 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 font-mono text-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-lg">/{Array.from(flags).join('')}</span>
              </div>
              {regexResult.error && (
                <div className="mt-2 p-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {regexResult.error}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{t.flags || 'Flags'}</label>
              <div className="flex flex-wrap gap-2">
                {allFlags.map(f => (
                  <button
                    key={f.key}
                    onClick={() => toggleFlag(f.key)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-mono font-bold transition-all ${flags.has(f.key) ? 'bg-emerald-600 text-white shadow-sm' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                    title={f.desc}
                  >
                    {f.key}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => setShowReplace(!showReplace)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${showReplace ? 'bg-emerald-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600'}`}>
                  {showReplace ? (t.hide_replace || 'Hide Replace') : (t.replace || 'Replace')}
                </button>
                <button onClick={() => setShowCheat(!showCheat)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all">
                  {showCheat ? (t.hide_cheat_sheet || 'Hide Cheat Sheet') : (t.cheat_sheet || 'Cheat Sheet')}
                </button>
                <button onClick={reset} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-600 hover:bg-red-200 dark:hover:bg-red-900 transition-all flex items-center gap-1">
                  <RotateCcw className="w-3 h-3" /> {tc.reset || 'Reset'}
                </button>
              </div>
            </div>
          </div>

          {showReplace && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{t.replacement_label || 'Replacement'}</label>
              <input
                type="text"
                value={replacement}
                onChange={(e) => setReplacement(e.target.value)}
                placeholder={t.replacement_placeholder || 'Replacement text (use $1, $2 for groups)'}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 font-mono text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Test String */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{t.test_string || 'Test String'}</label>
            <textarea
              value={testString}
              onChange={(e) => setTestString(e.target.value)}
              placeholder={t.test_string_placeholder || 'Enter text to test against...'}
              rows={10}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 font-mono text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
            />
          </div>

          {/* Results */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">{t.match_results || 'Match Results'}</label>
              {regexResult.valid && (
                <div className="flex gap-3 text-sm">
                  <span className="text-emerald-600 font-medium">{tpl(t.matches_count || '{n} matches', { n: regexResult.matchCount })}</span>
                  <span className="text-gray-500">{tpl(t.chars_count || '({n} chars)', { n: regexResult.totalLength })}</span>
                </div>
              )}
            </div>

            <div className="mb-3">
              {regexResult.valid ? (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 font-mono text-sm whitespace-pre-wrap border border-gray-200 dark:border-gray-700 min-h-[200px] max-h-[300px] overflow-y-auto">
                  {regexResult.highlighted.length > 0 ? (
                    regexResult.highlighted.map((seg, i) => (
                      <span key={i} className={seg.isMatch ? 'bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-200 rounded px-0.5' : ''}>
                        {seg.text}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400">{t.no_matches || 'No matches found'}</span>
                  )}
                </div>
              ) : (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-red-600 text-sm min-h-[200px]">
                  {t.invalid_pattern || 'Invalid regex pattern'}
                </div>
              )}
            </div>

            {/* Match List */}
            {regexResult.valid && regexResult.matchCount > 0 && (
              <div className="max-h-40 overflow-y-auto space-y-1">
                {regexResult.matches.slice(0, 50).map((m, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded bg-gray-50 dark:bg-gray-700/50 text-xs font-mono">
                    <span className="text-emerald-700 dark:text-emerald-300 font-medium">#{i + 1}</span>
                    <span className="truncate mx-2 flex-1">{m.full.length > 60 ? m.full.slice(0, 60) + '...' : m.full}</span>
                    <span className="text-gray-500">@{m.index}</span>
                  </div>
                ))}
                {regexResult.matchCount > 50 && (
                  <p className="text-xs text-gray-400 text-center">{tpl(t.more_matches || '...and {n} more matches', { n: regexResult.matchCount - 50 })}</p>
                )}
              </div>
            )}

            {/* Groups */}
            {regexResult.groups.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-medium text-gray-500 mb-1">{t.captured_groups || 'Captured Groups'}</p>
                {regexResult.groups.slice(0, 10).map((g, i) => (
                  <div key={i} className="flex gap-2 text-xs font-mono mb-1">
                    <span className="text-gray-400">#{i + 1}:</span>
                    {g.values.map((v, j) => (
                      <span key={j} className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 rounded">${j + 1}={v}</span>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Replacement Result */}
            {showReplace && regexResult.replaced !== null && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-medium text-gray-500">{t.replaced || 'Replaced'}</p>
                  <button onClick={() => handleCopy(regexResult.replaced!)} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                    <Copy className="w-3 h-3" /> {copied ? (tc.copied || 'Copied!') : (tc.copy || 'Copy')}
                  </button>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-sm font-mono whitespace-pre-wrap border border-green-200 dark:border-green-800 max-h-24 overflow-y-auto">
                  {regexResult.replaced}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cheat Sheet */}
        {showCheat && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">{t.cheat_title || 'Regex Cheat Sheet'}</h3>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
              {cheatSections.map(section => (
                <div key={section.name}>
                  <h4 className="font-medium text-emerald-600 mb-3 text-sm uppercase tracking-wide">{section.name}</h4>
                  <div className="space-y-2">
                    {section.items.map(item => (
                      <div key={item.pattern} className="flex items-center gap-2 text-sm">
                        <code className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 font-mono text-emerald-700 dark:text-emerald-300 text-xs">{item.pattern}</code>
                        <span className="text-gray-600 dark:text-gray-400">{item.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Examples */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
          <h3 className="text-lg font-semibold mb-3">{t.quick_examples || 'Quick Examples'}</h3>
          <div className="flex flex-wrap gap-2">
            {examples.map(ex => (
              <button key={ex.pattern} onClick={() => setPattern(ex.pattern)} className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-sm font-mono transition-colors">
                {ex.label}: <span className="text-emerald-600">/{ex.pattern}/</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

function highlightMatches(text: string, matches: { full: string; index: number }[]): { text: string; isMatch: boolean }[] {
  if (matches.length === 0) return [{ text, isMatch: false }];
  const segments: { text: string; isMatch: boolean }[] = [];
  let lastEnd = 0;

  for (const match of matches) {
    if (match.index > lastEnd) {
      segments.push({ text: text.slice(lastEnd, match.index), isMatch: false });
    }
    segments.push({ text: match.full, isMatch: true });
    lastEnd = match.index + match.full.length;
  }

  if (lastEnd < text.length) {
    segments.push({ text: text.slice(lastEnd), isMatch: false });
  }

  return segments;
}

export default RegexTester;
