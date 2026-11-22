import {
  VillageComparisonRow,
  ComparisonGrandTotal,
  PrimaryVillageComparisonRow,
  PrimaryGrandTotal,
  VillageCategory,
  MigrationVarianceStatus,
  VillageMigrationOverrideMap,
  VillageAgeMigrationRow
} from '../types/comparison';
import { Citizen } from '../types/census';
import { StudentRecord } from '../types/student';
import { calculateAgeInMonths, parseDateOfBirth } from './enrollmentUtils';

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
        const rows = parsed.map(computeRowRates);
        if (!rows.some(r => r.id === 'outside')) {
          rows.push(
            computeRowRates({
              id: 'outside',
              villageName: 'មកពីភូមិផ្សេង (ចំណូល)',
              populationTotal: 0,
              populationFemale: 0,
              householdCount: 0,
              age0Total: 0,
              age0Female: 0,
              age1Total: 0,
              age1Female: 0,
              age2Total: 0,
              age2Female: 0,
              age0to2Total: 0,
              age0to2Female: 0,
              age3Total: 0,
              age3Female: 0,
              age4Total: 0,
              age4Female: 0,
              age5Total: 0,
              age5Female: 0,
              age3to5Total: 0,
              age3to5Female: 0,
              enrolled3Total: 0,
              enrolled3Female: 0,
              enrolled4Total: 0,
              enrolled4Female: 0,
              enrolled5Total: 0,
              enrolled5Female: 0,
              enrolled3to5Total: 0,
              enrolled3to5Female: 0,
              remarks: 'សិស្សចំណូលមកពីភូមិក្រៅតំបន់សេវា'
            })
          );
        }
        return rows;
      }
    }
  } catch (e) {
    console.info('Using default comparison table data:', e);
  }
  return [
    ...DEFAULT_COMPARISON_ROWS.map(computeRowRates),
    computeRowRates({
      id: 'outside',
      villageName: 'មកពីភូមិផ្សេង (ចំណូល)',
      populationTotal: 0,
      populationFemale: 0,
      householdCount: 0,
      age0Total: 0,
      age0Female: 0,
      age1Total: 0,
      age1Female: 0,
      age2Total: 0,
      age2Female: 0,
      age0to2Total: 0,
      age0to2Female: 0,
      age3Total: 0,
      age3Female: 0,
      age4Total: 0,
      age4Female: 0,
      age5Total: 0,
      age5Female: 0,
      age3to5Total: 0,
      age3to5Female: 0,
      enrolled3Total: 0,
      enrolled3Female: 0,
      enrolled4Total: 0,
      enrolled4Female: 0,
      enrolled5Total: 0,
      enrolled5Female: 0,
      enrolled3to5Total: 0,
      enrolled3to5Female: 0,
      remarks: 'សិស្សចំណូលមកពីភូមិក្រៅតំបន់សេវា'
    })
  ];
}

export function saveComparisonRows(rows: VillageComparisonRow[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_COMPARISON, JSON.stringify(rows));
  } catch (e) {
    console.warn('Failed to save comparison table to localStorage:', e);
  }
}

export function classifyCitizenVillage(c: Citizen): 'roak' | 'mukh_chhnang' {
  const v = (c.village || '').trim();
  return v.includes('មុខឈ្នាង') ? 'mukh_chhnang' : 'roak';
}

export function classifyStudentVillage(s: StudentRecord): VillageCategory {
  const v = (s.currentVillage || s.pobVillage || '').trim();
  if (v.includes('មុខឈ្នាង')) return 'mukh_chhnang';
  if (!v || v.includes('រោគ')) return 'roak';
  return 'outside';
}

