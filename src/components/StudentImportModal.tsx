import React, { useState, useMemo } from 'react';
import { X, UserPlus, CheckCircle2, Search, Filter, Baby, GraduationCap, MapPin, Sparkles } from 'lucide-react';
import { Citizen, Household, Language } from '../types/census';
import { StudentRecord, StudentGrade } from '../types/student';
import { createStudentFromCitizen } from '../utils/studentData';
import { parseDateOfBirth, calculateAgeInMonths } from '../utils/enrollmentUtils';

interface StudentImportModalProps {
  isOpen: boolean;
  citizens: Citizen[];
  households: Household[];
  existingStudents: StudentRecord[];
  language: Language;
  onClose: () => void;
  onImportStudents: (newStudents: StudentRecord[]) => void;
}

export const StudentImportModal: React.FC<StudentImportModalProps> = ({
  isOpen,
  citizens,
  households,
  existingStudents,
  language,
  onClose,
  onImportStudents
}) => {
  const [filterCohort, setFilterCohort] = useState<'all' | 'group1' | 'group2'>('all');
  const [villageFilter, setVillageFilter] = useState<'all' | string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCitizenIds, setSelectedCitizenIds] = useState<Set<number>>(new Set());

  // Existing student IDs / names mapped for fast lookup
  const enrolledCitizenIds = useMemo(() => {
    return new Set(existingStudents.map(s => s.citizenId).filter(Boolean));
  }, [existingStudents]);

  const existingNames = useMemo(() => {
    return new Set(existingStudents.map(s => s.name.trim()));
  }, [existingStudents]);

  // Find candidate children from census (age <= 12)
  const candidateChildren = useMemo(() => {
    return citizens.filter(c => {
      // Must be a child under 12
      if (c.age > 12) return false;
      const months = calculateAgeInMonths(c.dob, c.age);

      // Group 1: 3-5 years (36-69 mos)
      const isG1 = months >= 36 && months < 70;
      // Group 2: 70-82 months
      const isG2 = months >= 70 && months <= 82;

      if (filterCohort === 'group1' && !isG1) return false;
      if (filterCohort === 'group2' && !isG2) return false;

      // Village filter
      if (villageFilter !== 'all' && (c.village || 'រោគ') !== villageFilter) return false;

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchesName = c.name.toLowerCase().includes(q);
        const matchesHh = String(c.householdCode || c.householdId).toLowerCase().includes(q);
        const matchesDob = c.dob.toLowerCase().includes(q);
        if (!matchesName && !matchesHh && !matchesDob) return false;
      }

      return true;
    });
  }, [citizens, filterCohort, villageFilter, searchTerm]);

  const toggleSelect = (id: number) => {
    setSelectedCitizenIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllUnenrolled = () => {
    const unenrolledIds = candidateChildren
      .filter(c => !enrolledCitizenIds.has(c.id) && !existingNames.has(c.name.trim()))
      .map(c => c.id);
    setSelectedCitizenIds(new Set(unenrolledIds));
  };

  const handleClearSelection = () => {
    setSelectedCitizenIds(new Set());
  };

  const handleExecuteImport = () => {
    if (selectedCitizenIds.size === 0) return;

    const toImportCitizens = citizens.filter(c => selectedCitizenIds.has(c.id));
    const newStudents: StudentRecord[] = toImportCitizens.map(c => {
      const months = calculateAgeInMonths(c.dob, c.age);
      const isGrade1 = months >= 70 && months <= 82;
      const grade: StudentGrade = isGrade1
        ? 'ថ្នាក់ទី១'
        : (months >= 60 ? 'មត្តេយ្យកម្រិតខ្ពស់' : (months >= 48 ? 'មត្តេយ្យកម្រិតមធ្យម' : 'មត្តេយ្យកម្រិតទាប'));

      return createStudentFromCitizen(c, households, grade, 'ក');
    });

    onImportStudents(newStudents);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col font-khmer">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-700 to-teal-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">
                {language === 'km' ? 'នាំចូលកុមារពីជំរឿនប្រជាជន ២០២៦ ទៅក្នុងតារាងសិស្ស' : 'Import Children from 2026 Census to Student Info'}
              </h3>
              <p className="text-xs text-emerald-100">
                {language === 'km' 
                  ? 'ស្វែងរក និងចុះឈ្មោះកុមារក្នុងតំបន់សេវា ប.សរោគ ចូលក្នុងប្រព័ន្ធព័ត៌មានសិស្សដោយស្វ័យប្រវត្តិ' 
                  : 'Quickly enroll eligible catchment children directly into MoEYS student table'}
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

        {/* Filter Controls */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap gap-2 items-center justify-between text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ស្វែងរកឈ្មោះ, ខ្នងផ្ទះ..."
                className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 w-44"
              />
            </div>

            <select
              value={filterCohort}
              onChange={(e) => setFilterCohort(e.target.value as 'all' | 'group1' | 'group2')}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium"
            >
              <option value="all">គ្រប់កម្រិតអាយុ (០-១២ ឆ្នាំ)</option>
              <option value="group1">ក្រុម១៖ មត្តេយ្យ (៣-៥ ឆ្នាំ)</option>
              <option value="group2">ក្រុម២៖ ថ្នាក់ទី១ (៧០-៨២ ខែ)</option>
            </select>

            <select
              value={villageFilter}
              onChange={(e) => setVillageFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium"
            >
              <option value="all">ភូមិទាំងអស់</option>
              <option value="រោគ">ភូមិរោគ</option>
              <option value="មុខឈ្នាង">ភូមិមុខឈ្នាង</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectAllUnenrolled}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold border border-emerald-300 transition"
            >
              ជ្រើសរើសទាំងអស់ដែលមិនទាន់ចុះ ({candidateChildren.filter(c => !enrolledCitizenIds.has(c.id) && !existingNames.has(c.name.trim())).length})
            </button>
            {selectedCitizenIds.size > 0 && (
              <button
                onClick={handleClearSelection}
                className="px-2.5 py-1.5 rounded-lg text-slate-600 hover:bg-slate-200 transition"
              >
                លុបការជ្រើស ({selectedCitizenIds.size})
              </button>
            )}
          </div>
        </div>

        {/* Candidate Children List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {candidateChildren.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              ពុំមានកុមារត្រូវគ្នានឹងការស្វែងរកនេះទេ
            </div>
          ) : (
            candidateChildren.map(c => {
              const isAlreadyStudent = enrolledCitizenIds.has(c.id) || existingNames.has(c.name.trim());
              const isSelected = selectedCitizenIds.has(c.id);
              const months = calculateAgeInMonths(c.dob, c.age);

              return (
                <div
                  key={c.id}
                  onClick={() => !isAlreadyStudent && toggleSelect(c.id)}
                  className={`p-3 rounded-xl border transition flex items-center justify-between text-xs ${
                    isAlreadyStudent
                      ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                      : isSelected
                        ? 'bg-emerald-50/70 border-emerald-400 shadow-xs cursor-pointer'
                        : 'bg-white hover:bg-slate-50 border-slate-200 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      disabled={isAlreadyStudent}
                      checked={isSelected || isAlreadyStudent}
                      onChange={() => !isAlreadyStudent && toggleSelect(c.id)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{c.name}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                          c.gender === 'ស្រី' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {c.gender}
                        </span>
                        <span className="text-slate-500 text-[11px]">
                          អាយុ៖ <strong>{c.age} ឆ្នាំ</strong> ({months} ខែ)
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                        <span>ថ្ងៃខែឆ្នាំកំណើត៖ <strong className="text-slate-700">{c.dob}</strong></span>
                        <span>•</span>
                        <span>ភូមិ៖ <strong className="text-slate-700">{c.village || 'រោគ'}</strong></span>
                        <span>•</span>
                        <span>ខ្នងផ្ទះ៖ <strong className="text-slate-700">#{c.householdCode || c.householdId}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div>
                    {isAlreadyStudent ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-200 text-slate-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        មានក្នុងតារាងរួចហើយ
                      </span>
                    ) : (
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                        isSelected 
                          ? 'bg-emerald-600 text-white' 
                          : 'bg-slate-100 hover:bg-emerald-50 text-slate-700 border border-slate-300'
                      }`}>
                        <UserPlus className="w-3.5 h-3.5" />
                        {isSelected ? 'បានជ្រើសរើស' : 'ជ្រើសរើស'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="text-slate-600 font-medium">
            បានជ្រើសរើស៖ <strong className="text-emerald-700">{selectedCitizenIds.size} នាក់</strong> សម្រាប់បញ្ចូលទៅក្នុងតារាងព័ត៌មានសិស្ស
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200 font-semibold transition"
            >
              បោះបង់
            </button>

            <button
              disabled={selectedCitizenIds.size === 0}
              onClick={handleExecuteImport}
              className={`inline-flex items-center gap-1.5 px-5 py-2 rounded-xl font-bold transition shadow-xs ${
                selectedCitizenIds.size > 0
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>នាំចូល ({selectedCitizenIds.size} នាក់)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
