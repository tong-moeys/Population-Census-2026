export interface VillageComparisonRow {
  id: string;
  villageName: string;
  populationTotal: number;
  populationFemale: number;
  householdCount: number;

  // Children in village census (ទិន្នន័យកុមារក្នុងភូមិ)
  age0Total: number;
  age0Female: number;
  age1Total: number;
  age1Female: number;
  age2Total: number;
  age2Female: number;
  age0to2Total: number;
  age0to2Female: number;
  age3Total: number;
  age3Female: number;
  age4Total: number;
  age4Female: number;
  age5Total: number;
  age5Female: number;
  age3to5Total: number;
  age3to5Female: number;

  // Enrolled students 2026-2027 (ចំនួនសិស្សបានចុះឈ្មោះចូលរៀន - EDITABLE)
  enrolled3Total: number;
  enrolled3Female: number;
  enrolled4Total: number;
  enrolled4Female: number;
  enrolled5Total: number;
  enrolled5Female: number;
  enrolled3to5Total: number;
  enrolled3to5Female: number;

  // Enrollment Rates (%) (Auto-calculated: Enrolled / Village * 100)
  rate3Total: number;
  rate3Female: number;
  rate4Total: number;
  rate4Female: number;
  rate5Total: number;
  rate5Female: number;
  rate3to5Total: number;
  rate3to5Female: number;

  remarks: string;
}

export interface ComparisonGrandTotal {
  populationTotal: number;
  populationFemale: number;
  householdCount: number;

  age0Total: number;
  age0Female: number;
  age1Total: number;
  age1Female: number;
  age2Total: number;
  age2Female: number;
  age0to2Total: number;
  age0to2Female: number;
  age3Total: number;
  age3Female: number;
  age4Total: number;
  age4Female: number;
  age5Total: number;
  age5Female: number;
  age3to5Total: number;
  age3to5Female: number;

  enrolled3Total: number;
  enrolled3Female: number;
  enrolled4Total: number;
  enrolled4Female: number;
  enrolled5Total: number;
  enrolled5Female: number;
  enrolled3to5Total: number;
  enrolled3to5Female: number;

  rate3Total: number;
  rate3Female: number;
  rate4Total: number;
  rate4Female: number;
  rate5Total: number;
  rate5Female: number;
  rate3to5Total: number;
  rate3to5Female: number;
}

export interface PrimaryVillageComparisonRow {
  id: string;
  villageName: string;
  populationTotal: number;
  populationFemale: number;
  householdCount: number;

  // Group 2: Children 70-82 Months (Age 6 entrance to Grade 1)
  group2CensusTotal: number;
  group2CensusFemale: number;
  group2EnrolledTotal: number;
  group2EnrolledFemale: number;
  group2RemainingTotal: number;
  group2RemainingFemale: number;
  group2RateTotal: number;
  group2RateFemale: number;

  // Age 6 (ថ្នាក់ទី១)
  age6CensusTotal: number;
  age6CensusFemale: number;
  age6EnrolledTotal: number;
  age6EnrolledFemale: number;
  age6RemainingTotal: number;
  age6RemainingFemale: number;
  age6RateTotal: number;
  age6RateFemale: number;

  // Age 7 (ថ្នាក់ទី២)
  age7CensusTotal: number;
  age7CensusFemale: number;
  age7EnrolledTotal: number;
  age7EnrolledFemale: number;
  age7RemainingTotal: number;
  age7RemainingFemale: number;
  age7RateTotal: number;
  age7RateFemale: number;

  // Age 8 (ថ្នាក់ទី៣)
  age8CensusTotal: number;
  age8CensusFemale: number;
  age8EnrolledTotal: number;
  age8EnrolledFemale: number;
  age8RemainingTotal: number;
  age8RemainingFemale: number;
  age8RateTotal: number;
  age8RateFemale: number;

  // Age 9 (ថ្នាក់ទី៤)
  age9CensusTotal: number;
  age9CensusFemale: number;
  age9EnrolledTotal: number;
  age9EnrolledFemale: number;
  age9RemainingTotal: number;
  age9RemainingFemale: number;
  age9RateTotal: number;
  age9RateFemale: number;

  // Age 10 (ថ្នាក់ទី៥)
  age10CensusTotal: number;
  age10CensusFemale: number;
  age10EnrolledTotal: number;
  age10EnrolledFemale: number;
  age10RemainingTotal: number;
  age10RemainingFemale: number;
  age10RateTotal: number;
  age10RateFemale: number;

  // Age 11 (ថ្នាក់ទី៦)
  age11CensusTotal: number;
  age11CensusFemale: number;
  age11EnrolledTotal: number;
  age11EnrolledFemale: number;
  age11RemainingTotal: number;
  age11RemainingFemale: number;
  age11RateTotal: number;
  age11RateFemale: number;