// Compute live census statistics for a given village from the database
export function populateCensusFromCitizens(villageName: string, citizens: Citizen[]) {
  if (villageName.includes('ភូមិផ្សេង') || villageName.includes('ចំណូល')) {
    return {
      populationTotal: 0,
      populationFemale: 0,
      householdCount: 0,
      age0Total: 0,
      age0Female: 0,
      age1Total: 0,
      age1Female: 0,
      age2Total: 0,
      age2Female: 0,
      age3Total: 0,
      age3Female: 0,
      age4Total: 0,
      age4Female: 0,
      age5Total: 0,
      age5Female: 0
    };
  }

  const targetCategory = villageName.includes('មុខឈ្នាង') ? 'mukh_chhnang' : 'roak';
  const villageCitizens = citizens.filter(c => classifyCitizenVillage(c) === targetCategory);
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

export function isActiveStudent(s: StudentRecord): boolean {
  return s.status !== 'dropped_out' && s.status !== 'transferred_out' && s.status !== 'graduated';
}

export function getStudentAgeYears(s: StudentRecord): number {
  if (typeof s.age === 'number' && !isNaN(s.age) && s.age > 0) {
    return Math.floor(s.age);
  }
  if (s.dob) {
    const trimmed = s.dob.trim();
    const isoMatch = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(trimmed);
    if (isoMatch) {
      const yr = parseInt(isoMatch[1], 10);
      if (!isNaN(yr)) return Math.max(0, 2026 - yr);
    }
    const parsed = parseDateOfBirth(trimmed);
    if (parsed) {
      return Math.max(0, 2026 - parsed.getFullYear());
    }
  }
  if (typeof s.ageMonths === 'number' && !isNaN(s.ageMonths) && s.ageMonths > 0) {
    return Math.floor(s.ageMonths / 12);
  }
  return 0;
}

// Compute student enrollment counts from the actual students list (purely by exact age)
export function populateEnrolledFromStudents(villageName: string, students: StudentRecord[]) {
  const targetCategory: VillageCategory = villageName.includes('មុខឈ្នាង')
    ? 'mukh_chhnang'
    : (villageName.includes('ភូមិផ្សេង') || villageName.includes('ចំណូល'))
      ? 'outside'
      : 'roak';

  const villageStudents = students.filter(isActiveStudent).filter(s => classifyStudentVillage(s) === targetCategory);

  const countStudentAge = (targetAge: number) => {
    const matched = villageStudents.filter(s => getStudentAgeYears(s) === targetAge);
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

export function generatePreschoolBaseline(citizens: Citizen[], students: StudentRecord[]): VillageComparisonRow[] {
  const savedMap = new Map(DEFAULT_COMPARISON_ROWS.map(r => [r.id, r]));
  const activeStudents = students.filter(isActiveStudent);
  const linkedCitizenIds = new Set(
    activeStudents.map(s => s.citizenId).filter((cid): cid is number => typeof cid === 'number' && !isNaN(cid))
  );
  const studentNameSet = new Set(activeStudents.map(s => (s.name || '').trim()).filter(Boolean));

  const buildRow = (id: string, villageName: string, fallbackRemark = '') => {
    const census = populateCensusFromCitizens(villageName, citizens);
    const enrolled = populateEnrolledFromStudents(villageName, students);
    const targetCategory: VillageCategory = id === 'mukh_chhnang' ? 'mukh_chhnang' : id === 'outside' ? 'outside' : 'roak';
    const extraCitizens = targetCategory === 'outside'
      ? []
      : citizens.filter(
          c =>
            classifyCitizenVillage(c) === targetCategory &&
            c.enrollmentStatus === 'enrolled' &&
            !linkedCitizenIds.has(c.id) &&
            !studentNameSet.has((c.name || '').trim())
        );

    const extraCount = (age: number) => {
      const m = extraCitizens.filter(c => c.age === age);
      return { total: m.length, female: m.filter(c => c.gender === 'ស្រី').length };
    };
    const ex3 = extraCount(3);
    const ex4 = extraCount(4);
    const ex5 = extraCount(5);

    const enrolled3Total = enrolled.enrolled3Total + ex3.total;
    const enrolled3Female = enrolled.enrolled3Female + ex3.female;
    const enrolled4Total = enrolled.enrolled4Total + ex4.total;
    const enrolled4Female = enrolled.enrolled4Female + ex4.female;
    const enrolled5Total = enrolled.enrolled5Total + ex5.total;
    const enrolled5Female = enrolled.enrolled5Female + ex5.female;

    const base = savedMap.get(id);
    return computeRowRates({
      id,
      villageName,
      ...census,
      age0to2Total: census.age0Total + census.age1Total + census.age2Total,
      age0to2Female: census.age0Female + census.age1Female + census.age2Female,
      age3to5Total: census.age3Total + census.age4Total + census.age5Total,
      age3to5Female: census.age3Female + census.age4Female + census.age5Female,
      enrolled3Total,
      enrolled3Female,
      enrolled4Total,
      enrolled4Female,
      enrolled5Total,
      enrolled5Female,
      enrolled3to5Total: enrolled3Total + enrolled4Total + enrolled5Total,
      enrolled3to5Female: enrolled3Female + enrolled4Female + enrolled5Female,
      remarks: base?.remarks || fallbackRemark
    });
  };
  return [
    buildRow('roak', 'ភូមិរោគ'),
    buildRow('mukh_chhnang', 'ភូមិមុខឈ្នាង'),
    buildRow('outside', 'មកពីភូមិផ្សេង (ចំណូល)', 'សិស្សចំណូលមកពីភូមិក្រៅតំបន់សេវា')
  ];
}

export function syncPreschoolRowsWithSystemData(
  existingRows: VillageComparisonRow[],
  citizens: Citizen[],
  students: StudentRecord[],
  syncStudentsAlso: boolean
): VillageComparisonRow[] {
  const freshRows = generatePreschoolBaseline(citizens, students);
  const existingMap = new Map(existingRows.map(r => [r.id, r]));
  return freshRows.map(fresh => {
    const prev = existingMap.get(fresh.id);
    if (!prev) return fresh;
    if (syncStudentsAlso) {
      return computeRowRates({
        ...fresh,
        remarks: prev.remarks ?? fresh.remarks
      });
    }
    return computeRowRates({
      ...prev,
      populationTotal: fresh.populationTotal,
      populationFemale: fresh.populationFemale,
      householdCount: fresh.householdCount,
      age0Total: fresh.age0Total,
      age0Female: fresh.age0Female,
      age1Total: fresh.age1Total,
      age1Female: fresh.age1Female,
      age2Total: fresh.age2Total,
      age2Female: fresh.age2Female,
      age0to2Total: fresh.age0to2Total,
      age0to2Female: fresh.age0to2Female,
      age3Total: fresh.age3Total,
      age3Female: fresh.age3Female,
      age4Total: fresh.age4Total,
      age4Female: fresh.age4Female,
      age5Total: fresh.age5Total,
      age5Female: fresh.age5Female,
      age3to5Total: fresh.age3to5Total,
      age3to5Female: fresh.age3to5Female
    });
  });
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

export const STORAGE_KEY_PRIMARY_COMPARISON = 'moeys_primary_comparison_table_2026_v3';

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

// Generate Primary Baseline by inspecting the true census and active enrolled student records strictly by Age (not Grade)
export function generatePrimaryBaseline(citizens: Citizen[], students: StudentRecord[]): PrimaryVillageComparisonRow[] {
  const isRoak = (c: Citizen) => classifyCitizenVillage(c) === 'roak';
  const isMukhChhnang = (c: Citizen) => classifyCitizenVillage(c) === 'mukh_chhnang';
  const isOutsideCitizen = (_c: Citizen) => false;

  const isStudentRoak = (s: StudentRecord) => classifyStudentVillage(s) === 'roak';
  const isStudentMukhChhnang = (s: StudentRecord) => classifyStudentVillage(s) === 'mukh_chhnang';
  const isStudentOutside = (s: StudentRecord) => classifyStudentVillage(s) === 'outside';

  const activeStudents = students.filter(isActiveStudent);

  const buildVillageRow = (
    id: string,
    villageName: string,
    filterCitizen: (c: Citizen) => boolean,
    filterStudent: (s: StudentRecord) => boolean,
    defaultRemarks: string
  ): PrimaryVillageComparisonRow => {
    const vCitizens = citizens.filter(filterCitizen);
    const vStudents = activeStudents.filter(filterStudent);

    const popTotal = vCitizens.length;
    const popFemale = vCitizens.filter(c => c.gender === 'ស្រី').length;
    const hhCount = new Set(vCitizens.map(c => `${c.village || 'រោគ'}_${c.householdCode || c.householdId}`)).size;

    // Deduplication sets to combine Student Registry + Citizens marked as 'enrolled' without double-counting
    const linkedCitizenIds = new Set(
      vStudents.map(s => s.citizenId).filter((cid): cid is number => typeof cid === 'number' && !isNaN(cid))
    );
    const studentNameSet = new Set(vStudents.map(s => (s.name || '').trim()).filter(Boolean));
    const extraEnrolledCitizens = vCitizens.filter(
      c => c.enrollmentStatus === 'enrolled' && !linkedCitizenIds.has(c.id) && !studentNameSet.has((c.name || '').trim())
    );

    // Group 2: 70-82 months (purely by age/months window)
    const adultRel = new Set(['ប្តី', 'ប្រពន្ធ', 'ឪពុក', 'ម្តាយ', 'កូនប្រសារ', 'ម្ដាយក្មេក', 'ឪពុកក្មេក']);
    const nonAdults = vCitizens.filter(c => !adultRel.has((c.relationship || '').trim()));

    const group2List = nonAdults.filter(c => {
      const mos = calculateAgeInMonths(c.dob, c.age);
      return mos >= 70 && mos <= 82;
    });

    const group2CensusTotal = group2List.length;
    const group2CensusFemale = group2List.filter(c => c.gender === 'ស្រី').length;

    const group2Students = vStudents.filter(s => {
      const mos = (typeof s.ageMonths === 'number' && s.ageMonths > 0)
        ? s.ageMonths
        : calculateAgeInMonths(s.dob, getStudentAgeYears(s));
      return mos >= 70 && mos <= 82;
    });
    const group2ExtraEnrolled = extraEnrolledCitizens.filter(c => {
      if (adultRel.has((c.relationship || '').trim())) return false;
      const mos = calculateAgeInMonths(c.dob, c.age);
      return mos >= 70 && mos <= 82;
    });
    const group2EnrolledTotal = group2Students.length + group2ExtraEnrolled.length;
    const group2EnrolledFemale =
      group2Students.filter(s => s.gender === 'ស្រី').length +
      group2ExtraEnrolled.filter(c => c.gender === 'ស្រី').length;

    // Helper for exact ages 6 to 11
    const countAge = (targetAge: number) => {
      const matchCitizens = vCitizens.filter(c => c.age === targetAge);
      const matchFem = matchCitizens.filter(c => c.gender === 'ស្រី').length;

      const matchStudents = vStudents.filter(s => getStudentAgeYears(s) === targetAge);
      const matchExtraEnrolled = extraEnrolledCitizens.filter(c => c.age === targetAge);

      const enrolledTot = matchStudents.length + matchExtraEnrolled.length;
      const enrolledFem =
        matchStudents.filter(s => s.gender === 'ស្រី').length +
        matchExtraEnrolled.filter(c => c.gender === 'ស្រី').length;

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

    // Age 12+ (Youth 12-18 in census; active students aged >= 12)
    const a12Match = vCitizens.filter(c => c.age >= 12 && c.age <= 18);
    const a12Fem = a12Match.filter(c => c.gender === 'ស្រី').length;
    const a12Students = vStudents.filter(s => getStudentAgeYears(s) >= 12);
    const a12ExtraEnrolled = extraEnrolledCitizens.filter(c => c.age >= 12 && c.age <= 18);

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
      age6EnrolledTotal: a6.enrolledTot,
      age6EnrolledFemale: a6.enrolledFem,
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
      age12PlusEnrolledTotal: a12Students.length + a12ExtraEnrolled.length,
      age12PlusEnrolledFemale:
        a12Students.filter(s => s.gender === 'ស្រី').length +
        a12ExtraEnrolled.filter(c => c.gender === 'ស្រី').length,
      remarks: defaultRemarks
    });
  };

  const roakRow = buildVillageRow('roak', 'ភូមិរោគ', isRoak, isStudentRoak, 'ទាញទិន្នន័យស្វ័យប្រវត្តិពីជំរឿន និងបញ្ជីសិស្ស');
  const mukhChhnangRow = buildVillageRow('mukh_chhnang', 'ភូមិមុខឈ្នាង', isMukhChhnang, isStudentMukhChhnang, 'ភូមិចំណុះបឋមសិក្សារោគ');
  const outsideRow = buildVillageRow('outside', 'មកពីភូមិផ្សេង (ចំណូល)', isOutsideCitizen, isStudentOutside, 'សិស្សចំណូលមកពីភូមិក្រៅតំបន់សេវា');

  return [roakRow, mukhChhnangRow, outsideRow];
}

export function syncPrimaryRowsWithSystemData(
  existingRows: PrimaryVillageComparisonRow[],
  citizens: Citizen[],
  students: StudentRecord[],
  syncStudentsAlso: boolean
): PrimaryVillageComparisonRow[] {
  const freshRows = generatePrimaryBaseline(citizens, students);
  const existingMap = new Map(existingRows.map(r => [r.id, r]));

  return freshRows.map(fresh => {
    const prev = existingMap.get(fresh.id);
    if (!prev) return fresh;
    if (syncStudentsAlso) {
      return computePrimaryRowRates({
        ...fresh,
        remarks: prev.remarks ?? fresh.remarks
      });
    }
    return computePrimaryRowRates({
      ...prev,
      populationTotal: fresh.populationTotal,
      populationFemale: fresh.populationFemale,
      householdCount: fresh.householdCount,
      group2CensusTotal: fresh.group2CensusTotal,
      group2CensusFemale: fresh.group2CensusFemale,
      age6CensusTotal: fresh.age6CensusTotal,
      age6CensusFemale: fresh.age6CensusFemale,
      age7CensusTotal: fresh.age7CensusTotal,
      age7CensusFemale: fresh.age7CensusFemale,
      age8CensusTotal: fresh.age8CensusTotal,
      age8CensusFemale: fresh.age8CensusFemale,
      age9CensusTotal: fresh.age9CensusTotal,
      age9CensusFemale: fresh.age9CensusFemale,
      age10CensusTotal: fresh.age10CensusTotal,
      age10CensusFemale: fresh.age10CensusFemale,
      age11CensusTotal: fresh.age11CensusTotal,
      age11CensusFemale: fresh.age11CensusFemale,
      age12PlusCensusTotal: fresh.age12PlusCensusTotal,
      age12PlusCensusFemale: fresh.age12PlusCensusFemale
    });
  });
}

export function loadSavedPrimaryComparisonRows(citizens: Citizen[], students: StudentRecord[]): PrimaryVillageComparisonRow[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PRIMARY_COMPARISON);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return syncPrimaryRowsWithSystemData(parsed.map(computePrimaryRowRates), citizens, students, false);
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
  const ageGroupHeaders = ['៦ ឆ្នាំ', '៧ ឆ្នាំ', '៨ ឆ្នាំ', '៩ ឆ្នាំ', '១០ ឆ្នាំ', '១១ ឆ្នាំ'];

  const line0 = [
    'ឈ្មោះភូមិរដ្ឋបាលចំណុះអោយសាលា',
    'ចំនួនប្រជាជន', '',
    'ចំនួនគ្រួសារ',
    'កុមារក្រុម២ (៧០-៨២ ខែ)', '', '', '', '', '', '', '',
    ...ageGroupHeaders.flatMap(label => [label, '', '', '', '', '', '', '']),
    'សរុបកុមារបឋមសិក្សា (៦-១១ ឆ្នាំ)', '', '', '', '', '', '', '',
    '១២ ឆ្នាំឡើង', '', '', '',
    'កំណត់សំគាល់'
  ];

  const metricPairHeaders = ['ជំរឿន', '', 'សិស្សរៀន', '', 'នៅសល់', '', '%', ''];
  const line1 = [
    '', '', '', '',
    'ជំរឿនពិត', '', 'សិស្សរៀន', '', 'នៅសល់', '', '% ចូលរៀន', '',
    ...ageGroupHeaders.flatMap(() => metricPairHeaders),
    'ជំរឿនសរុប', '', 'សិស្សរៀន', '', 'នៅសល់សរុប', '', '% ចូលរៀន', '',
    'ជំរឿន', '', 'សិស្សរៀន', '',
    ''
  ];

  const totalFemalePairs = (count: number) => Array.from({ length: count }, () => ['សរុប', 'ស្រី']).flat();
  const line2 = [
    '',
    'សរុប', 'ស្រី',
    '',
    ...totalFemalePairs(4), // Group 2
    ...ageGroupHeaders.flatMap(() => totalFemalePairs(4)), // Ages 6-11
    ...totalFemalePairs(4), // Primary Total
    ...totalFemalePairs(2), // Age 12+
    ''
  ];

  const formatRow = (r: PrimaryVillageComparisonRow) => [
    `"${r.villageName}"`,
    r.populationTotal, r.populationFemale, r.householdCount,
    r.group2CensusTotal, r.group2CensusFemale,
    r.group2EnrolledTotal, r.group2EnrolledFemale,
    r.group2RemainingTotal, r.group2RemainingFemale,
    `"${r.group2RateTotal}%"`, `"${r.group2RateFemale}%"`,
    r.age6CensusTotal, r.age6CensusFemale, r.age6EnrolledTotal, r.age6EnrolledFemale, r.age6RemainingTotal, r.age6RemainingFemale, `"${r.age6RateTotal}%"`, `"${r.age6RateFemale}%"`,
    r.age7CensusTotal, r.age7CensusFemale, r.age7EnrolledTotal, r.age7EnrolledFemale, r.age7RemainingTotal, r.age7RemainingFemale, `"${r.age7RateTotal}%"`, `"${r.age7RateFemale}%"`,
    r.age8CensusTotal, r.age8CensusFemale, r.age8EnrolledTotal, r.age8EnrolledFemale, r.age8RemainingTotal, r.age8RemainingFemale, `"${r.age8RateTotal}%"`, `"${r.age8RateFemale}%"`,
    r.age9CensusTotal, r.age9CensusFemale, r.age9EnrolledTotal, r.age9EnrolledFemale, r.age9RemainingTotal, r.age9RemainingFemale, `"${r.age9RateTotal}%"`, `"${r.age9RateFemale}%"`,
    r.age10CensusTotal, r.age10CensusFemale, r.age10EnrolledTotal, r.age10EnrolledFemale, r.age10RemainingTotal, r.age10RemainingFemale, `"${r.age10RateTotal}%"`, `"${r.age10RateFemale}%"`,
    r.age11CensusTotal, r.age11CensusFemale, r.age11EnrolledTotal, r.age11EnrolledFemale, r.age11RemainingTotal, r.age11RemainingFemale, `"${r.age11RateTotal}%"`, `"${r.age11RateFemale}%"`,
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
    grandTotal.age6CensusTotal, grandTotal.age6CensusFemale, grandTotal.age6EnrolledTotal, grandTotal.age6EnrolledFemale, grandTotal.age6RemainingTotal, grandTotal.age6RemainingFemale, `"${grandTotal.age6RateTotal.toFixed(2)}%"`, `"${grandTotal.age6RateFemale.toFixed(2)}%"`,
    grandTotal.age7CensusTotal, grandTotal.age7CensusFemale, grandTotal.age7EnrolledTotal, grandTotal.age7EnrolledFemale, grandTotal.age7RemainingTotal, grandTotal.age7RemainingFemale, `"${grandTotal.age7RateTotal.toFixed(2)}%"`, `"${grandTotal.age7RateFemale.toFixed(2)}%"`,
    grandTotal.age8CensusTotal, grandTotal.age8CensusFemale, grandTotal.age8EnrolledTotal, grandTotal.age8EnrolledFemale, grandTotal.age8RemainingTotal, grandTotal.age8RemainingFemale, `"${grandTotal.age8RateTotal.toFixed(2)}%"`, `"${grandTotal.age8RateFemale.toFixed(2)}%"`,
    grandTotal.age9CensusTotal, grandTotal.age9CensusFemale, grandTotal.age9EnrolledTotal, grandTotal.age9EnrolledFemale, grandTotal.age9RemainingTotal, grandTotal.age9RemainingFemale, `"${grandTotal.age9RateTotal.toFixed(2)}%"`, `"${grandTotal.age9RateFemale.toFixed(2)}%"`,
    grandTotal.age10CensusTotal, grandTotal.age10CensusFemale, grandTotal.age10EnrolledTotal, grandTotal.age10EnrolledFemale, grandTotal.age10RemainingTotal, grandTotal.age10RemainingFemale, `"${grandTotal.age10RateTotal.toFixed(2)}%"`, `"${grandTotal.age10RateFemale.toFixed(2)}%"`,
    grandTotal.age11CensusTotal, grandTotal.age11CensusFemale, grandTotal.age11EnrolledTotal, grandTotal.age11EnrolledFemale, grandTotal.age11RemainingTotal, grandTotal.age11RemainingFemale, `"${grandTotal.age11RateTotal.toFixed(2)}%"`, `"${grandTotal.age11RateFemale.toFixed(2)}%"`,
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
    line2.join(','),
    ...rows.map(r => formatRow(r).join(',')),
    totalRow.join(',')
  ];

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + allLines.join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `primary-school-age-comparison-2026-2027.csv`);
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

// =========================================================================
// VILLAGE × AGE MIGRATION (ចំណូល-ចំណាកស្រុក) & <100% / >100% CAUSE ANALYSIS
// =========================================================================

export const STORAGE_KEY_MIGRATION_OVERRIDES = 'moeys_village_age_migration_2026_v1';

export function loadMigrationOverrides(): VillageMigrationOverrideMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MIGRATION_OVERRIDES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed as VillageMigrationOverrideMap;
      }
    }
  } catch (e) {
    console.info('Using default village migration overrides:', e);
  }
  return {};
}

