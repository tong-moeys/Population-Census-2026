import React, { useState, useMemo, useEffect } from 'react';
import { X, UserPlus, CheckCircle2, Search, Sparkles, Calendar, ArrowUpDown } from 'lucide-react';
import { Citizen, Household, Language } from '../types/census';
import { StudentRecord, StudentGrade } from '../types/student';
import { createStudentFromCitizen, getDefaultGradeForCitizen } from '../utils/studentData';
import { calculateAgeInMonths } from '../utils/enrollmentUtils';
import { classifyCitizenVillage, isActiveStudent } from '../utils/comparisonData';

export type ImportAgeFilter =
  | 'all'
  | '0-2'
  | '3'
  | '4'
  | '5'
  | 'group1'
  | 'group2'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | '11'
  | '12+';

interface StudentImportModalProps {
  isOpen: boolean;
  citizens: Citizen[];
  households: Household[];
  existingStudents: StudentRecord[];
  language: Language;
  initialAgeFilter?: string;
  initialVillageFilter?: string;
  onClose: () => void;
  onImportStudents: (newStudents: StudentRecord[]) => void;
}

const VALID_AGE_FILTERS = new Set<string>([
  'all', '0-2', '3', '4', '5', 'group1', 'group2', '6', '7', '8', '9', '10', '11', '12+'
]);

