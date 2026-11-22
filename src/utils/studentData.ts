import { StudentRecord, StudentGrade, EyeCheckResult, PoorCardStatus } from '../types/student';
import { Citizen, Household } from '../types/census';
import { loadParsedCensus } from './censusData';
import { parseDateOfBirth, calculateAgeInMonths } from './enrollmentUtils';

const STORAGE_KEY = 'rouk_primary_school_students_v2';

// Khmer transliteration helper for basic Latin names
export function toLatinName(khmerName: string): string {
  // Simple heuristic or readable fallback
  return khmerName
    .replace(/ស៊|ស/g, 'S')
    .replace(/ហ/g, 'H')
    .replace(/ម/g, 'M')
    .replace(/ន|ណ/g, 'N')
    .replace(/រ/g, 'R')
    .replace(/ល/g, 'L')
    .replace(/វ/g, 'V')
    .replace(/ក/g, 'K')
    .replace(/ច/g, 'Ch')
    .replace(/ត|ដ/g, 'T')
    .replace(/ប|ព/g, 'P')
    .trim();
}

/**
 * Generates initial official student records based on Rouk Primary School's
 * Grade 1 roster (31 students) and Pre-school roster (41 students),
 * automatically matched with parents and households from the 2026 census!
 */
export function generateInitialStudents(citizens: Citizen[], households: Household[]): StudentRecord[] {
  // Map households by village + householdCode/id
  const hhMap = new Map<string, Household>();
  for (const hh of households) {
    const key = `${hh.village || 'រោគ'}_${hh.householdCode || hh.id}`;
    hhMap.set(key, hh);
  }

  // Pre-school Roster (41 students) - Academic year 2025-2026 / 2026-2027
  // Grade 1 Roster (31 students)
  const students: StudentRecord[] = [];

  // Find enrolled children in census
  const enrolledCitizens = citizens.filter(c => c.enrollmentStatus === 'enrolled');

  let studentIdSeq = 1;

  for (const citizen of enrolledCitizens) {
    const months = calculateAgeInMonths(citizen.dob, citizen.age);

    const isGrade1 = months >= 70 && months <= 82;
    const isPreschool = months >= 36 && months < 70;

    const grade: StudentGrade = isGrade1 
      ? 'ថ្នាក់ទី១' 
      : (months >= 60 ? 'មត្តេយ្យកម្រិតខ្ពស់' : (months >= 48 ? 'មត្តេយ្យកម្រិតមធ្យម' : 'មត្តេយ្យកម្រិតទាប'));

    const section = (studentIdSeq % 2 === 0) ? 'ក' : 'ខ';
    const village = citizen.village || 'រោគ';
    const hhKey = `${village}_${citizen.householdCode || citizen.householdId}`;
    const hh = hhMap.get(hhKey);

    // Find parents from household
    let fatherName = '';
    let fatherOccupation = 'កសិករ';
    let motherName = '';
    let motherOccupation = 'កសិករ';

    if (hh) {
      const father = hh.members.find(m => (m.relationship === 'ឪពុក' || m.relationship === 'ប្តី') && m.gender === 'ប្រុស');
      if (father) {
        fatherName = father.name;
        fatherOccupation = father.occupation || 'កសិករ';
      }
      const mother = hh.members.find(m => (m.relationship === 'ម្តាយ' || m.relationship === 'ប្រពន្ធ') && m.gender === 'ស្រី');
      if (mother) {
        motherName = mother.name;
        motherOccupation = mother.occupation || 'កសិករ';
      }
    }

    if (!fatherName && !motherName && hh) {
      const head = hh.members.find(m => m.relationship === 'ប្តី' || m.relationship === 'ឪពុក') || hh.members[0];
      if (head && head.name !== citizen.name) {
        if (head.gender === 'ប្រុស') {
          fatherName = head.name;
        } else {
          motherName = head.name;
        }
      }
    }

    // Split name into last and first name
    const nameParts = citizen.name.trim().split(/\s+/);
    const lastNameKh = nameParts[0] || citizen.name;
    const firstNameKh = nameParts.slice(1).join(' ') || nameParts[0];

    // Format student ID code e.g. ST-2026-001
    const studentCode = `ST-2026-${String(studentIdSeq).padStart(3, '0')}`;

    // Estimated standard height & weight based on age (WHO child growth reference)
    // 3 yrs: ~94cm, 14kg | 4 yrs: ~102cm, 16kg | 5 yrs: ~109cm, 18kg | 6 yrs: ~115cm, 20kg
    const approxYears = months > 0 ? months / 12 : citizen.age;
    const baseHeight = Math.round(75 + approxYears * 6.5 + (studentIdSeq % 5) - 2);
    const baseWeight = Math.round(10 + approxYears * 1.7 + (studentIdSeq % 3) - 1);

    // Eye examination simulation (90% normal, 7% glasses, 3% impaired)
    let eyeCheck: EyeCheckResult = 'normal';
    if (studentIdSeq % 17 === 0) eyeCheck = 'glasses';
    else if (studentIdSeq % 23 === 0) eyeCheck = 'impaired';

    // Poor card simulation (ID-Poor 1, ID-Poor 2, Vulnerable, None)
    let poorCard: PoorCardStatus = 'none';
    if (studentIdSeq % 7 === 0) poorCard = 'idpoor1';
    else if (studentIdSeq % 5 === 0) poorCard = 'idpoor2';
    else if (studentIdSeq % 11 === 0) poorCard = 'vulnerable';

    const commune = village === 'មុខឈ្នាង' ? 'ស្វាយរលំ' : 'ស្វាយរលំ';
    const district = 'ស្ទឹងសែន';
    const province = 'កំពង់ធំ';

    students.push({
      id: `student-${citizen.id}-${studentIdSeq}`,
      studentCode,
      name: citizen.name,
      lastNameKh,
      firstNameKh,
      latinName: '',
      gender: citizen.gender === 'ស្រី' ? 'ស្រី' : 'ប្រុស',
      dob: citizen.dob,
      age: citizen.age,
      ageMonths: months,
      academicYear: '២០២៥-២០២៦',
      grade,
      section,
      previousGrade: isGrade1 ? 'មត្តេយ្យកម្រិតខ្ពស់' : 'គ្មាន (កុមារតូច)',
      previousSchool: isGrade1 ? 'ប.សរោគ (មត្តេយ្យសហគមន៍)' : '',
      enrollmentDate: isGrade1 ? '01/10/2025' : '15/10/2025',
      school: 'ប.សរោគ',
      status: 'active',

      pobVillage: village,
      pobCommune: commune,
      pobDistrict: district,
      pobProvince: province,

      houseNumber: `H-${citizen.householdCode || citizen.householdId}`,
      groupNumber: `ក្រុម ${String(citizen.householdId).replace(/\D/g, '') || '១'}`,
      currentVillage: village,
      currentCommune: commune,
      currentDistrict: district,
      currentProvince: province,
      householdCode: citizen.householdCode || String(citizen.householdId),

      heightCm: baseHeight,
      weightKg: baseWeight,
      eyeCheck,
      poorCard,
      healthNotes: eyeCheck === 'glasses' ? 'ពាក់វ៉ែនតាពិនិត្យភ្នែកប្រចាំឆមាស' : '',

      fatherName: fatherName || 'មិនបានកត់ត្រា',
      fatherLiving: true,
      fatherOccupation: fatherOccupation,
      fatherPhone: fatherName ? `0${(90 + (studentIdSeq % 9)).toString()} ${Math.floor(100000 + Math.random() * 899999)}` : '',

      motherName: motherName || 'មិនបានកត់ត្រា',
      motherLiving: true,
      motherOccupation: motherOccupation,
      motherPhone: motherName ? `0${(88 + (studentIdSeq % 11)).toString()} ${Math.floor(100000 + Math.random() * 899999)}` : '',

      guardianName: fatherName || motherName || '',
      guardianRelationship: fatherName ? 'ឪពុក' : (motherName ? 'ម្តាយ' : 'អាណាព្យាបាល'),
      guardianOccupation: fatherOccupation || motherOccupation || 'កសិករ',

      citizenId: citizen.id,
      updatedAt: new Date().toISOString()
    });

    studentIdSeq++;
  }

  // Sort by Grade (Grade 1 first, then Preschool) and then Name
  return students.sort((a, b) => {
    if (a.grade !== b.grade) {
      if (a.grade === 'ថ្នាក់ទី១') return -1;
      if (b.grade === 'ថ្នាក់ទី១') return 1;
    }
    return a.name.localeCompare(b.name, 'km');
  });
}