export function saveMigrationOverrides(overrides: VillageMigrationOverrideMap): void {
  try {
    localStorage.setItem(STORAGE_KEY_MIGRATION_OVERRIDES, JSON.stringify(overrides));
  } catch (e) {
    console.warn('Failed to save migration overrides to localStorage:', e);
  }
}

interface AgeCohortDefinition {
  ageKey: string;
  ageLabelKm: string;
  ageLabelEn: string;
  matchesCitizen: (c: Citizen) => boolean;
  matchesStudent: (s: StudentRecord) => boolean;
}

const ADULT_RELATIONSHIPS = new Set(['ប្តី', 'ប្រពន្ធ', 'ឪពុក', 'ម្តាយ', 'កូនប្រសារ', 'ម្ដាយក្មេក', 'ឪពុកក្មេក']);

const ALL_AGE_COHORT_DEFS: AgeCohortDefinition[] = [
  {
    ageKey: '3',
    ageLabelKm: '៣ ឆ្នាំ',
    ageLabelEn: 'Age 3',
    matchesCitizen: c => c.age === 3,
    matchesStudent: s => getStudentAgeYears(s) === 3
  },
  {
    ageKey: '4',
    ageLabelKm: '៤ ឆ្នាំ',
    ageLabelEn: 'Age 4',
    matchesCitizen: c => c.age === 4,
    matchesStudent: s => getStudentAgeYears(s) === 4
  },
  {
    ageKey: '5',
    ageLabelKm: '៥ ឆ្នាំ',
    ageLabelEn: 'Age 5',
    matchesCitizen: c => c.age === 5,
    matchesStudent: s => getStudentAgeYears(s) === 5
  },
  {
    ageKey: 'group2',
    ageLabelKm: 'ក្រុម២ (៧០-៨២ខែ)',
    ageLabelEn: 'Group 2 (70-82m)',
    matchesCitizen: c => {
      if (ADULT_RELATIONSHIPS.has((c.relationship || '').trim())) return false;
      const mos = calculateAgeInMonths(c.dob, c.age);
      return mos >= 70 && mos <= 82;
    },
    matchesStudent: s => {
      const mos = (typeof s.ageMonths === 'number' && s.ageMonths > 0)
        ? s.ageMonths
        : calculateAgeInMonths(s.dob, getStudentAgeYears(s));
      return mos >= 70 && mos <= 82;
    }
  },
  {
    ageKey: '6',
    ageLabelKm: '៦ ឆ្នាំ',
    ageLabelEn: 'Age 6',
    matchesCitizen: c => c.age === 6,
    matchesStudent: s => getStudentAgeYears(s) === 6
  },
  {
    ageKey: '7',
    ageLabelKm: '៧ ឆ្នាំ',
    ageLabelEn: 'Age 7',
    matchesCitizen: c => c.age === 7,
    matchesStudent: s => getStudentAgeYears(s) === 7
  },
  {
    ageKey: '8',
    ageLabelKm: '៨ ឆ្នាំ',
    ageLabelEn: 'Age 8',
    matchesCitizen: c => c.age === 8,
    matchesStudent: s => getStudentAgeYears(s) === 8
  },
  {
    ageKey: '9',
    ageLabelKm: '៩ ឆ្នាំ',
    ageLabelEn: 'Age 9',
    matchesCitizen: c => c.age === 9,
    matchesStudent: s => getStudentAgeYears(s) === 9
  },
  {
    ageKey: '10',
    ageLabelKm: '១០ ឆ្នាំ',
    ageLabelEn: 'Age 10',
    matchesCitizen: c => c.age === 10,
    matchesStudent: s => getStudentAgeYears(s) === 10
  },
  {
    ageKey: '11',
    ageLabelKm: '១១ ឆ្នាំ',
    ageLabelEn: 'Age 11',
    matchesCitizen: c => c.age === 11,
    matchesStudent: s => getStudentAgeYears(s) === 11
  },
  {
    ageKey: '12+',
    ageLabelKm: '១២+ ឆ្នាំ',
    ageLabelEn: 'Age 12+',
    matchesCitizen: c => c.age >= 12 && c.age <= 18,
    matchesStudent: s => getStudentAgeYears(s) >= 12
  }
];

