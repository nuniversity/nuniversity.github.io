'use client'

import React, { useState, useMemo } from 'react';
import { ArrowLeftRight, Copy,Check } from 'lucide-react';

const categories: Record<string, { label: string; icon: string; units: Record<string, { label: string; toBase: number; offset?: number }> }> = {
  length: {
    label: 'Length',
    icon: '📏',
    units: {
      meters: { label: 'Meters (m)', toBase: 1 },
      kilometers: { label: 'Kilometers (km)', toBase: 1000 },
      centimeters: { label: 'Centimeters (cm)', toBase: 0.01 },
      millimeters: { label: 'Millimeters (mm)', toBase: 0.001 },
      miles: { label: 'Miles (mi)', toBase: 1609.344 },
      yards: { label: 'Yards (yd)', toBase: 0.9144 },
      feet: { label: 'Feet (ft)', toBase: 0.3048 },
      inches: { label: 'Inches (in)', toBase: 0.0254 },
      nautical_miles: { label: 'Nautical Miles (nmi)', toBase: 1852 },
    },
  },
  mass: {
    label: 'Mass',
    icon: '⚖️',
    units: {
      kilograms: { label: 'Kilograms (kg)', toBase: 1 },
      grams: { label: 'Grams (g)', toBase: 0.001 },
      milligrams: { label: 'Milligrams (mg)', toBase: 0.000001 },
      metric_tons: { label: 'Metric Tons (t)', toBase: 1000 },
      pounds: { label: 'Pounds (lb)', toBase: 0.453592 },
      ounces: { label: 'Ounces (oz)', toBase: 0.0283495 },
      stones: { label: 'Stones (st)', toBase: 6.35029 },
    },
  },
  temperature: {
    label: 'Temperature',
    icon: '🌡️',
    units: {
      celsius: { label: 'Celsius (°C)', toBase: 1 },
      fahrenheit: { label: 'Fahrenheit (°F)', toBase: 1, offset: 1 },
      kelvin: { label: 'Kelvin (K)', toBase: 1, offset: 2 },
    },
  },
  volume: {
    label: 'Volume',
    icon: '🧪',
    units: {
      liters: { label: 'Liters (L)', toBase: 1 },
      milliliters: { label: 'Milliliters (mL)', toBase: 0.001 },
      cubic_meters: { label: 'Cubic Meters (m³)', toBase: 1000 },
      gallons_us: { label: 'Gallons (US)', toBase: 3.78541 },
      gallons_uk: { label: 'Gallons (UK)', toBase: 4.54609 },
      quarts: { label: 'Quarts (qt)', toBase: 0.946353 },
      pints: { label: 'Pints (pt)', toBase: 0.473176 },
      cups: { label: 'Cups', toBase: 0.236588 },
      fluid_ounces: { label: 'Fluid Ounces (fl oz)', toBase: 0.0295735 },
      tablespoons: { label: 'Tablespoons (tbsp)', toBase: 0.0147868 },
      teaspoons: { label: 'Teaspoons (tsp)', toBase: 0.00492892 },
    },
  },
  speed: {
    label: 'Speed',
    icon: '🚀',
    units: {
      meters_per_second: { label: 'Meters/second (m/s)', toBase: 1 },
      kilometers_per_hour: { label: 'Kilometers/hour (km/h)', toBase: 0.277778 },
      miles_per_hour: { label: 'Miles/hour (mph)', toBase: 0.44704 },
      knots: { label: 'Knots (kn)', toBase: 0.514444 },
      feet_per_second: { label: 'Feet/second (ft/s)', toBase: 0.3048 },
      mach: { label: 'Mach (at sea level)', toBase: 340.29 },
    },
  },
  area: {
    label: 'Area',
    icon: '📐',
    units: {
      square_meters: { label: 'Square Meters (m²)', toBase: 1 },
      square_kilometers: { label: 'Square Kilometers (km²)', toBase: 1000000 },
      square_miles: { label: 'Square Miles (mi²)', toBase: 2589988.1 },
      square_yards: { label: 'Square Yards (yd²)', toBase: 0.836127 },
      square_feet: { label: 'Square Feet (ft²)', toBase: 0.092903 },
      square_inches: { label: 'Square Inches (in²)', toBase: 0.00064516 },
      hectares: { label: 'Hectares (ha)', toBase: 10000 },
      acres: { label: 'Acres', toBase: 4046.856 },
    },
  },
  time: {
    label: 'Time',
    icon: '⏱️',
    units: {
      seconds: { label: 'Seconds (s)', toBase: 1 },
      milliseconds: { label: 'Milliseconds (ms)', toBase: 0.001 },
      microseconds: { label: 'Microseconds (µs)', toBase: 0.000001 },
      minutes: { label: 'Minutes (min)', toBase: 60 },
      hours: { label: 'Hours (h)', toBase: 3600 },
      days: { label: 'Days (d)', toBase: 86400 },
      weeks: { label: 'Weeks', toBase: 604800 },
      months: { label: 'Months (30 days)', toBase: 2592000 },
      years: { label: 'Years (365 days)', toBase: 31536000 },
    },
  },
  data: {
    label: 'Data Storage',
    icon: '💾',
    units: {
      bytes: { label: 'Bytes (B)', toBase: 1 },
      kilobytes: { label: 'Kilobytes (KB)', toBase: 1024 },
      megabytes: { label: 'Megabytes (MB)', toBase: 1048576 },
      gigabytes: { label: 'Gigabytes (GB)', toBase: 1073741824 },
      terabytes: { label: 'Terabytes (TB)', toBase: 1099511627776 },
      petabytes: { label: 'Petabytes (PB)', toBase: 1125899906842624 },
      bits: { label: 'Bits (b)', toBase: 0.125 },
      kilobits: { label: 'Kilobits (Kb)', toBase: 128 },
      megabits: { label: 'Megabits (Mb)', toBase: 131072 },
      gigabits: { label: 'Gigabits (Gb)', toBase: 134217728 },
    },
  },
  angle: {
    label: 'Angle',
    icon: '📐',
    units: {
      degrees: { label: 'Degrees (°)', toBase: 1 },
      radians: { label: 'Radians (rad)', toBase: 57.2958 },
      gradians: { label: 'Gradians (grad)', toBase: 0.9 },
      arcminutes: { label: 'Arcminutes (\')', toBase: 1 / 60 },
      arcseconds: { label: 'Arcseconds (")', toBase: 1 / 3600 },
    },
  },
};