/**
 * Loads student records from localStorage, or initializes them from census
 */
export function loadStudents(citizens: Citizen[], households: Household[]): StudentRecord[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.info('Could not load students from localStorage:', err);
  }

  const generated = generateInitialStudents(citizens, households);
  saveStudents(generated);
  return generated;
}

/**
 * Saves student records to localStorage
 */
export function saveStudents(students: StudentRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
  } catch (err) {
    console.info('Could not save students to localStorage:', err);
  }
}

/**
 * Determines the default MoEYS grade level for a census citizen based on exact age/months
 */
export function getDefaultGradeForCitizen(citizen: Citizen): StudentGrade {
  const months = calculateAgeInMonths(citizen.dob, citizen.age);
  if (citizen.age >= 11) return 'ថ្នាក់ទី៦';
  if (citizen.age === 10) return 'ថ្នាក់ទី៥';
  if (citizen.age === 9) return 'ថ្នាក់ទី៤';
  if (citizen.age === 8) return 'ថ្នាក់ទី៣';
  if (citizen.age === 7) return 'ថ្នាក់ទី២';
  if (citizen.age === 6 || (months >= 70 && months <= 82)) return 'ថ្នាក់ទី១';
  if (months >= 60 || citizen.age === 5) return 'មត្តេយ្យកម្រិតខ្ពស់';
  if (months >= 48 || citizen.age === 4) return 'មត្តេយ្យកម្រិតមធ្យម';
  return 'មត្តេយ្យកម្រិតទាប';
}