function extractFromPrimaryRow(row: PrimaryVillageComparisonRow, ageKey: string) {
  switch (ageKey) {
    case 'group2':
      return {
        censusTotal: row.group2CensusTotal,
        censusFemale: row.group2CensusFemale,
        enrolledTotal: row.group2EnrolledTotal,
        enrolledFemale: row.group2EnrolledFemale
      };
    case '6':
      return {
        censusTotal: row.age6CensusTotal,
        censusFemale: row.age6CensusFemale,
        enrolledTotal: row.age6EnrolledTotal,
        enrolledFemale: row.age6EnrolledFemale
      };
    case '7':
      return {
        censusTotal: row.age7CensusTotal,
        censusFemale: row.age7CensusFemale,
        enrolledTotal: row.age7EnrolledTotal,
        enrolledFemale: row.age7EnrolledFemale
      };
    case '8':
      return {
        censusTotal: row.age8CensusTotal,
        censusFemale: row.age8CensusFemale,
        enrolledTotal: row.age8EnrolledTotal,
        enrolledFemale: row.age8EnrolledFemale
      };
    case '9':
      return {
        censusTotal: row.age9CensusTotal,
        censusFemale: row.age9CensusFemale,
        enrolledTotal: row.age9EnrolledTotal,
        enrolledFemale: row.age9EnrolledFemale
      };
    case '10':
      return {
        censusTotal: row.age10CensusTotal,
        censusFemale: row.age10CensusFemale,
        enrolledTotal: row.age10EnrolledTotal,
        enrolledFemale: row.age10EnrolledFemale
      };
    case '11':
      return {
        censusTotal: row.age11CensusTotal,
        censusFemale: row.age11CensusFemale,
        enrolledTotal: row.age11EnrolledTotal,
        enrolledFemale: row.age11EnrolledFemale
      };
    case '12+':
      return {
        censusTotal: row.age12PlusCensusTotal,
        censusFemale: row.age12PlusCensusFemale,
        enrolledTotal: row.age12PlusEnrolledTotal,
        enrolledFemale: row.age12PlusEnrolledFemale
      };
    default:
      return null;
  }
}