interface UnitConverterProps {
  lang: string;
  dict: any;
}

type CategoryKey = keyof typeof categories;

const UnitConverter = ({ lang = 'en' }: UnitConverterProps) => {
  const [category, setCategory] = useState<CategoryKey>('length');
  const [fromUnit, setFromUnit] = useState('meters');
  const [toUnit, setToUnit] = useState('kilometers');
  const [value, setValue] = useState('1');
  const [copied, setCopied] = useState(false);

  const cat = categories[category];

  const result = useMemo(() => {
    const input = parseFloat(value);
    if (isNaN(input)) return '';
    const from = cat.units[fromUnit];
    const to = cat.units[toUnit];
    if (!from || !to) return '';

    if (category === 'temperature') {
      let celsius: number;
      if (fromUnit === 'celsius') celsius = input;
      else if (fromUnit === 'fahrenheit') celsius = (input - 32) * 5 / 9;
      else if (fromUnit === 'kelvin') celsius = input - 273.15;

      if (toUnit === 'celsius') return celsius.toFixed(4);
      if (toUnit === 'fahrenheit') return (celsius * 9 / 5 + 32).toFixed(4);
      if (toUnit === 'kelvin') return (celsius + 273.15).toFixed(4);
    }

    const baseValue = input * from.toBase;
    const converted = baseValue / to.toBase;
    if (Math.abs(converted) < 0.0001) return converted.toExponential(6);
    if (Math.abs(converted) >= 1000000) return converted.toExponential(4);
    return converted.toLocaleString('en-US', { maximumSignificantDigits: 10 });
  }, [category, fromUnit, toUnit, value, cat]);

  const copyResult = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const swapUnits = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 mb-4">
            <ArrowLeftRight className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            Unit Converter
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Convert between hundreds of units in real-time
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 justify-center">
          {(Object.keys(categories) as CategoryKey[]).map((key) => (
            <button
              key={key}
              onClick={() => { setCategory(key); const units = Object.keys(categories[key].units); setFromUnit(units[0]); setToUnit(units[1] || units[0]); }}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${category === key ? 'bg-blue-600 text-white shadow-lg' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'}`}
            >
              <span className="mr-1.5">{categories[key].icon}</span>
              {categories[key].label}
            </button>
          ))}
        </div>

        {/* Converter Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-end">
            {/* From */}
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">From</label>
              <input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-lg font-semibold focus:ring-2 focus:ring-blue-500 outline-none mb-2"
                placeholder="1"
              />
              <select
                value={fromUnit}
                onChange={(e) => setFromUnit(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {Object.entries(cat.units).map(([key, u]) => (
                  <option key={key} value={key}>{u.label}</option>
                ))}
              </select>
            </div>

            {/* Swap Button */}
            <div className="flex items-center pb-2">
              <button onClick={swapUnits} className="p-3 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                <ArrowLeftRight className="w-5 h-5 text-blue-600" />
              </button>
            </div>

            {/* To */}
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">To</label>
              <div className="w-full px-4 py-3 rounded-lg border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 text-lg font-bold text-blue-700 dark:text-blue-300 mb-2 flex items-center justify-between">
                <span>{result || '—'}</span>
                {result && (
                  <button onClick={copyResult} className="p-1 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors">
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-blue-500" />}
                  </button>
                )}
              </div>
              <select
                value={toUnit}
                onChange={(e) => setToUnit(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {Object.entries(cat.units).map(([key, u]) => (
                  <option key={key} value={key}>{u.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Conversion Formula */}
          {result && fromUnit !== toUnit && (
            <div className="mt-6 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">{value}</span> {cat.units[fromUnit]?.label.split(' (')[0]} ={' '}
                <span className="font-bold text-blue-600">{result}</span> {cat.units[toUnit]?.label.split(' (')[0]}
              </p>
            </div>
          )}
        </div>

        {/* Common Conversions */}
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Common Conversions</h3>
          <div className="grid grid-cols-2 gap-2">
            {getCommonConversions(category).slice(0, 8).map((conv, i) => (
              <button
                key={i}
                onClick={() => { setFromUnit(conv.from); setToUnit(conv.to); setValue(conv.value.toString()); }}
                className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 text-left text-sm transition-colors"
              >
                <span className="text-gray-500 dark:text-gray-400">{conv.value} {cat.units[conv.from]?.label.split(' (')[0]}</span>
                <br />
                <span className="font-medium">= {conv.result} {cat.units[conv.to]?.label.split(' (')[0]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

function getCommonConversions(category: string): { from: string; to: string; value: number; result: string }[] {
  const all: Record<string, { from: string; to: string; value: number; result: string }[]> = {
    length: [
      { from: 'kilometers', to: 'miles', value: 1, result: '0.6214' },
      { from: 'miles', to: 'kilometers', value: 1, result: '1.609' },
      { from: 'meters', to: 'feet', value: 1, result: '3.281' },
      { from: 'feet', to: 'meters', value: 1, result: '0.3048' },
      { from: 'inches', to: 'centimeters', value: 1, result: '2.54' },
      { from: 'centimeters', to: 'inches', value: 1, result: '0.3937' },
      { from: 'yards', to: 'meters', value: 1, result: '0.9144' },
      { from: 'kilometers', to: 'nautical_miles', value: 1, result: '0.53996' },
    ],
    mass: [
      { from: 'kilograms', to: 'pounds', value: 1, result: '2.205' },
      { from: 'pounds', to: 'kilograms', value: 1, result: '0.4536' },
      { from: 'ounces', to: 'grams', value: 1, result: '28.35' },
      { from: 'grams', to: 'ounces', value: 1, result: '0.03527' },
      { from: 'metric_tons', to: 'pounds', value: 1, result: '2204.6' },
      { from: 'stones', to: 'kilograms', value: 1, result: '6.350' },
    ],
    temperature: [
      { from: 'celsius', to: 'fahrenheit', value: 0, result: '32' },
      { from: 'fahrenheit', to: 'celsius', value: 32, result: '0' },
      { from: 'celsius', to: 'kelvin', value: 0, result: '273.15' },
      { from: 'kelvin', to: 'celsius', value: 273.15, result: '0' },
      { from: 'celsius', to: 'fahrenheit', value: 100, result: '212' },
      { from: 'fahrenheit', to: 'celsius', value: 212, result: '100' },
    ],
    volume: [
      { from: 'liters', to: 'gallons_us', value: 1, result: '0.2642' },
      { from: 'gallons_us', to: 'liters', value: 1, result: '3.785' },
      { from: 'liters', to: 'cups', value: 1, result: '4.227' },
      { from: 'cups', to: 'milliliters', value: 1, result: '236.6' },
      { from: 'tablespoons', to: 'milliliters', value: 1, result: '14.79' },
      { from: 'teaspoons', to: 'milliliters', value: 1, result: '4.929' },
    ],
    speed: [
      { from: 'kilometers_per_hour', to: 'miles_per_hour', value: 1, result: '0.6214' },
      { from: 'miles_per_hour', to: 'kilometers_per_hour', value: 1, result: '1.609' },
      { from: 'knots', to: 'kilometers_per_hour', value: 1, result: '1.852' },
      { from: 'mach', to: 'kilometers_per_hour', value: 1, result: '1225' },
    ],
    area: [
      { from: 'square_meters', to: 'square_feet', value: 1, result: '10.76' },
      { from: 'square_feet', to: 'square_meters', value: 1, result: '0.0929' },
      { from: 'hectares', to: 'acres', value: 1, result: '2.471' },
      { from: 'acres', to: 'square_feet', value: 1, result: '43560' },
    ],
    time: [
      { from: 'hours', to: 'minutes', value: 1, result: '60' },
      { from: 'minutes', to: 'seconds', value: 1, result: '60' },
      { from: 'days', to: 'hours', value: 1, result: '24' },
      { from: 'weeks', to: 'days', value: 1, result: '7' },
      { from: 'years', to: 'days', value: 1, result: '365' },
    ],
    data: [
      { from: 'gigabytes', to: 'megabytes', value: 1, result: '1024' },
      { from: 'megabytes', to: 'kilobytes', value: 1, result: '1024' },
      { from: 'terabytes', to: 'gigabytes', value: 1, result: '1024' },
      { from: 'megabits', to: 'megabytes', value: 1, result: '0.125' },
    ],
    angle: [
      { from: 'degrees', to: 'radians', value: 180, result: '3.142' },
      { from: 'radians', to: 'degrees', value: 1, result: '57.3' },
      { from: 'degrees', to: 'arcminutes', value: 1, result: '60' },
      { from: 'arcminutes', to: 'arcseconds', value: 1, result: '60' },
    ],
  };
  return all[category] || [];
}

export default UnitConverter;
