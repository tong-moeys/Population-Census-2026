import rawCensusData from '../data/rawCensus.json';
import { Citizen, DemographicStats, Household } from '../types/census';

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
    if (!Array.isArray(row) || row.length < 8) continue;

    // Skip headers (Row "0" or when row[0] is "ID")
    if (row[0] === 'ID' || row[1] === 'គោត្តនាម និង នាម') continue;
    
    // Skip empty filler rows
    const name = String(row[1] ?? '').trim();
    if (!name && !row[2] && !row[3]) continue;

    const rawId = row[0];
    const originalId = (rawId !== '' && rawId !== undefined) ? rawId : sequenceId;
    const gender = String(row[2] ?? '').trim();
    const dob = String(row[3] ?? '').trim();
    
    let age = 0;
    if (typeof row[4] === 'number') {
      age = row[4];
    } else if (row[4]) {
      const parsed = parseInt(String(row[4]).trim(), 10);
      age = isNaN(parsed) ? 0 : parsed;
    }

    const relationship = String(row[5] ?? '').trim();
    const occupation = String(row[6] ?? '').trim();
    
    let householdId = 0;
    if (typeof row[7] === 'number') {
      householdId = row[7];
    } else if (row[7]) {
      const parsedH = parseInt(String(row[7]).trim(), 10);
      householdId = isNaN(parsedH) ? 0 : parsedH;
    }

    citizens.push({
      id: sequenceId,
      originalId,
      name: name || `ពលរដ្ឋ #${sequenceId}`,
      gender: gender || 'មិនស្គាល់',
      dob,
      age,
      relationship: relationship || 'ផ្សេងៗ',
      occupation: occupation || 'ផ្សេងៗ',
      householdId: householdId || 1
    });

    sequenceId++;
  }

  // Group by Household
  const householdMap = new Map<number, Citizen[]>();
  for (const citizen of citizens) {
    const hId = citizen.householdId;
    if (!householdMap.has(hId)) {
      householdMap.set(hId, []);
    }
    householdMap.get(hId)!.push(citizen);
  }

  const households: Household[] = [];
  householdMap.forEach((members, id) => {
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
      id,
      headName: head?.name || `គ្រួសារ #${id}`,
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

  // Sort households by numeric ID
  households.sort((a, b) => (Number(a.id) - Number(b.id)));

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
    { label: '55-59', min: 55, max: 55 },
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
