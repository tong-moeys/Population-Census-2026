import { VillageComparisonRow, ComparisonGrandTotal } from '../types/comparison';
import { Citizen } from '../types/census';
import { StudentRecord } from '../types/student';

export const STORAGE_KEY_COMPARISON = 'moeys_comparison_table_2026_v1';

export const DEFAULT_COMPARISON_ROWS: VillageComparisonRow[] = [
  {
    id: 'roak',
    villageName: 'ភូមិរោគ',
    populationTotal: 1683,
    populationFemale: 829,
    householdCount: 323,
    age0Total: 24,
    age0Female: 12,
    age1Total: 30,
    age1Female: 15,
    age2Total: 26,
    age2Female: 12,
    age0to2Total: 80,
    age0to2Female: 39,
    age3Total: 31,
    age3Female: 21,
    age4Total: 26,
    age4Female: 9,
    age5Total: 35,
    age5Female: 12,
    age3to5Total: 92,
    age3to5Female: 42,
    enrolled3Total: 14,
    enrolled3Female: 9,
    enrolled4Total: 23,
    enrolled4Female: 14,
    enrolled5Total: 32,
    enrolled5Female: 14,
    enrolled3to5Total: 69,
    enrolled3to5Female: 37,
    rate3Total: 45.16,
    rate3Female: 42.86,
    rate4Total: 88.46,
    rate4Female: 155.56,
    rate5Total: 91.43,
    rate5Female: 116.67,
    rate3to5Total: 75.0,
    rate3to5Female: 88.1,
    remarks: 'មានកុមារមកពីតំបន់ផ្សេង'
  },
  {
    id: 'mukh_chhnang',
    villageName: 'ភូមិមុខឈ្នាង',
    populationTotal: 386,
    populationFemale: 201,
    householdCount: 77,
    age0Total: 4,
    age0Female: 2,
    age1Total: 5,
    age1Female: 2,
    age2Total: 10,
    age2Female: 7,
    age0to2Total: 19,
    age0to2Female: 11,
    age3Total: 2,
    age3Female: 2,
    age4Total: 7,
    age4Female: 4,
    age5Total: 9,
    age5Female: 7,
    age3to5Total: 18,
    age3to5Female: 13,
    enrolled3Total: 0,
    enrolled3Female: 0,
    enrolled4Total: 7,
    enrolled4Female: 4,
    enrolled5Total: 5,
    enrolled5Female: 5,
    enrolled3to5Total: 12,
    enrolled3to5Female: 9,
    rate3Total: 0,
    rate3Female: 0,
    rate4Total: 100.0,
    rate4Female: 100.0,
    rate5Total: 55.56,
    rate5Female: 71.43,
    rate3to5Total: 66.67,
    rate3to5Female: 69.23,
    remarks: ''
  }
];

export function computeRowRates(row: Omit<VillageComparisonRow, 'rate3Total' | 'rate3Female' | 'rate4Total' | 'rate4Female' | 'rate5Total' | 'rate5Female' | 'rate3to5Total' | 'rate3to5Female'>): VillageComparisonRow {
  const calcRate = (enrolled: number, census: number) => {
    if (!census || census <= 0) return 0;
    return parseFloat(((enrolled / census) * 100).toFixed(2));
  };

  const enrolled3to5Total = row.enrolled3Total + row.enrolled4Total + row.enrolled5Total;
  const enrolled3to5Female = row.enrolled3Female + row.enrolled4Female + row.enrolled5Female;

  const age0to2Total = row.age0Total + row.age1Total + row.age2Total;
  const age0to2Female = row.age0Female + row.age1Female + row.age2Female;

  const age3to5Total = row.age3Total + row.age4Total + row.age5Total;
  const age3to5Female = row.age3Female + row.age4Female + row.age5Female;

  return {
    ...row,
    age0to2Total,
    age0to2Female,
    age3to5Total,
    age3to5Female,
    enrolled3to5Total,
    enrolled3to5Female,
    rate3Total: calcRate(row.enrolled3Total, row.age3Total),
    rate3Female: calcRate(row.enrolled3Female, row.age3Female),
    rate4Total: calcRate(row.enrolled4Total, row.age4Total),
    rate4Female: calcRate(row.enrolled4Female, row.age4Female),
    rate5Total: calcRate(row.enrolled5Total, row.age5Total),
    rate5Female: calcRate(row.enrolled5Female, row.age5Female),
    rate3to5Total: calcRate(enrolled3to5Total, age3to5Total),
    rate3to5Female: calcRate(enrolled3to5Female, age3to5Female)
  };
}

export function computeGrandTotal(rows: VillageComparisonRow[]): ComparisonGrandTotal {
  const sum = (fn: (r: VillageComparisonRow) => number) => rows.reduce((acc, r) => acc + (fn(r) || 0), 0);

  const populationTotal = sum(r => r.populationTotal);
  const populationFemale = sum(r => r.populationFemale);
  const householdCount = sum(r => r.householdCount);

  const age0Total = sum(r => r.age0Total);
  const age0Female = sum(r => r.age0Female);
  const age1Total = sum(r => r.age1Total);
  const age1Female = sum(r => r.age1Female);
  const age2Total = sum(r => r.age2Total);
  const age2Female = sum(r => r.age2Female);
  const age0to2Total = age0Total + age1Total + age2Total;
  const age0to2Female = age0Female + age1Female + age2Female;

  const age3Total = sum(r => r.age3Total);
  const age3Female = sum(r => r.age3Female);
  const age4Total = sum(r => r.age4Total);
  const age4Female = sum(r => r.age4Female);
  const age5Total = sum(r => r.age5Total);
  const age5Female = sum(r => r.age5Female);
  const age3to5Total = age3Total + age4Total + age5Total;
  const age3to5Female = age3Female + age4Female + age5Female;

  const enrolled3Total = sum(r => r.enrolled3Total);
  const enrolled3Female = sum(r => r.enrolled3Female);
  const enrolled4Total = sum(r => r.enrolled4Total);
  const enrolled4Female = sum(r => r.enrolled4Female);
  const enrolled5Total = sum(r => r.enrolled5Total);
  const enrolled5Female = sum(r => r.enrolled5Female);
  const enrolled3to5Total = enrolled3Total + enrolled4Total + enrolled5Total;
  const enrolled3to5Female = enrolled3Female + enrolled4Female + enrolled5Female;

  const calcRate = (enrolled: number, census: number) => {
    if (!census || census <= 0) return 0;
    return parseFloat(((enrolled / census) * 100).toFixed(2));
  };

  return {
    populationTotal,
    populationFemale,
    householdCount,
    age0Total,
    age0Female,
    age1Total,
    age1Female,
    age2Total,
    age2Female,
    age0to2Total,
    age0to2Female,
    age3Total,
    age3Female,
    age4Total,
    age4Female,
    age5Total,
    age5Female,
    age3to5Total,
    age3to5Female,
    enrolled3Total,
    enrolled3Female,
    enrolled4Total,
    enrolled4Female,
    enrolled5Total,
    enrolled5Female,
    enrolled3to5Total,
    enrolled3to5Female,
    rate3Total: calcRate(enrolled3Total, age3Total),
    rate3Female: calcRate(enrolled3Female, age3Female),
    rate4Total: calcRate(enrolled4Total, age4Total),
    rate4Female: calcRate(enrolled4Female, age4Female),
    rate5Total: calcRate(enrolled5Total, age5Total),
    rate5Female: calcRate(enrolled5Female, age5Female),
    rate3to5Total: calcRate(enrolled3to5Total, age3to5Total),
    rate3to5Female: calcRate(enrolled3to5Female, age3to5Female)
  };
}

