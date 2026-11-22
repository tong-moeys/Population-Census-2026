export type EyeCheckResult = 'normal' | 'impaired' | 'glasses' | 'untested';
export type PoorCardStatus = 'none' | 'idpoor1' | 'idpoor2' | 'vulnerable';
export type StudentStatus = 'active' | 'transferred_in' | 'transferred_out' | 'dropped_out' | 'graduated';
export type StudentGrade = 'មត្តេយ្យកម្រិតទាប' | 'មត្តេយ្យកម្រិតមធ្យម' | 'មត្តេយ្យកម្រិតខ្ពស់' | 'មត្តេយ្យចម្រុះ' | 'ថ្នាក់ទី១' | 'ថ្នាក់ទី២' | 'ថ្នាក់ទី៣' | 'ថ្នាក់ទី៤' | 'ថ្នាក់ទី៥' | 'ថ្នាក់ទី៦';

export interface StudentRecord {
  id: string; // Unique student code or UUID (e.g. ST-2026-001)
  studentCode: string; // Official MoEYS / School Student ID (អត្តលេខសិស្ស)
  name: string; // គោត្តនាម និង នាម
  lastNameKh: string; // គោត្តនាម
  firstNameKh: string; // នាម
  latinName?: string; // ឈ្មោះជាអក្សរឡាតាំង
  gender: 'ប្រុស' | 'ស្រី';
  dob: string; // ថ្ងៃខែឆ្នាំកំណើត (DD/Mon/YYYY or DD/MM/YYYY)
  age: number; // អាយុគិតជាឆ្នាំ
  ageMonths?: number; // អាយុគិតជាខែ
  photoUrl?: string; // រូបថតសិស្ស (URL or avatar placeholder)

  // Academic Info (ព័ត៌មានសិក្សា)
  academicYear: string; // ឆ្នាំសិក្សា (e.g. "២០២៥-២០២៦" or "២០២៦-២០២៧")
  grade: StudentGrade | string; // កម្រិតថ្នាក់
  section: string; // បន្ទប់ ឬ ក្រុម (e.g. "ក", "ខ", "គ")
  previousGrade?: string; // ថ្នាក់រៀនមុន (e.g. "មត្តេយ្យ", "គ្មាន", "មកពីភូមិ...")
  previousSchool?: string; // សាលាមុន
  enrollmentDate: string; // ថ្ងៃចូលរៀន / ថ្ងៃចុះឈ្មោះ
  school: string; // សាលាបឋមសិក្សា (e.g. "ប.សរោគ")
  status: StudentStatus; // ស្ថានភាពសិស្ស

  // Place of Birth (ទីកន្លែងកំណើត)
  pobVillage: string; // ភូមិកំណើត
  pobCommune: string; // ឃុំ/សង្កាត់កំណើត
  pobDistrict: string; // ស្រុក/ខណ្ឌកំណើត
  pobProvince: string; // រាជធានី/ខេត្តកំណើត

  // Current Address (អាសយដ្ឋានបច្ចុប្បន្ន)
  houseNumber?: string; // ផ្ទះលេខ
  groupNumber?: string; // ក្រុមទី
  currentVillage: string; // ភូមិ (រោគ, មុខឈ្នាង, ...)
  currentCommune: string; // ឃុំ/សង្កាត់
  currentDistrict: string; // ស្រុក/ខណ្ឌ
  currentProvince: string; // រាជធានី/ខេត្ត
  householdCode?: string; // លេខកូដខ្នងផ្ទះជំរឿន (e.g. 1R1, 1M26)

  // Physical & Health (សុខភាព និងកាយសម្បទា)
  heightCm?: number; // កម្ពស់ (cm)
  weightKg?: number; // ទម្ងន់ (kg)
  eyeCheck: EyeCheckResult; // លទ្ធផលពិនិត្យភ្នែក (ធម្មតា, ខ្សោយ, ពាក់វ៉ែនតា, មិនទាន់ពិនិត្យ)
  healthNotes?: string; // កំណត់សម្គាល់សុខភាព
  disability?: string; // ពិការភាព (បើមាន)
  poorCard: PoorCardStatus; // ប័ណ្ណសមធម៌ / ក្រីក្រ (ក្រ១, ក្រ២, ងាយរងគ្រោះ, គ្មាន)

  // Father Information (ព័ត៌មានឪពុក)
  fatherName: string;
  fatherLiving: boolean; // រស់ / ស្លាប់
  fatherOccupation: string;
  fatherPhone?: string;
  fatherAddress?: string;

  // Mother Information (ព័ត៌មានម្តាយ)
  motherName: string;
  motherLiving: boolean; // រស់ / ស្លាប់
  motherOccupation: string;
  motherPhone?: string;
  motherAddress?: string;

  // Guardian Information (ព័ត៌មានអាណាព្យាបាល)
  guardianName?: string;
  guardianRelationship?: string; // ត្រូវជា (ឪពុក, ម្តាយ, ជីដូន, ជីតា, មីង, ពូ...)
  guardianOccupation?: string;
  guardianPhone?: string;
  guardianAddress?: string;

  // Linkage to Census Data
  citizenId?: number; // ID ក្នុងបញ្ជីជំរឿន
  updatedAt?: string;
}
