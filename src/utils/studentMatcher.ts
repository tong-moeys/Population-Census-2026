import { Citizen } from '../types/census';
import { EyeCheckResult, StudentGrade } from '../types/student';
import { calculateAgeInMonths, calculateAgeYears, formatDobCanonical, parseDateOfBirth } from './enrollmentUtils';

export function normalizeKhmerText(str: string): string {
  return String(str || '')
    .replace(/\s+/g, '')
    .replace(/\u17D2\u178F/g, '\u17D2\u178A') // normalize coeng ta / da
    .replace(/\u17BB\u17B8/g, '\u17B8')       // normalize ុី -> ី
    .replace(/[\u17C9\u17CA\u17CB\u17CC\u17CD\u17CE\u17CF\u17D0]/g, '') // diacritics
    .trim();
}

export function khmerLevenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

export function dateKey(dt: Date | null): string {
  if (!dt || isNaN(dt.getTime())) return '';
  return `${dt.getFullYear()}-${dt.getMonth() + 1}-${dt.getDate()}`;
}

export function swappedDateKey(dt: Date | null): string {
  if (!dt || isNaN(dt.getTime())) return '';
  const d = dt.getDate();
  const m = dt.getMonth() + 1;
  if (d > 12) return '';
  return `${dt.getFullYear()}-${d}-${m}`;
}

/**
 * Resolves village strictly from census family code ({1-9}M* -> មុខឈ្នាង, {1-9}R* -> រោគ)
 * with fallback to raw village text.
 */
export function resolveVillageFromHouseholdCode(householdCode: string, rawVillage = ''): 'មុខឈ្នាង' | 'រោគ' {
  const code = String(householdCode || '').trim();
  const m = /^\s*\d+\s*([MR])/i.exec(code);
  if (m) {
    return m[1].toUpperCase() === 'M' ? 'មុខឈ្នាង' : 'រោគ';
  }
  if (String(rawVillage || '').includes('មុខឈ្នាង') || /M/i.test(code)) {
    return 'មុខឈ្នាង';
  }
  return 'រោគ';
}

export interface ParsedRawStudent {
  rowIndex: number;
  lastNameKh: string;
  firstNameKh: string;
  name: string;
  gender: 'ប្រុស' | 'ស្រី';
  dob: string;
  dobDate: Date | null;
  age: number;
  ageMonths: number;
  grade: StudentGrade | string;
  section: string;
  phone: string;
  pobVillage: string;
  pobCommune: string;
  pobDistrict: string;
  pobProvince: string;
  disability: string;
  academicYear: string;
  heightCm?: number;
  weightKg?: number;
  eyeCheck: EyeCheckResult;
  healthNotes: string;
  fatherName: string;
  fatherPhone: string;
  fatherOccupation: string;
  fatherVillage: string;
  motherName: string;
  motherPhone: string;
  motherOccupation: string;
  motherVillage: string;
  guardianName: string;
  guardianRelationship: string;
  guardianPhone: string;
  guardianOccupation: string;
}

const GRADE_CODE_MAP: Record<string, { grade: StudentGrade; section: string }> = {
  'មត្តេយ្យ-កម្រិតខ្ពស់': { grade: 'មត្តេយ្យកម្រិតខ្ពស់', section: 'ក' },
  'មត្តេយ្យ-ចម្រុះ': { grade: 'មត្តេយ្យចម្រុះ', section: 'ក' },
  '1-A': { grade: 'ថ្នាក់ទី១', section: 'ក' },
  '1-B': { grade: 'ថ្នាក់ទី១', section: 'ខ' },
  '2-A': { grade: 'ថ្នាក់ទី២', section: 'ក' },
  '2-B': { grade: 'ថ្នាក់ទី២', section: 'ខ' },
  '3-A': { grade: 'ថ្នាក់ទី៣', section: 'ក' },
  '3-B': { grade: 'ថ្នាក់ទី៣', section: 'ខ' },
  '4-A': { grade: 'ថ្នាក់ទី៤', section: 'ក' },
  '4-B': { grade: 'ថ្នាក់ទី៤', section: 'ខ' },
  '5-A': { grade: 'ថ្នាក់ទី៥', section: 'ក' },
  '5-B': { grade: 'ថ្នាក់ទី៥', section: 'ខ' },
  '6-A': { grade: 'ថ្នាក់ទី៦', section: 'ក' },
  '6-B': { grade: 'ថ្នាក់ទី៦', section: 'ខ' }
};

function toNumOrUndef(val: unknown): number | undefined {
  if (typeof val === 'number' && !isNaN(val) && val > 0) return val;
  if (typeof val === 'string' && val.trim() !== '') {
    const n = parseFloat(val);
    if (!isNaN(n) && n > 0) return n;
  }
  return undefined;
}