export function loadSavedComparisonRows(): VillageComparisonRow[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_COMPARISON);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(computeRowRates);
      }
    }
  } catch (e) {
    console.info('Using default comparison table data:', e);
  }
  return DEFAULT_COMPARISON_ROWS.map(computeRowRates);
}

export function saveComparisonRows(rows: VillageComparisonRow[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_COMPARISON, JSON.stringify(rows));
  } catch (e) {
    console.warn('Failed to save comparison table to localStorage:', e);
  }
}

// Compute live census statistics for a given village from the database
export function populateCensusFromCitizens(villageName: string, citizens: Citizen[]) {
  const isTargetVillage = (c: Citizen) => {
    const v = (c.village || '').trim();
    if (villageName.includes('មុខឈ្នាង')) {
      return v === 'មុខឈ្នាង';
    }
    return v === 'រោគ' || v !== 'មុខឈ្នាង';
  };

  const villageCitizens = citizens.filter(isTargetVillage);
  const popTotal = villageCitizens.length;
  const popFemale = villageCitizens.filter(c => c.gender === 'ស្រី').length;
  const householdSet = new Set(villageCitizens.map(c => `${c.village || 'រោគ'}_${c.householdCode || c.householdId}`));
  const hhCount = householdSet.size;

  const countAge = (targetAge: number) => {
    const matched = villageCitizens.filter(c => c.age === targetAge);
    const fem = matched.filter(c => c.gender === 'ស្រី').length;
    return { total: matched.length, female: fem };
  };

  const a0 = countAge(0);
  const a1 = countAge(1);
  const a2 = countAge(2);
  const a3 = countAge(3);
  const a4 = countAge(4);
  const a5 = countAge(5);

  return {
    populationTotal: popTotal,
    populationFemale: popFemale,
    householdCount: hhCount,
    age0Total: a0.total,
    age0Female: a0.female,
    age1Total: a1.total,
    age1Female: a1.female,
    age2Total: a2.total,
    age2Female: a2.female,
    age3Total: a3.total,
    age3Female: a3.female,
    age4Total: a4.total,
    age4Female: a4.female,
    age5Total: a5.total,
    age5Female: a5.female
  };
}

// Compute student enrollment counts from the actual students list
export function populateEnrolledFromStudents(villageName: string, students: StudentRecord[]) {
  const isTargetVillage = (s: StudentRecord) => {
    const v = (s.currentVillage || s.pobVillage || '').trim();
    if (villageName.includes('មុខឈ្នាង')) {
      return v.includes('មុខឈ្នាង');
    }
    return v.includes('រោគ') || (!v.includes('មុខឈ្នាង') && v.length > 0);
  };

  const villageStudents = students.filter(isTargetVillage);

  const countStudentAge = (targetAge: number) => {
    const matched = villageStudents.filter(s => {
      let age = s.age;
      if (!age && s.dob) {
        const yr = parseInt(s.dob.split('-')[0], 10);
        if (!isNaN(yr)) {
          age = 2026 - yr;
        }
      }
      return age === targetAge;
    });
    const female = matched.filter(s => s.gender === 'ស្រី').length;
    return { total: matched.length, female };
  };

  const e3 = countStudentAge(3);
  const e4 = countStudentAge(4);
  const e5 = countStudentAge(5);

  return {
    enrolled3Total: e3.total,
    enrolled3Female: e3.female,
    enrolled4Total: e4.total,
    enrolled4Female: e4.female,
    enrolled5Total: e5.total,
    enrolled5Female: e5.female
  };
}

