import React, { useState, useMemo } from 'react';
import { 
  GraduationCap, 
  Users, 
  UserPlus, 
  Download, 
  Printer, 
  Search, 
  Filter, 
  Baby, 
  School, 
  Eye, 
  ShieldAlert, 
  MapPin, 
  Phone, 
  Edit3, 
  Trash2, 
  Eye as ViewIcon, 
  Sparkles,
  ArrowUpDown,
  Heart,
  ChevronRight,
  FileSpreadsheet,
  SlidersHorizontal,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { StudentRecord, StudentGrade, EyeCheckResult, PoorCardStatus } from '../types/student';
import { Citizen, Household, Language } from '../types/census';
import { translations, translateGender } from '../utils/translations';
import { exportStudentsToCSV } from '../utils/studentData';
import { StudentProfileModal } from './StudentProfileModal';
import { StudentFormModal } from './StudentFormModal';
import { StudentImportModal } from './StudentImportModal';
import { OfficialSignatureSection } from './OfficialSignatureSection';

interface StudentInformationViewProps {
  students: StudentRecord[];
  citizens: Citizen[];
  households: Household[];
  language: Language;
  onSaveStudent: (student: StudentRecord) => void;
  onDeleteStudent: (studentId: string) => void;
  onImportStudents: (newStudents: StudentRecord[]) => void;
}

export const StudentInformationView: React.FC<StudentInformationViewProps> = ({
  students,
  citizens,
  households,
  language,
  onSaveStudent,
  onDeleteStudent,
  onImportStudents
}) => {
  const t = translations[language];

  // Modals state
  const [selectedStudentForProfile, setSelectedStudentForProfile] = useState<StudentRecord | null>(null);
  const [studentToEdit, setStudentToEdit] = useState<StudentRecord | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Table Density Mode: 'ultra-compact' (default - smallest font & tightest table) | 'compact' | 'normal'
  const [density, setDensity] = useState<'ultra-compact' | 'compact' | 'normal'>(() => {
    return (localStorage.getItem('student_table_density') as 'ultra-compact' | 'compact' | 'normal') || 'ultra-compact';
  });

  const handleDensityChange = (newDensity: 'ultra-compact' | 'compact' | 'normal') => {
    setDensity(newDensity);
    localStorage.setItem('student_table_density', newDensity);
  };

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState<'all' | string>('all');
  const [villageFilter, setVillageFilter] = useState<'all' | string>('all');
  const [genderFilter, setGenderFilter] = useState<'all' | string>('all');
  const [poorCardFilter, setPoorCardFilter] = useState<'all' | PoorCardStatus>('all');
  const [eyeFilter, setEyeFilter] = useState<'all' | EyeCheckResult>('all');
  const [sectionFilter, setSectionFilter] = useState<'all' | string>('all');
  const [ageFilter, setAgeFilter] = useState<'all' | 3 | 4 | 5 | 6 | 7>('all');

  // Sorting
  const [sortField, setSortField] = useState<'code' | 'name' | 'grade' | 'age'>('grade');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Pagination & Page Size
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | 'all'>(50);

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      // Age filter (3, 4, 5, 6, 7 years)
      if (ageFilter !== 'all' && student.age !== ageFilter) {
        return false;
      }

      // Grade filter
      if (gradeFilter !== 'all') {
        if (gradeFilter === 'preschool' && !student.grade.includes('មត្តេយ្យ')) return false;
        if (gradeFilter === 'grade1' && student.grade !== 'ថ្នាក់ទី១') return false;
        if (gradeFilter !== 'preschool' && gradeFilter !== 'grade1' && student.grade !== gradeFilter) return false;
      }

      // Village filter
      if (villageFilter !== 'all' && student.currentVillage !== villageFilter) {
        return false;
      }

      // Gender filter
      if (genderFilter !== 'all' && student.gender !== genderFilter) {
        return false;
      }

      // Poor card filter
      if (poorCardFilter !== 'all' && student.poorCard !== poorCardFilter) {
        return false;
      }

      // Eye check filter
      if (eyeFilter !== 'all' && student.eyeCheck !== eyeFilter) {
        return false;
      }

      // Section filter
      if (sectionFilter !== 'all' && student.section !== sectionFilter) {
        return false;
      }

      // Search query
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchesName = student.name.toLowerCase().includes(q);
        const matchesCode = student.studentCode.toLowerCase().includes(q);
        const matchesFather = student.fatherName.toLowerCase().includes(q);
        const matchesMother = student.motherName.toLowerCase().includes(q);
        const matchesHh = (student.householdCode || '').toLowerCase().includes(q);
        const matchesDob = student.dob.toLowerCase().includes(q);
        if (!matchesName && !matchesCode && !matchesFather && !matchesMother && !matchesHh && !matchesDob) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortField === 'grade') {
        const gradeRank = (g: string) => {
          if (g === 'ថ្នាក់ទី១') return 1;
          if (g.includes('កម្រិតខ្ពស់')) return 2;
          if (g.includes('កម្រិតមធ្យម')) return 3;
          if (g.includes('កម្រិតទាប')) return 4;
          return 5;
        };
        const rankDiff = gradeRank(a.grade) - gradeRank(b.grade);
        if (rankDiff !== 0) return sortOrder === 'asc' ? rankDiff : -rankDiff;
        return a.name.localeCompare(b.name, 'km');
      }
      if (sortField === 'code') {
        return sortOrder === 'asc' ? a.studentCode.localeCompare(b.studentCode) : b.studentCode.localeCompare(a.studentCode);
      }
      if (sortField === 'name') {
        return sortOrder === 'asc' ? a.name.localeCompare(b.name, 'km') : b.name.localeCompare(a.name, 'km');
      }
      if (sortField === 'age') {
        return sortOrder === 'asc' ? a.age - b.age : b.age - a.age;
      }
      return 0;
    });
  }, [students, ageFilter, gradeFilter, villageFilter, genderFilter, poorCardFilter, eyeFilter, sectionFilter, searchTerm, sortField, sortOrder]);

  // Live student counts by exact age 3, 4, 5, 6, 7
  const studentAgeCounts = useMemo(() => {
    const context = students.filter(student => {
      if (villageFilter !== 'all' && student.currentVillage !== villageFilter) return false;
      if (genderFilter !== 'all' && student.gender !== genderFilter) return false;
      return true;
    });
    return ([3, 4, 5, 6, 7] as const).map(age => {
      const list = context.filter(s => s.age === age);
      return {
        age,
        total: list.length,
        female: list.filter(s => s.gender === 'ស្រី').length
      };
    });
  }, [students, villageFilter, genderFilter]);

  // Pagination Slice
  const effectivePageSize = pageSize === 'all' ? filteredStudents.length || 1 : pageSize;
  const totalPages = pageSize === 'all' ? 1 : (Math.ceil(filteredStudents.length / effectivePageSize) || 1);
  const paginatedStudents = useMemo(() => {
    if (pageSize === 'all') return filteredStudents;
    const start = (currentPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, currentPage, pageSize]);

  // Statistics
  const stats = useMemo(() => {
    const total = students.length;
    const female = students.filter(s => s.gender === 'ស្រី').length;
    const grade1Count = students.filter(s => s.grade === 'ថ្នាក់ទី១').length;
    const preschoolCount = students.filter(s => s.grade.includes('មត្តេយ្យ')).length;
    const idPoorCount = students.filter(s => s.poorCard === 'idpoor1' || s.poorCard === 'idpoor2' || s.poorCard === 'vulnerable').length;
    const visionAlertCount = students.filter(s => s.eyeCheck === 'impaired' || s.eyeCheck === 'glasses').length;
    const roukVillageCount = students.filter(s => s.currentVillage === 'រោគ').length;
    const mukhChhnangCount = students.filter(s => s.currentVillage === 'មុខឈ្នាង').length;

    return {
      total,
      female,
      femalePercent: total > 0 ? Math.round((female / total) * 100) : 0,
      grade1Count,
      preschoolCount,
      idPoorCount,
      idPoorPercent: total > 0 ? Math.round((idPoorCount / total) * 100) : 0,
      visionAlertCount,
      roukVillageCount,
      mukhChhnangCount
    };
  }, [students]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    exportStudentsToCSV(filteredStudents, 'ប.សរោគ');
  };

  return (
    <div className="space-y-6 print:space-y-3">
      {/* Top Banner & Title */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 sm:p-7 shadow-lg relative overflow-hidden no-print">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-400 text-slate-950 shadow-xs">
                <GraduationCap className="w-4 h-4" />
                {language === 'km' ? 'ព័ត៌មានលម្អិតសិស្ស (EMIS/SIS MoEYS)' : 'MoEYS Student Information Table'}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-blue-200 border border-white/20">
                {language === 'km' ? 'សាលាបឋមសិក្សារោគ' : 'Rouk Primary School'}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
              {language === 'km' ? 'តារាងព័ត៌មានលម្អិតសិស្ស តាមកម្រិតថ្នាក់ និងបន្ទប់' : 'Detailed Student Records & Profile Management'}
            </h2>
            <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed max-w-2xl">
              {language === 'km' 
                ? 'ទម្រង់ស្តង់ដារក្រសួងអប់រំ យុវជន និងកីឡា៖ បញ្ជីឈ្មោះ ថ្ងៃខែឆ្នាំកំណើត ទីកន្លែងកំណើត អាសយដ្ឋាន ព័ត៌មានឪពុកម្តាយ កម្ពស់ ទម្ងន់ ពិនិត្យភ្នែក និងកម្រិតជីវភាព។'
                : 'Official Ministry of Education schema: Student ID, Birthplace, Residence, Parents, Physical metrics, Vision status, and Poor card category.'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 no-print">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/30 transition"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{language === 'km' ? 'នាំចូលពីជំរឿន' : 'Import from Census'}</span>
            </button>

            <button
              onClick={() => {
                setStudentToEdit(null);
                setIsFormModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-900/30 transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>{t.addStudent}</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition"
            >
              <Printer className="w-4 h-4" />
              <span>{language === 'km' ? 'បោះពុម្ពតារាង' : 'Print Table'}</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition"
            >
              <Download className="w-4 h-4" />
              <span>{t.exportCSV}</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 no-print">
        {/* Total Students */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>{language === 'km' ? 'សិស្សសរុប' : 'Total Students'}</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono">
            {stats.total.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            ស្រី <strong>{stats.female}</strong> នាក់ ({stats.femalePercent}%)
          </p>
        </div>

        {/* Grade 1 Primary */}
        <div 
          onClick={() => setGradeFilter(gradeFilter === 'grade1' ? 'all' : 'grade1')}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            gradeFilter === 'grade1'
              ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-500/20'
              : 'bg-white border-slate-200 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>{language === 'km' ? 'ថ្នាក់ទី១' : 'Grade 1'}</span>
            <School className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-indigo-900 font-mono">
            {stats.grade1Count}
          </div>
          <p className="text-[11px] text-indigo-600 mt-0.5">
            {language === 'km' ? 'បឋមសិក្សា (៧០-៨២ខែ)' : 'Primary Roster'}
          </p>
        </div>

        {/* Pre-school */}
        <div 
          onClick={() => setGradeFilter(gradeFilter === 'preschool' ? 'all' : 'preschool')}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            gradeFilter === 'preschool'
              ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-500/20'
              : 'bg-white border-slate-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>{language === 'km' ? 'មត្តេយ្យសិក្សា' : 'Pre-school'}</span>
            <Baby className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-900 font-mono">
            {stats.preschoolCount}
          </div>
          <p className="text-[11px] text-emerald-600 mt-0.5">
            {language === 'km' ? 'អាយុ ៣-៥ ឆ្នាំ' : 'Age 3-5 Years'}
          </p>
        </div>

        {/* ID-Poor Students */}
        <div 
          onClick={() => setPoorCardFilter(poorCardFilter === 'none' ? 'all' : 'idpoor1')}
          className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs cursor-pointer hover:border-amber-300"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>{language === 'km' ? 'ប័ណ្ណសមធម៌' : 'ID-Poor'}</span>
            <ShieldAlert className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-900 font-mono">
            {stats.idPoorCount}
          </div>
          <p className="text-[11px] text-amber-700 mt-0.5">
            {stats.idPoorPercent}% {language === 'km' ? 'នៃសិស្សសរុប' : 'of students'}
          </p>
        </div>

        {/* Vision / Eye Check */}
        <div 
          onClick={() => setEyeFilter(eyeFilter === 'all' ? 'glasses' : 'all')}
          className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs cursor-pointer hover:border-purple-300"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>{language === 'km' ? 'ពិនិត្យភ្នែក' : 'Eye Check'}</span>
            <Eye className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-purple-900 font-mono">
            {stats.visionAlertCount}
          </div>
          <p className="text-[11px] text-purple-700 mt-0.5">
            {language === 'km' ? 'ពាក់វ៉ែនតា / គំហើញខ្សោយ' : 'Glasses / Impaired'}
          </p>
        </div>

        {/* Catchment Villages */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>{language === 'km' ? 'ភូមិចំណុះ' : 'Villages'}</span>
            <MapPin className="w-4 h-4 text-teal-600" />
          </div>
          <div className="mt-2 text-xs font-semibold text-slate-700 space-y-1">
            <div className="flex justify-between">
              <span>ភូមិរោគ៖</span>
              <strong className="text-slate-900 font-mono">{stats.roukVillageCount}</strong>
            </div>
            <div className="flex justify-between">
              <span>មុខឈ្នាង៖</span>
              <strong className="text-slate-900 font-mono">{stats.mukhChhnangCount}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap gap-2.5 items-center justify-between text-xs no-print">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ស្វែងរកតាម ឈ្មោះ, អត្តលេខ, ឪពុកម្តាយ..."
              className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-56 font-khmer"
            />
          </div>

          {/* Grade Filter */}
          <select
            value={gradeFilter}
            onChange={(e) => {
              setGradeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium"
          >
            <option value="all">កម្រិតថ្នាក់ទាំងអស់ (All Grades)</option>
            <option value="grade1">ថ្នាក់ទី១ (Grade 1)</option>
            <option value="preschool">ថ្នាក់មត្តេយ្យទាំងអស់</option>
            <option value="មត្តេយ្យកម្រិតខ្ពស់">មត្តេយ្យកម្រិតខ្ពស់ (៥ ឆ្នាំ)</option>
            <option value="មត្តេយ្យកម្រិតមធ្យម">មត្តេយ្យកម្រិតមធ្យម (៤ ឆ្នាំ)</option>
            <option value="មត្តេយ្យកម្រិតទាប">មត្តេយ្យកម្រិតទាប (៣ ឆ្នាំ)</option>
          </select>

          {/* Section Filter */}
          <select
            value={sectionFilter}
            onChange={(e) => {
              setSectionFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium"
          >
            <option value="all">បន្ទប់ទាំងអស់ (All Sections)</option>
            <option value="ក">បន្ទប់ ក</option>
            <option value="ខ">បន្ទប់ ខ</option>
            <option value="គ">បន្ទប់ គ</option>
          </select>

          {/* Village Filter */}
          <select
            value={villageFilter}
            onChange={(e) => {
              setVillageFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium"
          >
            <option value="all">ភូមិទាំងអស់</option>
            <option value="រោគ">ភូមិរោគ</option>
            <option value="មុខឈ្នាង">ភូមិមុខឈ្នាង</option>
          </select>

          {/* Gender Filter */}
          <select
            value={genderFilter}
            onChange={(e) => {
              setGenderFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium"
          >
            <option value="all">{t.filterGender}</option>
            <option value="ប្រុស">{t.males}</option>
            <option value="ស្រី">{t.females}</option>
          </select>

          {/* Eye Check Filter */}
          <select
            value={eyeFilter}
            onChange={(e) => {
              setEyeFilter(e.target.value as 'all' | EyeCheckResult);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium"
          >
            <option value="all">លទ្ធផលភ្នែកទាំងអស់</option>
            <option value="normal">ធម្មតា</option>
            <option value="glasses">ពាក់វ៉ែនតា</option>
            <option value="impaired">គំហើញខ្សោយ</option>
          </select>

          {/* ID-Poor Filter */}
          <select
            value={poorCardFilter}
            onChange={(e) => {
              setPoorCardFilter(e.target.value as 'all' | PoorCardStatus);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium"
          >
            <option value="all">ប័ណ្ណក្រីក្រទាំងអស់</option>
            <option value="none">គ្មាន (ទូទៅ)</option>
            <option value="idpoor1">ក្រ១ (Very Poor)</option>
            <option value="idpoor2">ក្រ២ (Poor)</option>
            <option value="vulnerable">ងាយរងគ្រោះ</option>
          </select>
        </div>

        {/* Clear filters if active */}
        {(ageFilter !== 'all' || gradeFilter !== 'all' || villageFilter !== 'all' || genderFilter !== 'all' || poorCardFilter !== 'all' || eyeFilter !== 'all' || sectionFilter !== 'all' || searchTerm.trim()) && (
          <button
            onClick={() => {
              setAgeFilter('all');
              setGradeFilter('all');
              setVillageFilter('all');
              setGenderFilter('all');
              setPoorCardFilter('all');
              setEyeFilter('all');
              setSectionFilter('all');
              setSearchTerm('');
              setCurrentPage(1);
            }}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
          >
            លុបតម្រង ({filteredStudents.length} / {students.length})
          </button>
        )}

        {/* Exact Age Quick Filter & Count Pills (3, 4, 5, 6, 7 years) */}
        <div className="w-full pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-slate-700 mr-1">
            {language === 'km' ? 'តម្រង & រាប់អាយុ៖' : 'Age Filter & Count:'}
          </span>
          <button
            type="button"
            onClick={() => { setAgeFilter('all'); setCurrentPage(1); }}
            className={`px-2 py-0.5 rounded-md text-[11px] font-bold border transition ${
              ageFilter === 'all'
                ? 'bg-slate-800 text-white border-slate-900'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            {language === 'km' ? `ទាំងអស់ (${students.length})` : `All (${students.length})`}
          </button>
          {studentAgeCounts.map(item => {
            const isActive = ageFilter === item.age;
            return (
              <button
                key={item.age}
                type="button"
                onClick={() => {
                  setAgeFilter(isActive ? 'all' : item.age);
                  setCurrentPage(1);
                }}
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold border transition flex items-center gap-1 ${
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs'
                    : 'bg-indigo-50/70 text-indigo-950 border-indigo-200 hover:bg-indigo-100'
                }`}
              >
                <span>{language === 'km' ? `${item.age} ឆ្នាំ` : `${item.age}y`}</span>
                <span className={`px-1 rounded text-[10px] font-black ${
                  isActive ? 'bg-white/20 text-white' : 'bg-white text-indigo-800 border border-indigo-200'
                }`}>
                  {item.total}
                </span>
                <span className={`text-[10px] font-semibold ${isActive ? 'text-pink-100' : 'text-pink-700'}`}>
                  ({language === 'km' ? 'ស្រី' : 'F'} {item.female})
                </span>
              </button>
            );
          })}
          <span className="ml-auto text-[11px] font-bold text-slate-700">
            {language === 'km'
              ? `រកឃើញ៖ ${filteredStudents.length} នាក់ (ស្រី ${filteredStudents.filter(s => s.gender === 'ស្រី').length})`
              : `Found: ${filteredStudents.length} (F ${filteredStudents.filter(s => s.gender === 'ស្រី').length})`}
          </span>
        </div>
      </div>

      {/* Official Print Header (Only visible when printing) */}
      <div className="hidden print:block font-khmer pb-4 border-b-2 border-slate-800">
        <div className="flex justify-between items-start">
          <div className="text-left">
            <p className="text-xs font-bold text-slate-700">ក្រសួងអប់រំ យុវជន និងកីឡា</p>
            <p className="text-xs text-slate-600">មន្ទីរអប់រំ យុវជន និងកីឡាខេត្តកំពង់ធំ</p>
            <p className="text-xs text-slate-600">ការិយាល័យអប់រំ យុវជន និងកីឡា ស្រុកស្ទឹងសែន</p>
            <p className="text-sm font-bold text-slate-900 mt-1">សាលាបឋមសិក្សារោគ</p>
          </div>

          <div className="text-right">
            <p className="text-xs font-bold text-slate-900">ព្រះរាជាណាចក្រកម្ពុជា</p>
            <p className="text-xs font-bold text-slate-800">ជាតិ សាសនា ព្រះមហាក្សត្រ</p>
            <div className="flex justify-end my-1">
              <span className="w-16 h-0.5 bg-amber-500 rounded-full" />
            </div>
            <p className="text-[11px] text-slate-600">
              ឆ្នាំសិក្សា៖ <strong>២០២៥-២០២៦</strong>
            </p>
          </div>
        </div>

        <div className="text-center mt-3">
          <h2 className="text-base font-bold text-slate-900">
            តារាងព័ត៌មានលម្អិតសិស្ស {gradeFilter !== 'all' ? `(${gradeFilter})` : ''} 
          </h2>
          <p className="text-xs text-slate-600">
            ភូមិចំណុះ៖ ភូមិរោគ និងភូមិមុខឈ្នាង | សរុប៖ <strong>{filteredStudents.length} នាក់</strong> (ស្រី {filteredStudents.filter(s => s.gender === 'ស្រី').length} នាក់)
          </p>
        </div>
      </div>

      {/* Density and Table Display Controls Bar */}
      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs no-print">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 font-bold text-slate-700 text-[11px]">
            <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
            <span>{language === 'km' ? 'ទំហំតារាង & អក្សរ៖' : 'Table & Font Size:'}</span>
          </span>

          <div className="inline-flex p-0.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
            <button
              onClick={() => handleDensityChange('ultra-compact')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition flex items-center gap-1 ${
                density === 'ultra-compact'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
              title="បង្រួមតូចបំផុត (ទំហំអក្សរ ៩.៥px, ចន្លោះជួរតូចបំផុត មិនបាច់រមូរច្រើន)"
            >
              <ZoomOut className="w-3 h-3" />
              <span>{language === 'km' ? 'តូចបំផុត (Ultra Compact)' : 'Ultra Compact'}</span>
            </button>

            <button
              onClick={() => handleDensityChange('compact')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition flex items-center gap-1 ${
                density === 'compact'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span>{language === 'km' ? 'មធ្យម' : 'Compact'}</span>
            </button>

            <button
              onClick={() => handleDensityChange('normal')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition flex items-center gap-1 ${
                density === 'normal'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <ZoomIn className="w-3 h-3" />
              <span>{language === 'km' ? 'ធម្មតា' : 'Normal'}</span>
            </button>
          </div>
        </div>

        {/* Rows Per Page Selector */}
        <div className="flex items-center gap-2 text-[11px]">
          <span className="text-slate-500 font-medium">
            {language === 'km' ? 'ចំនួនក្នុង១ទំព័រ៖' : 'Per Page:'}
          </span>
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
            {[25, 50, 100, 'all' as const].map((size) => (
              <button
                key={size}
                onClick={() => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                  pageSize === size
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {size === 'all' ? (language === 'km' ? 'ទាំងអស់' : 'All') : size}
              </button>
            ))}
          </div>

          <span className="text-slate-400 font-mono text-[10px] hidden sm:inline">
            ({filteredStudents.length} {language === 'km' ? 'សិស្ស' : 'students'})
          </span>
        </div>
      </div>

      {/* Official MoEYS Student Information Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden print:overflow-visible print:shadow-none print:rounded-none">
        <div className="overflow-x-auto max-h-[78vh] overflow-y-auto print:overflow-visible print:max-h-none">
          <table className={`w-full text-left border-collapse font-khmer print-wide-table ${
            density === 'ultra-compact' 
              ? 'text-[9.5px] leading-tight' 
              : density === 'compact' 
                ? 'text-[11px] leading-snug' 
                : 'text-xs leading-normal'
          }`}>
            <thead className={`sticky top-0 print:static bg-slate-100 z-20 text-slate-700 uppercase font-bold border-b border-slate-300 shadow-2xs select-none ${
              density === 'ultra-compact' 
                ? 'text-[9px]' 
                : density === 'compact' 
                  ? 'text-[10px]' 
                  : 'text-[11px]'
            }`}>
              <tr>
                <th className={`border-r border-slate-200 text-center w-8 ${density === 'ultra-compact' ? 'py-1 px-1' : density === 'compact' ? 'py-1.5 px-1.5' : 'py-2.5 px-2.5'}`}>ល.រ</th>
                <th className={`border-r border-slate-200 w-20 ${density === 'ultra-compact' ? 'py-1 px-1' : density === 'compact' ? 'py-1.5 px-1.5' : 'py-2.5 px-2.5'}`}>អត្តលេខ</th>
                <th className={`border-r border-slate-200 min-w-[110px] ${density === 'ultra-compact' ? 'py-1 px-1.5' : density === 'compact' ? 'py-1.5 px-2' : 'py-2.5 px-2.5'}`}>គោត្តនាម-នាម</th>
                <th className={`border-r border-slate-200 text-center w-10 ${density === 'ultra-compact' ? 'py-1 px-1' : density === 'compact' ? 'py-1.5 px-1.5' : 'py-2.5 px-2.5'}`}>ភេទ</th>
                <th className={`border-r border-slate-200 text-center w-20 ${density === 'ultra-compact' ? 'py-1 px-1' : density === 'compact' ? 'py-1.5 px-1.5' : 'py-2.5 px-2.5'}`}>ថ្ងៃកំណើត</th>
                <th className={`border-r border-slate-200 text-center w-9 ${density === 'ultra-compact' ? 'py-1 px-1' : density === 'compact' ? 'py-1.5 px-1.5' : 'py-2.5 px-2.5'}`}>អាយុ</th>
                <th className={`border-r border-slate-200 min-w-[85px] ${density === 'ultra-compact' ? 'py-1 px-1.5' : density === 'compact' ? 'py-1.5 px-2' : 'py-2.5 px-2.5'}`}>ថ្នាក់-បន្ទប់</th>
                <th className={`border-r border-slate-200 min-w-[90px] ${density === 'ultra-compact' ? 'py-1 px-1.5' : density === 'compact' ? 'py-1.5 px-2' : 'py-2.5 px-2.5'}`}>ទីកន្លែងកំណើត</th>
                <th className={`border-r border-slate-200 min-w-[85px] ${density === 'ultra-compact' ? 'py-1 px-1.5' : density === 'compact' ? 'py-1.5 px-2' : 'py-2.5 px-2.5'}`}>អាសយដ្ឋានបច្ចុប្បន្ន</th>
                <th className={`border-r border-slate-200 min-w-[95px] ${density === 'ultra-compact' ? 'py-1 px-1.5' : density === 'compact' ? 'py-1.5 px-2' : 'py-2.5 px-2.5'}`}>ឪពុក / មុខរបរ</th>
                <th className={`border-r border-slate-200 min-w-[95px] ${density === 'ultra-compact' ? 'py-1 px-1.5' : density === 'compact' ? 'py-1.5 px-2' : 'py-2.5 px-2.5'}`}>ម្តាយ / មុខរបរ</th>
                <th className={`border-r border-slate-200 min-w-[75px] ${density === 'ultra-compact' ? 'py-1 px-1' : density === 'compact' ? 'py-1.5 px-1.5' : 'py-2.5 px-2.5'}`}>លេខទូរស័ព្ទ</th>
                <th className={`border-r border-slate-200 text-center min-w-[60px] ${density === 'ultra-compact' ? 'py-1 px-1' : density === 'compact' ? 'py-1.5 px-1.5' : 'py-2.5 px-2.5'}`}>កម្ពស់/ទម្ងន់</th>
                <th className={`border-r border-slate-200 text-center min-w-[60px] ${density === 'ultra-compact' ? 'py-1 px-1' : density === 'compact' ? 'py-1.5 px-1.5' : 'py-2.5 px-2.5'}`}>ពិនិត្យភ្នែក</th>
                <th className={`border-r border-slate-200 text-center min-w-[55px] ${density === 'ultra-compact' ? 'py-1 px-1' : density === 'compact' ? 'py-1.5 px-1.5' : 'py-2.5 px-2.5'}`}>ប័ណ្ណក្រីក្រ</th>
                <th className={`text-center min-w-[65px] no-print ${density === 'ultra-compact' ? 'py-1 px-1' : density === 'compact' ? 'py-1.5 px-1.5' : 'py-2.5 px-2.5'}`}>សកម្មភាព</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={16} className="text-center py-10 text-slate-400">
                    {t.noResults}
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((student, idx) => {
                  const globalIdx = (currentPage - 1) * effectivePageSize + idx + 1;
                  const isGrade1 = student.grade === 'ថ្នាក់ទី១';
                  const cellPad = density === 'ultra-compact' 
                    ? 'py-0.5 px-1' 
                    : density === 'compact' 
                      ? 'py-1 px-1.5' 
                      : 'py-2 px-2.5';

                  return (
                    <tr 
                      key={student.id} 
                      className={`hover:bg-blue-50/50 transition group ${
                        isGrade1 ? 'bg-indigo-50/15' : 'bg-white'
                      }`}
                    >
                      {/* No. */}
                      <td className={`${cellPad} border-r border-slate-200 text-center font-mono text-slate-500`}>
                        {globalIdx}
                      </td>

                      {/* Student ID */}
                      <td className={`${cellPad} border-r border-slate-200 font-mono font-bold text-slate-900 whitespace-nowrap`}>
                        {student.studentCode}
                      </td>

                      {/* Student Name */}
                      <td className={`${cellPad} border-r border-slate-200 font-bold text-slate-900`}>
                        <div 
                          onClick={() => setSelectedStudentForProfile(student)}
                          className="hover:text-blue-600 cursor-pointer flex items-center gap-1 leading-tight"
                        >
                          <span>{student.name}</span>
                        </div>
                        {student.latinName && (
                          <div className={`text-slate-400 font-mono uppercase leading-none ${density === 'ultra-compact' ? 'text-[8px] mt-0.5' : 'text-[10px]'}`}>
                            {student.latinName}
                          </div>
                        )}
                      </td>

                      {/* Gender */}
                      <td className={`${cellPad} border-r border-slate-200 text-center font-medium`}>
                        <span className={`rounded font-bold leading-tight ${
                          density === 'ultra-compact' ? 'px-1 py-0 text-[8.5px]' : 'px-1.5 py-0.5 text-[10px]'
                        } ${
                          student.gender === 'ស្រី' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {student.gender}
                        </span>
                      </td>

                      {/* DOB */}
                      <td className={`${cellPad} border-r border-slate-200 whitespace-nowrap text-center font-mono text-slate-700`}>
                        {student.dob}
                      </td>

                      {/* Age */}
                      <td className={`${cellPad} border-r border-slate-200 text-center font-bold text-slate-800`}>
                        {student.age}
                      </td>

                      {/* Grade & Section */}
                      <td className={`${cellPad} border-r border-slate-200 whitespace-nowrap`}>
                        <span className={`inline-block font-semibold ${
                          isGrade1 ? 'text-indigo-900' : 'text-emerald-900'
                        }`}>
                          {student.grade}
                        </span>
                        <span className={`ml-1 rounded bg-slate-100 text-slate-700 font-bold ${
                          density === 'ultra-compact' ? 'px-1 py-0 text-[8.5px]' : 'px-1.5 py-0.2 text-[10px]'
                        }`}>
                          {student.section}
                        </span>
                      </td>

                      {/* Place of Birth */}
                      <td className={`${cellPad} border-r border-slate-200 text-slate-600 ${
                        density === 'ultra-compact' ? 'text-[8.5px]' : 'text-[11px]'
                      }`}>
                        ភូមិ {student.pobVillage}, {student.pobCommune}
                      </td>

                      {/* Current Address */}
                      <td className={`${cellPad} border-r border-slate-200 text-slate-700 ${
                        density === 'ultra-compact' ? 'text-[8.5px]' : 'text-[11px]'
                      }`}>
                        <span className="font-semibold text-slate-900">ភូមិ {student.currentVillage}</span>
                        {student.householdCode && (
                          <span className={`text-slate-400 block font-mono ${density === 'ultra-compact' ? 'text-[8px]' : 'text-[10px]'}`}>
                            #{student.householdCode}
                          </span>
                        )}
                      </td>

                      {/* Father */}
                      <td className={`${cellPad} border-r border-slate-200 ${
                        density === 'ultra-compact' ? 'text-[8.5px]' : 'text-[11px]'
                      }`}>
                        <div className="font-medium text-slate-900 leading-tight">{student.fatherName}</div>
                        <div className={`text-slate-500 leading-none ${density === 'ultra-compact' ? 'text-[8px] mt-0.5' : 'text-[10px]'}`}>{student.fatherOccupation}</div>
                      </td>

                      {/* Mother */}
                      <td className={`${cellPad} border-r border-slate-200 ${
                        density === 'ultra-compact' ? 'text-[8.5px]' : 'text-[11px]'
                      }`}>
                        <div className="font-medium text-slate-900 leading-tight">{student.motherName}</div>
                        <div className={`text-slate-500 leading-none ${density === 'ultra-compact' ? 'text-[8px] mt-0.5' : 'text-[10px]'}`}>{student.motherOccupation}</div>
                      </td>

                      {/* Phone */}
                      <td className={`${cellPad} border-r border-slate-200 font-mono whitespace-nowrap text-slate-600 ${
                        density === 'ultra-compact' ? 'text-[8.5px]' : 'text-[11px]'
                      }`}>
                        {student.fatherPhone || student.motherPhone || student.guardianPhone || '—'}
                      </td>

                      {/* Height & Weight */}
                      <td className={`${cellPad} border-r border-slate-200 text-center whitespace-nowrap text-slate-700 ${
                        density === 'ultra-compact' ? 'text-[8.5px]' : 'text-[11px]'
                      }`}>
                        {student.heightCm ? `${student.heightCm}cm` : '—'} / {student.weightKg ? `${student.weightKg}kg` : '—'}
                      </td>

                      {/* Eye Check */}
                      <td className={`${cellPad} border-r border-slate-200 text-center whitespace-nowrap`}>
                        {student.eyeCheck === 'normal' && (
                          <span className={`text-emerald-700 bg-emerald-50 rounded font-semibold border border-emerald-200 ${
                            density === 'ultra-compact' ? 'px-1 py-0 text-[8px]' : 'px-1.5 py-0.5 text-[10px]'
                          }`}>ធម្មតា</span>
                        )}
                        {student.eyeCheck === 'glasses' && (
                          <span className={`text-blue-700 bg-blue-50 rounded font-bold border border-blue-200 ${
                            density === 'ultra-compact' ? 'px-1 py-0 text-[8px]' : 'px-1.5 py-0.5 text-[10px]'
                          }`}>ពាក់វ៉ែនតា</span>
                        )}
                        {student.eyeCheck === 'impaired' && (
                          <span className={`text-rose-700 bg-rose-50 rounded font-bold border border-rose-200 ${
                            density === 'ultra-compact' ? 'px-1 py-0 text-[8px]' : 'px-1.5 py-0.5 text-[10px]'
                          }`}>ខ្សោយ</span>
                        )}
                        {student.eyeCheck === 'untested' && (
                          <span className={`text-slate-400 ${density === 'ultra-compact' ? 'text-[8px]' : 'text-[10px]'}`}>មិនពិនិត្យ</span>
                        )}
                      </td>

                      {/* ID-Poor */}
                      <td className={`${cellPad} border-r border-slate-200 text-center whitespace-nowrap`}>
                        {student.poorCard === 'idpoor1' && (
                          <span className={`text-amber-800 bg-amber-100 rounded font-bold border border-amber-300 ${
                            density === 'ultra-compact' ? 'px-1 py-0 text-[8px]' : 'px-1.5 py-0.5 text-[10px]'
                          }`}>ក្រ១</span>
                        )}
                        {student.poorCard === 'idpoor2' && (
                          <span className={`text-blue-800 bg-blue-100 rounded font-bold border border-blue-300 ${
                            density === 'ultra-compact' ? 'px-1 py-0 text-[8px]' : 'px-1.5 py-0.5 text-[10px]'
                          }`}>ក្រ២</span>
                        )}
                        {student.poorCard === 'vulnerable' && (
                          <span className={`text-purple-800 bg-purple-100 rounded font-bold border border-purple-300 ${
                            density === 'ultra-compact' ? 'px-1 py-0 text-[8px]' : 'px-1.5 py-0.5 text-[10px]'
                          }`}>ងាយរងគ្រោះ</span>
                        )}
                        {student.poorCard === 'none' && (
                          <span className={`text-slate-400 ${density === 'ultra-compact' ? 'text-[8px]' : 'text-[10px]'}`}>គ្មាន</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className={`${cellPad} text-center no-print`}>
                        <div className="flex items-center justify-center gap-0.5">
                          <button
                            onClick={() => setSelectedStudentForProfile(student)}
                            className="p-0.5 rounded text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                            title="មើលសលាកបត្រព័ត៌មានផ្ទាល់ខ្លួន"
                          >
                            <ViewIcon className={density === 'ultra-compact' ? 'w-3 h-3' : 'w-4 h-4'} />
                          </button>

                          <button
                            onClick={() => {
                              setStudentToEdit(student);
                              setIsFormModalOpen(true);
                            }}
                            className="p-0.5 rounded text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition"
                            title="កែប្រែព័ត៌មាន"
                          >
                            <Edit3 className={density === 'ultra-compact' ? 'w-3 h-3' : 'w-4 h-4'} />
                          </button>

                          <button
                            onClick={() => {
                              if (window.confirm(`តើអ្នកពិតជាចង់លុបទិន្នន័យសិស្ស ${student.name} (${student.studentCode}) មែនទេ?`)) {
                                onDeleteStudent(student.id);
                              }
                            }}
                            className="p-0.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="លុបចេញ"
                          >
                            <Trash2 className={density === 'ultra-compact' ? 'w-3 h-3' : 'w-4 h-4'} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Summary */}
        <div className="p-2.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-slate-600 no-print">
          <div className="text-[11px]">
            {language === 'km' ? 'បង្ហាញ' : 'Showing'} <strong>{paginatedStudents.length}</strong> {language === 'km' ? 'នៃសិស្សសរុប' : 'of'} <strong>{filteredStudents.length}</strong> {language === 'km' ? 'នាក់' : 'students'}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              disabled={currentPage <= 1 || pageSize === 'all'}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="px-2 py-0.5 rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-30 transition font-medium text-[11px]"
            >
              {language === 'km' ? 'ថយក្រោយ' : 'Prev'}
            </button>
            <span className="px-2 text-slate-700 font-bold text-[11px]">
              {currentPage} / {totalPages}
            </span>
            <button
              disabled={currentPage >= totalPages || pageSize === 'all'}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="px-2 py-0.5 rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-30 transition font-medium text-[11px]"
            >
              {language === 'km' ? 'បន្ទាប់' : 'Next'}
            </button>
          </div>
        </div>
      </div>

      {/* Official Signatures Section for Official MoEYS Printouts */}
      <div className="mt-8 pt-6 border-t border-slate-300">
        <OfficialSignatureSection
          language={language}
          defaultLocation="រោគ"
          reportType="school"
          defaultSignatories={{
            centerTitle: 'អ្នកទទួលបន្ទុកស្ថិតិ / គ្រូបន្ទុកថ្នាក់',
            rightTitle: 'នាយកសាលាបឋមសិក្សារោគ'
          }}
        />
      </div>

      {/* Student Profile Modal */}
      {selectedStudentForProfile && (
        <StudentProfileModal
          student={selectedStudentForProfile}
          language={language}
          onClose={() => setSelectedStudentForProfile(null)}
          onEdit={(student) => {
            setSelectedStudentForProfile(null);
            setStudentToEdit(student);
            setIsFormModalOpen(true);
          }}
        />
      )}

      {/* Add / Edit Student Modal */}
      {isFormModalOpen && (
        <StudentFormModal
          isOpen={isFormModalOpen}
          studentToEdit={studentToEdit}
          language={language}
          onClose={() => {
            setIsFormModalOpen(false);
            setStudentToEdit(null);
          }}
          onSave={onSaveStudent}
        />
      )}

      {/* Import from Census Modal */}
      {isImportModalOpen && (
        <StudentImportModal
          isOpen={isImportModalOpen}
          citizens={citizens}
          households={households}
          existingStudents={students}
          language={language}
          onClose={() => setIsImportModalOpen(false)}
          onImportStudents={onImportStudents}
        />
      )}
    </div>
  );
};
