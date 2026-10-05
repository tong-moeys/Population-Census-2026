/**
 * Utility functions for Khmer Solar (សុរិយគតិ) and Lunar (ចន្ទគតិ) calendar dates
 * used in official Cambodian administration, reports, and document signatures.
 */

// Khmer Digits (លេខខ្មែរ)
export const toKhmerNum = (num: number | string): string => {
  const khmerDigits = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
  return String(num).replace(/[0-9]/g, (digit) => khmerDigits[parseInt(digit, 10)]);
};

// Khmer Weekdays (ថ្ងៃនៃសប្តាហ៍)
export const KHMER_WEEKDAYS = [
  'អាទិត្យ',
  'ចន្ទ',
  'អង្គារ',
  'ពុធ',
  'ព្រហស្បតិ៍',
  'សុក្រ',
  'សៅរ៍'
];

// Khmer Solar Months (ខែសុរិយគតិ)
export const KHMER_SOLAR_MONTHS = [
  'មករា',
  'កុម្ភៈ',
  'មីនា',
  'មេសា',
  'ឧសភា',
  'មិថុនា',
  'កក្កដា',
  'សីហា',
  'កញ្ញា',
  'តុលា',
  'វិច្ឆិកា',
  'ធ្នូ'
];

// Khmer Lunar Months (ខែចន្ទគតិ)
export const KHMER_LUNAR_MONTHS = [
  'មិគសិរ',
  'បុស្ស',
  'មាឃ',
  'ផល្គុន',
  'ចែត្រ',
  'ពិសាខ',
  'ជេស្ឋ',
  'អាសាឍ',
  'ទុតិយាសាឍ',
  'ស្រាពណ៍',
  'ភទ្របទ',
  'អស្សុជ',
  'កត្តិក'
];

// Khmer Animal Years (ឆ្នាំនៃរាសីចក្រ)
export const KHMER_ZODIAC_YEARS = [
  'ជូត',   // Rat
  'ឆ្លូវ',   // Ox
  'ខាល',   // Tiger
  'ថោះ',   // Rabbit
  'រោង',   // Dragon
  'ម្សាញ់', // Snake
  'មមី',   // Horse
  'មមែ',   // Goat
  'វក',    // Monkey
  'រកា',   // Rooster
  'ច',     // Dog
  'កុរ'    // Pig
];

// Khmer Sak Eras (ស័ក)
export const KHMER_SAK = [
  'សំរឹទ្ធិស័ក', // 0
  'ឯកស័ក',      // 1
  'ទោស័ក',      // 2
  'ត្រីស័ក',      // 3
  'ចត្វាស័ក',    // 4
  'បញ្ចស័ក',     // 5
  'ឆស័ក',       // 6
  'សប្តស័ក',     // 7
  'អដ្ឋស័ក',      // 8
  'នព្វស័ក'       // 9
];

export interface SignatureDateConfig {
  mode: 'auto' | 'custom' | 'blank';
  location: string;
  // Solar values
  solarDate: string; // YYYY-MM-DD
  // Lunar values
  lunarDayOfWeek: string;
  lunarMoonPhase: 'កើត' | 'រោច';
  lunarDayOfMonth: number; // 1 to 15
  lunarMonth: string;
  lunarYear: string;
  lunarSak: string;
  buddhistYear: number;
  showLunar: boolean;
  showSolar: boolean;
}

/**
 * Calculates approximate Khmer Buddhist Era and Animal Year for a Gregorian year
 */
export function getKhmerYearInfo(date: Date) {
  const gYear = date.getFullYear();
  const gMonth = date.getMonth(); // 0-11
  const gDay = date.getDate();

  // Khmer New Year is usually April 13-14.
  // Before Khmer New Year, the lunar year belongs to the previous year.
  const isAfterKhmerNewYear = gMonth > 3 || (gMonth === 3 && gDay >= 14);

  // Buddhist Era (ព.ស.): Gregorian year + 543 or 544
  // After Visak Bochea (around May), Buddhist year advances.
  const isAfterVisak = gMonth >= 4;
  const beYear = gYear + (isAfterVisak ? 544 : 543);

  // Animal year cycle (2020: ជូត (0), 2024: រោង (4), 2026: មមី (6))
  const zodiacIndex = (gYear - 4) % 12;
  const adjustedZodiacIndex = isAfterKhmerNewYear ? (zodiacIndex >= 0 ? zodiacIndex : zodiacIndex + 12) : ((zodiacIndex - 1 + 12) % 12);
  const animalYear = KHMER_ZODIAC_YEARS[adjustedZodiacIndex];

  // Sak era cycle: Last digit of Buddhist era or Gregorian
  const sakIndex = (beYear) % 10;
  const sak = KHMER_SAK[sakIndex];

  return { beYear, animalYear, sak };
}

/**
 * Calculates approximate Khmer lunar day based on moon cycle
 */