export function exportComparisonToCSV(rows: VillageComparisonRow[], grandTotal: ComparisonGrandTotal) {
  const line0 = [
    'ឈ្មោះភូមិរដ្ឋបាលចំណុះអោយសាលា',
    'ចំនួនប្រជាជន', '',
    'ចំនួនគ្រួសារ',
    'ទិន្ន័យកុមារក្នុងភូមិ', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
    'ចំនួនសិស្សបានចុះឈ្មោះចូលរៀន ឆ្នាំសិក្សា ២០២៦-២០២៧', '', '', '', '', '', '', '',
    '% ទិន្ន័យការមាន៣-៥ បានចុះឈ្មោះចូលរៀន ២០២៦-២០២៧', '', '', '', '', '', '', '',
    'កំណត់សំគាល់'
  ];

  const line1 = [
    '', '', '', '',
    '0 ឆ្នាំ', '', '១ឆ្នាំ', '', '២ឆ្នាំ', '', '០-២ឆ្នាំ', '', '៣ឆ្នាំ', '', '៤ឆ្នាំ', '', '៥ឆ្នាំ', '', '៣-៥ឆ្នាំ', '',
    '៣ឆ្នាំ', '', '៤ឆ្នាំ', '', '៥ឆ្នាំ', '', '៣-៥ឆ្នាំ', '',
    '៣ឆ្នាំ', '', '៤ឆ្នាំ', '', '៥ឆ្នាំ', '', '៣-៥ឆ្នាំ', '',
    ''
  ];

  const line2 = [
    '',
    'សរុប', 'ស្រី',
    '',
    'សរុប', 'ស្រី', 'សរុប', 'ស្រី', 'សរុប', 'ស្រី', 'សរុប', 'ស្រី',
    'សរុប', 'ស្រី', 'សរុប', 'ស្រី', 'សរុប', 'ស្រី', 'សរុប', 'ស្រី',
    'សរុប', 'ស្រី', 'សរុប', 'ស្រី', 'សរុប', 'ស្រី', 'សរុប', 'ស្រី',
    'សរុប', 'ស្រី', 'សរុប', 'ស្រី', 'សរុប', 'ស្រី', 'សរុប', 'ស្រី',
    ''
  ];

  const formatRow = (r: VillageComparisonRow) => [
    `"${r.villageName}"`,
    r.populationTotal, r.populationFemale, r.householdCount,
    r.age0Total, r.age0Female,
    r.age1Total, r.age1Female,
    r.age2Total, r.age2Female,
    r.age0to2Total, r.age0to2Female,
    r.age3Total, r.age3Female,
    r.age4Total, r.age4Female,
    r.age5Total, r.age5Female,
    r.age3to5Total, r.age3to5Female,
    r.enrolled3Total, r.enrolled3Female,
    r.enrolled4Total, r.enrolled4Female,
    r.enrolled5Total, r.enrolled5Female,
    r.enrolled3to5Total, r.enrolled3to5Female,
    `"${r.rate3Total}%"`, `"${r.rate3Female}%"`,
    `"${r.rate4Total}%"`, `"${r.rate4Female}%"`,
    `"${r.rate5Total}%"`, `"${r.rate5Female}%"`,
    `"${r.rate3to5Total.toFixed(2)}%"`, `"${r.rate3to5Female.toFixed(2)}%"`,
    `"${r.remarks || ''}"`
  ];

  const totalRow = [
    '"សរុបរួម"',
    grandTotal.populationTotal, grandTotal.populationFemale, grandTotal.householdCount,
    grandTotal.age0Total, grandTotal.age0Female,
    grandTotal.age1Total, grandTotal.age1Female,
    grandTotal.age2Total, grandTotal.age2Female,
    grandTotal.age0to2Total, grandTotal.age0to2Female,
    grandTotal.age3Total, grandTotal.age3Female,
    grandTotal.age4Total, grandTotal.age4Female,
    grandTotal.age5Total, grandTotal.age5Female,
    grandTotal.age3to5Total, grandTotal.age3to5Female,
    grandTotal.enrolled3Total, grandTotal.enrolled3Female,
    grandTotal.enrolled4Total, grandTotal.enrolled4Female,
    grandTotal.enrolled5Total, grandTotal.enrolled5Female,
    grandTotal.enrolled3to5Total, grandTotal.enrolled3to5Female,
    `"${grandTotal.rate3Total.toFixed(2)}%"`, `"${grandTotal.rate3Female.toFixed(2)}%"`,
    `"${grandTotal.rate4Total.toFixed(2)}%"`, `"${grandTotal.rate4Female.toFixed(2)}%"`,
    `"${grandTotal.rate5Total.toFixed(2)}%"`, `"${grandTotal.rate5Female.toFixed(2)}%"`,
    `"${grandTotal.rate3to5Total.toFixed(2)}%"`, `"${grandTotal.rate3to5Female.toFixed(2)}%"`,
    '""'
  ];

  const allLines = [
    line0.join(','),
    line1.join(','),
    line2.join(','),
    ...rows.map(r => formatRow(r).join(',')),
    totalRow.join(',')
  ];

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + allLines.join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `comparison-table-census-vs-enrolled-2026-2027.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// =========================================================================
// PRIMARY SCHOOL (AGE 6+ & GROUP 2) COMPARISON LOGIC & STORAGE
// =========================================================================

export const STORAGE_KEY_PRIMARY_COMPARISON = 'moeys_primary_comparison_table_2026_v2';

import { PrimaryVillageComparisonRow, PrimaryGrandTotal } from '../types/comparison';
import { calculateAgeInMonths } from './enrollmentUtils';

export function computePrimaryRowRates(
  row: Omit<PrimaryVillageComparisonRow, 
    'group2RemainingTotal' | 'group2RemainingFemale' | 'group2RateTotal' | 'group2RateFemale' |
    'age6RemainingTotal' | 'age6RemainingFemale' | 'age6RateTotal' | 'age6RateFemale' |
    'age7RemainingTotal' | 'age7RemainingFemale' | 'age7RateTotal' | 'age7RateFemale' |
    'age8RemainingTotal' | 'age8RemainingFemale' | 'age8RateTotal' | 'age8RateFemale' |
    'age9RemainingTotal' | 'age9RemainingFemale' | 'age9RateTotal' | 'age9RateFemale' |
    'age10RemainingTotal' | 'age10RemainingFemale' | 'age10RateTotal' | 'age10RateFemale' |
    'age11RemainingTotal' | 'age11RemainingFemale' | 'age11RateTotal' | 'age11RateFemale' |
    'primaryCensusTotal' | 'primaryCensusFemale' | 'primaryEnrolledTotal' | 'primaryEnrolledFemale' |
    'primaryRemainingTotal' | 'primaryRemainingFemale' | 'primaryRateTotal' | 'primaryRateFemale'
  >
): PrimaryVillageComparisonRow {
  const calcRate = (enrolled: number, census: number) => {
    if (!census || census <= 0) return 0;
    return parseFloat(((enrolled / census) * 100).toFixed(2));
  };

  const group2RemainingTotal = Math.max(0, row.group2CensusTotal - row.group2EnrolledTotal);
  const group2RemainingFemale = Math.max(0, row.group2CensusFemale - row.group2EnrolledFemale);
  const group2RateTotal = calcRate(row.group2EnrolledTotal, row.group2CensusTotal);
  const group2RateFemale = calcRate(row.group2EnrolledFemale, row.group2CensusFemale);

  const age6RemainingTotal = Math.max(0, row.age6CensusTotal - row.age6EnrolledTotal);
  const age6RemainingFemale = Math.max(0, row.age6CensusFemale - row.age6EnrolledFemale);
  const age6RateTotal = calcRate(row.age6EnrolledTotal, row.age6CensusTotal);
  const age6RateFemale = calcRate(row.age6EnrolledFemale, row.age6CensusFemale);

  const age7RemainingTotal = Math.max(0, row.age7CensusTotal - row.age7EnrolledTotal);
  const age7RemainingFemale = Math.max(0, row.age7CensusFemale - row.age7EnrolledFemale);
  const age7RateTotal = calcRate(row.age7EnrolledTotal, row.age7CensusTotal);
  const age7RateFemale = calcRate(row.age7EnrolledFemale, row.age7CensusFemale);

  const age8RemainingTotal = Math.max(0, row.age8CensusTotal - row.age8EnrolledTotal);
  const age8RemainingFemale = Math.max(0, row.age8CensusFemale - row.age8EnrolledFemale);
  const age8RateTotal = calcRate(row.age8EnrolledTotal, row.age8CensusTotal);
  const age8RateFemale = calcRate(row.age8EnrolledFemale, row.age8CensusFemale);

  const age9RemainingTotal = Math.max(0, row.age9CensusTotal - row.age9EnrolledTotal);
  const age9RemainingFemale = Math.max(0, row.age9CensusFemale - row.age9EnrolledFemale);
  const age9RateTotal = calcRate(row.age9EnrolledTotal, row.age9CensusTotal);
  const age9RateFemale = calcRate(row.age9EnrolledFemale, row.age9CensusFemale);

  const age10RemainingTotal = Math.max(0, row.age10CensusTotal - row.age10EnrolledTotal);
  const age10RemainingFemale = Math.max(0, row.age10CensusFemale - row.age10EnrolledFemale);
  const age10RateTotal = calcRate(row.age10EnrolledTotal, row.age10CensusTotal);
  const age10RateFemale = calcRate(row.age10EnrolledFemale, row.age10CensusFemale);

  const age11RemainingTotal = Math.max(0, row.age11CensusTotal - row.age11EnrolledTotal);
  const age11RemainingFemale = Math.max(0, row.age11CensusFemale - row.age11EnrolledFemale);
  const age11RateTotal = calcRate(row.age11EnrolledTotal, row.age11CensusTotal);
  const age11RateFemale = calcRate(row.age11EnrolledFemale, row.age11CensusFemale);

  const primaryCensusTotal = row.age6CensusTotal + row.age7CensusTotal + row.age8CensusTotal + row.age9CensusTotal + row.age10CensusTotal + row.age11CensusTotal;
  const primaryCensusFemale = row.age6CensusFemale + row.age7CensusFemale + row.age8CensusFemale + row.age9CensusFemale + row.age10CensusFemale + row.age11CensusFemale;

  const primaryEnrolledTotal = row.age6EnrolledTotal + row.age7EnrolledTotal + row.age8EnrolledTotal + row.age9EnrolledTotal + row.age10EnrolledTotal + row.age11EnrolledTotal;
  const primaryEnrolledFemale = row.age6EnrolledFemale + row.age7EnrolledFemale + row.age8EnrolledFemale + row.age9EnrolledFemale + row.age10EnrolledFemale + row.age11EnrolledFemale;

  const primaryRemainingTotal = Math.max(0, primaryCensusTotal - primaryEnrolledTotal);
  const primaryRemainingFemale = Math.max(0, primaryCensusFemale - primaryEnrolledFemale);

  const primaryRateTotal = calcRate(primaryEnrolledTotal, primaryCensusTotal);
  const primaryRateFemale = calcRate(primaryEnrolledFemale, primaryCensusFemale);

  return {
    ...row,
    group2RemainingTotal,
    group2RemainingFemale,
    group2RateTotal,
    group2RateFemale,
    age6RemainingTotal,
    age6RemainingFemale,
    age6RateTotal,
    age6RateFemale,
    age7RemainingTotal,
    age7RemainingFemale,
    age7RateTotal,
    age7RateFemale,
    age8RemainingTotal,
    age8RemainingFemale,
    age8RateTotal,
    age8RateFemale,
    age9RemainingTotal,
    age9RemainingFemale,
    age9RateTotal,
    age9RateFemale,
    age10RemainingTotal,
    age10RemainingFemale,
    age10RateTotal,
    age10RateFemale,
    age11RemainingTotal,
    age11RemainingFemale,
    age11RateTotal,
    age11RateFemale,
    primaryCensusTotal,
    primaryCensusFemale,
    primaryEnrolledTotal,
    primaryEnrolledFemale,
    primaryRemainingTotal,
    primaryRemainingFemale,
    primaryRateTotal,
    primaryRateFemale
  };
}

export function computePrimaryGrandTotal(rows: PrimaryVillageComparisonRow[]): PrimaryGrandTotal {
  const sum = (fn: (r: PrimaryVillageComparisonRow) => number) => rows.reduce((acc, r) => acc + (fn(r) || 0), 0);

  const calcRate = (enrolled: number, census: number) => {
    if (!census || census <= 0) return 0;
    return parseFloat(((enrolled / census) * 100).toFixed(2));
  };

  const populationTotal = sum(r => r.populationTotal);
  const populationFemale = sum(r => r.populationFemale);
  const householdCount = sum(r => r.householdCount);

  const group2CensusTotal = sum(r => r.group2CensusTotal);
  const group2CensusFemale = sum(r => r.group2CensusFemale);
  const group2EnrolledTotal = sum(r => r.group2EnrolledTotal);
  const group2EnrolledFemale = sum(r => r.group2EnrolledFemale);
  const group2RemainingTotal = Math.max(0, group2CensusTotal - group2EnrolledTotal);
  const group2RemainingFemale = Math.max(0, group2CensusFemale - group2EnrolledFemale);
  const group2RateTotal = calcRate(group2EnrolledTotal, group2CensusTotal);
  const group2RateFemale = calcRate(group2EnrolledFemale, group2CensusFemale);

  const age6CensusTotal = sum(r => r.age6CensusTotal);
  const age6CensusFemale = sum(r => r.age6CensusFemale);
  const age6EnrolledTotal = sum(r => r.age6EnrolledTotal);
  const age6EnrolledFemale = sum(r => r.age6EnrolledFemale);
  const age6RemainingTotal = Math.max(0, age6CensusTotal - age6EnrolledTotal);
  const age6RemainingFemale = Math.max(0, age6CensusFemale - age6EnrolledFemale);
  const age6RateTotal = calcRate(age6EnrolledTotal, age6CensusTotal);
  const age6RateFemale = calcRate(age6EnrolledFemale, age6CensusFemale);

  const age7CensusTotal = sum(r => r.age7CensusTotal);
  const age7CensusFemale = sum(r => r.age7CensusFemale);
  const age7EnrolledTotal = sum(r => r.age7EnrolledTotal);
  const age7EnrolledFemale = sum(r => r.age7EnrolledFemale);
  const age7RemainingTotal = Math.max(0, age7CensusTotal - age7EnrolledTotal);
  const age7RemainingFemale = Math.max(0, age7CensusFemale - age7EnrolledFemale);
  const age7RateTotal = calcRate(age7EnrolledTotal, age7CensusTotal);
  const age7RateFemale = calcRate(age7EnrolledFemale, age7CensusFemale);

  const age8CensusTotal = sum(r => r.age8CensusTotal);
  const age8CensusFemale = sum(r => r.age8CensusFemale);
  const age8EnrolledTotal = sum(r => r.age8EnrolledTotal);
  const age8EnrolledFemale = sum(r => r.age8EnrolledFemale);
  const age8RemainingTotal = Math.max(0, age8CensusTotal - age8EnrolledTotal);
  const age8RemainingFemale = Math.max(0, age8CensusFemale - age8EnrolledFemale);
  const age8RateTotal = calcRate(age8EnrolledTotal, age8CensusTotal);
  const age8RateFemale = calcRate(age8EnrolledFemale, age8CensusFemale);

  const age9CensusTotal = sum(r => r.age9CensusTotal);
  const age9CensusFemale = sum(r => r.age9CensusFemale);
  const age9EnrolledTotal = sum(r => r.age9EnrolledTotal);
  const age9EnrolledFemale = sum(r => r.age9EnrolledFemale);
  const age9RemainingTotal = Math.max(0, age9CensusTotal - age9EnrolledTotal);
  const age9RemainingFemale = Math.max(0, age9CensusFemale - age9EnrolledFemale);
  const age9RateTotal = calcRate(age9EnrolledTotal, age9CensusTotal);
  const age9RateFemale = calcRate(age9EnrolledFemale, age9CensusFemale);

  const age10CensusTotal = sum(r => r.age10CensusTotal);
  const age10CensusFemale = sum(r => r.age10CensusFemale);
  const age10EnrolledTotal = sum(r => r.age10EnrolledTotal);
  const age10EnrolledFemale = sum(r => r.age10EnrolledFemale);
  const age10RemainingTotal = Math.max(0, age10CensusTotal - age10EnrolledTotal);
  const age10RemainingFemale = Math.max(0, age10CensusFemale - age10EnrolledFemale);
  const age10RateTotal = calcRate(age10EnrolledTotal, age10CensusTotal);
  const age10RateFemale = calcRate(age10EnrolledFemale, age10CensusFemale);

  const age11CensusTotal = sum(r => r.age11CensusTotal);
  const age11CensusFemale = sum(r => r.age11CensusFemale);
  const age11EnrolledTotal = sum(r => r.age11EnrolledTotal);
  const age11EnrolledFemale = sum(r => r.age11EnrolledFemale);
  const age11RemainingTotal = Math.max(0, age11CensusTotal - age11EnrolledTotal);
  const age11RemainingFemale = Math.max(0, age11CensusFemale - age11EnrolledFemale);
  const age11RateTotal = calcRate(age11EnrolledTotal, age11CensusTotal);
  const age11RateFemale = calcRate(age11EnrolledFemale, age11CensusFemale);

  const primaryCensusTotal = age6CensusTotal + age7CensusTotal + age8CensusTotal + age9CensusTotal + age10CensusTotal + age11CensusTotal;
  const primaryCensusFemale = age6CensusFemale + age7CensusFemale + age8CensusFemale + age9CensusFemale + age10CensusFemale + age11CensusFemale;
  const primaryEnrolledTotal = age6EnrolledTotal + age7EnrolledTotal + age8EnrolledTotal + age9EnrolledTotal + age10EnrolledTotal + age11EnrolledTotal;
  const primaryEnrolledFemale = age6EnrolledFemale + age7EnrolledFemale + age8EnrolledFemale + age9EnrolledFemale + age10EnrolledFemale + age11EnrolledFemale;
  const primaryRemainingTotal = Math.max(0, primaryCensusTotal - primaryEnrolledTotal);
  const primaryRemainingFemale = Math.max(0, primaryCensusFemale - primaryEnrolledFemale);
  const primaryRateTotal = calcRate(primaryEnrolledTotal, primaryCensusTotal);
  const primaryRateFemale = calcRate(primaryEnrolledFemale, primaryCensusFemale);

  const age12PlusCensusTotal = sum(r => r.age12PlusCensusTotal);
  const age12PlusCensusFemale = sum(r => r.age12PlusCensusFemale);
  const age12PlusEnrolledTotal = sum(r => r.age12PlusEnrolledTotal);
  const age12PlusEnrolledFemale = sum(r => r.age12PlusEnrolledFemale);

  return {
    populationTotal,
    populationFemale,
    householdCount,
    group2CensusTotal,
    group2CensusFemale,
    group2EnrolledTotal,
    group2EnrolledFemale,
    group2RemainingTotal,
    group2RemainingFemale,
    group2RateTotal,
    group2RateFemale,
    age6CensusTotal,
    age6CensusFemale,
    age6EnrolledTotal,
    age6EnrolledFemale,
    age6RemainingTotal,
    age6RemainingFemale,
    age6RateTotal,
    age6RateFemale,
    age7CensusTotal,
    age7CensusFemale,
    age7EnrolledTotal,
    age7EnrolledFemale,
    age7RemainingTotal,
    age7RemainingFemale,
    age7RateTotal,
    age7RateFemale,
    age8CensusTotal,
    age8CensusFemale,
    age8EnrolledTotal,
    age8EnrolledFemale,
    age8RemainingTotal,
    age8RemainingFemale,
    age8RateTotal,
    age8RateFemale,
    age9CensusTotal,
    age9CensusFemale,
    age9EnrolledTotal,
    age9EnrolledFemale,
    age9RemainingTotal,
    age9RemainingFemale,
    age9RateTotal,
    age9RateFemale,
    age10CensusTotal,
    age10CensusFemale,
    age10EnrolledTotal,
    age10EnrolledFemale,
    age10RemainingTotal,
    age10RemainingFemale,
    age10RateTotal,
    age10RateFemale,
    age11CensusTotal,
    age11CensusFemale,
    age11EnrolledTotal,
    age11EnrolledFemale,
    age11RemainingTotal,
    age11RemainingFemale,
    age11RateTotal,
    age11RateFemale,
    primaryCensusTotal,
    primaryCensusFemale,
    primaryEnrolledTotal,
    primaryEnrolledFemale,
    primaryRemainingTotal,
    primaryRemainingFemale,
    primaryRateTotal,
    primaryRateFemale,
    age12PlusCensusTotal,
    age12PlusCensusFemale,
    age12PlusEnrolledTotal,
    age12PlusEnrolledFemale
  };
}

// Generate Primary Baseline by accurately inspecting the true census and enrolled student records
export function generatePrimaryBaseline(citizens: Citizen[], students: StudentRecord[]): PrimaryVillageComparisonRow[] {
  const isRoak = (c: Citizen) => {
    const v = (c.village || '').trim();
    return v === 'រោគ' || v !== 'មុខឈ្នាង';
  };
  const isMukhChhnang = (c: Citizen) => {
    const v = (c.village || '').trim();
    return v === 'មុខឈ្នាង';
  };

  const isStudentRoak = (s: StudentRecord) => {
    const v = (s.currentVillage || s.pobVillage || '').trim();
    return v.includes('រោគ') || (!v.includes('មុខឈ្នាង') && v.length > 0);
  };
  const isStudentMukhChhnang = (s: StudentRecord) => {
    const v = (s.currentVillage || s.pobVillage || '').trim();
    return v.includes('មុខឈ្នាង');
  };

  const buildVillageRow = (
    id: string,
    villageName: string,
    filterCitizen: (c: Citizen) => boolean,
    filterStudent: (s: StudentRecord) => boolean,
    defaultRemarks: string
  ): PrimaryVillageComparisonRow => {
    const vCitizens = citizens.filter(filterCitizen);
    const vStudents = students.filter(filterStudent);

    const popTotal = vCitizens.length;
    const popFemale = vCitizens.filter(c => c.gender === 'ស្រី').length;
    const hhCount = new Set(vCitizens.map(c => `${c.village || 'រោគ'}_${c.householdCode || c.householdId}`)).size;

    // Group 2: 70-82 months (children entering Grade 1)
    const adultRel = new Set(['ប្តី', 'ប្រពន្ធ', 'ឪពុក', 'ម្តាយ', 'កូនប្រសារ', 'ម្ដាយក្មេក', 'ឪពុកក្មេក']);
    const nonAdults = vCitizens.filter(c => !adultRel.has((c.relationship || '').trim()));

    const group2List = nonAdults.filter(c => {
      const mos = calculateAgeInMonths(c.dob, c.age);
      return mos >= 70 && mos <= 82;
    });

    const group2CensusTotal = group2List.length;
    const group2CensusFemale = group2List.filter(c => c.gender === 'ស្រី').length;

    // Group 2 students enrolled (Grade 1 students from this village)
    const g1Students = vStudents.filter(s => {
      if (s.grade === 'ថ្នាក់ទី១') return true;
      const mos = s.ageMonths || calculateAgeInMonths(s.dob, s.age);
      return mos >= 70 && mos <= 82;
    });
    const group2EnrolledTotal = g1Students.length > 0 ? g1Students.length : group2List.filter(c => c.enrollmentStatus === 'enrolled').length;
    const group2EnrolledFemale = g1Students.length > 0 ? g1Students.filter(s => s.gender === 'ស្រី').length : group2List.filter(c => c.enrollmentStatus === 'enrolled' && c.gender === 'ស្រី').length;

    // Helper for ages 6 to 11
    const countAge = (targetAge: number) => {
      const matchCitizens = vCitizens.filter(c => c.age === targetAge);
      const matchFem = matchCitizens.filter(c => c.gender === 'ស្រី').length;

      // Match enrolled students in this age or corresponding primary grade
      const matchStudents = vStudents.filter(s => {
        let age = s.age;
        if (!age && s.dob) {
          const yr = parseInt(s.dob.split('-')[0], 10);
          if (!isNaN(yr)) age = 2026 - yr;
        }
        return age === targetAge;
      });
      const enrolledTot = matchStudents.length;
      const enrolledFem = matchStudents.filter(s => s.gender === 'ស្រី').length;

      return {
        censusTot: matchCitizens.length,
        censusFem: matchFem,
        enrolledTot,
        enrolledFem
      };
    };

    const a6 = countAge(6);
    const a7 = countAge(7);
    const a8 = countAge(8);
    const a9 = countAge(9);
    const a10 = countAge(10);
    const a11 = countAge(11);

    // Age 12+
    const a12Match = vCitizens.filter(c => c.age >= 12 && c.age <= 18);
    const a12Fem = a12Match.filter(c => c.gender === 'ស្រី').length;
    const a12Students = vStudents.filter(s => s.age >= 12);

    return computePrimaryRowRates({
      id,
      villageName,
      populationTotal: popTotal,
      populationFemale: popFemale,
      householdCount: hhCount,
      group2CensusTotal,
      group2CensusFemale,
      group2EnrolledTotal,
      group2EnrolledFemale,
      age6CensusTotal: a6.censusTot,
      age6CensusFemale: a6.censusFem,
      age6EnrolledTotal: Math.max(a6.enrolledTot, group2EnrolledTotal), // 6yo or Grade 1
      age6EnrolledFemale: Math.max(a6.enrolledFem, group2EnrolledFemale),
      age7CensusTotal: a7.censusTot,
      age7CensusFemale: a7.censusFem,
      age7EnrolledTotal: a7.enrolledTot,
      age7EnrolledFemale: a7.enrolledFem,
      age8CensusTotal: a8.censusTot,
      age8CensusFemale: a8.censusFem,
      age8EnrolledTotal: a8.enrolledTot,
      age8EnrolledFemale: a8.enrolledFem,
      age9CensusTotal: a9.censusTot,
      age9CensusFemale: a9.censusFem,
      age9EnrolledTotal: a9.enrolledTot,
      age9EnrolledFemale: a9.enrolledFem,
      age10CensusTotal: a10.censusTot,
      age10CensusFemale: a10.censusFem,
      age10EnrolledTotal: a10.enrolledTot,
      age10EnrolledFemale: a10.enrolledFem,
      age11CensusTotal: a11.censusTot,
      age11CensusFemale: a11.censusFem,
      age11EnrolledTotal: a11.enrolledTot,
      age11EnrolledFemale: a11.enrolledFem,
      age12PlusCensusTotal: a12Match.length,
      age12PlusCensusFemale: a12Fem,
      age12PlusEnrolledTotal: a12Students.length,
      age12PlusEnrolledFemale: a12Students.filter(s => s.gender === 'ស្រី').length,
      remarks: defaultRemarks
    });
  };

  const roakRow = buildVillageRow('roak', 'ភូមិរោគ', isRoak, isStudentRoak, 'សិស្សបានចុះឈ្មោះស្ទើរពេញលេញ (មានកុមារខ្លះមកពីតំបន់ក្បែរ)');
  const mukhChhnangRow = buildVillageRow('mukh_chhnang', 'ភូមិមុខឈ្នាង', isMukhChhnang, isStudentMukhChhnang, 'ភូមិចំណុះបឋមសិក្សារោគ');

  return [roakRow, mukhChhnangRow];
}

export function loadSavedPrimaryComparisonRows(citizens: Citizen[], students: StudentRecord[]): PrimaryVillageComparisonRow[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PRIMARY_COMPARISON);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(computePrimaryRowRates);
      }
    }
  } catch (e) {
    console.info('Using generated baseline primary comparison data:', e);
  }
  return generatePrimaryBaseline(citizens, students);
}

export function savePrimaryComparisonRows(rows: PrimaryVillageComparisonRow[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_PRIMARY_COMPARISON, JSON.stringify(rows));
  } catch (e) {
    console.warn('Failed to save primary comparison table to localStorage:', e);
  }
}

export function exportPrimaryComparisonToCSV(rows: PrimaryVillageComparisonRow[], grandTotal: PrimaryGrandTotal) {
  const line0 = [
    'ឈ្មោះភូមិរដ្ឋបាលចំណុះអោយសាលា',
    'ចំនួនប្រជាជន', '',
    'ចំនួនគ្រួសារ',
    'កុមារក្រុម២ (៧០-៨២ ខែ / ៦ឆ្នាំ)', '', '', '', '', '', '', '',
    '៦ឆ្នាំ (ថ្នាក់ទី១)', '', '', '',
    '៧ឆ្នាំ (ថ្នាក់ទី២)', '', '', '',
    '៨ឆ្នាំ (ថ្នាក់ទី៣)', '', '', '',
    '៩ឆ្នាំ (ថ្នាក់ទី៤)', '', '', '',
    '១០ឆ្នាំ (ថ្នាក់ទី៥)', '', '', '',
    '១១ឆ្នាំ (ថ្នាក់ទី៦)', '', '', '',
    'សរុបកុមារបឋមសិក្សា (៦-១១ ឆ្នាំ)', '', '', '', '', '', '', '',
    '១២ឆ្នាំឡើង', '', '', '',
    'កំណត់សំគាល់'
  ];

  const line1 = [
    '', '', '', '',
    'ជំរឿនពិត', '', 'បានចុះឈ្មោះ', '', 'នៅសល់មិនទាន់ចុះឈ្មោះ', '', '% ចូលរៀន', '',
    'ជំរឿន', 'សិស្សរៀន', 'នៅសល់', '%',
    'ជំរឿន', 'សិស្សរៀន', 'នៅសល់', '%',
    'ជំរឿន', 'សិស្សរៀន', 'នៅសល់', '%',
    'ជំរឿន', 'សិស្សរៀន', 'នៅសល់', '%',
    'ជំរឿន', 'សិស្សរៀន', 'នៅសល់', '%',
    'ជំរឿន', 'សិស្សរៀន', 'នៅសល់', '%',
    'ជំរឿនពិត សរុប', 'ជំរឿន ស្រី', 'បានចុះឈ្មោះ សរុប', 'បានចុះឈ្មោះ ស្រី', 'នៅសល់ សរុប', 'នៅសល់ ស្រី', '% ចូលរៀន សរុប', '% ចូលរៀន ស្រី',
    'ជំរឿន', 'ជំរឿន ស្រី', 'សិស្សរៀន', 'សិស្សរៀន ស្រី',
    ''
  ];

  const formatRow = (r: PrimaryVillageComparisonRow) => [
    `"${r.villageName}"`,
    r.populationTotal, r.populationFemale, r.householdCount,
    r.group2CensusTotal, r.group2CensusFemale,
    r.group2EnrolledTotal, r.group2EnrolledFemale,
    r.group2RemainingTotal, r.group2RemainingFemale,
    `"${r.group2RateTotal}%"`, `"${r.group2RateFemale}%"`,
    r.age6CensusTotal, r.age6EnrolledTotal, r.age6RemainingTotal, `"${r.age6RateTotal}%"`,
    r.age7CensusTotal, r.age7EnrolledTotal, r.age7RemainingTotal, `"${r.age7RateTotal}%"`,
    r.age8CensusTotal, r.age8EnrolledTotal, r.age8RemainingTotal, `"${r.age8RateTotal}%"`,
    r.age9CensusTotal, r.age9EnrolledTotal, r.age9RemainingTotal, `"${r.age9RateTotal}%"`,
    r.age10CensusTotal, r.age10EnrolledTotal, r.age10RemainingTotal, `"${r.age10RateTotal}%"`,
    r.age11CensusTotal, r.age11EnrolledTotal, r.age11RemainingTotal, `"${r.age11RateTotal}%"`,
    r.primaryCensusTotal, r.primaryCensusFemale,
    r.primaryEnrolledTotal, r.primaryEnrolledFemale,
    r.primaryRemainingTotal, r.primaryRemainingFemale,
    `"${r.primaryRateTotal.toFixed(2)}%"`, `"${r.primaryRateFemale.toFixed(2)}%"`,
    r.age12PlusCensusTotal, r.age12PlusCensusFemale, r.age12PlusEnrolledTotal, r.age12PlusEnrolledFemale,
    `"${r.remarks || ''}"`
  ];

  const totalRow = [
    '"សរុបរួម"',
    grandTotal.populationTotal, grandTotal.populationFemale, grandTotal.householdCount,
    grandTotal.group2CensusTotal, grandTotal.group2CensusFemale,
    grandTotal.group2EnrolledTotal, grandTotal.group2EnrolledFemale,
    grandTotal.group2RemainingTotal, grandTotal.group2RemainingFemale,
    `"${grandTotal.group2RateTotal.toFixed(2)}%"`, `"${grandTotal.group2RateFemale.toFixed(2)}%"`,
    grandTotal.age6CensusTotal, grandTotal.age6EnrolledTotal, grandTotal.age6RemainingTotal, `"${grandTotal.age6RateTotal.toFixed(2)}%"`,
    grandTotal.age7CensusTotal, grandTotal.age7EnrolledTotal, grandTotal.age7RemainingTotal, `"${grandTotal.age7RateTotal.toFixed(2)}%"`,
    grandTotal.age8CensusTotal, grandTotal.age8EnrolledTotal, grandTotal.age8RemainingTotal, `"${grandTotal.age8RateTotal.toFixed(2)}%"`,
    grandTotal.age9CensusTotal, grandTotal.age9EnrolledTotal, grandTotal.age9RemainingTotal, `"${grandTotal.age9RateTotal.toFixed(2)}%"`,
    grandTotal.age10CensusTotal, grandTotal.age10EnrolledTotal, grandTotal.age10RemainingTotal, `"${grandTotal.age10RateTotal.toFixed(2)}%"`,
    grandTotal.age11CensusTotal, grandTotal.age11EnrolledTotal, grandTotal.age11RemainingTotal, `"${grandTotal.age11RateTotal.toFixed(2)}%"`,
    grandTotal.primaryCensusTotal, grandTotal.primaryCensusFemale,
    grandTotal.primaryEnrolledTotal, grandTotal.primaryEnrolledFemale,
    grandTotal.primaryRemainingTotal, grandTotal.primaryRemainingFemale,
    `"${grandTotal.primaryRateTotal.toFixed(2)}%"`, `"${grandTotal.primaryRateFemale.toFixed(2)}%"`,
    grandTotal.age12PlusCensusTotal, grandTotal.age12PlusCensusFemale, grandTotal.age12PlusEnrolledTotal, grandTotal.age12PlusEnrolledFemale,
    '""'
  ];

  const allLines = [
    line0.join(','),
    line1.join(','),
    ...rows.map(r => formatRow(r).join(',')),
    totalRow.join(',')
  ];

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + allLines.join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `primary-school-group2-comparison-2026-2027.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Whole-School Statistics Aggregator
export interface SchoolWideStatistics {
  totalStudents: number;
  totalFemales: number;
  femalePercentage: number;
  totalClasses: number;

  // Grade Breakdown
  gradeStats: {
    gradeName: string;
    total: number;
    female: number;
    femaleRate: number;
    sections: string[];
  }[];

  // Feeder Village Breakdown
  villageStats: {
    villageName: string;
    total: number;
    female: number;
    percentage: number;
  }[];

  // Group 2 Analysis (70-82 months)
  group2: {
    censusTotal: number;
    censusFemale: number;
    enrolledTotal: number;
    enrolledFemale: number;
    remainingTotal: number;
    remainingFemale: number;
    enrollmentRate: number;
  };

  // Primary School Age in Catchment (6-11 years)
  primaryCatchment: {
    censusTotal: number;
    censusFemale: number;
    schoolTotal: number;
    schoolFemale: number;
    netEnrollmentRate: number;
  };

  // Equity & Health
  equity: {
    idPoorTotal: number;
    idPoorPercentage: number;
    eyeIssuesTotal: number;
  };
}

export function computeSchoolWideStatistics(
  students: StudentRecord[],
  citizens: Citizen[]
): SchoolWideStatistics {
  const totalStudents = students.length;
  const totalFemales = students.filter(s => s.gender === 'ស្រី').length;
  const femalePercentage = totalStudents > 0 ? parseFloat(((totalFemales / totalStudents) * 100).toFixed(1)) : 0;

  // Grade stats
  const gradeOrder = [
    'មត្តេយ្យកម្រិតទាប', 'មត្តេយ្យកម្រិតមធ្យម', 'មត្តេយ្យកម្រិតខ្ពស់',
    'ថ្នាក់ទី១', 'ថ្នាក់ទី២', 'ថ្នាក់ទី៣', 'ថ្នាក់ទី៤', 'ថ្នាក់ទី៥', 'ថ្នាក់ទី៦'
  ];

  const gradeMap = new Map<string, StudentRecord[]>();
  for (const s of students) {
    const g = s.grade || 'មិនស្គាល់';
    if (!gradeMap.has(g)) gradeMap.set(g, []);
    gradeMap.get(g)!.push(s);
  }

  const gradeStats = gradeOrder
    .filter(g => gradeMap.has(g))
    .map(g => {
      const list = gradeMap.get(g) || [];
      const fem = list.filter(s => s.gender === 'ស្រី').length;
      const sections = Array.from(new Set(list.map(s => s.section).filter(Boolean)));
      return {
        gradeName: g,
        total: list.length,
        female: fem,
        femaleRate: list.length > 0 ? parseFloat(((fem / list.length) * 100).toFixed(1)) : 0,
        sections: sections.length > 0 ? sections : ['ក']
      };
    });

  // Village stats
  const vMap: Record<string, StudentRecord[]> = {
    'ភូមិរោគ': [],
    'ភូមិមុខឈ្នាង': [],
    'ក្រៅតំបន់/ផ្សេងៗ': []
  };

  for (const s of students) {
    const v = (s.currentVillage || s.pobVillage || '').trim();
    if (v.includes('មុខឈ្នាង')) {
      vMap['ភូមិមុខឈ្នាង'].push(s);
    } else if (v.includes('រោគ') || v.length === 0) {
      vMap['ភូមិរោគ'].push(s);
    } else {
      vMap['ក្រៅតំបន់/ផ្សេងៗ'].push(s);
    }
  }

  const villageStats = Object.entries(vMap).map(([name, list]) => {
    const fem = list.filter(s => s.gender === 'ស្រី').length;
    return {
      villageName: name,
      total: list.length,
      female: fem,
      percentage: totalStudents > 0 ? parseFloat(((list.length / totalStudents) * 100).toFixed(1)) : 0
    };
  });

  // Group 2 (70-82 mos)
  const adultRel = new Set(['ប្តី', 'ប្រពន្ធ', 'ឪពុក', 'ម្តាយ', 'កូនប្រសារ', 'ម្ដាយក្មេក', 'ឪពុកក្មេក']);
  const group2Children = citizens
    .filter(c => !adultRel.has((c.relationship || '').trim()))
    .filter(c => {
      const mos = calculateAgeInMonths(c.dob, c.age);
      return mos >= 70 && mos <= 82;
    });

  const g2CensusTotal = group2Children.length;
  const g2CensusFemale = group2Children.filter(c => c.gender === 'ស្រី').length;
  const g2Enrolled = group2Children.filter(c => c.enrollmentStatus === 'enrolled');
  const g2EnrolledTotal = g2Enrolled.length;
  const g2EnrolledFemale = g2Enrolled.filter(c => c.gender === 'ស្រី').length;
  const g2RemainingTotal = Math.max(0, g2CensusTotal - g2EnrolledTotal);
  const g2RemainingFemale = Math.max(0, g2CensusFemale - g2EnrolledFemale);
  const g2Rate = g2CensusTotal > 0 ? parseFloat(((g2EnrolledTotal / g2CensusTotal) * 100).toFixed(1)) : 0;

  // Primary Catchment 6-11 years
  const primaryCitizens = citizens.filter(c => c.age >= 6 && c.age <= 11);
  const primaryCitizensFem = primaryCitizens.filter(c => c.gender === 'ស្រី').length;
  const primaryStudents = students.filter(s => s.grade.startsWith('ថ្នាក់ទី') || (s.age >= 6 && s.age <= 11));
  const primaryStudentsFem = primaryStudents.filter(s => s.gender === 'ស្រី').length;
  const netRate = primaryCitizens.length > 0 ? parseFloat(((primaryStudents.length / primaryCitizens.length) * 100).toFixed(1)) : 0;

  // Equity
  const idPoorTotal = students.filter(s => s.poorCard === 'idpoor1' || s.poorCard === 'idpoor2' || s.poorCard === 'vulnerable').length;
  const idPoorPercentage = totalStudents > 0 ? parseFloat(((idPoorTotal / totalStudents) * 100).toFixed(1)) : 0;
  const eyeIssuesTotal = students.filter(s => s.eyeCheck === 'glasses' || s.eyeCheck === 'impaired').length;

  return {
    totalStudents,
    totalFemales,
    femalePercentage,
    totalClasses: gradeStats.reduce((acc, g) => acc + g.sections.length, 0),
    gradeStats,
    villageStats,
    group2: {
      censusTotal: g2CensusTotal,
      censusFemale: g2CensusFemale,
      enrolledTotal: g2EnrolledTotal,
      enrolledFemale: g2EnrolledFemale,
      remainingTotal: g2RemainingTotal,
      remainingFemale: g2RemainingFemale,
      enrollmentRate: g2Rate
    },
    primaryCatchment: {
      censusTotal: primaryCitizens.length,
      censusFemale: primaryCitizensFem,
      schoolTotal: primaryStudents.length,
      schoolFemale: primaryStudentsFem,
      netEnrollmentRate: netRate
    },
    equity: {
      idPoorTotal,
      idPoorPercentage,
      eyeIssuesTotal
    }
  };
}

