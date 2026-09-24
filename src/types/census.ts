export interface Citizen {
  id: number;
  originalId: string | number;
  name: string;
  gender: 'ប្រុស' | 'ស្រី' | string;
  dob: string;
  age: number;
  relationship: string;
  occupation: string;
  householdId: number;
  school?: string;
  village?: string;
  enrollmentStatus?: 'not_enrolled' | 'enrolled' | 'contacted' | 'moved';
}

export interface Household {
  id: number;
  headName: string;
  village?: string;
  membersCount: number;
  members: Citizen[];
  malesCount: number;
  femalesCount: number;
  childrenCount: number; // age < 18
  workingAgeCount: number; // 18 - 60
  seniorsCount: number; // > 60
  occupations: Record<string, number>;
}

export interface AgeGenderCount {
  total: number;
  female: number;
}

export interface SchoolCatchmentReportRow {
  schoolName: string;
  isMainDataset?: boolean;
  // 0 - 3 years
  age0: AgeGenderCount;
  age1: AgeGenderCount;
  age2: AgeGenderCount;
  age3: AgeGenderCount;
  total0to3: AgeGenderCount;
  // 4 - 6 years
  age4: AgeGenderCount;
  age5: AgeGenderCount;
  age6: AgeGenderCount;
  total4to6: AgeGenderCount;
  // 7 - 11 years
  age7: AgeGenderCount;
  age8: AgeGenderCount;
  age9: AgeGenderCount;
  age10: AgeGenderCount;
  age11: AgeGenderCount;
  total7to11: AgeGenderCount;
  // 12 - 14 years
  age12: AgeGenderCount;
  age13: AgeGenderCount;
  age14: AgeGenderCount;
  total12to14: AgeGenderCount;
  // 15 - 17 years
  age15: AgeGenderCount;
  age16: AgeGenderCount;
  age17: AgeGenderCount;
  total15to17: AgeGenderCount;
  // 18+ years
  age18: AgeGenderCount;
  age19to25: AgeGenderCount;
  age26to45: AgeGenderCount;
  age46plus: AgeGenderCount;
  total18plus: AgeGenderCount;
  // Grand total & households
  grandTotal: AgeGenderCount;
  householdCount: number;
}

export interface DemographicStats {
  totalPopulation: number;
  totalHouseholds: number;
  maleCount: number;
  femaleCount: number;
  unknownGenderCount: number;
  averageAge: number;
  medianAge: number;
  minAge: number;
  maxAge: number;
  ageGroups: {
    under15: number;
    age15to24: number;
    age25to59: number;
    senior60plus: number;
  };
  agePyramid: {
    bracket: string;
    male: number;
    female: number;
  }[];
  topOccupations: {
    name: string;
    count: number;
    percentage: number;
  }[];
  relationshipDistribution: {
    name: string;
    count: number;
    percentage: number;
  }[];
  averageHouseholdSize: number;
  largestHouseholdSize: number;
}

export type EnrollmentStatus = 'not_enrolled' | 'enrolled' | 'contacted' | 'moved';

export interface EnrollmentChild {
  citizen: Citizen;
  ageInMonths: number;
  ageInYears: number;
  group: 'group1' | 'group2' | 'both';
  enrollmentStatus: EnrollmentStatus;
  parentName?: string;
  parentRelationship?: string;
  targetSchool: string;
}

export interface EnrollmentGroupStats {
  group1Total: number;
  group1Female: number;
  group2Total: number;
  group2Female: number;
  totalEligible: number;
  totalEnrolled: number;
  totalContacted: number;
  totalPending: number;
}

export type ViewTab = 'dashboard' | 'school-report' | 'enrollment' | 'citizens' | 'households' | 'pyramid' | 'analytics';
export type Language = 'km' | 'en';