export function parseRawStudentRow(row: (string | number)[], rowIndex: number): ParsedRawStudent | null {
  if (!Array.isArray(row) || row.length < 10) return null;
  const lastNameKh = String(row[0] ?? '').trim();
  const firstNameKh = String(row[1] ?? '').trim();
  const name = [lastNameKh, firstNameKh].filter(Boolean).join(' ').trim();
  if (!name || lastNameKh === 'នាមត្រកូល' || lastNameKh === 'ព័ត៌មានសិស្ស') return null;

  const gender: 'ប្រុស' | 'ស្រី' = String(row[2] ?? '').trim() === 'ស្រី' ? 'ស្រី' : 'ប្រុស';
  const dobRaw = String(row[3] ?? '').trim();
  const dobDate = parseDateOfBirth(dobRaw, true);
  const dob = formatDobCanonical(dobDate, dobRaw);
  const age = calculateAgeYears(dob, 0, new Date(2026, 10, 1), true);
  const ageMonths = calculateAgeInMonths(dob, age);

  const rawGrade = String(row[5] ?? '').trim();
  const mapped = GRADE_CODE_MAP[rawGrade];
  const grade = mapped ? mapped.grade : rawGrade || 'ថ្នាក់ទី១';
  const section = mapped ? mapped.section : 'ក';

  const rawProvince = String(row[10] ?? '').trim().replace(/^ខេត្ត/, '').trim();
  const rawDisability = String(row[12] ?? '').trim();
  const disability =
    !rawDisability || rawDisability === 'មិនមានពិការភាព' || rawDisability === 'មិនមាន'
      ? ''
      : rawDisability;

  const heightSem2 = toNumOrUndef(row[18]);
  const weightSem2 = toNumOrUndef(row[19]);
  const heightCm = heightSem2 ?? toNumOrUndef(row[14]);
  const weightKg = weightSem2 ?? toNumOrUndef(row[15]);

  const rawEye = String(row[25] ?? '').trim();
  let eyeCheck: EyeCheckResult = 'untested';
  if (rawEye.includes('ភ្នែកល្អ') || rawEye.includes('ធម្មតា')) eyeCheck = 'normal';
  else if (rawEye.includes('ខ្សោយ')) eyeCheck = 'impaired';
  else if (rawEye.includes('វ៉ែនតា')) eyeCheck = 'glasses';

  const bmiStatus = String(row[21] ?? row[17] ?? '').trim();
  const earResult = String(row[32] ?? '').trim();
  const vaccine = String(row[37] ?? '').trim();
  const healthNotesParts: string[] = [];
  if (bmiStatus && bmiStatus !== 'ទម្ងន់ធម្មតា') healthNotesParts.push(`BMI: ${bmiStatus}`);
  if (earResult && !earResult.includes('ល្អប្រសើរ')) healthNotesParts.push(`ត្រចៀក: ${earResult}`);
  if (vaccine) healthNotesParts.push(`វ៉ាក់សាំង: ${vaccine}`);

  const fatherName = [String(row[39] ?? '').trim(), String(row[40] ?? '').trim()].filter(Boolean).join(' ').trim();
  const motherName = [String(row[47] ?? '').trim(), String(row[48] ?? '').trim()].filter(Boolean).join(' ').trim();
  const guardianType = String(row[55] ?? '').trim();
  const guardianName = [String(row[56] ?? '').trim(), String(row[57] ?? '').trim()].filter(Boolean).join(' ').trim();

  return {
    rowIndex,
    lastNameKh: lastNameKh || name,
    firstNameKh: firstNameKh || name,
    name,
    gender,
    dob,
    dobDate,
    age,
    ageMonths,
    grade,
    section,
    phone: String(row[6] ?? '').trim(),
    pobVillage: String(row[7] ?? '').trim(),
    pobCommune: String(row[8] ?? '').trim() || 'ស្ពានស្រែង',
    pobDistrict: String(row[9] ?? '').trim() || 'ភ្នំស្រុក',
    pobProvince: rawProvince || 'បន្ទាយមានជ័យ',
    disability,
    academicYear: '២០២៦-២០២៧',
    heightCm,
    weightKg,
    eyeCheck,
    healthNotes: healthNotesParts.join(' • '),
    fatherName,
    fatherPhone: String(row[41] ?? '').trim(),
    fatherOccupation: String(row[42] ?? '').trim() || 'កសិករ',
    fatherVillage: String(row[43] ?? '').trim(),
    motherName,
    motherPhone: String(row[49] ?? '').trim(),
    motherOccupation: String(row[50] ?? '').trim() || 'កសិករ',
    motherVillage: String(row[51] ?? '').trim(),
    guardianName: guardianName || fatherName || motherName || '',
    guardianRelationship: guardianType || (fatherName ? 'ឪពុក' : motherName ? 'ម្តាយ' : 'អាណាព្យាបាល'),
    guardianPhone: String(row[58] ?? '').trim(),
    guardianOccupation: String(row[59] ?? '').trim() || 'កសិករ'
  };
}

