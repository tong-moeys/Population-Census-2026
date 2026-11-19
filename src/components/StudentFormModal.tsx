import React, { useState, useEffect } from 'react';
import { X, Save, UserPlus, Edit3, GraduationCap, MapPin, Users, Heart, Eye } from 'lucide-react';
import { StudentRecord, StudentGrade, EyeCheckResult, PoorCardStatus, StudentStatus } from '../types/student';
import { Language } from '../types/census';
import { translations } from '../utils/translations';

interface StudentFormModalProps {
  isOpen: boolean;
  studentToEdit: StudentRecord | null;
  language: Language;
  onClose: () => void;
  onSave: (student: StudentRecord) => void;
}

export const StudentFormModal: React.FC<StudentFormModalProps> = ({
  isOpen,
  studentToEdit,
  language,
  onClose,
  onSave
}) => {
  const t = translations[language];

  // Tab inside modal: 'personal' | 'academic' | 'address' | 'family' | 'health'
  const [activeSubTab, setActiveSubTab] = useState<'personal' | 'academic' | 'address' | 'family' | 'health'>('personal');

  // Form states
  const [studentCode, setStudentCode] = useState('');
  const [name, setName] = useState('');
  const [latinName, setLatinName] = useState('');
  const [gender, setGender] = useState<'ប្រុស' | 'ស្រី'>('ប្រុស');
  const [dob, setDob] = useState('');
  const [age, setAge] = useState<number>(6);

  const [academicYear, setAcademicYear] = useState('២០២៥-២០២៦');
  const [grade, setGrade] = useState<string>('ថ្នាក់ទី១');
  const [section, setSection] = useState('ក');
  const [previousGrade, setPreviousGrade] = useState('');
  const [enrollmentDate, setEnrollmentDate] = useState('01/10/2025');
  const [status, setStatus] = useState<StudentStatus>('active');

  const [pobVillage, setPobVillage] = useState('រោគ');
  const [pobCommune, setPobCommune] = useState('ស្វាយរលំ');
  const [pobDistrict, setPobDistrict] = useState('ស្ទឹងសែន');
  const [pobProvince, setPobProvince] = useState('កំពង់ធំ');

  const [currentVillage, setCurrentVillage] = useState('រោគ');
  const [currentCommune, setCurrentCommune] = useState('ស្វាយរលំ');
  const [currentDistrict, setCurrentDistrict] = useState('ស្ទឹងសែន');
  const [currentProvince, setCurrentProvince] = useState('កំពង់ធំ');
  const [householdCode, setHouseholdCode] = useState('1R1');

  const [heightCm, setHeightCm] = useState<number | ''>(115);
  const [weightKg, setWeightKg] = useState<number | ''>(19);
  const [eyeCheck, setEyeCheck] = useState<EyeCheckResult>('normal');
  const [poorCard, setPoorCard] = useState<PoorCardStatus>('none');
  const [disability, setDisability] = useState('');
  const [healthNotes, setHealthNotes] = useState('');

  const [fatherName, setFatherName] = useState('');
  const [fatherLiving, setFatherLiving] = useState(true);
  const [fatherOccupation, setFatherOccupation] = useState('កសិករ');
  const [fatherPhone, setFatherPhone] = useState('');

  const [motherName, setMotherName] = useState('');
  const [motherLiving, setMotherLiving] = useState(true);
  const [motherOccupation, setMotherOccupation] = useState('កសិករ');
  const [motherPhone, setMotherPhone] = useState('');

  const [guardianName, setGuardianName] = useState('');
  const [guardianRelationship, setGuardianRelationship] = useState('ឪពុក');
  const [guardianOccupation, setGuardianOccupation] = useState('កសិករ');
  const [guardianPhone, setGuardianPhone] = useState('');

  useEffect(() => {
    if (studentToEdit) {
      setStudentCode(studentToEdit.studentCode);
      setName(studentToEdit.name);
      setLatinName(studentToEdit.latinName || '');
      setGender(studentToEdit.gender);
      setDob(studentToEdit.dob);
      setAge(studentToEdit.age);

      setAcademicYear(studentToEdit.academicYear);
      setGrade(studentToEdit.grade);
      setSection(studentToEdit.section);
      setPreviousGrade(studentToEdit.previousGrade || '');
      setEnrollmentDate(studentToEdit.enrollmentDate);
      setStatus(studentToEdit.status);

      setPobVillage(studentToEdit.pobVillage);
      setPobCommune(studentToEdit.pobCommune);
      setPobDistrict(studentToEdit.pobDistrict);
      setPobProvince(studentToEdit.pobProvince);

      setCurrentVillage(studentToEdit.currentVillage);
      setCurrentCommune(studentToEdit.currentCommune);
      setCurrentDistrict(studentToEdit.currentDistrict);
      setCurrentProvince(studentToEdit.currentProvince);
      setHouseholdCode(studentToEdit.householdCode || '1R1');

      setHeightCm(studentToEdit.heightCm || '');
      setWeightKg(studentToEdit.weightKg || '');
      setEyeCheck(studentToEdit.eyeCheck || 'normal');
      setPoorCard(studentToEdit.poorCard || 'none');
      setDisability(studentToEdit.disability || '');
      setHealthNotes(studentToEdit.healthNotes || '');

      setFatherName(studentToEdit.fatherName);
      setFatherLiving(studentToEdit.fatherLiving);
      setFatherOccupation(studentToEdit.fatherOccupation || 'កសិករ');
      setFatherPhone(studentToEdit.fatherPhone || '');

      setMotherName(studentToEdit.motherName);
      setMotherLiving(studentToEdit.motherLiving);
      setMotherOccupation(studentToEdit.motherOccupation || 'កសិករ');
      setMotherPhone(studentToEdit.motherPhone || '');

      setGuardianName(studentToEdit.guardianName || '');
      setGuardianRelationship(studentToEdit.guardianRelationship || 'ឪពុក');
      setGuardianOccupation(studentToEdit.guardianOccupation || 'កសិករ');
      setGuardianPhone(studentToEdit.guardianPhone || '');
    } else {
      const randId = Math.floor(100 + Math.random() * 900);
      setStudentCode(`ST-2026-${randId}`);
      setName('');
      setLatinName('');
      setGender('ប្រុស');
      setDob('15/Apr/2020');
      setAge(6);

      setAcademicYear('២០២៥-២០២៦');
      setGrade('ថ្នាក់ទី១');
      setSection('ក');
      setPreviousGrade('មត្តេយ្យកម្រិតខ្ពស់');
      setEnrollmentDate(new Date().toLocaleDateString('en-GB'));
      setStatus('active');

      setPobVillage('រោគ');
      setPobCommune('ស្វាយរលំ');
      setPobDistrict('ស្ទឹងសែន');
      setPobProvince('កំពង់ធំ');

      setCurrentVillage('រោគ');
      setCurrentCommune('ស្វាយរលំ');
      setCurrentDistrict('ស្ទឹងសែន');
      setCurrentProvince('កំពង់ធំ');
      setHouseholdCode('1R1');

      setHeightCm(115);
      setWeightKg(19);
      setEyeCheck('normal');
      setPoorCard('none');
      setDisability('');
      setHealthNotes('');

      setFatherName('');
      setFatherLiving(true);
      setFatherOccupation('កសិករ');
      setFatherPhone('');

      setMotherName('');
      setMotherLiving(true);
      setMotherOccupation('កសិករ');
      setMotherPhone('');

      setGuardianName('');
      setGuardianRelationship('ឪពុក');
      setGuardianOccupation('កសិករ');
      setGuardianPhone('');
    }
  }, [studentToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const nameParts = name.trim().split(/\s+/);
    const lastNameKh = nameParts[0] || name.trim();
    const firstNameKh = nameParts.slice(1).join(' ') || nameParts[0];

    const savedRecord: StudentRecord = {
      id: studentToEdit?.id || `student-${Date.now()}`,
      studentCode: studentCode.trim() || `ST-2026-${Math.floor(100 + Math.random() * 900)}`,
      name: name.trim(),
      lastNameKh,
      firstNameKh,
      latinName: latinName.trim(),
      gender,
      dob: dob.trim(),
      age: Number(age) || 6,
      academicYear,
      grade,
      section,
      previousGrade: previousGrade.trim(),
      enrollmentDate,
      school: 'ប.សរោគ',
      status,

      pobVillage: pobVillage.trim(),
      pobCommune: pobCommune.trim(),
      pobDistrict: pobDistrict.trim(),
      pobProvince: pobProvince.trim(),

      currentVillage: currentVillage.trim(),
      currentCommune: currentCommune.trim(),
      currentDistrict: currentDistrict.trim(),
      currentProvince: currentProvince.trim(),
      householdCode: householdCode.trim(),

      heightCm: heightCm !== '' ? Number(heightCm) : undefined,
      weightKg: weightKg !== '' ? Number(weightKg) : undefined,
      eyeCheck,
      poorCard,
      disability: disability.trim(),
      healthNotes: healthNotes.trim(),

      fatherName: fatherName.trim() || 'មិនបានកត់ត្រា',
      fatherLiving,
      fatherOccupation: fatherOccupation.trim() || 'កសិករ',
      fatherPhone: fatherPhone.trim(),

      motherName: motherName.trim() || 'មិនបានកត់ត្រា',
      motherLiving,
      motherOccupation: motherOccupation.trim() || 'កសិករ',
      motherPhone: motherPhone.trim(),

      guardianName: guardianName.trim() || fatherName.trim() || motherName.trim() || '',
      guardianRelationship,
      guardianOccupation: guardianOccupation.trim() || 'កសិករ',
      guardianPhone: guardianPhone.trim(),

      updatedAt: new Date().toISOString()
    };

    onSave(savedRecord);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col font-khmer">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-700 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              {studentToEdit ? <Edit3 className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">
                {studentToEdit ? t.editStudent : t.addStudent}
              </h3>
              <p className="text-xs text-blue-100">
                {language === 'km' ? 'ព័ត៌មានលម្អិតសិស្សតាមទម្រង់ក្រសួងអប់រំ យុវជន និងកីឡា' : 'MoEYS Standard Student Information'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Category Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 overflow-x-auto text-xs font-semibold gap-1">
          <button
            type="button"
            onClick={() => setActiveSubTab('personal')}
            className={`px-3 py-2 border-b-2 rounded-t-lg transition whitespace-nowrap flex items-center gap-1.5 ${
              activeSubTab === 'personal'
                ? 'border-blue-600 text-blue-700 bg-white font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>ព័ត៌មានផ្ទាល់ខ្លួន</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('academic')}
            className={`px-3 py-2 border-b-2 rounded-t-lg transition whitespace-nowrap flex items-center gap-1.5 ${
              activeSubTab === 'academic'
                ? 'border-blue-600 text-blue-700 bg-white font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>ការសិក្សា</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('address')}
            className={`px-3 py-2 border-b-2 rounded-t-lg transition whitespace-nowrap flex items-center gap-1.5 ${
              activeSubTab === 'address'
                ? 'border-blue-600 text-blue-700 bg-white font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>កំណើត & ទីលំនៅ</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('family')}
            className={`px-3 py-2 border-b-2 rounded-t-lg transition whitespace-nowrap flex items-center gap-1.5 ${
              activeSubTab === 'family'
                ? 'border-blue-600 text-blue-700 bg-white font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>ឪពុកម្តាយ & អាណាព្យាបាល</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('health')}
            className={`px-3 py-2 border-b-2 rounded-t-lg transition whitespace-nowrap flex items-center gap-1.5 ${
              activeSubTab === 'health'
                ? 'border-blue-600 text-blue-700 bg-white font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>សុខភាព & ជីវភាព</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {activeSubTab === 'personal' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    អត្តលេខសិស្ស (Student ID) *
                  </label>
                  <input
                    type="text"
                    required
                    value={studentCode}
                    onChange={(e) => setStudentCode(e.target.value)}
                    placeholder="ឧ. ST-2026-001"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    គោត្តនាម និងនាម (Khmer Name) *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ឧ. ឡូត សុវណ្ណពុទ្ធិរាជ"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ភេទ (Gender) *</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as 'ប្រុស' | 'ស្រី')}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="ប្រុស">ប្រុស (Male)</option>
                    <option value="ស្រី">ស្រី (Female)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ថ្ងៃខែឆ្នាំកំណើត (DOB) *</label>
                  <input
                    type="text"
                    required
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    placeholder="15/Apr/2020"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">អាយុ (Age)</label>
                  <input
                    type="number"
                    min="2"
                    max="18"
                    value={age}
                    onChange={(e) => setAge(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ឈ្មោះជាអក្សរឡាតាំង (Latin Name)</label>
                <input
                  type="text"
                  value={latinName}
                  onChange={(e) => setLatinName(e.target.value)}
                  placeholder="LOT SOVANNPOTHIREACH"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase font-mono"
                />
              </div>
            </div>
          )}

          {activeSubTab === 'academic' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ឆ្នាំសិក្សា (Academic Year) *</label>
                  <select
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="២០២៥-២០២៦">២០២៥-២០២៦</option>
                    <option value="២០២៦-២០២៧">២០២៦-២០២៧</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">កម្រិតថ្នាក់ (Grade) *</label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-bold"
                  >
                    <option value="មត្តេយ្យកម្រិតទាប">មត្តេយ្យកម្រិតទាប (អាយុ ៣ ឆ្នាំ)</option>
                    <option value="មត្តេយ្យកម្រិតមធ្យម">មត្តេយ្យកម្រិតមធ្យម (អាយុ ៤ ឆ្នាំ)</option>
                    <option value="មត្តេយ្យកម្រិតខ្ពស់">មត្តេយ្យកម្រិតខ្ពស់ (អាយុ ៥ ឆ្នាំ)</option>
                    <option value="ថ្នាក់ទី១">ថ្នាក់ទី១ (បឋមសិក្សា ៧០-៨២ខែ)</option>
                    <option value="ថ្នាក់ទី២">ថ្នាក់ទី២</option>
                    <option value="ថ្នាក់ទី៣">ថ្នាក់ទី៣</option>
                    <option value="ថ្នាក់ទី៤">ថ្នាក់ទី៤</option>
                    <option value="ថ្នាក់ទី៥">ថ្នាក់ទី៥</option>
                    <option value="ថ្នាក់ទី៦">ថ្នាក់ទី៦</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">បន្ទប់ / ក្រុម (Section)</label>
                  <select
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="ក">បន្ទប់ ក</option>
                    <option value="ខ">បន្ទប់ ខ</option>
                    <option value="គ">បន្ទប់ គ</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ថ្ងៃចូលរៀន (Enrollment Date)</label>
                  <input
                    type="text"
                    value={enrollmentDate}
                    onChange={(e) => setEnrollmentDate(e.target.value)}
                    placeholder="01/10/2025"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ស្ថានភាពសិស្ស (Status)</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as StudentStatus)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="active">កំពុងសិក្សា (Active)</option>
                    <option value="transferred_in">ផ្ទេរចូល</option>
                    <option value="transferred_out">ផ្ទេរចេញ</option>
                    <option value="dropped_out">បោះបង់ការសិក្សា</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ថ្នាក់រៀនមុន (Previous Grade/School)</label>
                <input
                  type="text"
                  value={previousGrade}
                  onChange={(e) => setPreviousGrade(e.target.value)}
                  placeholder="ឧ. មត្តេយ្យកម្រិតខ្ពស់ ឬ គ្មាន"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {activeSubTab === 'address' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200">
                <span className="font-bold text-blue-900 block mb-2">ទីកន្លែងកំណើត (Place of Birth)</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">ភូមិ</label>
                    <input
                      type="text"
                      value={pobVillage}
                      onChange={(e) => setPobVillage(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">ឃុំ</label>
                    <input
                      type="text"
                      value={pobCommune}
                      onChange={(e) => setPobCommune(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">ស្រុក</label>
                    <input
                      type="text"
                      value={pobDistrict}
                      onChange={(e) => setPobDistrict(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">ខេត្ត</label>
                    <input
                      type="text"
                      value={pobProvince}
                      onChange={(e) => setPobProvince(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-800 block mb-2">អាសយដ្ឋានបច្ចុប្បន្ន (Current Address)</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">ភូមិបច្ចុប្បន្ន</label>
                    <select
                      value={currentVillage}
                      onChange={(e) => setCurrentVillage(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white"
                    >
                      <option value="រោគ">រោគ</option>
                      <option value="មុខឈ្នាង">មុខឈ្នាង</option>
                      <option value="ផ្សេងៗ">ផ្សេងៗ</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">ឃុំ</label>
                    <input
                      type="text"
                      value={currentCommune}
                      onChange={(e) => setCurrentCommune(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">ស្រុក</label>
                    <input
                      type="text"
                      value={currentDistrict}
                      onChange={(e) => setCurrentDistrict(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">ខេត្ត</label>
                    <input
                      type="text"
                      value={currentProvince}
                      onChange={(e) => setCurrentProvince(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white"
                    />
                  </div>
                </div>

                <div className="mt-2.5">
                  <label className="block text-[11px] text-slate-600 mb-0.5">លេខកូដខ្នងផ្ទះជំរឿន (Household Code)</label>
                  <input
                    type="text"
                    value={householdCode}
                    onChange={(e) => setHouseholdCode(e.target.value)}
                    placeholder="1R1, 1M26..."
                    className="w-full sm:w-1/2 px-2.5 py-1.5 rounded border border-slate-300 bg-white font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {activeSubTab === 'family' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Father */}
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800">ព័ត៌មានឪពុក (Father)</span>
                  <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={fatherLiving}
                      onChange={(e) => setFatherLiving(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span>នៅរស់ (Living)</span>
                  </label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">ឈ្មោះឪពុក</label>
                    <input
                      type="text"
                      value={fatherName}
                      onChange={(e) => setFatherName(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">មុខរបរ</label>
                    <input
                      type="text"
                      value={fatherOccupation}
                      onChange={(e) => setFatherOccupation(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">លេខទូរស័ព្ទ</label>
                    <input
                      type="text"
                      value={fatherPhone}
                      onChange={(e) => setFatherPhone(e.target.value)}
                      placeholder="092 123 456"
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Mother */}
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800">ព័ត៌មានម្តាយ (Mother)</span>
                  <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={motherLiving}
                      onChange={(e) => setMotherLiving(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span>នៅរស់ (Living)</span>
                  </label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">ឈ្មោះម្តាយ</label>
                    <input
                      type="text"
                      value={motherName}
                      onChange={(e) => setMotherName(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">មុខរបរ</label>
                    <input
                      type="text"
                      value={motherOccupation}
                      onChange={(e) => setMotherOccupation(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">លេខទូរស័ព្ទ</label>
                    <input
                      type="text"
                      value={motherPhone}
                      onChange={(e) => setMotherPhone(e.target.value)}
                      placeholder="097 123 456"
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Guardian */}
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <span className="font-bold text-slate-800 block">អាណាព្យាបាល (Guardian)</span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">ឈ្មោះអាណាព្យាបាល</label>
                    <input
                      type="text"
                      value={guardianName}
                      onChange={(e) => setGuardianName(e.target.value)}
                      placeholder="បើខុសពីឪពុកម្តាយ"
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">ត្រូវជា</label>
                    <input
                      type="text"
                      value={guardianRelationship}
                      onChange={(e) => setGuardianRelationship(e.target.value)}
                      placeholder="ឪពុក, ម្តាយ, ជីដូន..."
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">មុខរបរ</label>
                    <input
                      type="text"
                      value={guardianOccupation}
                      onChange={(e) => setGuardianOccupation(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">លេខទូរស័ព្ទ</label>
                    <input
                      type="text"
                      value={guardianPhone}
                      onChange={(e) => setGuardianPhone(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSubTab === 'health' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">កម្ពស់ (Height - cm)</label>
                  <input
                    type="number"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="115"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ទម្ងន់ (Weight - kg)</label>
                  <input
                    type="number"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="19"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">លទ្ធផលពិនិត្យគំហើញភ្នែក *</label>
                  <select
                    value={eyeCheck}
                    onChange={(e) => setEyeCheck(e.target.value as EyeCheckResult)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="normal">ធម្មតា (Normal Vision)</option>
                    <option value="glasses">ពាក់វ៉ែនតា (Wears Glasses)</option>
                    <option value="impaired">គំហើញខ្សោយ (Vision Impaired)</option>
                    <option value="untested">មិនទាន់បានពិនិត្យ</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ប័ណ្ណសមធម៌ / ក្រីក្រ (ID-Poor) *</label>
                  <select
                    value={poorCard}
                    onChange={(e) => setPoorCard(e.target.value as PoorCardStatus)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="none">គ្មាន (ទូទៅ - Non-poor)</option>
                    <option value="idpoor1">ក្រីក្រកម្រិត ១ (IDPoor 1 - Very Poor)</option>
                    <option value="idpoor2">ក្រីក្រកម្រិត ២ (IDPoor 2 - Poor)</option>
                    <option value="vulnerable">គ្រួសារងាយរងគ្រោះ (Vulnerable)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ពិការភាព (Disability - បើមាន)</label>
                <input
                  type="text"
                  value={disability}
                  onChange={(e) => setDisability(e.target.value)}
                  placeholder="ឧ. គ្មាន, ឬពិការជើង..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">កំណត់សម្គាល់សុខភាព (Health Notes)</label>
                <input
                  type="text"
                  value={healthNotes}
                  onChange={(e) => setHealthNotes(e.target.value)}
                  placeholder="ឧ. អាលែកហ្ស៊ី, ត្រូវការតាមដាន..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold transition"
            >
              {t.cancel}
            </button>

            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20 transition"
            >
              <Save className="w-4 h-4" />
              <span>{t.save}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
