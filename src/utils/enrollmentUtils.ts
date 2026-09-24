import { Citizen, Household, EnrollmentChild, EnrollmentGroupStats, EnrollmentStatus } from '../types/census';

const monthMap: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
};

/**
 * Parses DOB in the standard format "DD/Mon/YYYY" (e.g., "15/Apr/2020")
 */
export function parseDateOfBirth(dobStr: string): Date | null {
  if (!dobStr) return null;
  const parts = dobStr.split('/');
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0], 10);
  const monKey = parts[1].toLowerCase().trim();
  const mon = monthMap[monKey];
  const yr = parseInt(parts[2], 10);
  if (isNaN(day) || mon === undefined || isNaN(yr)) return null;
  return new Date(yr, mon, day);
}

/**
 * Calculates exact age in full months as of the official school year intake cutoff (October 1, 2026)
 */
export function calculateAgeInMonths(
  dobStr: string,
  fallbackYears = 0,
  asOfDate: Date = new Date(2026, 9, 1)
): number {
  const dob = parseDateOfBirth(dobStr);
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
    const key = `${h.village || 'រោគ'}_${h.id}`;
    householdMap.set(key, h);
  }

  const allChildren: EnrollmentChild[] = [];
  const group1Children: EnrollmentChild[] = [];
  const group2Children: EnrollmentChild[] = [];

  for (const citizen of citizens) {
    const months = calculateAgeInMonths(citizen.dob, citizen.age);
    const years = citizen.age || Math.floor(months / 12);

    // Group 1: Children aged 3-5 years (pre-school mobilization)
    // Age in years 3, 4, 5 OR months 36 to 71
    const isGroup1 = (years >= 3 && years <= 5) || (months >= 36 && months <= 71);

    // Group 2: Children aged 70-80 months (official Grade 1 Primary school enrollment window)
    const isGroup2 = months >= 70 && months <= 80;

    if (!isGroup1 && !isGroup2) continue;

    // Find parent / guardian in the same household
    const hKey = `${citizen.village || 'រោគ'}_${citizen.householdId}`;
    const household = householdMap.get(hKey);

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