export function isExplicitOutsideVillage(villageName: string): boolean {
  const v = String(villageName || '').trim();
  if (!v) return false;
  return !v.includes('រោគ') && !v.includes('មុខឈ្នាង');
}

interface IndexedCitizen {
  citizen: Citizen;
  norm: string;
  dobDate: Date | null;
  dobKey: string;
  year: number;
  hhKey: string;
}

export function matchRawStudentsToCitizens(
  rawStudents: ParsedRawStudent[],
  citizens: Citizen[]
): Map<number, Citizen> {
  const indexed: IndexedCitizen[] = citizens.map(c => {
    const dt = parseDateOfBirth(c.dob, true);
    return {
      citizen: c,
      norm: normalizeKhmerText(c.name),
      dobDate: dt,
      dobKey: dateKey(dt),
      year: dt ? dt.getFullYear() : 2026 - c.age,
      hhKey: `${c.village || 'រោគ'}_${c.householdCode || c.householdId}`
    };
  });

  const famMembersMap = new Map<string, IndexedCitizen[]>();
  for (const item of indexed) {
    if (!famMembersMap.has(item.hhKey)) famMembersMap.set(item.hhKey, []);
    famMembersMap.get(item.hhKey)!.push(item);
  }

  const result = new Map<number, Citizen>();
  const usedCitizenIds = new Set<number>();

  const pickAvailable = (predicate: (item: IndexedCitizen) => boolean): Citizen | null => {
    for (const item of indexed) {
      if (usedCitizenIds.has(item.citizen.id)) continue;
      if (item.citizen.age > 20) continue; // safety guard: students are children/youth
      if (predicate(item)) {
        usedCitizenIds.add(item.citizen.id);
        return item.citizen;
      }
    }
    return null;
  };

  for (const s of rawStudents) {
    // Do not link students explicitly coming from outside catchment villages (ភ្នំដី, អន្លង់, etc.)
    if (isExplicitOutsideVillage(s.pobVillage)) continue;

    const sNorm = normalizeKhmerText(s.name);
    const sDobKey = dateKey(s.dobDate);
    const sSwapKey = swappedDateKey(s.dobDate);
    const sYear = s.dobDate ? s.dobDate.getFullYear() : 2026 - s.age;
    const fNorm = normalizeKhmerText(s.fatherName);
    const mNorm = normalizeKhmerText(s.motherName);

    const hasParentInHousehold = (hhKey: string): boolean => {
      if (!fNorm && !mNorm) return false;
      const members = famMembersMap.get(hhKey) || [];
      return members.some(mem =>
        (fNorm && khmerLevenshtein(mem.norm, fNorm) <= 2) ||
        (mNorm && khmerLevenshtein(mem.norm, mNorm) <= 2)
      );
    };

    // Tier 1: Exact normalized name + exact DOB
    let matched = pickAvailable(item => item.norm === sNorm && Boolean(sDobKey) && item.dobKey === sDobKey);

    // Tier 2: Exact normalized name + swapped DD/MM or birth year within ±1
    if (!matched) {
      matched = pickAvailable(
        item =>
          item.norm === sNorm &&
          ((Boolean(sSwapKey) && item.dobKey === sSwapKey) || Math.abs(item.year - sYear) <= 1)
      );
    }

    // Tier 3: Exact normalized name (age difference <= 3)
    if (!matched) {
      matched = pickAvailable(item => item.norm === sNorm && Math.abs(item.year - sYear) <= 3);
    }

    // Tier 4: Same DOB (or swapped) + matching father/mother name in household
    if (!matched && sDobKey) {
      matched = pickAvailable(
        item =>
          (item.dobKey === sDobKey || (Boolean(sSwapKey) && item.dobKey === sSwapKey)) &&
          hasParentInHousehold(item.hhKey)
      );
    }

    // Tier 5: Fuzzy normalized name (Levenshtein <= 2) + same/swapped DOB
    if (!matched && sDobKey) {
      matched = pickAvailable(
        item =>
          (item.dobKey === sDobKey || (Boolean(sSwapKey) && item.dobKey === sSwapKey)) &&
          khmerLevenshtein(item.norm, sNorm) <= 2
      );
    }

    // Tier 6: Fuzzy name (Levenshtein <= 3) + birth year ±1 + matching parent in household
    if (!matched && (fNorm || mNorm)) {
      matched = pickAvailable(
        item =>
          Math.abs(item.year - sYear) <= 1 &&
          khmerLevenshtein(item.norm, sNorm) <= 3 &&
          hasParentInHousehold(item.hhKey)
      );
    }

    if (matched) {
      result.set(s.rowIndex, matched);
    }
  }

  return result;
}
