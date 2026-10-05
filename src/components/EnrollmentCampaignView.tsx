import React, { useState, useMemo } from 'react';
import { 
  Baby, 
  GraduationCap, 
  School, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Home, 
  Search, 
  Download, 
  Printer, 
  Users, 
  MapPin, 
  Building2, 
  Filter, 
  PhoneCall,
  Sparkles,
  ArrowUpDown,
  ChevronRight,
  Eye,
  Calendar,
  Info
} from 'lucide-react';
import { Citizen, Household, Language, EnrollmentChild, EnrollmentStatus } from '../types/census';
import { getEnrollmentChildren } from '../utils/enrollmentUtils';
import { translations, translateGender } from '../utils/translations';
import { OfficialSignatureSection } from './OfficialSignatureSection';
import { OfficialReportHeader } from './OfficialReportHeader';

interface EnrollmentCampaignViewProps {
  citizens: Citizen[];
  households: Household[];
  language: Language;
  onUpdateCitizenStatus: (citizenId: number, status: EnrollmentStatus) => void;
  onSelectCitizen: (citizen: Citizen) => void;
}

export const EnrollmentCampaignView: React.FC<EnrollmentCampaignViewProps> = ({
  citizens,
  households,
  language,
  onUpdateCitizenStatus,
  onSelectCitizen
}) => {
  const t = translations[language];

  // Tab: 'all' | 'group1' (3-5 years) | 'group2' (70-82 months)
  const [activeTab, setActiveTab] = useState<'all' | 'group1' | 'group2'>('group2');
  
  // Filters (Default to 'not_enrolled' so missing students from the roster are shown immediately)
  const [searchTerm, setSearchTerm] = useState('');
  const [villageFilter, setVillageFilter] = useState<'all' | string>('all');
  const [genderFilter, setGenderFilter] = useState<'all' | string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | EnrollmentStatus>('not_enrolled');
  const [highlightPending, setHighlightPending] = useState(true);
  const [sortField, setSortField] = useState<'months' | 'name' | 'village' | 'household'>('months');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Compute children dataset
  const { allChildren, group1Children, group2Children, stats } = useMemo(() => {
    return getEnrollmentChildren(citizens, households);
  }, [citizens, households]);

  // Current list based on group tab
  const baseList = useMemo(() => {
    if (activeTab === 'group1') return group1Children;
    if (activeTab === 'group2') return group2Children;
    return allChildren;
  }, [activeTab, group1Children, group2Children, allChildren]);

  // Apply search & filters
  const filteredChildren = useMemo(() => {
    return baseList.filter(child => {
      // Village filter
      if (villageFilter !== 'all' && (child.citizen.village || 'រោគ') !== villageFilter) {
        return false;
      }

      // Gender filter
      if (genderFilter !== 'all' && child.citizen.gender !== genderFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all' && child.enrollmentStatus !== statusFilter) {
        return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchesName = child.citizen.name.toLowerCase().includes(query);
        const matchesParent = (child.parentName || '').toLowerCase().includes(query);
        const matchesHId = String(child.citizen.householdCode || child.citizen.householdId).toLowerCase().includes(query);
        const matchesDob = child.citizen.dob.toLowerCase().includes(query);
        const matchesVillage = (child.citizen.village || '').toLowerCase().includes(query);
        if (!matchesName && !matchesParent && !matchesHId && !matchesDob && !matchesVillage) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortField === 'months') {
        return sortOrder === 'asc' ? a.ageInMonths - b.ageInMonths : b.ageInMonths - a.ageInMonths;
      }
      if (sortField === 'name') {
        return sortOrder === 'asc' 
          ? a.citizen.name.localeCompare(b.citizen.name) 
          : b.citizen.name.localeCompare(a.citizen.name);
      }
      if (sortField === 'household') {
        const hA = String(a.citizen.householdCode || a.citizen.householdId);
        const hB = String(b.citizen.householdCode || b.citizen.householdId);
        return sortOrder === 'asc' 
          ? hA.localeCompare(hB, undefined, { numeric: true, sensitivity: 'base' })
          : hB.localeCompare(hA, undefined, { numeric: true, sensitivity: 'base' });
      }
      if (sortField === 'village') {
        const vA = a.citizen.village || 'រោគ';
        const vB = b.citizen.village || 'រោគ';
        return sortOrder === 'asc' ? vA.localeCompare(vB) : vB.localeCompare(vA);
      }
      return 0;
    });
  }, [baseList, villageFilter, genderFilter, statusFilter, searchTerm, sortField, sortOrder]);

  const handleSort = (field: 'months' | 'name' | 'village' | 'household') => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Pending children in current filtered view
  const pendingInFiltered = useMemo(() => {
    return filteredChildren.filter(c => c.enrollmentStatus === 'not_enrolled' || !c.enrollmentStatus);
  }, [filteredChildren]);

  // Batch action: Mark all pending in filtered view as contacted
  const handleBatchMarkContacted = () => {
    for (const child of pendingInFiltered) {
      onUpdateCitizenStatus(child.citizen.id, 'contacted');
    }
  };

  // Cycle status on click
  const cycleStatus = (citizenId: number, currentStatus: EnrollmentStatus) => {
    const nextMap: Record<EnrollmentStatus, EnrollmentStatus> = {
      'not_enrolled': 'enrolled',
      'enrolled': 'contacted',
      'contacted': 'moved',
      'moved': 'not_enrolled'
    };
    const next = nextMap[currentStatus] || 'enrolled';
    onUpdateCitizenStatus(citizenId, next);
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'ID',
      'Child Name',
      'Gender',
      'DOB',
      'Age (Months)',
      'Age (Years)',
      'Group',
      'Village',
      'Household #',
      'Parents / Guardian',
      'Target School',
      'Enrollment Status'
    ];

    const rows = filteredChildren.map((c, idx) => [
      idx + 1,
      `"${c.citizen.name}"`,
      `"${c.citizen.gender}"`,
      `"${c.citizen.dob}"`,
      c.ageInMonths,
      c.ageInYears,
      `"${c.group === 'group1' ? 'ក្រុម១ (៣-៥ឆ្នាំ)' : c.group === 'group2' ? 'ក្រុម២ (៧០-៨២ខែ)' : 'ទាំងពីរ'}"`,
      `"${c.citizen.village || 'រោគ'}"`,
      c.citizen.householdId,
      `"${c.parentName || ''}"`,
      `"${c.targetSchool}"`,
      `"${c.enrollmentStatus === 'enrolled' ? 'បានចុះឈ្មោះ' : c.enrollmentStatus === 'contacted' ? 'បានចុះជួប' : c.enrollmentStatus === 'moved' ? 'ផ្លាស់ទីលំនៅ' : 'មិនទាន់ចុះឈ្មោះ'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `student-enrollment-${activeTab}-moeys-2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Official MoEYS Administrative Header */}
      <OfficialReportHeader
        title={activeTab === 'group1' 
          ? 'បញ្ជីរាយនាមកុមារត្រូវប្រមូលចូលរៀន ក្រុមទី១៖ អាយុ ៣ ដល់ ៥ ឆ្នាំ (មត្តេយ្យសិក្សា)'
          : activeTab === 'group2'
            ? 'បញ្ជីរាយនាមកុមារត្រូវប្រមូលចូលរៀន ក្រុមទី២៖ អាយុ ៧០ ដល់ ៨២ ខែ (ចូលរៀនថ្នាក់ទី១ បឋមសិក្សា)'
            : 'បញ្ជីរាយនាមកុមារត្រូវប្រមូលចូលរៀន ក្រុមទី១ (៣-៥ឆ្នាំ) និង ក្រុមទី២ (៧០-៨២ខែ)'}
        subtitle="គោលបំណង៖ ប្រមូលសិស្សចូលរៀនឱ្យបានត្រឹមត្រូវ ១០០% សម្រាប់កុមារក្នុងតំបន់សេវា"
        academicYear="ឆ្នាំសិក្សា ២០២៦ - ២០២៧"
      />

      {/* Top Banner Notice */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-emerald-700/40 relative overflow-hidden no-print">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-400/20 text-emerald-200 border border-emerald-300/30">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>{language === 'km' ? 'យុទ្ធនាការប្រមូលសិស្សចូលរៀន ឆ្នាំ២០២៦ - ២០២៧' : 'Student Mobilization Campaign 2026-2027'}</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5 pt-1">
              <span>{language === 'km' ? 'បញ្ជីកុមារត្រូវប្រមូលចូលរៀន (២ក្រុម)' : 'Student Mobilization & Enrollment Lists'}</span>
            </h2>

            <p className="text-sm text-emerald-100/90 max-w-2xl leading-relaxed">
              {language === 'km' 
                ? 'គោលបំណង ៖ ប្រមូលសិស្សចូលរៀនឱ្យបានត្រឹមត្រូវ ១០០% ស្របតាមគោលនយោបាយក្រសួងអប់រំ យុវជន និងកីឡា ដោយបែងចែកជា ក្រុម១ (អាយុ ៣-៥ឆ្នាំ មត្តេយ្យ) និង ក្រុម២ (អាយុ ៧០-៨២ខែ ថ្នាក់ទី១) ក្នុងភូមិមុខឈ្នាង និងភូមិរោគ។'
                : 'Objective: 100% proper school enrollment categorized into Group 1 (3-5 years for Pre-school) and Group 2 (70-82 months for Grade 1 Primary).'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-white text-slate-900 hover:bg-emerald-50 transition shadow-sm"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>{t.exportCSV}</span>
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition"
            >
              <Printer className="w-4 h-4" />
              <span>{t.printReport}</span>
            </button>
          </div>
        </div>

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/15">
          {/* Group 1 */}
          <div 
            onClick={() => setActiveTab('group1')}
            className={`cursor-pointer rounded-xl p-3 border transition ${
              activeTab === 'group1' 
                ? 'bg-amber-400 text-slate-900 border-amber-300 font-bold' 
                : 'bg-white/10 hover:bg-white/15 text-white border-white/10'
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs opacity-90">
              <Baby className="w-4 h-4" />
              <span>{language === 'km' ? 'ក្រុម១ (អាយុ ៣-៥ឆ្នាំ)' : 'Group 1 (3-5 Yrs)'}</span>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-black">{stats.group1Total}</span>
              <span className="text-xs opacity-80">
                ({language === 'km' ? 'ស្រី' : 'F'}: {stats.group1Female})
              </span>
            </div>
            <div className="text-[10px] mt-0.5 opacity-80 font-medium">
              {language === 'km' ? 'មត្តេយ្យសិក្សា' : 'Pre-school'}
            </div>
          </div>

          {/* Group 2 */}
          <div 
            onClick={() => setActiveTab('group2')}
            className={`cursor-pointer rounded-xl p-3 border transition ${
              activeTab === 'group2' 
                ? 'bg-emerald-400 text-slate-900 border-emerald-300 font-bold' 
                : 'bg-white/10 hover:bg-white/15 text-white border-white/10'
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs opacity-90">
              <GraduationCap className="w-4 h-4" />
              <span>{language === 'km' ? 'ក្រុម២ (៧០-៨២ខែ)' : 'Group 2 (70-82 Mos)'}</span>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-black">{stats.group2Total}</span>
              <span className="text-xs opacity-80">
                ({language === 'km' ? 'ស្រី' : 'F'}: {stats.group2Female})
              </span>
            </div>
            <div className="text-[10px] mt-0.5 opacity-80 font-medium">
              {language === 'km' ? 'ចូលថ្នាក់ទី១ បឋម' : 'Grade 1 Entry'}
            </div>
          </div>

          {/* Total Eligible */}
          <div 
            onClick={() => setActiveTab('all')}
            className={`cursor-pointer rounded-xl p-3 border transition ${
              activeTab === 'all' 
                ? 'bg-blue-400 text-slate-900 border-blue-300 font-bold' 
                : 'bg-white/10 hover:bg-white/15 text-white border-white/10'
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs opacity-90">
              <Users className="w-4 h-4" />
              <span>{language === 'km' ? 'សរុបកុមារត្រូវប្រមូល' : 'Total Eligible'}</span>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-black">{stats.totalEligible}</span>
              <span className="text-xs opacity-80">
                {language === 'km' ? 'នាក់' : 'kids'}
              </span>
            </div>
            <div className="text-[10px] mt-0.5 opacity-80 font-medium">
              {language === 'km' ? 'ភូមិមុខឈ្នាង & រោគ' : 'Both villages'}
            </div>
          </div>

          {/* Enrollment Progress & Pending Card */}
          <div 
            onClick={() => setStatusFilter(prev => prev === 'not_enrolled' ? 'all' : 'not_enrolled')}
            className={`rounded-xl p-3 border cursor-pointer transition ${
              statusFilter === 'not_enrolled'
                ? 'bg-amber-400 text-slate-900 border-amber-300 font-bold'
                : 'bg-white/10 hover:bg-white/15 text-white border-white/10'
            }`}
            title={language === 'km' ? 'ចុចដើម្បីបង្ហាញតែកុមារមិនទាន់ចុះឈ្មោះ' : 'Click to filter pending unenrolled children'}
          >
            <div className="flex items-center justify-between text-xs opacity-90">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-300" />
                <span>{language === 'km' ? 'មិនទាន់ចុះឈ្មោះ' : 'Not Enrolled'}</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.2 bg-amber-500/30 text-amber-100 rounded">
                {language === 'km' ? 'ចុចចម្រាញ់' : 'Filter'}
              </span>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-black">{stats.totalPending}</span>
              <span className="text-xs opacity-80">
                / {stats.totalEligible}
              </span>
            </div>
            <div className="text-[10px] mt-0.5 opacity-90 font-medium">
              {language === 'km' ? `បានចុះឈ្មោះ៖ ${stats.totalEnrolled} នាក់ (${stats.totalEligible > 0 ? Math.round((stats.totalEnrolled / stats.totalEligible) * 100) : 0}%)` : `Enrolled: ${stats.totalEnrolled}`}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs and Filter Control Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-4 no-print">
        {/* Main Tab Switcher & Action Tools */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              {language === 'km' ? 'ជ្រើសរើសក្រុម៖' : 'Select Group:'}
            </span>
            <div className="inline-flex rounded-lg bg-slate-100 p-1 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-md transition ${
                  activeTab === 'all' 
                    ? 'bg-white text-emerald-800 shadow-xs font-bold' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {language === 'km' ? `កុមារទាំងអស់ (${stats.totalEligible})` : `All (${stats.totalEligible})`}
              </button>
              <button
                onClick={() => setActiveTab('group1')}
                className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 ${
                  activeTab === 'group1' 
                    ? 'bg-amber-500 text-white shadow-xs font-bold' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Baby className="w-3.5 h-3.5" />
                <span>{language === 'km' ? `ក្រុម១៖ ៣-៥ឆ្នាំ (${stats.group1Total})` : `Group 1: 3-5 yrs (${stats.group1Total})`}</span>
              </button>
              <button
                onClick={() => setActiveTab('group2')}
                className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 ${
                  activeTab === 'group2' 
                    ? 'bg-emerald-600 text-white shadow-xs font-bold' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>{language === 'km' ? `ក្រុម២៖ ៧០-៨២ខែ (${stats.group2Total})` : `Group 2: 70-82 mos (${stats.group2Total})`}</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Quick Roster Comparison Pills for Grade 1 (70-82 months) */}
            <button
              onClick={() => {
                setActiveTab('group2');
                setStatusFilter('not_enrolled');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition ${
                activeTab === 'group2' && statusFilter === 'not_enrolled'
                  ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                  : 'bg-rose-50 text-rose-900 hover:bg-rose-100 border-rose-200'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>
                {language === 'km'
                  ? `មិនមានក្នុងតារាងចុះឈ្មោះ (${group2Children.filter(c => c.enrollmentStatus === 'not_enrolled').length} នាក់)`
                  : `Missing from Roster (${group2Children.filter(c => c.enrollmentStatus === 'not_enrolled').length})`}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('group2');
                setStatusFilter('enrolled');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition ${
                activeTab === 'group2' && statusFilter === 'enrolled'
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                  : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border-emerald-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>
                {language === 'km'
                  ? `មានក្នុងតារាងរួច (${group2Children.filter(c => c.enrollmentStatus === 'enrolled').length} នាក់)`
                  : `In Roster (${group2Children.filter(c => c.enrollmentStatus === 'enrolled').length})`}
              </span>
            </button>

            {/* Highlight Pending Switch */}
            <button
              onClick={() => setHighlightPending(!highlightPending)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition ${
                highlightPending 
                  ? 'bg-amber-500 text-white border-amber-600 shadow-2xs' 
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
              }`}
              title={language === 'km' ? 'បើក/បិទការរំលេចកុមារមិនទាន់ចុះឈ្មោះ' : 'Toggle highlight pending children'}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{language === 'km' ? 'រំលេចកុមារមិនទាន់ចុះឈ្មោះ' : 'Highlight Pending'}</span>
            </button>

            {/* Batch Contact Action Button */}
            {pendingInFiltered.length > 0 && (
              <button
                onClick={handleBatchMarkContacted}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 flex items-center gap-1.5 transition shadow-2xs"
                title={language === 'km' ? 'ប្តូរកុមារមិនទាន់ចុះឈ្មោះក្នុងបញ្ជីនេះទៅជា «បានចុះជួប»' : 'Mark all pending in view as contacted'}
              >
                <PhoneCall className="w-3.5 h-3.5 text-amber-700" />
                <span>{language === 'km' ? `ចុះជួបទាំងអស់ (${pendingInFiltered.length})` : `Mark All Contacted (${pendingInFiltered.length})`}</span>
              </button>
            )}
          </div>
        </div>

        {/* Search & Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={language === 'km' ? 'ស្វែងរកឈ្មោះកុមារ, ឪពុកម្តាយ, ខ្នងផ្ទះ...' : 'Search child, parent, HH...'}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
            />
          </div>

          {/* Village Filter */}
          <div>
            <select
              value={villageFilter}
              onChange={(e) => setVillageFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
            >
              <option value="all">{t.filterVillage}</option>
              <option value="មុខឈ្នាង">{language === 'km' ? 'ភូមិមុខឈ្នាង (ចំណុះ ប.សរោគ)' : 'Mukh Chhnang (Rouk Feeder)'}</option>
              <option value="រោគ">{language === 'km' ? 'ភូមិរោគ (ចំណុះ ប.សរោគ)' : 'Roak Village (Rouk Feeder)'}</option>
            </select>
          </div>

          {/* Gender Filter */}
          <div>
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
            >
              <option value="all">{t.filterGender}</option>
              <option value="ប្រុស">{translateGender('ប្រុស', language)}</option>
              <option value="ស្រី">{translateGender('ស្រី', language)}</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as EnrollmentStatus | 'all')}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none font-medium"
            >
              <option value="all">{language === 'km' ? 'ស្ថានភាពទាំងអស់' : 'All Statuses'}</option>
              <option value="not_enrolled">❌ {language === 'km' ? 'មិនទាន់ចុះឈ្មោះ' : 'Not Enrolled'}</option>
              <option value="enrolled">✅ {language === 'km' ? 'បានចុះឈ្មោះចូលរៀន' : 'Enrolled'}</option>
              <option value="contacted">📞 {language === 'km' ? 'បានចុះជួប/តាមដាន' : 'Contacted / Home Visit'}</option>
              <option value="moved">✈️ {language === 'km' ? 'ផ្លាស់ទីលំនៅ/ផ្សេងៗ' : 'Relocated'}</option>
            </select>
          </div>
        </div>

        {/* Counter and Results */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <span>
              {language === 'km' ? 'បង្ហាញកុមារសរុប' : 'Showing children'}:{' '}
              <strong className="text-slate-900">{filteredChildren.length}</strong> / {baseList.length}
            </span>
            {pendingInFiltered.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                <Clock className="w-3 h-3 text-amber-700" />
                <span>{language === 'km' ? `មិនទាន់ចុះឈ្មោះ៖ ${pendingInFiltered.length} នាក់` : `Pending: ${pendingInFiltered.length}`}</span>
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-400">
            {language === 'km' ? '* ចុចប៊ូតុង «ចុះជួប» ដើម្បីកត់ត្រាការតាមដាន ឬចុចស្លាកស្ថានភាពដើម្បីប្តូរ' : '* Click "Mark Contacted" button or cycle status badge'}
          </span>
        </div>
      </div>

      {/* Children Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-3 px-3 w-12 text-center">#</th>
                <th 
                  onClick={() => handleSort('name')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-200/60 transition"
                >
                  <div className="flex items-center gap-1">
                    <span>{t.fullName}</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3 text-center">{t.gender}</th>
                <th className="py-3 px-3">{t.dob}</th>
                <th 
                  onClick={() => handleSort('months')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-200/60 transition text-emerald-800 bg-emerald-50/70"
                >
                  <div className="flex items-center gap-1">
                    <span>{language === 'km' ? 'អាយុ (ខែ)' : 'Age (Mos)'}</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                </th>
                <th className="py-3 px-3 text-center">{t.age}</th>
                <th className="py-3 px-3 text-center">ក្រុម</th>
                <th 
                  onClick={() => handleSort('village')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-200/60 transition"
                >
                  <div className="flex items-center gap-1">
                    <span>{t.village}</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('household')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-200/60 transition text-center"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>{t.householdId}</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4">{language === 'km' ? 'ឪពុកម្តាយ / មេគ្រួសារ' : 'Parents / Guardian'}</th>
                <th className="py-3 px-3">{language === 'km' ? 'សាលាគោលដៅ' : 'Target School'}</th>
                <th className="py-3 px-4 text-center">{language === 'km' ? 'ស្ថានភាពចុះឈ្មោះ' : 'Status'}</th>
                <th className="py-3 px-3 text-right no-print">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredChildren.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-slate-500">
                    <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700">{t.noResults}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {language === 'km' ? 'សូមកែសម្រួលពាក្យស្វែងរក ឬកំណត់តម្រងឡើងវិញ' : 'Try adjusting your filters'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredChildren.map((child, index) => {
                  const isMukhChhnang = child.citizen.village === 'មុខឈ្នាង';
                  const isGroup2 = child.ageInMonths >= 70 && child.ageInMonths <= 82;
                  const isPending = child.enrollmentStatus === 'not_enrolled' || !child.enrollmentStatus;
                  const rowClass = (isPending && highlightPending)
                    ? 'bg-amber-50/85 hover:bg-amber-100/90 border-l-4 border-l-amber-500 ring-1 ring-amber-300/40 font-medium transition'
                    : 'hover:bg-blue-50/40 transition';

                  return (
                    <tr 
                      key={child.citizen.id}
                      className={rowClass}
                    >
                      <td className="py-3 px-3 text-center text-slate-400 font-mono text-xs">
                        {index + 1}
                      </td>

                      {/* Child Name */}
                      <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span>{child.citizen.name}</span>
                          {isPending && highlightPending && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-200/90 text-amber-900 border border-amber-400/60 animate-pulse shadow-2xs">
                              <span>⚠️</span>
                              <span>{language === 'km' ? 'មិនទាន់ចុះឈ្មោះ' : 'Pending'}</span>
                            </span>
                          )}
                          {child.citizen.originalId && String(child.citizen.originalId) !== String(child.citizen.id) && (
                            <span className="text-[10px] text-slate-400 font-normal">
                              (#{child.citizen.originalId})
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Gender */}
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                          child.citizen.gender === 'ប្រុស'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : child.citizen.gender === 'ស្រី'
                              ? 'bg-pink-50 text-pink-700 border border-pink-200'
                              : 'bg-slate-50 text-slate-600'
                        }`}>
                          {translateGender(child.citizen.gender, language)}
                        </span>
                      </td>

                      {/* DOB */}
                      <td className="py-3 px-3 font-mono text-xs text-slate-600 whitespace-nowrap">
                        {child.citizen.dob || '—'}
                      </td>

                      {/* Age in Months */}
                      <td className="py-3 px-3 font-extrabold text-xs text-emerald-950 bg-emerald-50/50 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md ${
                          isGroup2 
                            ? 'bg-emerald-600 text-white font-black shadow-2xs' 
                            : 'bg-emerald-100 text-emerald-900'
                        }`}>
                          {child.ageInMonths} {language === 'km' ? 'ខែ' : 'mos'}
                        </span>
                      </td>

                      {/* Age in Years */}
                      <td className="py-3 px-3 text-center text-xs font-semibold text-slate-800">
                        {child.ageInYears} {language === 'km' ? 'ឆ្នាំ' : 'yrs'}
                      </td>

                      {/* Group Badge */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {isGroup2 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                            <GraduationCap className="w-3 h-3 text-emerald-700" />
                            <span>ក្រុម២ (៧០-៨២ខែ)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            <Baby className="w-3 h-3 text-amber-700" />
                            <span>ក្រុម១ (៣-៥ឆ្នាំ)</span>
                          </span>
                        )}
                      </td>

                      {/* Village */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {isMukhChhnang ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            <MapPin className="w-3 h-3 text-amber-600" />
                            <span>ភូមិមុខឈ្នាង</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            <MapPin className="w-3 h-3 text-blue-600" />
                            <span>ភូមិរោគ</span>
                          </span>
                        )}
                      </td>

                      {/* Household # */}
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center gap-1 font-mono text-xs text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 font-bold">
                          <Building2 className="w-3 h-3 text-indigo-600" />
                          #{child.citizen.householdCode || child.citizen.householdId}
                        </span>
                      </td>

                      {/* Parent / Guardian */}
                      <td className="py-3 px-4 text-xs text-slate-700 max-w-[200px] truncate" title={child.parentName}>
                        {child.parentName || <span className="text-slate-400 italic">មិនបានកត់ត្រា</span>}
                      </td>

                      {/* Target School */}
                      <td className="py-3 px-3 text-xs font-semibold text-slate-800 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          <School className="w-3 h-3 text-slate-500" />
                          <span>{child.targetSchool}</span>
                        </span>
                      </td>

                      {/* Enrollment Status & Direct Contacted Action */}
                      <td className="py-3 px-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          {isPending ? (
                            <>
                              <button
                                type="button"
                                onClick={() => onUpdateCitizenStatus(child.citizen.id, 'contacted')}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-95 text-white shadow-xs hover:shadow transition transform cursor-pointer whitespace-nowrap ring-2 ring-amber-400/40"
                                title={language === 'km' ? 'ចុចទីនេះដើម្បីប្តូរទៅជា «បានចុះជួប/តាមដាន» ភ្លាមៗ' : 'Change status directly to Contacted'}
                              >
                                <PhoneCall className="w-3 h-3" />
                                <span>{language === 'km' ? 'ចុះជួប' : 'Mark Contacted'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => cycleStatus(child.citizen.id, child.enrollmentStatus)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold bg-red-100 text-red-800 border border-red-200 hover:bg-red-200 transition"
                                title={language === 'km' ? 'ចុចដើម្បីប្តូរស្ថានភាព' : 'Click to cycle status'}
                              >
                                <Clock className="w-3 h-3 text-red-600" />
                                <span>{language === 'km' ? 'មិនទាន់' : 'Pending'}</span>
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => cycleStatus(child.citizen.id, child.enrollmentStatus)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition shadow-2xs active:scale-95 cursor-pointer ${
                                child.enrollmentStatus === 'enrolled'
                                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                  : child.enrollmentStatus === 'contacted'
                                    ? 'bg-amber-500 text-white hover:bg-amber-600'
                                    : 'bg-slate-500 text-white hover:bg-slate-600'
                              }`}
                              title={language === 'km' ? 'ចុចដើម្បីប្តូរស្ថានភាព' : 'Click to cycle status'}
                            >
                              {child.enrollmentStatus === 'enrolled' ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>{language === 'km' ? 'បានចុះឈ្មោះ' : 'Enrolled'}</span>
                                </>
                              ) : child.enrollmentStatus === 'contacted' ? (
                                <>
                                  <PhoneCall className="w-3.5 h-3.5" />
                                  <span>{language === 'km' ? 'បានចុះជួប/តាមដាន' : 'Visited'}</span>
                                </>
                              ) : (
                                <>
                                  <AlertCircle className="w-3.5 h-3.5" />
                                  <span>{language === 'km' ? 'ផ្លាស់ទីលំនៅ' : 'Moved'}</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right no-print">
                        <div className="flex items-center justify-end gap-1">
                          {isPending && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onUpdateCitizenStatus(child.citizen.id, 'contacted');
                              }}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg transition"
                              title={language === 'km' ? 'ចុចកត់ត្រាបានចុះជួប' : 'Mark as Contacted'}
                            >
                              <PhoneCall className="w-3 h-3 text-amber-700" />
                              <span className="hidden xl:inline">{language === 'km' ? 'ចុះជួប' : 'Contact'}</span>
                            </button>
                          )}
                          <button
                            onClick={() => onSelectCitizen(child.citizen)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title={t.details}
                          >
                            <Eye className="w-4 h-4" />
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
      </div>

      {/* Official Signatures Block with Khmer Lunar & Solar dates for Print & Review */}
      <OfficialSignatureSection
        language={language}
        defaultLocation="រោគ"
        reportType="enrollment"
      />
    </div>
  );
};