  // Primary School Total (៦-១១ ឆ្នាំ សរុប)
  primaryCensusTotal: number;
  primaryCensusFemale: number;
  primaryEnrolledTotal: number;
  primaryEnrolledFemale: number;
  primaryRemainingTotal: number;
  primaryRemainingFemale: number;
  primaryRateTotal: number;
  primaryRateFemale: number;

  // Age 12+ (អនុវិទ្យាល័យ / លើសអាយុ)
  age12PlusCensusTotal: number;
  age12PlusCensusFemale: number;
  age12PlusEnrolledTotal: number;
  age12PlusEnrolledFemale: number;

  remarks: string;
}

export interface PrimaryGrandTotal {
  populationTotal: number;
  populationFemale: number;
  householdCount: number;

  group2CensusTotal: number;
  group2CensusFemale: number;
  group2EnrolledTotal: number;
  group2EnrolledFemale: number;
  group2RemainingTotal: number;
  group2RemainingFemale: number;
  group2RateTotal: number;
  group2RateFemale: number;

  age6CensusTotal: number;
  age6CensusFemale: number;
  age6EnrolledTotal: number;
  age6EnrolledFemale: number;
  age6RemainingTotal: number;
  age6RemainingFemale: number;
  age6RateTotal: number;
  age6RateFemale: number;

  age7CensusTotal: number;
  age7CensusFemale: number;
  age7EnrolledTotal: number;
  age7EnrolledFemale: number;
  age7RemainingTotal: number;
  age7RemainingFemale: number;
  age7RateTotal: number;
  age7RateFemale: number;

  age8CensusTotal: number;
  age8CensusFemale: number;
  age8EnrolledTotal: number;
  age8EnrolledFemale: number;
  age8RemainingTotal: number;
  age8RemainingFemale: number;
  age8RateTotal: number;
  age8RateFemale: number;

  age9CensusTotal: number;
  age9CensusFemale: number;
  age9EnrolledTotal: number;
  age9EnrolledFemale: number;
  age9RemainingTotal: number;
  age9RemainingFemale: number;
  age9RateTotal: number;
  age9RateFemale: number;

  age10CensusTotal: number;
  age10CensusFemale: number;
  age10EnrolledTotal: number;
  age10EnrolledFemale: number;
  age10RemainingTotal: number;
  age10RemainingFemale: number;
  age10RateTotal: number;
  age10RateFemale: number;

  age11CensusTotal: number;
  age11CensusFemale: number;
  age11EnrolledTotal: number;
  age11EnrolledFemale: number;
  age11RemainingTotal: number;
  age11RemainingFemale: number;
  age11RateTotal: number;
  age11RateFemale: number;

  primaryCensusTotal: number;
  primaryCensusFemale: number;
  primaryEnrolledTotal: number;
  primaryEnrolledFemale: number;
  primaryRemainingTotal: number;
  primaryRemainingFemale: number;
  primaryRateTotal: number;
  primaryRateFemale: number;

  age12PlusCensusTotal: number;
  age12PlusCensusFemale: number;
  age12PlusEnrolledTotal: number;
  age12PlusEnrolledFemale: number;
}

export type VillageCategory = 'roak' | 'mukh_chhnang' | 'outside';

export type MigrationVarianceStatus = 'under' | 'exact' | 'over' | 'none';

export interface VillageMigrationOverride {
  inMigrationTotal?: number;
  inMigrationFemale?: number;
  outMigrationTotal?: number;
  outMigrationFemale?: number;
  customReason?: string;
}

export type VillageMigrationOverrideMap = Record<string, VillageMigrationOverride>;

export interface VillageAgeMigrationRow {
  rowKey: string;
  mode: 'primary' | 'preschool' | 'all';
  ageKey: string;
  ageLabelKm: string;
  ageLabelEn: string;
  villageId: VillageCategory;
  villageName: string;
  censusTotal: number;
  censusFemale: number;
  enrolledTotal: number;
  enrolledFemale: number;
  diffTotal: number;
  diffFemale: number;
  rateTotal: number;
  rateFemale: number;
  varianceStatus: MigrationVarianceStatus;
  inMigrationTotal: number;
  inMigrationFemale: number;
  outMigrationTotal: number;
  outMigrationFemale: number;
  notEnrolledRemainingTotal: number;
  notEnrolledRemainingFemale: number;
  systemOutsideTotal: number;
  systemOutsideFemale: number;
  systemTransferredInTotal: number;
  systemTransferredInFemale: number;
  systemMovedTotal: number;
  systemMovedFemale: number;
  systemTransferredOutTotal: number;
  systemTransferredOutFemale: number;
  systemDroppedOutTotal: number;
  systemDroppedOutFemale: number;
  systemNotEnrolledTotal: number;
  systemNotEnrolledFemale: number;
  autoReasonKm: string;
  customReason: string;
}

