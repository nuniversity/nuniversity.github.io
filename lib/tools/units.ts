/**
 * Unit conversion engine — one source of truth for the Unit Converter and its
 * "common conversions" shortcuts (which previously hard-coded rounded results
 * that could drift from the factors above them).
 *
 * Every unit stores its factor to the category base unit. Temperature is the
 * only affine scale and is handled explicitly; the old `offset` fields were
 * never read and produced nonsense if the generic path was taken.
 */

export interface UnitDefinition {
  /** English fallback label; dictionaries override it. */
  label: string
  /** Multiplier that converts this unit to the category base unit. */
  factor: number
}

export interface UnitCategory {
  label: string
  icon: string
  units: Record<string, UnitDefinition>
}

export const UNIT_CATEGORIES: Record<string, UnitCategory> = {
  length: {
    label: 'Length',
    icon: '📏',
    units: {
      meters: { label: 'Meters (m)', factor: 1 },
      kilometers: { label: 'Kilometers (km)', factor: 1000 },
      centimeters: { label: 'Centimeters (cm)', factor: 0.01 },
      millimeters: { label: 'Millimeters (mm)', factor: 0.001 },
      miles: { label: 'Miles (mi)', factor: 1609.344 },
      yards: { label: 'Yards (yd)', factor: 0.9144 },
      feet: { label: 'Feet (ft)', factor: 0.3048 },
      inches: { label: 'Inches (in)', factor: 0.0254 },
      nautical_miles: { label: 'Nautical Miles (nmi)', factor: 1852 },
    },
  },
  mass: {
    label: 'Mass',
    icon: '⚖️',
    units: {
      kilograms: { label: 'Kilograms (kg)', factor: 1 },
      grams: { label: 'Grams (g)', factor: 0.001 },
      milligrams: { label: 'Milligrams (mg)', factor: 0.000001 },
      metric_tons: { label: 'Metric Tons (t)', factor: 1000 },
      pounds: { label: 'Pounds (lb)', factor: 0.45359237 },
      ounces: { label: 'Ounces (oz)', factor: 0.028349523125 },
      stones: { label: 'Stones (st)', factor: 6.35029318 },
    },
  },
  temperature: {
    label: 'Temperature',
    icon: '🌡️',
    units: {
      celsius: { label: 'Celsius (°C)', factor: 1 },
      fahrenheit: { label: 'Fahrenheit (°F)', factor: 1 },
      kelvin: { label: 'Kelvin (K)', factor: 1 },
    },
  },
  volume: {
    label: 'Volume',
    icon: '🧪',
    units: {
      liters: { label: 'Liters (L)', factor: 1 },
      milliliters: { label: 'Milliliters (mL)', factor: 0.001 },
      cubic_meters: { label: 'Cubic Meters (m³)', factor: 1000 },
      gallons_us: { label: 'Gallons (US)', factor: 3.785411784 },
      gallons_uk: { label: 'Gallons (UK)', factor: 4.54609 },
      quarts: { label: 'Quarts (qt)', factor: 0.946352946 },
      pints: { label: 'Pints (pt)', factor: 0.473176473 },
      cups: { label: 'Cups (US)', factor: 0.2365882365 },
      fluid_ounces: { label: 'Fluid Ounces (fl oz)', factor: 0.0295735295625 },
      tablespoons: { label: 'Tablespoons (tbsp)', factor: 0.01478676478125 },
      teaspoons: { label: 'Teaspoons (tsp)', factor: 0.00492892159375 },
    },
  },
  speed: {
    label: 'Speed',
    icon: '🚀',
    units: {
      meters_per_second: { label: 'Meters/second (m/s)', factor: 1 },
      kilometers_per_hour: { label: 'Kilometers/hour (km/h)', factor: 1000 / 3600 },
      miles_per_hour: { label: 'Miles/hour (mph)', factor: 1609.344 / 3600 },
      knots: { label: 'Knots (kn)', factor: 1852 / 3600 },
      feet_per_second: { label: 'Feet/second (ft/s)', factor: 0.3048 },
      mach: { label: 'Mach (at sea level)', factor: 340.29 },
    },
  },
  area: {
    label: 'Area',
    icon: '📐',
    units: {
      square_meters: { label: 'Square Meters (m²)', factor: 1 },
      square_kilometers: { label: 'Square Kilometers (km²)', factor: 1_000_000 },
      square_miles: { label: 'Square Miles (mi²)', factor: 2_589_988.110336 },
      square_yards: { label: 'Square Yards (yd²)', factor: 0.83612736 },
      square_feet: { label: 'Square Feet (ft²)', factor: 0.09290304 },
      square_inches: { label: 'Square Inches (in²)', factor: 0.00064516 },
      hectares: { label: 'Hectares (ha)', factor: 10_000 },
      acres: { label: 'Acres (ac)', factor: 4046.8564224 },
    },
  },
  time: {
    label: 'Time',
    icon: '⏱️',
    units: {
      seconds: { label: 'Seconds (s)', factor: 1 },
      milliseconds: { label: 'Milliseconds (ms)', factor: 0.001 },
      microseconds: { label: 'Microseconds (µs)', factor: 0.000001 },
      minutes: { label: 'Minutes (min)', factor: 60 },
      hours: { label: 'Hours (h)', factor: 3600 },
      days: { label: 'Days (d)', factor: 86_400 },
      weeks: { label: 'Weeks (wk)', factor: 604_800 },
      months: { label: 'Months (30 days)', factor: 2_592_000 },
      years: { label: 'Years (365 days)', factor: 31_536_000 },
    },
  },
  data: {
    label: 'Data Storage',
    icon: '💾',
    units: {
      bytes: { label: 'Bytes (B)', factor: 1 },
      kilobytes: { label: 'Kilobytes (KB)', factor: 1024 },
      megabytes: { label: 'Megabytes (MB)', factor: 1024 ** 2 },
      gigabytes: { label: 'Gigabytes (GB)', factor: 1024 ** 3 },
      terabytes: { label: 'Terabytes (TB)', factor: 1024 ** 4 },
      petabytes: { label: 'Petabytes (PB)', factor: 1024 ** 5 },
      bits: { label: 'Bits (b)', factor: 0.125 },
      kilobits: { label: 'Kilobits (Kb)', factor: 128 },
      megabits: { label: 'Megabits (Mb)', factor: 131_072 },
      gigabits: { label: 'Gigabits (Gb)', factor: 134_217_728 },
    },
  },
  angle: {
    label: 'Angle',
    icon: '📐',
    units: {
      degrees: { label: 'Degrees (°)', factor: 1 },
      radians: { label: 'Radians (rad)', factor: 180 / Math.PI },
      gradians: { label: 'Gradians (grad)', factor: 0.9 },
      arcminutes: { label: 'Arcminutes (\')', factor: 1 / 60 },
      arcseconds: { label: 'Arcseconds (")', factor: 1 / 3600 },
    },
  },
}

