import { Citizen, Household, EnrollmentChild, EnrollmentGroupStats, EnrollmentStatus } from '../types/census';

const monthMap: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
};

/**
 * Parses DOB supporting "DD/Mon/YYYY" (e.g., "15/Apr/2020"), numeric "DD/MM/YYYY",
 * numeric "MM/DD/YYYY" / "MM-DD-YYYY" (when month/day order differs or 2nd token > 12), and 2-digit years.
 */
export function parseDateOfBirth(dobStr: string, preferDayFirst = true): Date | null {
  if (!dobStr) return null;
  const parts = dobStr.trim().split(/[/-]/);
  if (parts.length !== 3) return null;

  const rawYear = parts[2].trim();
  let yr = parseInt(rawYear, 10);
  if (isNaN(yr)) return null;
  if (rawYear.length === 2) {
    yr = yr <= 27 ? 2000 + yr : 1900 + yr;
  }

  const monKey = parts[1].toLowerCase().trim();
  if (monthMap[monKey] !== undefined) {
    const day = parseInt(parts[0], 10);
    if (isNaN(day) || day < 1 || day > 31) return null;
    return new Date(yr, monthMap[monKey], day);
  }

  // Handle numeric dates (e.g., "02/11/2021" DD/MM/YYYY or "10/25/90" MM/DD/YY)
  const first = parseInt(parts[0], 10);
  const second = parseInt(parts[1], 10);
  if (isNaN(first) || isNaN(second)) return null;

  if (first > 12 && second >= 1 && second <= 12) {
    return new Date(yr, second - 1, first);
  }
  if (second > 12 && first >= 1 && first <= 12) {
    return new Date(yr, first - 1, second);
  }
  if (preferDayFirst) {
    return new Date(yr, second - 1, first);
  }
  return new Date(yr, first - 1, second);
}

/**
 * Formats a Date into canonical "DD/Mon/YYYY" for display and matching
 */
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export function formatDobCanonical(dt: Date | null, fallback = ''): string {
  if (!dt || isNaN(dt.getTime())) return fallback;
  const dd = String(dt.getDate()).padStart(2, '0');
  const mon = MONTH_NAMES[dt.getMonth()];
  const yyyy = dt.getFullYear();
  return `${dd}/${mon}/${yyyy}`;
}

/**
 * Calculates age in full years as of the November 2026 census reference date
 */
export function calculateAgeYears(
  dobStr: string,
  fallbackYears = 0,
  asOfDate: Date = new Date(2026, 10, 1),
  preferDayFirst = true
): number {
  const dob = parseDateOfBirth(dobStr, preferDayFirst);
  if (!dob) return Math.max(0, fallbackYears || 0);
  let age = asOfDate.getFullYear() - dob.getFullYear();
  if (
    asOfDate.getMonth() < dob.getMonth() ||
    (asOfDate.getMonth() === dob.getMonth() && asOfDate.getDate() < dob.getDate())
  ) {
    age--;
  }
  return Math.max(0, age);
}

/**
 * Calculates exact age in full months as of the official school year intake cutoff (October 1, 2026)
 */
export function calculateAgeInMonths(
  dobStr: string,
  fallbackYears = 0,
  asOfDate: Date = new Date(2026, 9, 1)
): number {
  const dob = parseDateOfBirth(dobStr, true);
  if (!dob) {
    return Math.max(0, fallbackYears * 12);
  }
  let months = (asOfDate.getFullYear() - dob.getFullYear()) * 12 + (asOfDate.getMonth() - dob.getMonth());
  if (asOfDate.getDate() < dob.getDate()) {
    months--;
  }
  return Math.max(0, months);
}

/**
 * Build enrollment child list with parent information and group membership
 */