export function getApproximateLunarDate(date: Date) {
  // Known reference new moon: Jan 18, 2026, or Feb 17, 2026
  // Synodic month = 29.53058867 days
  const refNewMoon = new Date(Date.UTC(2026, 0, 18, 19, 52, 0)).getTime();
  const diffDays = (date.getTime() - refNewMoon) / (1000 * 60 * 60 * 24);
  const synodicMonth = 29.53058867;
  const cycleDay = ((diffDays % synodicMonth) + synodicMonth) % synodicMonth;

  let moonPhase: 'កើត' | 'រោច' = 'កើត';
  let lunarDay = Math.floor(cycleDay) + 1;

  if (lunarDay > 15) {
    moonPhase = 'រោច';
    lunarDay = lunarDay - 15;
    if (lunarDay > 15) lunarDay = 15;
  }
  if (lunarDay < 1) lunarDay = 1;

  const dayOfWeek = KHMER_WEEKDAYS[date.getDay()];
  const { beYear, animalYear, sak } = getKhmerYearInfo(date);

  // Approximate Khmer lunar month (KHMER_LUNAR_MONTHS)
  // Usually aligned with Gregorian month with slight offset
  const gMonth = date.getMonth();
  // Mapping Gregorian month to roughly corresponding Khmer lunar month
  // Jan ~ បុស្ស / មាឃ, Sep ~ ភទ្របទ / អស្សុជ
  const lunarMonthMap: Record<number, string> = {
    0: 'បុស្ស',
    1: 'មាឃ',
    2: 'ផល្គុន',
    3: 'ចែត្រ',
    4: 'ពិសាខ',
    5: 'ជេស្ឋ',
    6: 'អាសាឍ',
    7: 'ស្រាពណ៍',
    8: 'ភទ្របទ',
    9: 'អស្សុជ',
    10: 'កត្តិក',
    11: 'មិគសិរ'
  };

  const lunarMonth = lunarMonthMap[gMonth] || 'ភទ្របទ';

  return {
    dayOfWeek,
    moonPhase,
    lunarDay,
    lunarMonth,
    animalYear,
    sak,
    beYear
  };
}

/**
 * Creates default signature date config
 */
export function getDefaultSignatureConfig(): SignatureDateConfig {
  const now = new Date();
  const approx = getApproximateLunarDate(now);

  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');

  return {
    mode: 'auto',
    location: 'រោគ',
    solarDate: `${yyyy}-${mm}-${dd}`,
    lunarDayOfWeek: approx.dayOfWeek,
    lunarMoonPhase: approx.moonPhase,
    lunarDayOfMonth: approx.lunarDay,
    lunarMonth: approx.lunarMonth,
    lunarYear: approx.animalYear,
    lunarSak: approx.sak,
    buddhistYear: approx.beYear,
    showLunar: true,
    showSolar: true
  };
}

/**
 * Formats full Lunar Date string for signatures
 * Example: ថ្ងៃសុក្រ ៩រោច ខែភទ្របទ ឆ្នាំមមី អដ្ឋស័ក ព.ស. ២៥៧០
 * or blank: ថ្ងៃ.......... ....កើត/រោច ខែ............ ឆ្នាំ............ ....ស័ក ព.ស. ២៥....
 */
export function formatKhmerLunarDate(config: SignatureDateConfig): string {
  if (config.mode === 'blank') {
    return 'ថ្ងៃ.................. ..........កើត/រោច ខែ.................. ឆ្នាំ.................. ..................ស័ក ព.ស. ២៥......';
  }

  const dayKh = toKhmerNum(config.lunarDayOfMonth);
  const beKh = toKhmerNum(config.buddhistYear);

  return `ថ្ងៃ${config.lunarDayOfWeek} ${dayKh}${config.lunarMoonPhase} ខែ${config.lunarMonth} ឆ្នាំ${config.lunarYear} ${config.lunarSak} ពុទ្ធសករាជ ២៥${beKh.slice(-2) || '៧០'}`;
}

/**
 * Formats full Solar Date string for signatures
 * Example: ធ្វើនៅ រោគ, ថ្ងៃទី២៥ ខែកញ្ញា ឆ្នាំ២០២៦
 * or blank: ធ្វើនៅ................, ថ្ងៃទី........ ខែ................ ឆ្នាំ២០២៦
 */
export function formatKhmerSolarDate(config: SignatureDateConfig): string {
  const locPrefix = config.location.trim() ? `${config.location.trim()}, ` : '';

  if (config.mode === 'blank') {
    return `${config.location.trim() ? config.location.trim() + ', ' : 'ធ្វើនៅ................, '}ថ្ងៃទី........ ខែ................ ឆ្នាំ២០២...`;
  }

  try {
    const parts = config.solarDate.split('-');
    const year = parseInt(parts[0], 10) || 2026;
    const monthIndex = (parseInt(parts[1], 10) || 1) - 1;
    const day = parseInt(parts[2], 10) || 1;

    const dayKh = toKhmerNum(day);
    const monthKh = KHMER_SOLAR_MONTHS[monthIndex] || 'មករា';
    const yearKh = toKhmerNum(year);

    return `${locPrefix}ថ្ងៃទី${dayKh} ខែ${monthKh} ឆ្នាំ${yearKh}`;
  } catch {
    return `${locPrefix}ថ្ងៃទី........ ខែ................ ឆ្នាំ២០២៦`;
  }
}