export type UnitCategoryKey = keyof typeof UNIT_CATEGORIES

export function isUnitCategory(value: string): value is UnitCategoryKey {
  return Object.prototype.hasOwnProperty.call(UNIT_CATEGORIES, value)
}

function toCelsius(unit: string, value: number): number | null {
  switch (unit) {
    case 'celsius':
      return value
    case 'fahrenheit':
      return ((value - 32) * 5) / 9
    case 'kelvin':
      return value - 273.15
    default:
      return null
  }
}

function fromCelsius(unit: string, celsius: number): number | null {
  switch (unit) {
    case 'celsius':
      return celsius
    case 'fahrenheit':
      return (celsius * 9) / 5 + 32
    case 'kelvin':
      return celsius + 273.15
    default:
      return null
  }
}

/**
 * Converts `value` between two units of the same category.
 * Returns `null` for unknown categories/units or non-finite input.
 */
export function convertUnit(
  category: string,
  fromUnit: string,
  toUnit: string,
  value: number
): number | null {
  if (!Number.isFinite(value)) return null
  if (!isUnitCategory(category)) return null
  const units = UNIT_CATEGORIES[category].units
  const from = units[fromUnit]
  const to = units[toUnit]
  if (!from || !to) return null

  if (category === 'temperature') {
    const celsius = toCelsius(fromUnit, value)
    return celsius === null ? null : fromCelsius(toUnit, celsius)
  }

  return (value * from.factor) / to.factor
}

/** Locale used for number formatting for each supported site language. */
export function numberLocale(lang: string): string {
  if (lang === 'pt') return 'pt-BR'
  if (lang === 'es') return 'es-ES'
  return 'en-US'
}

