import rawCensusData from '../data/rawCensus.json';
import { Citizen, DemographicStats, Household } from '../types/census';

export function loadParsedCensus(): { citizens: Citizen[]; households: Household[]; stats: DemographicStats } {
  const citizens: Citizen[] = [];
  const rawArray = rawCensusData as unknown as Array<Record<string, (string | number)[]>>;

  // 28 students from the official Grade 1 roster PDF matched by DOB + Household Code
  const enrolledGrade1RosterKeys = new Set<string>([
    '15/Apr/2020_1M3',   // ឡូត សុវណ្ណពុទ្ធិរាជ (#30)
    '14/Sep/2020_1M26',  // ឃឿន វ៉ាន់នីន (#1)
    '06/Sep/2020_1M27',  // សង សុជាតិ (#25)
    '17/Mar/2020_1M37',  // ឈួង ឆៃយ៉ុទ្ធ (#5)
    '03/Sep/2020_1M52',  // សាន កូមិន (#26)
    '26/May/2020_1R17',  // ធី ប៉ាម (#9)
    '24/Aug/2020_1R18',  // ណូច វណ្ណា (#7)
    '9/Apr/2020_1R24',   // យ៉ុន យ៉ុងអុី (#17)
    '13/Oct/2020_1R40',  // ហំ ចាន់សុខធារិទ្ធិ (#29)
    '26/Mar/2020_1R42',  // រ៉ើន សុវឌ្ឍនា (#21)
    '19/Aug/2020_1R45',  // ញាស់ ផាវិត (#6)
    '28/Jul/2020_1R50',  // មាន ឫទ្ធី (#15)
    '12/Apr/2020_2R33',  // វ៉ុង ពេជ្រសិរីវុទ្ធ (#22)
    '04/Mar/2020_3R13',  // នេម វ៉ាន់សៀ (#11)
    '25/Aug/2020_3R20',  // អាន ចរិយា (#31)
    '03/Apr/2020_3R29',  // វឹង សុខសេរីវឌ្ឍនា (#23)
    '27/Jul/2020_4R12',  // រ៉ុង កនីកា (#20)
    '27/Dec/2019_5R3',   // សំរើត វិសាល (#28)
    '20/May/2020_5R10',  // ម៉េក រ៉ាឈិក (#16)
    '09/Feb/2020_5R21',  // រ៉ា ដារ៉ូ (#19)
    '07/Aug/2020_5R25',  // ដា សុនីសា / ដា រ៉ាជាប្រកទី (#3)
    '14/Jun/2020_5R38',  // ឆាយ កក្ដដា / ផាត កក្កដា (#2)
    '05/Feb/2020_6R2',   // សង សុជា (#24)
    '25/May/2020_6R3',   // ទឹម រ៉ាឌី (#8)
    '12/Jun/2020_6R13',  // ប៉ក់សៀវមិញហុង (#12)
    '19/Apr/2020_8R45',  // ជួន ដាលីន / ផូន ផាន់រ៉ន (#4)
    '06/Aug/2020_7R12',  // ផាន ណារី (#14)
    '04/Apr/2020_7R17'   // ធុល សាន (#10)
  ]);

  let sequenceId = 1;

  for (let i = 0; i < rawArray.length; i++) {
    const rowObj = rawArray[i];
    if (!rowObj) continue;
    const keys = Object.keys(rowObj);
    if (keys.length === 0) continue;
    
    const key = keys[0];
    const row = rowObj[key];
    if (!Array.isArray(row) || row.length < 6) continue;

    // Skip empty filler rows and headers
    const col0 = String(row[0] ?? '').trim();
    const col1 = String(row[1] ?? '').trim();
    if (!col0 && !col1) continue;
    if (col0 === 'ID' || col0 === 'គោត្តនាម និង នាម' || col1 === 'គោត្តនាម និង នាម') continue;

    let name = '';
    let gender = '';
    let dob = '';
    let age = 0;
    let relationship = '';
    let occupation = '';
    let householdCode = '';
    let rawVillage = '';

    // Check if col1 is gender ('ប្រុស' or 'ស្រី') => new format with household identifier
    if (col1 === 'ប្រុស' || col1 === 'ស្រី' || (!isNaN(Number(row[3])) && typeof row[3] !== 'undefined' && isNaN(Number(col0)))) {
      name = col0;
      gender = col1;
      dob = String(row[2] ?? '').trim();
      const rawAge = row[3];
      if (typeof rawAge === 'number') {
        age = rawAge;
      } else if (rawAge) {
        const parsed = parseInt(String(rawAge).trim(), 10);
        age = isNaN(parsed) ? 0 : parsed;
      }
      relationship = String(row[4] ?? '').trim();
      occupation = String(row[5] ?? '').trim();
      householdCode = String(row[6] ?? '').trim();
      rawVillage = row.length > 7 ? String(row[7] ?? '').trim() : '';
    } else {
      // Legacy format where col0 is ID and col1 is Name
      name = col1;
      gender = String(row[2] ?? '').trim();
      dob = String(row[3] ?? '').trim();
      const rawAge = row[4];
      if (typeof rawAge === 'number') {
        age = rawAge;
      } else if (rawAge) {
        const parsed = parseInt(String(rawAge).trim(), 10);
        age = isNaN(parsed) ? 0 : parsed;
      }
      relationship = String(row[5] ?? '').trim();
      occupation = String(row[6] ?? '').trim();
      householdCode = String(row[7] ?? '').trim();
      rawVillage = row.length > 8 ? String(row[8] ?? '').trim() : '';
    }

    if (!name) continue;

    // Determine village based on household code (1M* = មុខឈ្នាង, 1R* / other = រោគ) and rawVillage
    const isMukhChhnang = rawVillage === 'មុខឈ្នាង' || householdCode.includes('M') || householdCode.startsWith('1M');
    const village = isMukhChhnang ? 'មុខឈ្នាង' : 'រោគ';
    // User instruction: All current census data belongs to Rouk Primary School catchment (ប.សរោគ)
    const school = 'ប.សរោគ';
    const finalHhCode = householdCode || (isMukhChhnang ? `1M${sequenceId}` : `1R${sequenceId}`);
    const rosterKey = `${dob}_${finalHhCode}`;
    const isEnrolledInRoster = enrolledGrade1RosterKeys.has(rosterKey);

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
      enrollmentStatus: isEnrolledInRoster ? 'enrolled' : 'not_enrolled'
    });

    sequenceId++;
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
