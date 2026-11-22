import rawCensusData from '../data/rawCensus.json';
import rawStudents2027 from '../data/students2027.json';
import { Citizen, DemographicStats, Household } from '../types/census';
import { calculateAgeYears, formatDobCanonical, parseDateOfBirth } from './enrollmentUtils';
import {
  matchRawStudentsToCitizens,
  ParsedRawStudent,
  parseRawStudentRow,
  resolveVillageFromHouseholdCode
} from './studentMatcher';

export function loadParsedCensus(): { citizens: Citizen[]; households: Household[]; stats: DemographicStats } {
  const citizens: Citizen[] = [];
  const rawArray = rawCensusData as unknown as Array<Record<string, (string | number)[]>>;

  let sequenceId = 1;

  for (let i = 0; i < rawArray.length; i++) {
    const rowObj = rawArray[i];
    if (!rowObj) continue;
    const keys = Object.keys(rowObj);
    if (keys.length === 0) continue;

    const key = keys[0];
    const row = rowObj[key];
    if (!Array.isArray(row) || row.length < 6) continue;

    const col0 = String(row[0] ?? '').trim();
    const col1 = String(row[1] ?? '').trim();
    const col2 = String(row[2] ?? '').trim();
    if (!col0 && !col1) continue;

    // Skip headers in either legacy or new 2027 format
    if (
      col0 === 'last name' ||
      col0 === 'ID' ||
      col0 === 'គោត្តនាម និង នាម' ||
      col1 === 'គោត្តនាម និង នាម'
    ) {
      continue;
    }

    let name = '';
    let gender = '';
    let rawDob = '';
    let rawAgeField: string | number | undefined = '';
    let relationship = '';
    let occupation = '';
    let householdCode = '';
    let rawVillage = '';

    // Format A (new 2027): [lastName, firstName, gender, dob, age(""), be, occupation, family, village]
    if (col2 === 'ប្រុស' || col2 === 'ស្រី') {
      name = [col0, col1].filter(Boolean).join(' ').trim();
      gender = col2;
      rawDob = String(row[3] ?? '').trim();
      rawAgeField = row[4];
      relationship = String(row[5] ?? '').trim();
      occupation = String(row[6] ?? '').trim();
      householdCode = String(row[7] ?? '').trim();
      rawVillage = row.length > 8 ? String(row[8] ?? '').trim() : '';
    } else if (col1 === 'ប្រុស' || col1 === 'ស្រី') {
      // Format B (previous 2026): [fullName, gender, dob, age, relationship, occupation, householdCode, village]
      name = col0;
      gender = col1;
      rawDob = String(row[2] ?? '').trim();
      rawAgeField = row[3];
      relationship = String(row[4] ?? '').trim();
      occupation = String(row[5] ?? '').trim();
      householdCode = String(row[6] ?? '').trim();
      rawVillage = row.length > 7 ? String(row[7] ?? '').trim() : '';
    } else {
      // Legacy fallback: [id, fullName, gender, dob, age, relationship, occupation, householdCode, village]
      name = col1;
      gender = col2;
      rawDob = String(row[3] ?? '').trim();
      rawAgeField = row[4];
      relationship = String(row[5] ?? '').trim();
      occupation = String(row[6] ?? '').trim();
      householdCode = String(row[7] ?? '').trim();
      rawVillage = row.length > 8 ? String(row[8] ?? '').trim() : '';
    }

    if (!name) continue;

    // Parse DOB (preferDayFirst=false for numeric MM/DD/YYYY Excel exports in population JSON; DD/Mon/YYYY is unambiguous)
    const parsedDobDate = parseDateOfBirth(rawDob, false);
    const dob = formatDobCanonical(parsedDobDate, rawDob);

    let age = 0;
    const rawAgeStr = rawAgeField !== undefined && rawAgeField !== null ? String(rawAgeField).trim() : '';
    if (typeof rawAgeField === 'number' && !isNaN(rawAgeField)) {
      age = rawAgeField;
    } else if (rawAgeStr !== '' && !isNaN(Number(rawAgeStr))) {
      age = parseInt(rawAgeStr, 10);
    } else {
      age = calculateAgeYears(dob, 0, new Date(2026, 10, 1), true);
    }

    // Resolve village strictly using {1-9}M* -> មុខឈ្នាង, {1-9}R* -> រោគ
    const village = resolveVillageFromHouseholdCode(householdCode, rawVillage);
    const school = 'ប.សរោគ';
    const finalHhCode = householdCode || (village === 'មុខឈ្នាង' ? `1M${sequenceId}` : `1R${sequenceId}`);

    citizens.push({
      id: sequenceId,
      originalId: sequenceId,
      name,
      gender: gender || 'មិនស្គាល់',
      dob,
      age,
      relationship: relationship || 'ផ្សេងៗ',
      occupation: occupation || 'ផ្សេងៗ',
      householdId: finalHhCode,
      householdCode: finalHhCode,
      school,
      village,
      enrollmentStatus: 'not_enrolled'
    });

    sequenceId++;
  }

  // Cross-match all students in students2027.json against census citizens to mark enrolled status
  const rawStudentArray = rawStudents2027 as unknown as Array<Record<string, (string | number)[]>>;
  const parsedStudents: ParsedRawStudent[] = [];
  for (let i = 0; i < rawStudentArray.length; i++) {
    const rowObj = rawStudentArray[i];
    if (!rowObj) continue;
    const keys = Object.keys(rowObj);
    if (keys.length === 0) continue;
    const parsed = parseRawStudentRow(rowObj[keys[0]], i);
    if (parsed) parsedStudents.push(parsed);
  }
  const matchedMap = matchRawStudentsToCitizens(parsedStudents, citizens);
  const enrolledCitizenIds = new Set<number>(Array.from(matchedMap.values()).map(c => c.id));
  for (const c of citizens) {
    if (enrolledCitizenIds.has(c.id)) {
      c.enrollmentStatus = 'enrolled';
    }
  }

  // Group by Household Code
  const householdMap = new Map<string, Citizen[]>();
  for (const citizen of citizens) {
    const v = citizen.village || 'រោគ';
    const hKey = `${v}_${citizen.householdCode || citizen.householdId}`;
    if (!householdMap.has(hKey)) {
      householdMap.set(hKey, []);
    }
    householdMap.get(hKey)!.push(citizen);
  }

  const households: Household[] = [];
  householdMap.forEach((members) => {
    // Sort members in household logically: husband/father first, then wife/mother, then children, then grandchildren
    const rolePriority = (r: string): number => {
      if (r === 'ប្តី' || r === 'ឪពុក') return 1;
      if (r === 'ប្រពន្ធ' || r === 'ម្តាយ') return 2;
      if (r === 'កូន' || r === 'កូនប្រសារ') return 3;
      if (r === 'ចៅ') return 4;
      if (r === 'ម្ដាយក្មេក' || r === 'ឪពុកក្មេក') return 5;
      return 6;
    };
    
    members.sort((a, b) => rolePriority(a.relationship) - rolePriority(b.relationship));

    // Head is usually the first member or someone with relationship 'ប្តី', 'ឪពុក', or 'ម្តាយ'
    const head = members.find(m => m.relationship === 'ប្តី' || m.relationship === 'ឪពុក') 
      || members.find(m => m.relationship === 'ម្តាយ') 
      || members[0];

    const hCode = members[0]?.householdCode || members[0]?.householdId || '1';
    const hVillage = members[0]?.village || 'រោគ';

    const malesCount = members.filter(m => m.gender === 'ប្រុស').length;
    const femalesCount = members.filter(m => m.gender === 'ស្រី').length;
    const childrenCount = members.filter(m => m.age < 18).length;
    const workingAgeCount = members.filter(m => m.age >= 18 && m.age < 60).length;
    const seniorsCount = members.filter(m => m.age >= 60).length;

    const occupations: Record<string, number> = {};
    for (const m of members) {
      const occ = m.occupation || 'ផ្សេងៗ';
      occupations[occ] = (occupations[occ] || 0) + 1;
    }

    households.push({
      id: hCode,
      householdCode: String(hCode),
      headName: head?.name || `គ្រួសារ #${hCode}`,
      village: hVillage,
      membersCount: members.length,
      members,
      malesCount,
      femalesCount,
      childrenCount,
      workingAgeCount,
      seniorsCount,
      occupations
    });
  });

  // Sort households: មុខឈ្នាង first, then រោគ; within village naturally by household code
  households.sort((a, b) => {
    if (a.village !== b.village) {
      return a.village === 'មុខឈ្នាង' ? -1 : 1;
    }
    return String(a.id).localeCompare(String(b.id), undefined, { numeric: true, sensitivity: 'base' });
  });

  // Calculate Statistics
  const totalPopulation = citizens.length;
  const totalHouseholds = households.length;
  const maleCount = citizens.filter(c => c.gender === 'ប្រុស').length;
  const femaleCount = citizens.filter(c => c.gender === 'ស្រី').length;
  const unknownGenderCount = totalPopulation - maleCount - femaleCount;

  const totalAge = citizens.reduce((acc, c) => acc + c.age, 0);
  const averageAge = totalPopulation > 0 ? parseFloat((totalAge / totalPopulation).toFixed(1)) : 0;

  // Ages sorted for median, min, max
  const sortedAges = [...citizens.map(c => c.age)].sort((a, b) => a - b);
  const medianAge = sortedAges.length > 0 
    ? (sortedAges.length % 2 === 0 
        ? (sortedAges[sortedAges.length / 2 - 1] + sortedAges[sortedAges.length / 2]) / 2 
        : sortedAges[Math.floor(sortedAges.length / 2)])
    : 0;
  const minAge = sortedAges.length > 0 ? sortedAges[0] : 0;
  const maxAge = sortedAges.length > 0 ? sortedAges[sortedAges.length - 1] : 0;

  // Age Groups
  const under15 = citizens.filter(c => c.age < 15).length;
  const age15to24 = citizens.filter(c => c.age >= 15 && c.age <= 24).length;
  const age25to59 = citizens.filter(c => c.age >= 25 && c.age <= 59).length;
  const senior60plus = citizens.filter(c => c.age >= 60).length;

  // Age Pyramid Brackets (5-year cohorts: 0-4, 5-9, 10-14, ... 80+)
  const pyramidCohorts = [
    { label: '80+', min: 80, max: 200 },
    { label: '75-79', min: 75, max: 79 },
    { label: '70-74', min: 70, max: 74 },
    { label: '65-69', min: 65, max: 69 },
    { label: '60-64', min: 60, max: 64 },
    { label: '55-59', min: 55, max: 59 },
    { label: '50-54', min: 50, max: 54 },
    { label: '45-49', min: 45, max: 49 },
    { label: '40-44', min: 40, max: 44 },
    { label: '35-39', min: 35, max: 39 },
    { label: '30-34', min: 30, max: 34 },
    { label: '25-29', min: 25, max: 29 },
    { label: '20-24', min: 20, max: 24 },
    { label: '15-19', min: 15, max: 19 },
    { label: '10-14', min: 10, max: 14 },
    { label: '5-9', min: 5, max: 9 },
    { label: '0-4', min: 0, max: 4 },
  ];

  const agePyramid = pyramidCohorts.map(cohort => {
    const male = citizens.filter(c => c.gender === 'ប្រុស' && c.age >= cohort.min && c.age <= cohort.max).length;
    const female = citizens.filter(c => c.gender === 'ស្រី' && c.age >= cohort.min && c.age <= cohort.max).length;
    return {
      bracket: cohort.label,
      male,
      female
    };
  });

  // Top Occupations
  const occupationCounts: Record<string, number> = {};
  for (const c of citizens) {
    const occ = c.occupation || 'ផ្សេងៗ';
    occupationCounts[occ] = (occupationCounts[occ] || 0) + 1;
  }
  const topOccupations = Object.entries(occupationCounts)
    .map(([name, count]) => ({
      name,
      count,
      percentage: parseFloat(((count / totalPopulation) * 100).toFixed(1))
    }))
    .sort((a, b) => b.count - a.count);

  // Relationship Distribution
  const relationshipCounts: Record<string, number> = {};
  for (const c of citizens) {
    const rel = c.relationship || 'ផ្សេងៗ';
    relationshipCounts[rel] = (relationshipCounts[rel] || 0) + 1;
  }
  const relationshipDistribution = Object.entries(relationshipCounts)
    .map(([name, count]) => ({
      name,
      count,
      percentage: parseFloat(((count / totalPopulation) * 100).toFixed(1))
    }))
    .sort((a, b) => b.count - a.count);

  const averageHouseholdSize = totalHouseholds > 0 
    ? parseFloat((totalPopulation / totalHouseholds).toFixed(1)) 
    : 0;
  
  const largestHouseholdSize = households.reduce((max, h) => Math.max(max, h.membersCount), 0);

  return {
    citizens,
    households,
    stats: {
      totalPopulation,
      totalHouseholds,
      maleCount,
      femaleCount,
      unknownGenderCount,
      averageAge,
      medianAge,
      minAge,
      maxAge,
      ageGroups: {
        under15,
        age15to24,
        age25to59,
        senior60plus
      },
      agePyramid,
      topOccupations,
      relationshipDistribution,
      averageHouseholdSize,
      largestHouseholdSize
    }
  };
}