function extractFromPreschoolRow(row: VillageComparisonRow, ageKey: string) {
  switch (ageKey) {
    case '3':
      return {
        censusTotal: row.age3Total,
        censusFemale: row.age3Female,
        enrolledTotal: row.enrolled3Total,
        enrolledFemale: row.enrolled3Female
      };
    case '4':
      return {
        censusTotal: row.age4Total,
        censusFemale: row.age4Female,
        enrolledTotal: row.enrolled4Total,
        enrolledFemale: row.enrolled4Female
      };
    case '5':
      return {
        censusTotal: row.age5Total,
        censusFemale: row.age5Female,
        enrolledTotal: row.enrolled5Total,
        enrolledFemale: row.enrolled5Female
      };
    default:
      return null;
  }
}

export function computeVillageAgeMigrationRows(params: {
  mode: 'primary' | 'preschool' | 'all';
  primaryRows: PrimaryVillageComparisonRow[];
  preschoolRows: VillageComparisonRow[];
  citizens: Citizen[];
  students: StudentRecord[];
  overrides?: VillageMigrationOverrideMap;
  includeEmptyOutside?: boolean;
}): VillageAgeMigrationRow[] {
  const { mode, primaryRows, preschoolRows, citizens, students, overrides = {}, includeEmptyOutside = false } = params;

  const targetKeys =
    mode === 'preschool'
      ? ['3', '4', '5']
      : mode === 'primary'
        ? ['group2', '6', '7', '8', '9', '10', '11', '12+']
        : ['3', '4', '5', 'group2', '6', '7', '8', '9', '10', '11', '12+'];

  const cohorts = ALL_AGE_COHORT_DEFS.filter(def => targetKeys.includes(def.ageKey));
  const villageOrder: { id: VillageCategory; name: string }[] = [
    { id: 'roak', name: 'ភូមិរោគ' },
    { id: 'mukh_chhnang', name: 'ភូមិមុខឈ្នាង' },
    { id: 'outside', name: 'មកពីភូមិផ្សេង (ចំណូល)' }
  ];

  const rows: VillageAgeMigrationRow[] = [];

  for (const cohort of cohorts) {
    const cohortCitizens = citizens.filter(cohort.matchesCitizen);
    const cohortStudents = students.filter(cohort.matchesStudent);

    for (const vInfo of villageOrder) {
      const rowKey = `${mode}_${cohort.ageKey}_${vInfo.id}`;
      const override = overrides[rowKey];

      // Determine Census & Enrolled from live editable comparison rows (preserving manual table edits)
      let censusTotal = 0;
      let censusFemale = 0;
      let enrolledTotal = 0;
      let enrolledFemale = 0;

      const isPreschoolAge = cohort.ageKey === '3' || cohort.ageKey === '4' || cohort.ageKey === '5';
      if (isPreschoolAge) {
        const preRow = preschoolRows.find(r => r.id === vInfo.id);
        const extracted = preRow ? extractFromPreschoolRow(preRow, cohort.ageKey) : null;
        if (extracted) {
          censusTotal = extracted.censusTotal;
          censusFemale = extracted.censusFemale;
          enrolledTotal = extracted.enrolledTotal;
          enrolledFemale = extracted.enrolledFemale;
        }
      } else {
        const priRow = primaryRows.find(r => r.id === vInfo.id);
        const extracted = priRow ? extractFromPrimaryRow(priRow, cohort.ageKey) : null;
        if (extracted) {
          censusTotal = extracted.censusTotal;
          censusFemale = extracted.censusFemale;
          enrolledTotal = extracted.enrolledTotal;
          enrolledFemale = extracted.enrolledFemale;
        }
      }

      // System migration signals from Citizens & Students
      const vCitizens = vInfo.id === 'outside'
        ? []
        : cohortCitizens.filter(c => classifyCitizenVillage(c) === vInfo.id);
      const vStudentsAll = cohortStudents.filter(s => classifyStudentVillage(s) === vInfo.id);
      const vStudentsActive = vStudentsAll.filter(isActiveStudent);

      const movedList = vCitizens.filter(c => c.enrollmentStatus === 'moved');
      const notEnrolledList = vCitizens.filter(
        c => !c.enrollmentStatus || c.enrollmentStatus === 'not_enrolled' || c.enrollmentStatus === 'contacted'
      );
      const transferredInList = vStudentsActive.filter(s => s.status === 'transferred_in');
      const transferredOutList = vStudentsAll.filter(s => s.status === 'transferred_out');
      const droppedOutList = vStudentsAll.filter(s => s.status === 'dropped_out');

      const systemOutsideTotal = vInfo.id === 'outside' ? Math.max(enrolledTotal, vStudentsActive.length) : 0;
      const systemOutsideFemale = vInfo.id === 'outside'
        ? Math.max(enrolledFemale, vStudentsActive.filter(s => s.gender === 'ស្រី').length)
        : 0;

      const systemTransferredInTotal = transferredInList.length;
      const systemTransferredInFemale = transferredInList.filter(s => s.gender === 'ស្រី').length;
      const systemMovedTotal = movedList.length;
      const systemMovedFemale = movedList.filter(s => s.gender === 'ស្រី').length;
      const systemTransferredOutTotal = transferredOutList.length;
      const systemTransferredOutFemale = transferredOutList.filter(s => s.gender === 'ស្រី').length;
      const systemDroppedOutTotal = droppedOutList.length;
      const systemDroppedOutFemale = droppedOutList.filter(s => s.gender === 'ស្រី').length;
      const systemNotEnrolledTotal = notEnrolledList.length;
      const systemNotEnrolledFemale = notEnrolledList.filter(s => s.gender === 'ស្រី').length;

      const diffTotal = enrolledTotal - censusTotal;
      const diffFemale = enrolledFemale - censusFemale;

      const defaultInTotal = vInfo.id === 'outside'
        ? Math.max(enrolledTotal, systemOutsideTotal)
        : Math.max(systemTransferredInTotal, diffTotal > 0 ? diffTotal : 0);
      const defaultInFemale = vInfo.id === 'outside'
        ? Math.max(enrolledFemale, systemOutsideFemale)
        : Math.max(systemTransferredInFemale, diffFemale > 0 ? diffFemale : 0);

      const defaultOutTotal = systemMovedTotal + systemTransferredOutTotal + systemDroppedOutTotal;
      const defaultOutFemale = systemMovedFemale + systemTransferredOutFemale + systemDroppedOutFemale;

      const inMigrationTotal = override?.inMigrationTotal !== undefined ? override.inMigrationTotal : defaultInTotal;
      const inMigrationFemale = override?.inMigrationFemale !== undefined ? override.inMigrationFemale : defaultInFemale;
      const outMigrationTotal = override?.outMigrationTotal !== undefined ? override.outMigrationTotal : defaultOutTotal;
      const outMigrationFemale = override?.outMigrationFemale !== undefined ? override.outMigrationFemale : defaultOutFemale;

      // Skip completely empty outside-village rows unless requested or edited
      if (
        vInfo.id === 'outside' &&
        !includeEmptyOutside &&
        enrolledTotal === 0 &&
        inMigrationTotal === 0 &&
        outMigrationTotal === 0 &&
        !override?.customReason
      ) {
        continue;
      }

      const rateTotal = censusTotal > 0
        ? parseFloat(((enrolledTotal / censusTotal) * 100).toFixed(2))
        : (enrolledTotal > 0 ? 100 : 0);
      const rateFemale = censusFemale > 0
        ? parseFloat(((enrolledFemale / censusFemale) * 100).toFixed(2))
        : (enrolledFemale > 0 ? 100 : 0);

      let varianceStatus: MigrationVarianceStatus = 'none';
      if (vInfo.id === 'outside' && enrolledTotal > 0) {
        varianceStatus = 'over';
      } else if (censusTotal === 0 && enrolledTotal === 0) {
        varianceStatus = 'none';
      } else if (enrolledTotal > censusTotal) {
        varianceStatus = 'over';
      } else if (enrolledTotal < censusTotal) {
        varianceStatus = 'under';
      } else {
        varianceStatus = 'exact';
      }

      const notEnrolledRemainingTotal = diffTotal < 0
        ? Math.max(0, Math.abs(diffTotal) - outMigrationTotal)
        : 0;
      const notEnrolledRemainingFemale = diffFemale < 0
        ? Math.max(0, Math.abs(diffFemale) - outMigrationFemale)
        : 0;

      // Construct clear Khmer reason explaining <100% or >100%
      let autoReasonKm = '';
      if (vInfo.id === 'outside') {
        autoReasonKm = `>១០០% ចំណូលក្រៅភូមិ៖ សិស្សចំនួន ${enrolledTotal} នាក់ (ស្រី ${enrolledFemale}) មករៀនពីក្រៅតំបន់សេវា (គ្មានឈ្មោះក្នុងជំរឿនភូមិរោគ-មុខឈ្នាង)`;
      } else if (varianceStatus === 'over') {
        const surplus = diffTotal;
        const postCensusNewcomers = Math.max(0, inMigrationTotal - systemTransferredInTotal);
        const parts: string[] = [];
        if (systemTransferredInTotal > 0) parts.push(`ផ្ទេរចូល ${systemTransferredInTotal} នាក់`);
        if (postCensusNewcomers > 0) parts.push(`ចំណូលថ្មី/ក្រៅជំរឿន ${postCensusNewcomers} នាក់`);
        if (outMigrationTotal > 0) parts.push(`ចំណាកស្រុក ${outMigrationTotal} នាក់`);
        autoReasonKm = `>១០០% លើស +${surplus} នាក់ (${rateTotal.toFixed(1)}%)៖ មកពីចំណូលថ្មី/ផ្ទេរចូលសរុប ${inMigrationTotal} នាក់` +
          (parts.length > 0 ? ` (${parts.join(', ')})` : '');
      } else if (varianceStatus === 'under') {
        const deficit = Math.abs(diffTotal);
        const parts: string[] = [];
        if (outMigrationTotal > 0) {
          parts.push(`ចំណាកស្រុក/ផ្លាស់លំនៅ-ឈប់រៀន ${outMigrationTotal} នាក់`);
        }
        if (notEnrolledRemainingTotal > 0) {
          parts.push(`មិនទាន់ចុះឈ្មោះ/រៀនសាលាផ្សេង ${notEnrolledRemainingTotal} នាក់`);
        }
        if (inMigrationTotal > 0) {
          parts.push(`មានចំណូលចូលមកជំនួស ${inMigrationTotal} នាក់`);
        }
        autoReasonKm = `<១០០% ខ្វះ -${deficit} នាក់ (${rateTotal.toFixed(1)}%)៖ ${parts.join(' • ')}`;
      } else if (varianceStatus === 'exact') {
        autoReasonKm = `=១០០% គ្រប់តាមជំរឿន (${enrolledTotal}/${censusTotal} នាក់)` +
          (inMigrationTotal > 0 || outMigrationTotal > 0
            ? ` • ចំណូល ${inMigrationTotal} / ចំណាកស្រុក ${outMigrationTotal}`
            : '');
      } else {
        autoReasonKm = 'គ្មានកុមារក្នុងជំរឿន និងក្នុងបញ្ជីសាលា';
      }

      rows.push({
        rowKey,
        mode,
        ageKey: cohort.ageKey,
        ageLabelKm: cohort.ageLabelKm,
        ageLabelEn: cohort.ageLabelEn,
        villageId: vInfo.id,
        villageName: vInfo.name,
        censusTotal,
        censusFemale,
        enrolledTotal,
        enrolledFemale,
        diffTotal,
        diffFemale,
        rateTotal,
        rateFemale,
        varianceStatus,
        inMigrationTotal,
        inMigrationFemale,
        outMigrationTotal,
        outMigrationFemale,
        notEnrolledRemainingTotal,
        notEnrolledRemainingFemale,
        systemOutsideTotal,
        systemOutsideFemale,
        systemTransferredInTotal,
        systemTransferredInFemale,
        systemMovedTotal,
        systemMovedFemale,
        systemTransferredOutTotal,
        systemTransferredOutFemale,
        systemDroppedOutTotal,
        systemDroppedOutFemale,
        systemNotEnrolledTotal,
        systemNotEnrolledFemale,
        autoReasonKm,
        customReason: override?.customReason || ''
      });
    }
  }

  return rows;
}

