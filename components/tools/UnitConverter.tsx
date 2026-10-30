'use client'

import React, { useMemo } from 'react';
import { ArrowLeftRight, Copy, Check } from 'lucide-react';
import {
  UNIT_CATEGORIES,
  convertUnit,
  formatUnitValue,
  getCommonConversions,
  isUnitCategory,
  type UnitCategoryKey,
} from '@/lib/tools/units';
import { usePersistentState, useCopyToClipboard } from '@/lib/tools/use-persistent-state';
import { ToolHeader } from './shared/ToolHeader';

interface UnitConverterProps {
  lang: string;
  dict: any;
}

interface ConverterState {
  category: UnitCategoryKey;
  fromUnit: string;
  toUnit: string;
  value: string;
}

const DEFAULT_STATE: ConverterState = {
  category: 'length',
  fromUnit: 'meters',
  toUnit: 'kilometers',
  value: '1',
};

function validateState(raw: unknown): ConverterState | null {
  if (!raw || typeof raw !== 'object') return null;
  const value = raw as Partial<ConverterState>;
  if (typeof value.category !== 'string' || !isUnitCategory(value.category)) return null;
  const units = UNIT_CATEGORIES[value.category].units;
  if (typeof value.fromUnit !== 'string' || !units[value.fromUnit]) return null;
  if (typeof value.toUnit !== 'string' || !units[value.toUnit]) return null;
  return {
    category: value.category,
    fromUnit: value.fromUnit,
    toUnit: value.toUnit,
    value: typeof value.value === 'string' ? value.value : '1',
  };
}

const UnitConverter = ({ lang = 'en', dict = {} }: UnitConverterProps) => {
  const t = dict.tools?.unit_converter || {};
  const [state, setState] = usePersistentState<ConverterState>(
    'mimir:tools:unit_converter',
    DEFAULT_STATE,
    validateState
  );
  const { copied, failed, copy } = useCopyToClipboard();

  const category = UNIT_CATEGORIES[state.category];
  const shortUnitLabel = (unitKey: string) =>
    (t.units?.[unitKey] || category.units[unitKey]?.label || '').split(' (')[0];

  const result = useMemo(() => {
    const input = Number.parseFloat(state.value.replace(',', '.'));
    if (!Number.isFinite(input)) return '';
    const converted = convertUnit(state.category, state.fromUnit, state.toUnit, input);
    return formatUnitValue(converted, lang);
  }, [state.category, state.fromUnit, state.toUnit, state.value, lang]);

  const selectCategory = (next: UnitCategoryKey) => {
    const units = Object.keys(UNIT_CATEGORIES[next].units);
    setState({ category: next, fromUnit: units[0], toUnit: units[1] || units[0], value: state.value });
  };

  const swapUnits = () => {
    setState((prev) => ({ ...prev, fromUnit: prev.toUnit, toUnit: prev.fromUnit }));
  };

  const commonConversions = getCommonConversions(state.category, lang).slice(0, 8);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <ToolHeader
          icon={ArrowLeftRight}
          title={t.title || 'Unit Converter'}
          subtitle={t.subtitle || 'Convert between hundreds of units in real-time'}
          gradient="from-blue-600 to-cyan-600"
        />

        <div className="flex flex-wrap gap-2 mb-6 justify-center">
          {(Object.keys(UNIT_CATEGORIES) as UnitCategoryKey[]).map((key) => (
            <button
              key={key}
              onClick={() => selectCategory(key)}
              aria-pressed={state.category === key}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                state.category === key
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-card border border-border text-foreground hover:bg-muted'
              }`}
            >
              <span className="mr-1.5" aria-hidden="true">
                {UNIT_CATEGORIES[key].icon}
              </span>
              {t.categories?.[key] || UNIT_CATEGORIES[key].label}
            </button>
          ))}
        </div>

        <div className="bg-card border border-border rounded-2xl shadow-xl p-6 sm:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr,auto,1fr] gap-4 items-end">
            <div>
              <label htmlFor="unit-value" className="block text-sm font-medium text-muted-foreground mb-2">
                {t.from || 'From'}
              </label>
              <input
                id="unit-value"
                type="number"
                inputMode="decimal"
                value={state.value}
                onChange={(event) => setState((prev) => ({ ...prev, value: event.target.value }))}
                className="w-full px-4 py-3 rounded-lg border border-border bg-background text-lg font-semibold focus:ring-2 focus:ring-primary outline-none mb-2"
                placeholder="1"
              />
              <label htmlFor="unit-from" className="sr-only">
                {t.from || 'From'}
              </label>
              <select
                id="unit-from"
                value={state.fromUnit}
                onChange={(event) => setState((prev) => ({ ...prev, fromUnit: event.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:ring-2 focus:ring-primary outline-none"
              >
                {Object.entries(category.units).map(([key, unit]) => (
                  <option key={key} value={key}>
                    {t.units?.[key] || unit.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex sm:pb-2 justify-center">
              <button
                onClick={swapUnits}
                aria-label={t.swap || 'Swap units'}
                className="p-3 rounded-xl bg-muted hover:opacity-80 transition-opacity"
              >
                <ArrowLeftRight className="w-5 h-5 text-blue-600" aria-hidden="true" />
              </button>
            </div>

            <div>
              <label htmlFor="unit-to" className="block text-sm font-medium text-muted-foreground mb-2">
                {t.to || 'To'}
              </label>
              <div className="w-full px-4 py-3 rounded-lg border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 text-lg font-bold text-blue-700 dark:text-blue-300 mb-2 flex items-center justify-between gap-2">
                <span aria-live="polite" aria-atomic="true" data-testid="unit-result">
                  {result || '—'}
                </span>
                {result && (
                  <button
                    onClick={() => copy(result)}
                    aria-label={copied ? t.copied || 'Copied!' : failed ? t.copy_failed || 'Copy failed' : t.copy || 'Copy result'}
                    className="p-1 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-500" aria-hidden="true" />
                    ) : (
                      <Copy className="w-4 h-4 text-blue-500" aria-hidden="true" />
                    )}
                  </button>
                )}
              </div>
              <select
                id="unit-to"
                value={state.toUnit}
                onChange={(event) => setState((prev) => ({ ...prev, toUnit: event.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:ring-2 focus:ring-primary outline-none"
              >
                {Object.entries(category.units).map(([key, unit]) => (
                  <option key={key} value={key}>
                    {t.units?.[key] || unit.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {result && state.fromUnit !== state.toUnit && (
            <div className="mt-6 p-4 rounded-xl bg-muted/50 border border-border">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">{state.value}</span> {shortUnitLabel(state.fromUnit)} ={' '}
                <span className="font-bold text-blue-600">{result}</span> {shortUnitLabel(state.toUnit)}
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 bg-card border border-border rounded-2xl shadow-xl p-6">
          <h2 className="text-lg font-semibold mb-4">{t.common_conversions || 'Common Conversions'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {commonConversions.map((conversion) => (
              <button
                key={`${conversion.from}-${conversion.to}-${conversion.value}`}
                onClick={() =>
                  setState((prev) => ({
                    ...prev,
                    fromUnit: conversion.from,
                    toUnit: conversion.to,
                    value: String(conversion.value),
                  }))
                }
                className="p-3 rounded-lg bg-muted/50 hover:bg-muted border border-border text-left text-sm transition-colors"
              >
                <span className="text-muted-foreground">
                  {conversion.value} {shortUnitLabel(conversion.from)}
                </span>
                <br />
                <span className="font-medium">
                  = {conversion.result} {shortUnitLabel(conversion.to)}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnitConverter;
