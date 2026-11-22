import { StudentRecord, StudentGrade } from '../types/student';
import { Citizen, Household } from '../types/census';
import rawStudents2027 from '../data/students2027.json';
import { calculateAgeInMonths } from './enrollmentUtils';
import {
  isExplicitOutsideVillage,
  matchRawStudentsToCitizens,
  ParsedRawStudent,
  parseRawStudentRow
} from './studentMatcher';

const STORAGE_KEY = 'rouk_primary_school_students_2027_v1';

// Khmer transliteration helper for basic Latin names
export function toLatinName(khmerName: string): string {
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

function gradeSortOrder(grade: string): number {
  if (grade === 'ថ្នាក់ទី១') return 1;
  if (grade === 'ថ្នាក់ទី២') return 2;
  if (grade === 'ថ្នាក់ទី៣') return 3;
  if (grade === 'ថ្នាក់ទី៤') return 4;
  if (grade === 'ថ្នាក់ទី៥') return 5;
  if (grade === 'ថ្នាក់ទី៦') return 6;
  if (grade === 'មត្តេយ្យកម្រិតខ្ពស់') return 7;
  if (grade === 'មត្តេយ្យចម្រុះ') return 8;
  if (grade === 'មត្តេយ្យកម្រិតមធ្យម') return 9;
  if (grade === 'មត្តេយ្យកម្រិតទាប') return 10;
  return 11;
}

/**
 * Loads all official 2026-2027 student records (Preschool through Grade 6) from students2027.json
 * and links them with matching households and citizens from the census.
 */
export function generateInitialStudents(citizens: Citizen[], households: Household[]): StudentRecord[] {
  const hhMap = new Map<string, Household>();
  for (const hh of households) {
    const key = `${hh.village || 'រោគ'}_${hh.householdCode || hh.id}`;
    hhMap.set(key, hh);
  }

  const rawArray = rawStudents2027 as unknown as Array<Record<string, (string | number)[]>>;
  const parsedRows: ParsedRawStudent[] = [];
  for (let i = 0; i < rawArray.length; i++) {
    const rowObj = rawArray[i];
    if (!rowObj) continue;
    const keys = Object.keys(rowObj);
    if (keys.length === 0) continue;
    const parsed = parseRawStudentRow(rowObj[keys[0]], i);
    if (parsed) parsedRows.push(parsed);
  }

  const matchedCitizenMap = matchRawStudentsToCitizens(parsedRows, citizens);
  const students: StudentRecord[] = [];

  parsedRows.forEach((raw, idx) => {
    const seq = idx + 1;
    const matchedCitizen = matchedCitizenMap.get(raw.rowIndex);
    const isOutside = isExplicitOutsideVillage(raw.pobVillage);

    // Resolve current residence village: explicit outside stays outside; otherwise census match -> pobVillage -> 'រោគ'
    const currentVillage = isOutside
      ? raw.pobVillage
      : (matchedCitizen?.village || raw.pobVillage || 'រោគ');

    const pobVillage = raw.pobVillage || matchedCitizen?.village || 'រោគ';
    const hhCode = matchedCitizen?.householdCode || (matchedCitizen ? String(matchedCitizen.householdId) : '');
    const hh = matchedCitizen
      ? hhMap.get(`${matchedCitizen.village || 'រោគ'}_${hhCode}`)
      : undefined;

    let fatherName = raw.fatherName;
    let fatherOccupation = raw.fatherOccupation || 'កសិករ';
    let motherName = raw.motherName;
    let motherOccupation = raw.motherOccupation || 'កសិករ';

    if ((!fatherName || !motherName) && hh) {
      if (!fatherName) {
        const fMem = hh.members.find(m => (m.relationship === 'ឪពុក' || m.relationship === 'ប្តី') && m.gender === 'ប្រុស');
        if (fMem) {
          fatherName = fMem.name;
          fatherOccupation = fMem.occupation || fatherOccupation;
        }
      }
      if (!motherName) {
        const mMem = hh.members.find(m => (m.relationship === 'ម្តាយ' || m.relationship === 'ប្រពន្ធ') && m.gender === 'ស្រី');
        if (mMem) {
          motherName = mMem.name;
          motherOccupation = mMem.occupation || motherOccupation;
        }
      }
    }

    const studentCode = `ST-2027-${String(seq).padStart(3, '0')}`;
    const groupNumMatch = /^\s*(\d+)/.exec(hhCode);

    students.push({
      id: `student-2027-${seq}`,
      studentCode,
      name: raw.name,
      lastNameKh: raw.lastNameKh,
      firstNameKh: raw.firstNameKh,
      latinName: '',
      gender: raw.gender,
      dob: raw.dob,
      age: raw.age,
      ageMonths: raw.ageMonths,
      academicYear: raw.academicYear,
      grade: raw.grade,
      section: raw.section,
      previousGrade: raw.grade === 'ថ្នាក់ទី១' ? 'មត្តេយ្យសិក្សា' : '',
      previousSchool: isOutside ? `មកពីភូមិ ${raw.pobVillage}` : '',
      enrollmentDate: '01/10/2026',
      school: 'ប.សរោគ',
      status: 'active',

      pobVillage,
      pobCommune: raw.pobCommune,
      pobDistrict: raw.pobDistrict,
      pobProvince: raw.pobProvince,

      houseNumber: hhCode ? `H-${hhCode}` : undefined,
      groupNumber: groupNumMatch ? `ក្រុម ${groupNumMatch[1]}` : undefined,
      currentVillage,
      currentCommune: 'ស្ពានស្រែង',
      currentDistrict: 'ភ្នំស្រុក',
      currentProvince: 'បន្ទាយមានជ័យ',
      householdCode: hhCode || undefined,

      heightCm: raw.heightCm,
      weightKg: raw.weightKg,
      eyeCheck: raw.eyeCheck,
      poorCard: 'none',
      disability: raw.disability,
      healthNotes: raw.healthNotes,

      fatherName: fatherName || 'មិនបានកត់ត្រា',
      fatherLiving: true,
      fatherOccupation,
      fatherPhone: raw.fatherPhone || raw.phone,
      fatherAddress: raw.fatherVillage ? `ភូមិ${raw.fatherVillage}` : undefined,

      motherName: motherName || 'មិនបានកត់ត្រា',
      motherLiving: true,
      motherOccupation,
      motherPhone: raw.motherPhone,
      motherAddress: raw.motherVillage ? `ភូមិ${raw.motherVillage}` : undefined,

      guardianName: raw.guardianName || fatherName || motherName || '',
      guardianRelationship: raw.guardianRelationship,
      guardianOccupation: raw.guardianOccupation || 'កសិករ',
      guardianPhone: raw.guardianPhone || raw.phone,

      citizenId: matchedCitizen?.id,
      updatedAt: new Date().toISOString()
    });
  });

  return students.sort((a, b) => {
    const rankDiff = gradeSortOrder(a.grade) - gradeSortOrder(b.grade);
    if (rankDiff !== 0) return rankDiff;
    if (a.section !== b.section) return a.section.localeCompare(b.section, 'km');
    return a.name.localeCompare(b.name, 'km');
  });
}

/**
 * Loads student records from localStorage, or initializes them from students2027.json + census
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
  if (months >= 48 || citizen.age === 4) return 'មត្តេយ្យចម្រុះ';
  return 'មត្តេយ្យចម្រុះ';
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

  const idNum = Math.floor(400 + Math.random() * 599);
  const studentCode = `ST-2027-${idNum}`;

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
    academicYear: '២០២៦-២០២៧',
    grade: resolvedGrade,
    section,
    previousGrade: 'គ្មាន (មកពីជំរឿនប្រជាជន)',
    enrollmentDate: new Date().toLocaleDateString('en-GB'),
    school: 'ប.សរោគ',
    status: 'active',

    pobVillage: village,
    pobCommune: 'ស្ពានស្រែង',
    pobDistrict: 'ភ្នំស្រុក',
    pobProvince: 'បន្ទាយមានជ័យ',

    houseNumber: `H-${citizen.householdCode || citizen.householdId}`,
    groupNumber: `ក្រុម ${String(citizen.householdId).replace(/\D/g, '') || '១'}`,
    currentVillage: village,
    currentCommune: 'ស្ពានស្រែង',
    currentDistrict: 'ភ្នំស្រុក',
    currentProvince: 'បន្ទាយមានជ័យ',
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