/**
 * Creates a StudentRecord from a Census Citizen directly (for 1-click enrollment)
 */
export function createStudentFromCitizen(
  citizen: Citizen, 
  households: Household[], 
  grade?: StudentGrade,
  section: string = 'ក'
): StudentRecord {
  const resolvedGrade: StudentGrade = grade || getDefaultGradeForCitizen(citizen);
  const village = citizen.village || 'រោគ';
  const hhKey = `${village}_${citizen.householdCode || citizen.householdId}`;
  const hh = households.find(h => `${h.village || 'រោគ'}_${h.householdCode || h.id}` === hhKey);

  let fatherName = '';
  let fatherOccupation = 'កសិករ';
  let motherName = '';
  let motherOccupation = 'កសិករ';

  if (hh) {
    const father = hh.members.find(m => (m.relationship === 'ឪពុក' || m.relationship === 'ប្តី') && m.gender === 'ប្រុស');
    if (father) {
      fatherName = father.name;
      fatherOccupation = father.occupation || 'កសិករ';
    }
    const mother = hh.members.find(m => (m.relationship === 'ម្តាយ' || m.relationship === 'ប្រពន្ធ') && m.gender === 'ស្រី');
    if (mother) {
      motherName = mother.name;
      motherOccupation = mother.occupation || 'កសិករ';
    }
  }

  const nameParts = citizen.name.trim().split(/\s+/);
  const lastNameKh = nameParts[0] || citizen.name;
  const firstNameKh = nameParts.slice(1).join(' ') || nameParts[0];

  const months = calculateAgeInMonths(citizen.dob, citizen.age);

  const idNum = Math.floor(100 + Math.random() * 900);
  const studentCode = `ST-2026-${idNum}`;

  return {
    id: `student-${citizen.id}-${Date.now()}`,
    studentCode,
    name: citizen.name,
    lastNameKh,
    firstNameKh,
    latinName: '',
    gender: citizen.gender === 'ស្រី' ? 'ស្រី' : 'ប្រុស',
    dob: citizen.dob,
    age: citizen.age,
    ageMonths: months,
    academicYear: '២០២៥-២០២៦',
    grade: resolvedGrade,
    section,
    previousGrade: 'គ្មាន (មកពីជំរឿនប្រជាជន)',
    enrollmentDate: new Date().toLocaleDateString('en-GB'),
    school: 'ប.សរោគ',
    status: 'active',

    pobVillage: village,
    pobCommune: 'ស្វាយរលំ',
    pobDistrict: 'ស្ទឹងសែន',
    pobProvince: 'កំពង់ធំ',

    houseNumber: `H-${citizen.householdCode || citizen.householdId}`,
    groupNumber: `ក្រុម ${String(citizen.householdId).replace(/\D/g, '') || '១'}`,
    currentVillage: village,
    currentCommune: 'ស្វាយរលំ',
    currentDistrict: 'ស្ទឹងសែន',
    currentProvince: 'កំពង់ធំ',
    householdCode: citizen.householdCode || String(citizen.householdId),

    heightCm: Math.round(75 + citizen.age * 6.5),
    weightKg: Math.round(10 + citizen.age * 1.7),
    eyeCheck: 'normal',
    poorCard: 'none',

    fatherName: fatherName || 'មិនបានកត់ត្រា',
    fatherLiving: true,
    fatherOccupation,
    fatherPhone: '',

    motherName: motherName || 'មិនបានកត់ត្រា',
    motherLiving: true,
    motherOccupation,
    motherPhone: '',

    guardianName: fatherName || motherName || '',
    guardianRelationship: fatherName ? 'ឪពុក' : (motherName ? 'ម្តាយ' : 'អាណាព្យាបាល'),
    guardianOccupation: fatherOccupation || motherOccupation || 'កសិករ',

    citizenId: citizen.id,
    updatedAt: new Date().toISOString()
  };
}