/** Human-friendly numeric formatting with exponent fallbacks for extremes. */
export function formatUnitValue(value: number | null, lang = 'en'): string {
  if (value === null || !Number.isFinite(value)) return ''
  if (value === 0) return '0'
  const magnitude = Math.abs(value)
  if (magnitude < 0.0001 || magnitude >= 1_000_000_000_000) {
    return value.toExponential(6)
  }
  return value.toLocaleString(numberLocale(lang), { maximumSignificantDigits: 10 })
}

interface CommonConversion {
  from: string
  to: string
  value: number
}

const COMMON_CONVERSIONS: Record<string, CommonConversion[]> = {
  length: [
    { from: 'kilometers', to: 'miles', value: 1 },
    { from: 'miles', to: 'kilometers', value: 1 },
    { from: 'meters', to: 'feet', value: 1 },
    { from: 'feet', to: 'meters', value: 1 },
    { from: 'inches', to: 'centimeters', value: 1 },
    { from: 'centimeters', to: 'inches', value: 1 },
    { from: 'yards', to: 'meters', value: 1 },
    { from: 'kilometers', to: 'nautical_miles', value: 1 },
  ],
  mass: [
    { from: 'kilograms', to: 'pounds', value: 1 },
    { from: 'pounds', to: 'kilograms', value: 1 },
    { from: 'ounces', to: 'grams', value: 1 },
    { from: 'grams', to: 'ounces', value: 1 },
    { from: 'metric_tons', to: 'pounds', value: 1 },
    { from: 'stones', to: 'kilograms', value: 1 },
  ],
  temperature: [
    { from: 'celsius', to: 'fahrenheit', value: 0 },
    { from: 'fahrenheit', to: 'celsius', value: 32 },
    { from: 'celsius', to: 'kelvin', value: 0 },
    { from: 'kelvin', to: 'celsius', value: 273.15 },
    { from: 'celsius', to: 'fahrenheit', value: 100 },
    { from: 'fahrenheit', to: 'celsius', value: 212 },
  ],
  volume: [
    { from: 'liters', to: 'gallons_us', value: 1 },
    { from: 'gallons_us', to: 'liters', value: 1 },
    { from: 'liters', to: 'cups', value: 1 },
    { from: 'cups', to: 'milliliters', value: 1 },
    { from: 'tablespoons', to: 'milliliters', value: 1 },
    { from: 'teaspoons', to: 'milliliters', value: 1 },
  ],
  speed: [
    { from: 'kilometers_per_hour', to: 'miles_per_hour', value: 1 },
    { from: 'miles_per_hour', to: 'kilometers_per_hour', value: 1 },
    { from: 'knots', to: 'kilometers_per_hour', value: 1 },
    { from: 'mach', to: 'kilometers_per_hour', value: 1 },
  ],
  area: [
    { from: 'square_meters', to: 'square_feet', value: 1 },
    { from: 'square_feet', to: 'square_meters', value: 1 },
    { from: 'hectares', to: 'acres', value: 1 },
    { from: 'acres', to: 'square_feet', value: 1 },
  ],
  time: [
    { from: 'hours', to: 'minutes', value: 1 },
    { from: 'minutes', to: 'seconds', value: 1 },
    { from: 'days', to: 'hours', value: 1 },
    { from: 'weeks', to: 'days', value: 1 },
    { from: 'years', to: 'days', value: 1 },
  ],
  data: [
    { from: 'gigabytes', to: 'megabytes', value: 1 },
    { from: 'megabytes', to: 'kilobytes', value: 1 },
    { from: 'terabytes', to: 'gigabytes', value: 1 },
    { from: 'megabits', to: 'megabytes', value: 1 },
  ],
  angle: [
    { from: 'degrees', to: 'radians', value: 180 },
    { from: 'radians', to: 'degrees', value: 1 },
    { from: 'degrees', to: 'arcminutes', value: 1 },
    { from: 'arcminutes', to: 'arcseconds', value: 1 },
  ],
}

/** Common conversions for a category, with results computed from the factors. */
export function getCommonConversions(
  category: string,
  lang = 'en'
): Array<{ from: string; to: string; value: number; result: string }> {
  const pairs = COMMON_CONVERSIONS[category] ?? []
  return pairs.map((pair) => {
    const converted = convertUnit(category, pair.from, pair.to, pair.value)
    return { ...pair, result: formatUnitValue(converted, lang) }
  })
}