export function exportMigrationAnalysisToCSV(rows: VillageAgeMigrationRow[], modeLabel = 'all') {
  const headers = [
    'ក្រុមអាយុ',
    'ឈ្មោះភូមិ (ជួរដេកភូមិ)',
    'ជំរឿន (សរុប)',
    'ជំរឿន (ស្រី)',
    'សិស្សរៀន (សរុប)',
    'សិស្សរៀន (ស្រី)',
    'លំអៀង (សរុប)',
    'លំអៀង (ស្រី)',
    '% ចូលរៀន (សរុប)',
    '% ចូលរៀន (ស្រី)',
    'ស្ថានភាពភាគរយ',
    'ចំណូល (សរុប)',
    'ចំណូល (ស្រី)',
    'ចំណាកស្រុក/ផ្លាស់ចេញ (សរុប)',
    'ចំណាកស្រុក/ផ្លាស់ចេញ (ស្រី)',
    'មិនទាន់ចុះឈ្មោះ/សាលាផ្សេង (សរុប)',
    'មិនទាន់ចុះឈ្មោះ/សាលាផ្សេង (ស្រី)',
    'មូលហេតុ (<១០០% / >១០០%)',
    'កំណត់សំគាល់បន្ថែម'
  ];

  const statusText = (r: VillageAgeMigrationRow) => {
    if (r.villageId === 'outside') return '>100% (ចំណូលក្រៅភូមិ)';
    if (r.varianceStatus === 'over') return '>100% (លើស/ចំណូល)';
    if (r.varianceStatus === 'under') return '<100% (ខ្វះ)';
    if (r.varianceStatus === 'exact') return '=100% (គ្រប់)';
    return 'គ្មានទិន្នន័យ';
  };

  const lines = rows.map(r => [
    `"${r.ageLabelKm}"`,
    `"${r.villageName}"`,
    r.censusTotal,
    r.censusFemale,
    r.enrolledTotal,
    r.enrolledFemale,
    r.diffTotal,
    r.diffFemale,
    r.villageId === 'outside' ? '"ចំណូលក្រៅភូមិ"' : `"${r.rateTotal.toFixed(2)}%"`,
    r.villageId === 'outside' ? '"—"' : `"${r.rateFemale.toFixed(2)}%"`,
    `"${statusText(r)}"`,
    r.inMigrationTotal,
    r.inMigrationFemale,
    r.outMigrationTotal,
    r.outMigrationFemale,
    r.notEnrolledRemainingTotal,
    r.notEnrolledRemainingFemale,
    `"${r.autoReasonKm.replace(/"/g, '""')}"`,
    `"${(r.customReason || '').replace(/"/g, '""')}"`
  ].join(','));

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...lines].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `village-age-migration-reasons-${modeLabel}-2026-2027.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}