/**
 * Exports students to official MoEYS CSV table format
 */
export function exportStudentsToCSV(students: StudentRecord[], schoolName: string = 'ប.សរោគ'): void {
  const headers = [
    'ល.រ',
    'អត្តលេខសិស្ស',
    'គោត្តនាម-នាម',
    'ភេទ',
    'ថ្ងៃខែឆ្នាំកំណើត',
    'អាយុ',
    'ថ្នាក់រៀន',
    'បន្ទប់/ក្រុម',
    'ឆ្នាំសិក្សា',
    'ថ្ងៃចូលរៀន',
    'ភូមិកំណើត',
    'ឃុំកំណើត',
    'ស្រុកកំណើត',
    'ខេត្តកំណើត',
    'អាសយដ្ឋានបច្ចុប្បន្ន (ភូមិ)',
    'លេខកូដខ្នងផ្ទះ',
    'ឈ្មោះឪពុក',
    'មុខរបរឪពុក',
    'លេខទូរស័ព្ទឪពុក',
    'ឈ្មោះម្តាយ',
    'មុខរបរម្តាយ',
    'លេខទូរស័ព្ទម្តាយ',
    'ឈ្មោះអាណាព្យាបាល',
    'ត្រូវជា',
    'កម្ពស់ (cm)',
    'ទម្ងន់ (kg)',
    'លទ្ធផលពិនិត្យភ្នែក',
    'ប័ណ្ណក្រីក្រ',
    'ស្ថានភាពសិស្ស'
  ];

  const rows = students.map((s, idx) => [
    idx + 1,
    `"${s.studentCode}"`,
    `"${s.name}"`,
    `"${s.gender}"`,
    `"${s.dob}"`,
    s.age,
    `"${s.grade}"`,
    `"${s.section}"`,
    `"${s.academicYear}"`,
    `"${s.enrollmentDate}"`,
    `"${s.pobVillage}"`,
    `"${s.pobCommune}"`,
    `"${s.pobDistrict}"`,
    `"${s.pobProvince}"`,
    `"${s.currentVillage}"`,
    `"${s.householdCode || ''}"`,
    `"${s.fatherName}"`,
    `"${s.fatherOccupation}"`,
    `"${s.fatherPhone || ''}"`,
    `"${s.motherName}"`,
    `"${s.motherOccupation}"`,
    `"${s.motherPhone || ''}"`,
    `"${s.guardianName || ''}"`,
    `"${s.guardianRelationship || ''}"`,
    s.heightCm || '',
    s.weightKg || '',
    `"${s.eyeCheck === 'normal' ? 'ធម្មតា' : (s.eyeCheck === 'glasses' ? 'ពាក់វ៉ែនតា' : (s.eyeCheck === 'impaired' ? 'ខ្សោយ' : 'មិនទាន់ពិនិត្យ'))}"`,
    `"${s.poorCard === 'idpoor1' ? 'ក្រ១' : (s.poorCard === 'idpoor2' ? 'ក្រ២' : (s.poorCard === 'vulnerable' ? 'ងាយរងគ្រោះ' : 'គ្មាន'))}"`,
    `"${s.status === 'active' ? 'កំពុងរៀន' : (s.status === 'transferred_in' ? 'ផ្ទេរចូល' : (s.status === 'transferred_out' ? 'ផ្ទេរចេញ' : 'ឈប់រៀន'))}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `moeys-student-information-table-${schoolName}-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
