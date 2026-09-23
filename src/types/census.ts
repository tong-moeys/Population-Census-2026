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
}

export interface Household {
  id: number;
  headName: string;
  membersCount: number;
  members: Citizen[];
  malesCount: number;
  femalesCount: number;
  childrenCount: number; // age < 18
  workingAgeCount: number; // 18 - 60
  seniorsCount: number; // > 60
  occupations: Record<string, number>;
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

export type ViewTab = 'dashboard' | 'citizens' | 'households' | 'pyramid' | 'analytics';
export type Language = 'km' | 'en';