export const StudentImportModal: React.FC<StudentImportModalProps> = ({
  isOpen,
  citizens,
  households,
  existingStudents,
  language,
  initialAgeFilter,
  initialVillageFilter,
  onClose,
  onImportStudents
}) => {
  const [ageFilter, setAgeFilter] = useState<ImportAgeFilter>('all');
  const [villageFilter, setVillageFilter] = useState<'all' | string>('all');
  const [genderFilter, setGenderFilter] = useState<'all' | 'ប្រុស' | 'ស្រី'>('all');
  const [enrollmentFilter, setEnrollmentFilter] = useState<'unenrolled' | 'all' | 'enrolled'>('unenrolled');
  const [sortBy, setSortBy] = useState<'age_asc' | 'age_desc' | 'name' | 'household' | 'village'>('age_asc');
  const [targetGrade, setTargetGrade] = useState<'auto' | StudentGrade>('auto');
  const [targetSection, setTargetSection] = useState<string>('ក');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCitizenIds, setSelectedCitizenIds] = useState<Set<number>>(new Set());

  // Sync incoming filter when opened from StudentInformationView
  useEffect(() => {
    if (!isOpen) return;
    if (initialAgeFilter && VALID_AGE_FILTERS.has(initialAgeFilter)) {
      setAgeFilter(initialAgeFilter as ImportAgeFilter);
    } else {
      setAgeFilter('all');
    }
    if (initialVillageFilter && (initialVillageFilter === 'រោគ' || initialVillageFilter === 'មុខឈ្នាង')) {
      setVillageFilter(initialVillageFilter);
    } else {
      setVillageFilter('all');
    }
    setSelectedCitizenIds(new Set());
  }, [isOpen, initialAgeFilter, initialVillageFilter]);

  // Existing active student IDs / names mapped for fast lookup
  const enrolledCitizenIds = useMemo(() => {
    return new Set(
      existingStudents
        .filter(isActiveStudent)
        .map(s => s.citizenId)
        .filter((id): id is number => typeof id === 'number')
    );
  }, [existingStudents]);

  const existingNames = useMemo(() => {
    return new Set(existingStudents.filter(isActiveStudent).map(s => s.name.trim()));
  }, [existingStudents]);

  const isAlreadyStudent = (c: Citizen) =>
    enrolledCitizenIds.has(c.id) || existingNames.has(c.name.trim());

  const matchesAgeBucket = (c: Citizen, bucket: ImportAgeFilter): boolean => {
    if (bucket === 'all') return true;
    if (bucket === '0-2') return c.age >= 0 && c.age <= 2;
    if (bucket === '12+') return c.age >= 12 && c.age <= 18;
    const months = calculateAgeInMonths(c.dob, c.age);
    if (bucket === 'group1') return months >= 36 && months < 70;
    if (bucket === 'group2') return months >= 70 && months <= 82;
    const num = parseInt(bucket, 10);
    return !isNaN(num) && c.age === num;
  };

  // Base children up to age 18 (within village & gender context) for quick age count pills
  const contextChildren = useMemo(() => {
    return citizens.filter(c => {
      if (c.age < 0 || c.age > 18) return false;
      if (villageFilter !== 'all') {
        const vCat = classifyCitizenVillage(c);
        if (villageFilter === 'រោគ' && vCat !== 'roak') return false;
        if (villageFilter === 'មុខឈ្នាង' && vCat !== 'mukh_chhnang') return false;
      }
      if (genderFilter !== 'all' && c.gender !== genderFilter) return false;
      return true;
    });
  }, [citizens, villageFilter, genderFilter]);

  // Exact age pills with unenrolled + total counts
  const agePillCounts = useMemo(() => {
    const keys: { key: ImportAgeFilter; label: string }[] = [
      { key: '3', label: '៣ ឆ្នាំ' },
      { key: '4', label: '៤ ឆ្នាំ' },
      { key: '5', label: '៥ ឆ្នាំ' },
      { key: 'group2', label: 'ក្រុម២' },
      { key: '6', label: '៦ ឆ្នាំ' },
      { key: '7', label: '៧ ឆ្នាំ' },
      { key: '8', label: '៨ ឆ្នាំ' },
      { key: '9', label: '៩ ឆ្នាំ' },
      { key: '10', label: '១០ ឆ្នាំ' },
      { key: '11', label: '១១ ឆ្នាំ' },
      { key: '12+', label: '១២+ ឆ្នាំ' }
    ];
    return keys.map(k => {
      const matched = contextChildren.filter(c => matchesAgeBucket(c, k.key));
      const unenrolled = matched.filter(c => !isAlreadyStudent(c)).length;
      return {
        ...k,
        total: matched.length,
        unenrolled
      };
    });
  }, [contextChildren, enrolledCitizenIds, existingNames]);

  // Filtered and sorted candidate children
  const candidateChildren = useMemo(() => {
    return contextChildren
      .filter(c => {
        if (!matchesAgeBucket(c, ageFilter)) return false;

        const already = isAlreadyStudent(c);
        if (enrollmentFilter === 'unenrolled' && already) return false;
        if (enrollmentFilter === 'enrolled' && !already) return false;

        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase().trim();
          const matchesName = c.name.toLowerCase().includes(q);
          const matchesHh = String(c.householdCode || c.householdId).toLowerCase().includes(q);
          const matchesDob = c.dob.toLowerCase().includes(q);
          if (!matchesName && !matchesHh && !matchesDob) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'age_asc') {
          if (a.age !== b.age) return a.age - b.age;
          return a.name.localeCompare(b.name, 'km');
        }
        if (sortBy === 'age_desc') {
          if (a.age !== b.age) return b.age - a.age;
          return a.name.localeCompare(b.name, 'km');
        }
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name, 'km');
        }
        if (sortBy === 'household') {
          return String(a.householdCode || a.householdId).localeCompare(
            String(b.householdCode || b.householdId),
            undefined,
            { numeric: true, sensitivity: 'base' }
          );
        }
        if (sortBy === 'village') {
          const vDiff = (a.village || 'រោគ').localeCompare(b.village || 'រោគ', 'km');
          return vDiff !== 0 ? vDiff : a.age - b.age;
        }
        return 0;
      });
  }, [contextChildren, ageFilter, enrollmentFilter, searchTerm, sortBy, enrolledCitizenIds, existingNames]);

  const toggleSelect = (id: number) => {
    setSelectedCitizenIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const unenrolledInView = useMemo(
    () => candidateChildren.filter(c => !isAlreadyStudent(c)),
    [candidateChildren, enrolledCitizenIds, existingNames]
  );

  const handleSelectAllFiltered = () => {
    const ids = unenrolledInView.map(c => c.id);
    setSelectedCitizenIds(prev => {
      const next = new Set(prev);
      for (const id of ids) next.add(id);
      return next;
    });
  };

  const handleClearSelection = () => {
    setSelectedCitizenIds(new Set());
  };

  const handleExecuteImport = () => {
    if (selectedCitizenIds.size === 0) return;

    const toImportCitizens = citizens.filter(c => selectedCitizenIds.has(c.id));
    const newStudents: StudentRecord[] = toImportCitizens.map(c => {
      const grade: StudentGrade = targetGrade === 'auto'
        ? getDefaultGradeForCitizen(c)
        : targetGrade;
      return createStudentFromCitizen(c, households, grade, targetSection);
    });

    onImportStudents(newStudents);
    setSelectedCitizenIds(new Set());
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col font-khmer">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-700 to-teal-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">
                {language === 'km'
                  ? 'ផ្ទៀងផ្ទាត់តាមអាយុ និង Tick បញ្ជូនកុមារជំរឿនចូលរៀន'
                  : 'Verify by Age & Tick Census Children to Enroll'}
              </h3>
              <p className="text-xs text-emerald-100">
                {language === 'km'
                  ? 'ចម្រោះតាមអាយុ (៣–១២+ ឆ្នាំ) ផ្ទៀងផ្ទាត់ជាក់ស្ដែង Tick ជ្រើសរើស ហើយបញ្ជូនចូលរៀនដើម្បីឱ្យប្រព័ន្ធគណនាតារាងឡើងវិញ'
                  : 'Filter exact age (3-12+ yrs), verify & tick children, and enroll to auto-recalculate all comparison tables'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Controls */}
        <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 space-y-2.5 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative flex-1 min-w-[160px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ស្វែងរកឈ្មោះ, ខ្នងផ្ទះ, ថ្ងៃកំណើត..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Exact Age Select Dropdown */}
            <select
              value={ageFilter}
              onChange={(e) => setAgeFilter(e.target.value as ImportAgeFilter)}
              className="px-2.5 py-1.5 rounded-lg border border-indigo-300 bg-indigo-50 text-indigo-950 font-bold"
            >
              <option value="all">គ្រប់អាយុ (០-១៨ ឆ្នាំ)</option>
              <option value="0-2">អាយុ ០-២ ឆ្នាំ</option>
              <option value="3">អាយុ ៣ ឆ្នាំ (មត្តេយ្យទាប)</option>
              <option value="4">អាយុ ៤ ឆ្នាំ (មត្តេយ្យមធ្យម)</option>
              <option value="5">អាយុ ៥ ឆ្នាំ (មត្តេយ្យខ្ពស់)</option>
              <option value="group1">ក្រុម១៖ មត្តេយ្យ (៣-៥ ឆ្នាំ)</option>
              <option value="group2">ក្រុម២៖ ថ្នាក់ទី១ (៧០-៨២ ខែ)</option>
              <option value="6">អាយុ ៦ ឆ្នាំ (ថ្នាក់ទី១)</option>
              <option value="7">អាយុ ៧ ឆ្នាំ (ថ្នាក់ទី២)</option>
              <option value="8">អាយុ ៨ ឆ្នាំ (ថ្នាក់ទី៣)</option>
              <option value="9">អាយុ ៩ ឆ្នាំ (ថ្នាក់ទី៤)</option>
              <option value="10">អាយុ ១០ ឆ្នាំ (ថ្នាក់ទី៥)</option>
              <option value="11">អាយុ ១១ ឆ្នាំ (ថ្នាក់ទី៦)</option>
              <option value="12+">អាយុ ១២+ ឆ្នាំ (១២-១៨)</option>
            </select>

            {/* Village Filter */}
            <select
              value={villageFilter}
              onChange={(e) => setVillageFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium"
            >
              <option value="all">ភូមិទាំងអស់</option>
              <option value="រោគ">ភូមិរោគ</option>
              <option value="មុខឈ្នាង">ភូមិមុខឈ្នាង</option>
            </select>

            {/* Gender Filter */}
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value as 'all' | 'ប្រុស' | 'ស្រី')}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium"
            >
              <option value="all">ភេទទាំងអស់</option>
              <option value="ប្រុស">ប្រុស</option>
              <option value="ស្រី">ស្រី</option>
            </select>

            {/* Enrollment Filter */}
            <select
              value={enrollmentFilter}
              onChange={(e) => setEnrollmentFilter(e.target.value as 'unenrolled' | 'all' | 'enrolled')}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium"
            >
              <option value="unenrolled">មិនទាន់ចុះឈ្មោះ</option>
              <option value="all">បង្ហាញទាំងអស់</option>
              <option value="enrolled">មានក្នុងបញ្ជីរួច</option>
            </select>

            {/* Sort */}
            <div className="inline-flex items-center gap-1 bg-white border border-slate-300 rounded-lg px-2 py-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'age_asc' | 'age_desc' | 'name' | 'household' | 'village')}
                className="bg-transparent font-medium outline-none"
              >
                <option value="age_asc">តម្រៀប៖ អាយុ (តិច → ច្រើន)</option>
                <option value="age_desc">តម្រៀប៖ អាយុ (ច្រើន → តិច)</option>
                <option value="name">តម្រៀប៖ ឈ្មោះ (ក-អ)</option>
                <option value="household">តម្រៀប៖ ខ្នងផ្ទះ</option>
                <option value="village">តម្រៀប៖ ភូមិ</option>
              </select>
            </div>
          </div>

          {/* Exact Age Quick Filter Pills (3 -> 12+) */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-slate-200/80">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 mr-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>រើសអាយុ៖</span>
            </span>
            <button
              type="button"
              onClick={() => setAgeFilter('all')}
              className={`px-2 py-0.5 rounded-md text-[11px] font-bold border transition ${
                ageFilter === 'all'
                  ? 'bg-slate-800 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              ទាំងអស់
            </button>
            {agePillCounts.map(pill => {
              const isActive = ageFilter === pill.key;
              return (
                <button
                  key={pill.key}
                  type="button"
                  onClick={() => setAgeFilter(isActive ? 'all' : pill.key)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-bold border transition flex items-center gap-1 ${
                    isActive
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                      : 'bg-white text-slate-800 border-slate-300 hover:bg-emerald-50'
                  }`}
                >
                  <span>{pill.label}</span>
                  <span className={`px-1 rounded text-[10px] font-black ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : pill.unenrolled > 0
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-slate-100 text-slate-500'
                  }`}>
                    {pill.unenrolled}/{pill.total}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Selection Actions */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-slate-200/80">
            <div className="text-[11px] text-slate-600 font-medium">
              បង្ហាញ៖ <strong className="text-slate-900">{candidateChildren.length} នាក់</strong>{' '}
              (មិនទាន់ចុះឈ្មោះក្នុងតម្រង៖ <strong className="text-amber-700">{unenrolledInView.length} នាក់</strong>)
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAllFiltered}
                disabled={unenrolledInView.length === 0}
                className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold border border-emerald-300 transition disabled:opacity-40"
              >
                Tick ទាំងអស់ក្នុងតម្រង ({unenrolledInView.length})
              </button>
              {selectedCitizenIds.size > 0 && (
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="px-2.5 py-1 rounded-lg text-slate-600 hover:bg-slate-200 font-semibold transition"
                >
                  លុបការ Tick ({selectedCitizenIds.size})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Candidate Children List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-1.5">
          {candidateChildren.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              ពុំមានកុមារត្រូវគ្នានឹងតម្រងអាយុ ឬការស្វែងរកនេះទេ
            </div>
          ) : (
            candidateChildren.map((c, idx) => {
              const already = isAlreadyStudent(c);
              const isSelected = selectedCitizenIds.has(c.id);
              const months = calculateAgeInMonths(c.dob, c.age);
              const previewGrade = targetGrade === 'auto' ? getDefaultGradeForCitizen(c) : targetGrade;

              return (
                <div
                  key={c.id}
                  onClick={() => !already && toggleSelect(c.id)}
                  className={`p-2.5 sm:p-3 rounded-xl border transition flex items-center justify-between gap-2 text-xs ${
                    already
                      ? 'bg-slate-50 border-slate-200 opacity-65 cursor-not-allowed'
                      : isSelected
                        ? 'bg-emerald-50/80 border-emerald-500 shadow-xs cursor-pointer'
                        : 'bg-white hover:bg-slate-50 border-slate-200 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      disabled={already}
                      checked={isSelected || already}
                      onChange={() => {}}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />

                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-mono text-slate-400">#{idx + 1}</span>
                        <span className="font-bold text-slate-900 text-sm">{c.name}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                          c.gender === 'ស្រី' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {c.gender}
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-800 font-bold text-[11px]">
                          អាយុ {c.age} ឆ្នាំ ({months} ខែ)
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                        <span>ថ្ងៃកំណើត៖ <strong className="text-slate-700">{c.dob || '—'}</strong></span>
                        <span>•</span>
                        <span>ភូមិ៖ <strong className="text-slate-700">{c.village || 'រោគ'}</strong></span>
                        <span>•</span>
                        <span>ខ្នងផ្ទះ៖ <strong className="text-slate-700">#{c.householdCode || c.householdId}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!already && (
                      <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                        {previewGrade} ({targetSection})
                      </span>
                    )}
                    {already ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-200 text-slate-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        មានក្នុងបញ្ជីរួច
                      </span>
                    ) : (
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                        isSelected
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 hover:bg-emerald-50 text-slate-700 border border-slate-300'
                      }`}>
                        <UserPlus className="w-3.5 h-3.5" />
                        {isSelected ? 'បាន Tick' : 'Tick រើស'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer with Target Grade/Section + Batch Enroll CTA */}
        <div className="p-3 sm:p-4 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-700">កំណត់ថ្នាក់ចូលរៀន៖</span>
            <select
              value={targetGrade}
              onChange={(e) => setTargetGrade(e.target.value as 'auto' | StudentGrade)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-800"
            >
              <option value="auto">ស្វ័យប្រវត្តិតាមអាយុ (ណែនាំ)</option>
              <option value="មត្តេយ្យកម្រិតទាប">មត្តេយ្យកម្រិតទាប</option>
              <option value="មត្តេយ្យកម្រិតមធ្យម">មត្តេយ្យកម្រិតមធ្យម</option>
              <option value="មត្តេយ្យចម្រុះ">មត្តេយ្យចម្រុះ</option>
              <option value="មត្តេយ្យកម្រិតខ្ពស់">មត្តេយ្យកម្រិតខ្ពស់</option>
              <option value="ថ្នាក់ទី១">ថ្នាក់ទី១</option>
              <option value="ថ្នាក់ទី២">ថ្នាក់ទី២</option>
              <option value="ថ្នាក់ទី៣">ថ្នាក់ទី៣</option>
              <option value="ថ្នាក់ទី៤">ថ្នាក់ទី៤</option>
              <option value="ថ្នាក់ទី៥">ថ្នាក់ទី៥</option>
              <option value="ថ្នាក់ទី៦">ថ្នាក់ទី៦</option>
            </select>
            <select
              value={targetSection}
              onChange={(e) => setTargetSection(e.target.value)}
              className="px-2 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-800"
            >
              <option value="ក">បន្ទប់ ក</option>
              <option value="ខ">បន្ទប់ ខ</option>
              <option value="គ">បន្ទប់ គ</option>
            </select>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200 font-semibold transition"
            >
              បោះបង់
            </button>

            <button
              type="button"
              disabled={selectedCitizenIds.size === 0}
              onClick={handleExecuteImport}
              className={`inline-flex items-center gap-1.5 px-5 py-2 rounded-xl font-bold transition shadow-xs ${
                selectedCitizenIds.size > 0
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>បញ្ជូនទៅចូលរៀន ({selectedCitizenIds.size} នាក់)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