export function getEnrollmentChildren(
  citizens: Citizen[],
  households: Household[]
): {
  allChildren: EnrollmentChild[];
  group1Children: EnrollmentChild[];
  group2Children: EnrollmentChild[];
  stats: EnrollmentGroupStats;
} {
  // Map household to easily lookup parents
  const householdMap = new Map<string, Household>();
  for (const h of households) {
    const key = `${h.village || 'រោគ'}_${h.householdCode || h.id}`;
    householdMap.set(key, h);
    householdMap.set(String(h.householdCode || h.id), h);
  }

  const allChildren: EnrollmentChild[] = [];
  const group1Children: EnrollmentChild[] = [];
  const group2Children: EnrollmentChild[] = [];

  const adultRelationships = new Set([
    'ប្តី', 'ប្រពន្ធ', 'ឪពុក', 'ម្តាយ', 'កូនប្រសារ', 'ម្ដាយក្មេក', 'ឪពុកក្មេក'
  ]);

  for (const citizen of citizens) {
    if (adultRelationships.has((citizen.relationship || '').trim())) continue;

    const months = calculateAgeInMonths(citizen.dob, citizen.age);
    const years = citizen.age || Math.floor(months / 12);

    // Group 2: Children aged 70-82 months (official Grade 1 Primary school enrollment window)
    const isGroup2 = months >= 70 && months <= 82;

    // Group 1: Children aged 3-5 years (pre-school mobilization, < 70 months)
    const isGroup1 = !isGroup2 && ((years >= 3 && years <= 5) || (months >= 36 && months <= 69));

    if (!isGroup1 && !isGroup2) continue;

    // Find parent / guardian in the same household
    const hKey = `${citizen.village || 'រោគ'}_${citizen.householdCode || citizen.householdId}`;
    const household = householdMap.get(hKey) || householdMap.get(String(citizen.householdCode || citizen.householdId));

    let parentName = '';
    let parentRelationship = '';

    if (household) {
      // Look for father or mother
      const father = household.members.find(m => m.relationship === 'ឪពុក' || m.relationship === 'ប្តី');
      const mother = household.members.find(m => m.relationship === 'ម្តាយ' || m.relationship === 'ប្រពន្ធ');
      
      if (father && mother) {
        parentName = `${father.name} (ឪពុក) / ${mother.name} (ម្តាយ)`;
        parentRelationship = 'ឪពុក និង ម្តាយ';
      } else if (father) {
        parentName = `${father.name} (ឪពុក)`;
        parentRelationship = 'ឪពុក';
      } else if (mother) {
        parentName = `${mother.name} (ម្តាយ)`;
        parentRelationship = 'ម្តាយ';
      } else {
        parentName = household.headName;
        parentRelationship = 'មេគ្រួសារ';
      }
    }

    const targetSchool = citizen.school || 'ប.សរោគ';

    const groupKind: 'group1' | 'group2' | 'both' = (isGroup1 && isGroup2) 
      ? 'both' 
      : isGroup1 
        ? 'group1' 
        : 'group2';

    const childItem: EnrollmentChild = {
      citizen,
      ageInMonths: months,
      ageInYears: years,
      group: groupKind,
      enrollmentStatus: citizen.enrollmentStatus || 'not_enrolled',
      parentName,
      parentRelationship,
      targetSchool
    };

    allChildren.push(childItem);

    if (isGroup1) {
      group1Children.push(childItem);
    }
    if (isGroup2) {
      group2Children.push(childItem);
    }
  }

  // Calculate statistics
  const g1Total = group1Children.length;
  const g1Female = group1Children.filter(c => c.citizen.gender === 'ស្រី').length;

  const g2Total = group2Children.length;
  const g2Female = group2Children.filter(c => c.citizen.gender === 'ស្រី').length;

  const totalEligible = allChildren.length;
  const totalEnrolled = allChildren.filter(c => c.enrollmentStatus === 'enrolled').length;
  const totalContacted = allChildren.filter(c => c.enrollmentStatus === 'contacted').length;
  const totalPending = allChildren.filter(c => c.enrollmentStatus === 'not_enrolled').length;

  return {
    allChildren,
    group1Children,
    group2Children,
    stats: {
      group1Total: g1Total,
      group1Female: g1Female,
      group2Total: g2Total,
      group2Female: g2Female,
      totalEligible,
      totalEnrolled,
      totalContacted,
      totalPending
    }
  };
}
