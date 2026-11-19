import React, { useState, useMemo, useEffect } from 'react';
import { 
  Table as TableIcon, 
  Download, 
  Printer, 
  RotateCcw, 
  Save, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Info, 
  Sparkles, 
  School, 
  MapPin, 
  Edit3, 
  Layers, 
  Check, 
  Users, 
  GraduationCap, 
  Baby, 
  AlertCircle,
  RefreshCw,
  FileSpreadsheet,
  BarChart3,
  TrendingUp,
  Award,
  Eye,
  HeartHandshake,
  UserCheck,
  UserX,
  Search,
  ExternalLink
} from 'lucide-react';
import { User } from 'firebase/auth';
import { Citizen, Language } from '../types/census';
import { StudentRecord } from '../types/student';
import { 
  VillageComparisonRow, 
  PrimaryVillageComparisonRow 
} from '../types/comparison';
import { 
  loadSavedComparisonRows, 
  saveComparisonRows, 
  computeRowRates, 
  computeGrandTotal, 
  populateCensusFromCitizens, 
  populateEnrolledFromStudents, 
  exportComparisonToCSV,
  DEFAULT_COMPARISON_ROWS,
  loadSavedPrimaryComparisonRows,
  savePrimaryComparisonRows,
  computePrimaryRowRates,
  computePrimaryGrandTotal,
  generatePrimaryBaseline,
  exportPrimaryComparisonToCSV,
  computeSchoolWideStatistics
} from '../utils/comparisonData';
import { calculateAgeInMonths } from '../utils/enrollmentUtils';
import { OfficialReportHeader } from './OfficialReportHeader';
import { OfficialSignatureSection } from './OfficialSignatureSection';

interface ComparisonTableViewProps {
  citizens: Citizen[];
  students: StudentRecord[];
  language: Language;
  user?: User | null;
  onSaveToCloud?: (rows: unknown[]) => Promise<void>;
  onSelectCitizen?: (citizen: Citizen) => void;
}

export const ComparisonTableView: React.FC<ComparisonTableViewProps> = ({
  citizens,
  students,
  language,
  user,
  onSaveToCloud,
  onSelectCitizen
}) => {
  // Mode: Primary 6+ / Group 2 (User's new request) | Pre-school 3-5 (Previous request) | Whole School Stats
  const [activeMode, setActiveMode] = useState<'primary' | 'preschool' | 'school-stats'>('primary');

  // Pre-school 3-5 Years Data State
  const [preschoolRows, setPreschoolRows] = useState<VillageComparisonRow[]>(() => loadSavedComparisonRows());

  // Primary 6+ Years & Group 2 Data State
  const [primaryRows, setPrimaryRows] = useState<PrimaryVillageComparisonRow[]>(() => 
    loadSavedPrimaryComparisonRows(citizens, students)
  );

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isCloudSaving, setIsCloudSaving] = useState(false);
  const [remainingSearchQuery, setRemainingSearchQuery] = useState('');

  // Auto-save preschool rows to localStorage
  useEffect(() => {
    saveComparisonRows(preschoolRows);
  }, [preschoolRows]);

  // Auto-save primary rows to localStorage
  useEffect(() => {
    savePrimaryComparisonRows(primaryRows);
  }, [primaryRows]);

  // Recalculate Grand Totals
  const preschoolGrandTotal = useMemo(() => {
    return computeGrandTotal(preschoolRows);
  }, [preschoolRows]);

  const primaryGrandTotal = useMemo(() => {
    return computePrimaryGrandTotal(primaryRows);
  }, [primaryRows]);

  // Whole-School Comprehensive Statistics
  const schoolStats = useMemo(() => {
    return computeSchoolWideStatistics(students, citizens);
  }, [students, citizens]);

  // Out-of-School Group 2 Children (for direct mobilization list)
  const remainingGroup2Children = useMemo(() => {
    const adultRel = new Set(['ប្តី', 'ប្រពន្ធ', 'ឪពុក', 'ម្តាយ', 'កូនប្រសារ', 'ម្ដាយក្មេក', 'ឪពុកក្មេក']);
    return citizens
      .filter(c => !adultRel.has((c.relationship || '').trim()))
      .filter(c => {
        const mos = calculateAgeInMonths(c.dob, c.age);
        return mos >= 70 && mos <= 82;
      })
      .filter(c => c.enrollmentStatus !== 'enrolled')
      .filter(c => {
        if (!remainingSearchQuery.trim()) return true;
        const q = remainingSearchQuery.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          String(c.householdCode || c.householdId).toLowerCase().includes(q) ||
          (c.village || '').toLowerCase().includes(q)
        );
      });
  }, [citizens, remainingSearchQuery]);

  // ---------------------------------------------------------
  // Handlers for Primary School Rows (Age 6+ & Group 2)
  // ---------------------------------------------------------
  const handlePrimaryEnrolledChange = (
    rowId: string,
    field: keyof PrimaryVillageComparisonRow,
    value: string
  ) => {
    const num = Math.max(0, parseInt(value, 10) || 0);
    setPrimaryRows(prev => prev.map(r => {
      if (r.id !== rowId) return r;
      const updated = {
        ...r,
        [field]: num
      };
      return computePrimaryRowRates(updated);
    }));
  };

  const handlePrimaryRemarksChange = (rowId: string, remarks: string) => {
    setPrimaryRows(prev => prev.map(r => {
      if (r.id !== rowId) return r;
      return { ...r, remarks };
    }));
  };

  const handleSyncPrimaryFromData = () => {
    const fresh = generatePrimaryBaseline(citizens, students);
    setPrimaryRows(fresh);
    savePrimaryComparisonRows(fresh);
    triggerSaveToast();
  };

  // ---------------------------------------------------------
  // Handlers for Pre-school Rows (Age 3-5)
  // ---------------------------------------------------------
  const handlePreschoolEnrolledChange = (
    rowId: string, 
    field: 'enrolled3Total' | 'enrolled3Female' | 'enrolled4Total' | 'enrolled4Female' | 'enrolled5Total' | 'enrolled5Female', 
    value: string
  ) => {
    const num = Math.max(0, parseInt(value, 10) || 0);
    setPreschoolRows(prev => prev.map(r => {
      if (r.id !== rowId) return r;
      const updated = {
        ...r,
        [field]: num
      };
      return computeRowRates(updated);
    }));
  };

  const handlePreschoolRemarksChange = (rowId: string, remarks: string) => {
    setPreschoolRows(prev => prev.map(r => {
      if (r.id !== rowId) return r;
      return { ...r, remarks };
    }));
  };

  const handleResetPreschoolToBaseline = () => {
    if (window.confirm(language === 'km' ? 'តើអ្នកពិតជាចង់កំណត់ទិន្នន័យមត្តេយ្យលំនាំដើមឡើងវិញមែនទេ?' : 'Reset to default preschool baseline numbers?')) {
      const resetRows = DEFAULT_COMPARISON_ROWS.map(computeRowRates);
      setPreschoolRows(resetRows);
      saveComparisonRows(resetRows);
      triggerSaveToast();
    }
  };

  const triggerSaveToast = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleManualSave = async () => {
    if (activeMode === 'primary') {
      savePrimaryComparisonRows(primaryRows);
      if (onSaveToCloud && user) {
        try {
          setIsCloudSaving(true);
          await onSaveToCloud(primaryRows);
        } finally {
          setIsCloudSaving(false);
        }
      }
    } else {
      saveComparisonRows(preschoolRows);
      if (onSaveToCloud && user) {
        try {
          setIsCloudSaving(true);
          await onSaveToCloud(preschoolRows);
        } finally {
          setIsCloudSaving(false);
        }
      }
    }
    triggerSaveToast();
  };

  // Color helper for enrollment rates
  const getRateBadge = (rate: number, isFemale = false) => {
    if (rate === 0) {
      return (
        <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-500">
          0%
        </span>
      );
    }
    if (rate > 100) {
      return (
        <span 
          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-900 border border-purple-300"
          title="អត្រាលើស ១០០% (មានកុមារមកពីតំបន់ផ្សេង ឬកុមារក្រៅសេវា)"
        >
          {rate.toFixed(1)}%
          <span className="text-[9px] text-purple-700 font-extrabold">*</span>
        </span>
      );
    }
    if (rate >= 80) {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
          {rate.toFixed(1)}%
        </span>
      );
    }
    if (rate >= 50) {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-900 border border-blue-200">
          {rate.toFixed(1)}%
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
        {rate.toFixed(1)}%
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Official MoEYS Administrative Header */}
      <OfficialReportHeader
        title={
          activeMode === 'primary'
            ? 'តារាងប្រៀបធៀបទិន្នន័យកុមារបឋមសិក្សា (៦ ឆ្នាំឡើង & ក្រុម២ ថ្នាក់ទី១)'
            : activeMode === 'preschool'
              ? 'តារាងប្រៀបធៀបទិន្នន័យកុមារមត្តេយ្យសិក្សា (៣-៥ ឆ្នាំ ក្រុម១)'
              : 'របាយការណ៍ស្ថិតិទូទាំងសាលារៀន និងប្រៀបធៀបកុមារក្នុងតំបន់សេវា'
        }
        subtitle="សាលាបឋមសិក្សា រោគ • ភូមិរោគ និង ភូមិមុខឈ្នាង • ឆ្នាំសិក្សា ២០២៦-២០២៧"
        academicYear="ឆ្នាំសិក្សា ២០២៦ - ២០២៧"
      />

      {/* Mode Selector Tab Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2 rounded-2xl shadow-xs border border-slate-200 no-print">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Tab 1: Primary School 6+ & Group 2 (Requested Focus) */}
          <button
            onClick={() => setActiveMode('primary')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
              activeMode === 'primary'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-2 ring-blue-600/20'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>{language === 'km' ? 'បឋមសិក្សា (៦ ឆ្នាំឡើង & ក្រុម២)' : 'Primary School (Age 6+ & Group 2)'}</span>
            <span className={`px-2 py-0.5 text-[11px] rounded-full font-black ${
              activeMode === 'primary' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-900'
            }`}>
              {language === 'km' ? 'ថ្នាក់ទី១-៦' : 'Grades 1-6'}
            </span>
          </button>

          {/* Tab 2: Pre-School 3-5 Years (Group 1) */}
          <button
            onClick={() => setActiveMode('preschool')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
              activeMode === 'preschool'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-600/20'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Baby className="w-4 h-4" />
            <span>{language === 'km' ? 'មត្តេយ្យសិក្សា (៣-៥ ឆ្នាំ ក្រុម១)' : 'Pre-school (Age 3-5 Group 1)'}</span>
            <span className={`px-2 py-0.5 text-[11px] rounded-full font-black ${
              activeMode === 'preschool' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-900'
            }`}>
              {language === 'km' ? 'ឯកសារភ្ជាប់' : 'MoEYS Sheet'}
            </span>
          </button>

          {/* Tab 3: Whole-School Statistics (User's special request) */}
          <button
            onClick={() => setActiveMode('school-stats')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
              activeMode === 'school-stats'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-2 ring-indigo-600/20'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>{language === 'km' ? 'ស្ថិតិទូទាំងសាលារៀន' : 'Whole-School Statistics'}</span>
            <span className={`px-2 py-0.5 text-[11px] rounded-full font-black ${
              activeMode === 'school-stats' ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-900'
            }`}>
              {schoolStats.totalStudents} {language === 'km' ? 'សិស្ស' : 'Students'}
            </span>
          </button>
        </div>

        {/* Action Buttons for current mode */}
        <div className="flex items-center gap-2">
          {activeMode === 'primary' && (
            <>
              <button
                onClick={handleSyncPrimaryFromData}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition"
                title="ទាញយកទិន្នន័យស្រស់ពីបញ្ជីសិស្ស និងជំរឿន"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{language === 'km' ? 'ទាញពីប្រព័ន្ធ' : 'Refresh from Data'}</span>
              </button>
              <button
                onClick={() => exportPrimaryComparisonToCSV(primaryRows, primaryGrandTotal)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition"
                title="Export Primary CSV"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>CSV</span>
              </button>
            </>
          )}

          {activeMode === 'preschool' && (
            <>
              <button
                onClick={handleResetPreschoolToBaseline}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition"
                title="កំណត់ទិន្នន័យឯកសារភ្ជាប់ឡើងវិញ"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{language === 'km' ? 'ទិន្នន័យដើម' : 'Reset'}</span>
              </button>
              <button
                onClick={() => exportComparisonToCSV(preschoolRows, preschoolGrandTotal)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition"
                title="Export Preschool CSV"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>CSV</span>
              </button>
            </>
          )}

          <button
            onClick={handleManualSave}
            disabled={isCloudSaving}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{language === 'km' ? 'រក្សាទុក' : 'Save'}</span>
          </button>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition"
            title="Print"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Save Success Toast */}
      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200 no-print">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{language === 'km' ? 'ទិន្នន័យតារាងប្រៀបធៀបត្រូវបានរក្សាទុកដោយជោគជ័យ!' : 'Comparison table changes saved successfully!'}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 1: PRIMARY SCHOOL (AGE 6+ & GROUP 2) COMPARISON TABLE                */}
      {/* ========================================================================= */}
      {activeMode === 'primary' && (
        <div className="space-y-6">
          {/* Top Banner Notice for Primary School */}
          <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-blue-900/50 relative overflow-hidden no-print">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                    <School className="w-3.5 h-3.5 text-emerald-300" />
                    <span>សាលាបឋមសិក្សា រោគ (ប.សរោគ)</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-200 border border-amber-400/30">
                    <Award className="w-3.5 h-3.5 text-amber-300" />
                    <span>{language === 'km' ? 'កុមារក្រុម២ (៧០-៨២ ខែ / ៦ឆ្នាំ) ចូលថ្នាក់ទី១' : 'Group 2: Grade 1 Intake'}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-200 border border-cyan-400/30">
                    <Edit3 className="w-3.5 h-3.5 text-cyan-300" />
                    <span>{language === 'km' ? 'ជួរឈរពណ៌បៃតង អាចវាយបញ្ចូលទិន្នន័យផ្ទាល់' : 'Green inputs are directly editable'}</span>
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2 pt-1">
                  <span>{language === 'km' ? 'តារាងប្រៀបធៀបកុមារបឋមសិក្សា (៦ ឆ្នាំឡើង & ក្រុម២)' : 'Primary School Catchment Comparison (Age 6+ & Group 2)'}</span>
                </h2>

                <p className="text-sm text-blue-200/90 max-w-3xl leading-relaxed">
                  {language === 'km'
                    ? 'តារាងនេះផ្ទៀងផ្ទាត់រវាងទិន្នន័យជំរឿនពិត និងចំនួនសិស្សដែលកំពុងរៀននៅសាលា។ វាស់វែងយ៉ាងច្បាស់លាស់ថាកុមារ ក្រុម២ (អាយុ ៧០-៨២ខែ) បានចុះឈ្មោះចូលរៀនប៉ុន្មាននាក់ និងនៅសល់ប៉ុន្មាននាក់ដែលត្រូវប្រមូលមកចូលរៀនថ្នាក់ទី១ ព្រមទាំងស្ថិតិកុមារអាយុ ៦ ដល់ ១១+ ឆ្នាំ។'
                    : 'This table tracks Group 2 children (70-82 months) entering Grade 1 against actual census data, calculating enrolled, remaining out-of-school, and enrollment rates by village.'}
                </p>
              </div>

              {/* Group 2 Key Metric Indicator */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 self-start lg:self-auto min-w-[240px]">
                <div className="flex items-center justify-between text-xs text-blue-200 font-semibold mb-1">
                  <span>{language === 'km' ? 'កុមារក្រុម២ ថ្នាក់ទី១' : 'Group 2 Grade 1'}</span>
                  <span className="text-emerald-300 font-bold">{primaryGrandTotal.group2RateTotal.toFixed(1)}%</span>
                </div>
                <div className="text-2xl font-black text-white flex items-baseline gap-2">
                  <span>{primaryGrandTotal.group2EnrolledTotal}</span>
                  <span className="text-xs text-blue-200 font-normal">
                    / {primaryGrandTotal.group2CensusTotal} {language === 'km' ? 'នាក់ក្នុងជំរឿន' : 'in census'}
                  </span>
                </div>
                <div className="w-full bg-slate-800/60 rounded-full h-2 mt-2 overflow-hidden border border-white/10">
                  <div 
                    className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, primaryGrandTotal.group2RateTotal)}%` }}
                  />
                </div>
                <div className="text-[11px] text-amber-300 font-bold mt-1.5 flex items-center justify-between">
                  <span>{language === 'km' ? 'នៅសល់ត្រូវប្រមូល៖' : 'Remaining to mobilize:'}</span>
                  <span className="bg-amber-500/20 px-2 py-0.5 rounded text-amber-200 border border-amber-400/30">
                    {primaryGrandTotal.group2RemainingTotal} នាក់
                  </span>
                </div>
              </div>
            </div>

            {/* Quick KPI Highlights Grid for Primary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-white/15">
              {/* Census Group 2 Children */}
              <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/10">
                <div className="flex items-center gap-1.5 text-xs text-blue-200">
                  <Users className="w-4 h-4 text-blue-300" />
                  <span>{language === 'km' ? 'កុមារក្រុម២ ក្នុងជំរឿន' : 'Group 2 in Census'}</span>
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-white">{primaryGrandTotal.group2CensusTotal}</span>
                  <span className="text-xs text-pink-300 font-medium">
                    ({language === 'km' ? 'ស្រី' : 'F'}: {primaryGrandTotal.group2CensusFemale})
                  </span>
                </div>
                <p className="text-[10px] text-blue-200 mt-0.5">អាយុ ៧០-៨២ ខែ</p>
              </div>

              {/* Group 2 Enrolled */}
              <div className="bg-emerald-500/20 backdrop-blur-xs rounded-xl p-3 border border-emerald-400/30">
                <div className="flex items-center gap-1.5 text-xs text-emerald-200 font-semibold">
                  <UserCheck className="w-4 h-4 text-emerald-300" />
                  <span>{language === 'km' ? 'ក្រុម២ បានចុះឈ្មោះ' : 'Group 2 Enrolled'}</span>
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-white">{primaryGrandTotal.group2EnrolledTotal}</span>
                  <span className="text-xs text-emerald-200 font-medium">
                    ({language === 'km' ? 'ស្រី' : 'F'}: {primaryGrandTotal.group2EnrolledFemale})
                  </span>
                </div>
                <p className="text-[10px] text-emerald-300 mt-0.5">
                  {language === 'km' ? `សម្រេចបាន ${primaryGrandTotal.group2RateTotal.toFixed(1)}%` : `${primaryGrandTotal.group2RateTotal.toFixed(1)}% Intake`}
                </p>
              </div>

              {/* Group 2 Remaining Out of School */}
              <div className="bg-rose-500/20 backdrop-blur-xs rounded-xl p-3 border border-rose-400/30">
                <div className="flex items-center gap-1.5 text-xs text-rose-200 font-semibold">
                  <UserX className="w-4 h-4 text-rose-300" />
                  <span>{language === 'km' ? 'ក្រុម២ នៅសល់មិនទាន់ចុះឈ្មោះ' : 'Group 2 Remaining'}</span>
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-rose-100">{primaryGrandTotal.group2RemainingTotal}</span>
                  <span className="text-xs text-rose-200 font-medium">
                    ({language === 'km' ? 'ស្រី' : 'F'}: {primaryGrandTotal.group2RemainingFemale})
                  </span>
                </div>
                <p className="text-[10px] text-rose-300 mt-0.5">
                  {language === 'km' ? 'ត្រូវចុះចល័តប្រមូលចូលរៀន' : 'Need Mobilization'}
                </p>
              </div>

              {/* Total Primary School Age (6-11 years) */}
              <div className="bg-indigo-500/20 backdrop-blur-xs rounded-xl p-3 border border-indigo-400/30">
                <div className="flex items-center gap-1.5 text-xs text-indigo-200 font-semibold">
                  <GraduationCap className="w-4 h-4 text-indigo-300" />
                  <span>{language === 'km' ? 'កុមារបឋម (៦-១១ ឆ្នាំ)' : 'Primary Age 6-11'}</span>
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-white">{primaryGrandTotal.primaryEnrolledTotal}</span>
                  <span className="text-xs text-indigo-200 font-medium">
                    / {primaryGrandTotal.primaryCensusTotal} ({primaryGrandTotal.primaryRateTotal.toFixed(1)}%)
                  </span>
                </div>
                <p className="text-[10px] text-indigo-300 mt-0.5">
                  {language === 'km' ? `នៅសល់ទូទាំងបឋម៖ ${primaryGrandTotal.primaryRemainingTotal} នាក់` : `Total remaining: ${primaryGrandTotal.primaryRemainingTotal}`}
                </p>
              </div>
            </div>
          </div>

          {/* Primary School Comparison Table Component */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  {language === 'km' 
                    ? 'តារាងប្រៀបធៀប៖ កុមារក្រុម២ (៧០-៨២ ខែ) និងកុមារបឋមសិក្សា (៦ ឆ្នាំឡើង)' 
                    : 'Comparison Table: Group 2 Children (70-82 Mos) & Primary Cohorts (Age 6+)'}
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-400" />
                  <span>{language === 'km' ? 'សិស្សបានចុះឈ្មោះ (អាចបញ្ចូលទិន្នន័យ)' : 'Enrolled (Editable inputs)'}</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-amber-100 border border-amber-300" />
                  <span>{language === 'km' ? 'កុមារនៅសល់ (Auto-Calculated)' : 'Remaining Children'}</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-blue-100 border border-blue-300" />
                  <span>{language === 'km' ? '% ចូលរៀន' : 'Enrollment %'}</span>
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-[10px] text-center border-collapse leading-tight font-khmer">
                <thead>
                  {/* LEVEL 1 HEADERS */}
                  <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 font-bold">
                    <th rowSpan={3} className="py-1 px-1.5 text-left border-r border-slate-300 min-w-[115px] sticky left-0 bg-slate-100 z-20">
                      {language === 'km' ? 'ឈ្មោះភូមិរដ្ឋបាលចំណុះ' : 'Feeder Village'}
                    </th>
                    <th colSpan={2} rowSpan={2} className="p-2 border-r border-slate-300 bg-slate-50">
                      {language === 'km' ? 'ចំនួនប្រជាជន' : 'Population'}
                    </th>
                    <th rowSpan={3} className="p-2 border-r border-slate-300 bg-slate-50 min-w-[65px]">
                      {language === 'km' ? 'គ្រួសារ' : 'Households'}
                    </th>

                    {/* Group 2 Main Section (8 columns) */}
                    <th colSpan={8} className="p-2 border-r border-slate-300 bg-indigo-100 text-indigo-950 border-l-2 border-indigo-500 font-black">
                      {language === 'km' ? 'កុមារក្រុម២ (៧០-៨២ ខែ / ៦ឆ្នាំ) ចូលថ្នាក់ទី១' : 'Group 2 Children (70-82 Mos) Grade 1 Intake'}
                    </th>

                    {/* Primary Ages: 6, 7, 8, 9, 10, 11 (4 columns each: Census, Enrolled, Remaining, %) */}
                    <th colSpan={4} className="p-2 border-r border-slate-300 bg-blue-50 text-blue-950 font-bold">
                      ៦ ឆ្នាំ (ថ្នាក់ទី១)
                    </th>
                    <th colSpan={4} className="p-2 border-r border-slate-300 bg-blue-50 text-blue-950 font-bold">
                      ៧ ឆ្នាំ (ថ្នាក់ទី២)
                    </th>
                    <th colSpan={4} className="p-2 border-r border-slate-300 bg-blue-50 text-blue-950 font-bold">
                      ៨ ឆ្នាំ (ថ្នាក់ទី៣)
                    </th>
                    <th colSpan={4} className="p-2 border-r border-slate-300 bg-blue-50 text-blue-950 font-bold">
                      ៩ ឆ្នាំ (ថ្នាក់ទី៤)
                    </th>
                    <th colSpan={4} className="p-2 border-r border-slate-300 bg-blue-50 text-blue-950 font-bold">
                      ១០ ឆ្នាំ (ថ្នាក់ទី៥)
                    </th>
                    <th colSpan={4} className="p-2 border-r border-slate-300 bg-blue-50 text-blue-950 font-bold">
                      ១១ ឆ្នាំ (ថ្នាក់ទី៦)
                    </th>

                    {/* Primary School Total (8 columns) */}
                    <th colSpan={8} className="p-2 border-r border-slate-300 bg-emerald-100 text-emerald-950 border-l-2 border-emerald-500 font-black">
                      {language === 'km' ? 'សរុបកុមារបឋមសិក្សា (៦-១១ ឆ្នាំ)' : 'Total Primary (Ages 6-11)'}
                    </th>

                    {/* Age 12+ (4 columns) */}
                    <th colSpan={4} className="p-2 border-r border-slate-300 bg-slate-100 text-slate-800">
                      {language === 'km' ? '១២ ឆ្នាំឡើង' : '12+ Years'}
                    </th>

                    <th rowSpan={3} className="p-2 bg-slate-50 min-w-[150px]">
                      {language === 'km' ? 'កំណត់សំគាល់' : 'Remarks'}
                    </th>
                  </tr>

                  {/* LEVEL 2 HEADERS */}
                  <tr className="bg-slate-50 text-slate-700 border-b border-slate-300 font-bold text-[11px]">
                    {/* Group 2 Subheaders */}
                    <th colSpan={2} className="p-1.5 border-r border-slate-300 bg-indigo-50 border-l-2 border-indigo-500 text-indigo-900">ជំរឿនពិត</th>
                    <th colSpan={2} className="p-1.5 border-r border-slate-300 bg-emerald-100 text-emerald-950 font-black">បានចុះឈ្មោះ (បញ្ចូល)</th>
                    <th colSpan={2} className="p-1.5 border-r border-slate-300 bg-rose-50 text-rose-900">នៅសល់មិនទាន់ចុះ</th>
                    <th colSpan={2} className="p-1.5 border-r border-slate-300 bg-blue-100 text-blue-950 font-black">% ចូលរៀន</th>

                    {/* Age 6 */}
                    <th className="p-1 border-r border-slate-200">ជំរឿន</th>
                    <th className="p-1 border-r border-slate-200 bg-emerald-50 text-emerald-900 font-bold">រៀន</th>
                    <th className="p-1 border-r border-slate-200 text-amber-700">នៅសល់</th>
                    <th className="p-1 border-r border-slate-300 bg-blue-50 font-bold">%</th>

                    {/* Age 7 */}
                    <th className="p-1 border-r border-slate-200">ជំរឿន</th>
                    <th className="p-1 border-r border-slate-200 bg-emerald-50 text-emerald-900 font-bold">រៀន</th>
                    <th className="p-1 border-r border-slate-200 text-amber-700">នៅសល់</th>
                    <th className="p-1 border-r border-slate-300 bg-blue-50 font-bold">%</th>

                    {/* Age 8 */}
                    <th className="p-1 border-r border-slate-200">ជំរឿន</th>
                    <th className="p-1 border-r border-slate-200 bg-emerald-50 text-emerald-900 font-bold">រៀន</th>
                    <th className="p-1 border-r border-slate-200 text-amber-700">នៅសល់</th>
                    <th className="p-1 border-r border-slate-300 bg-blue-50 font-bold">%</th>

                    {/* Age 9 */}
                    <th className="p-1 border-r border-slate-200">ជំរឿន</th>
                    <th className="p-1 border-r border-slate-200 bg-emerald-50 text-emerald-900 font-bold">រៀន</th>
                    <th className="p-1 border-r border-slate-200 text-amber-700">នៅសល់</th>
                    <th className="p-1 border-r border-slate-300 bg-blue-50 font-bold">%</th>

                    {/* Age 10 */}
                    <th className="p-1 border-r border-slate-200">ជំរឿន</th>
                    <th className="p-1 border-r border-slate-200 bg-emerald-50 text-emerald-900 font-bold">រៀន</th>
                    <th className="p-1 border-r border-slate-200 text-amber-700">នៅសល់</th>
                    <th className="p-1 border-r border-slate-300 bg-blue-50 font-bold">%</th>

                    {/* Age 11 */}
                    <th className="p-1 border-r border-slate-200">ជំរឿន</th>
                    <th className="p-1 border-r border-slate-200 bg-emerald-50 text-emerald-900 font-bold">រៀន</th>
                    <th className="p-1 border-r border-slate-200 text-amber-700">នៅសល់</th>
                    <th className="p-1 border-r border-slate-300 bg-blue-50 font-bold">%</th>

                    {/* Primary Total (8 columns) */}
                    <th colSpan={2} className="p-1.5 border-r border-slate-200 bg-emerald-50 border-l-2 border-emerald-500 font-bold">ជំរឿនសរុប</th>
                    <th colSpan={2} className="p-1.5 border-r border-slate-200 bg-emerald-100 font-black text-emerald-950">បានចុះឈ្មោះ</th>
                    <th colSpan={2} className="p-1.5 border-r border-slate-200 bg-rose-50 text-rose-900 font-bold">នៅសល់សរុប</th>
                    <th colSpan={2} className="p-1.5 border-r border-slate-300 bg-blue-100 text-blue-950 font-black">% ចូលរៀនសរុប</th>

                    {/* 12+ Years */}
                    <th colSpan={2} className="p-1 border-r border-slate-200">ជំរឿន</th>
                    <th colSpan={2} className="p-1 border-r border-slate-300 bg-slate-200/60 font-bold">សិស្សរៀន</th>
                  </tr>

                  {/* LEVEL 3 HEADERS */}
                  <tr className="bg-slate-100 text-slate-600 border-b border-slate-300 text-[10px]">
                    {/* Population */}
                    <th className="p-1 border-r border-slate-200">សរុប</th>
                    <th className="p-1 border-r border-slate-300 text-pink-700">ស្រី</th>

                    {/* Group 2 */}
                    <th className="p-1 border-r border-slate-200 bg-indigo-50 border-l-2 border-indigo-500">សរុប</th>
                    <th className="p-1 border-r border-slate-200 bg-indigo-50 text-pink-700">ស្រី</th>
                    <th className="p-1 border-r border-slate-200 bg-emerald-100 font-bold text-emerald-950">សរុប</th>
                    <th className="p-1 border-r border-slate-200 bg-emerald-100 text-pink-800 font-bold">ស្រី</th>
                    <th className="p-1 border-r border-slate-200 bg-rose-50 text-rose-800 font-semibold">សរុប</th>
                    <th className="p-1 border-r border-slate-200 bg-rose-50 text-pink-700 font-semibold">ស្រី</th>
                    <th className="p-1 border-r border-slate-200 bg-blue-100 font-bold">សរុប</th>
                    <th className="p-1 border-r border-slate-300 bg-blue-100 text-pink-800 font-bold">ស្រី</th>

                    {/* Age 6 to 11 gender placeholders already labeled in level 2 */}
                    <th className="p-0.5 border-r border-slate-200"></th><th className="p-0.5 border-r border-slate-200"></th><th className="p-0.5 border-r border-slate-200"></th><th className="p-0.5 border-r border-slate-300"></th>
                    <th className="p-0.5 border-r border-slate-200"></th><th className="p-0.5 border-r border-slate-200"></th><th className="p-0.5 border-r border-slate-200"></th><th className="p-0.5 border-r border-slate-300"></th>
                    <th className="p-0.5 border-r border-slate-200"></th><th className="p-0.5 border-r border-slate-200"></th><th className="p-0.5 border-r border-slate-200"></th><th className="p-0.5 border-r border-slate-300"></th>
                    <th className="p-0.5 border-r border-slate-200"></th><th className="p-0.5 border-r border-slate-200"></th><th className="p-0.5 border-r border-slate-200"></th><th className="p-0.5 border-r border-slate-300"></th>
                    <th className="p-0.5 border-r border-slate-200"></th><th className="p-0.5 border-r border-slate-200"></th><th className="p-0.5 border-r border-slate-200"></th><th className="p-0.5 border-r border-slate-300"></th>
                    <th className="p-0.5 border-r border-slate-200"></th><th className="p-0.5 border-r border-slate-200"></th><th className="p-0.5 border-r border-slate-200"></th><th className="p-0.5 border-r border-slate-300"></th>

                    {/* Primary Total gender */}
                    <th className="p-1 border-r border-slate-200 bg-emerald-50 border-l-2 border-emerald-500 font-semibold">សរុប</th>
                    <th className="p-1 border-r border-slate-200 bg-emerald-50 text-pink-700">ស្រី</th>
                    <th className="p-1 border-r border-slate-200 bg-emerald-100 font-bold text-emerald-950">សរុប</th>
                    <th className="p-1 border-r border-slate-200 bg-emerald-100 text-pink-800 font-bold">ស្រី</th>
                    <th className="p-1 border-r border-slate-200 bg-rose-50 text-rose-800">សរុប</th>
                    <th className="p-1 border-r border-slate-200 bg-rose-50 text-pink-700">ស្រី</th>
                    <th className="p-1 border-r border-slate-200 bg-blue-100 font-black">សរុប</th>
                    <th className="p-1 border-r border-slate-300 bg-blue-100 text-pink-800 font-black">ស្រី</th>

                    {/* 12+ Years */}
                    <th className="p-1 border-r border-slate-200">សរុប</th><th className="p-1 border-r border-slate-200 text-pink-700">ស្រី</th>
                    <th className="p-1 border-r border-slate-200 bg-slate-200/60 font-semibold">សរុប</th><th className="p-1 border-r border-slate-300 bg-slate-200/60 text-pink-700 font-semibold">ស្រី</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {primaryRows.map(row => (
                    <tr key={row.id} className="hover:bg-slate-50 transition group">
                      {/* Village Name */}
                      <td className="py-1 px-1.5 text-left border-r border-slate-300 font-bold text-slate-900 sticky left-0 bg-white group-hover:bg-slate-50 z-10 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${row.villageName.includes('មុខឈ្នាង') ? 'bg-amber-500' : 'bg-blue-600'}`} />
                          <span>{row.villageName}</span>
                        </div>
                      </td>

                      {/* Population */}
                      <td className="p-1.5 border-r border-slate-200 font-semibold text-slate-800">{row.populationTotal}</td>
                      <td className="p-1.5 border-r border-slate-300 text-pink-700">{row.populationFemale}</td>

                      {/* Households */}
                      <td className="p-1.5 border-r border-slate-300 font-bold text-slate-800 bg-slate-50/50">{row.householdCount}</td>

                      {/* ========================================================================= */}
                      {/* GROUP 2 CHILDREN (70-82 MONTHS / GRADE 1 ENTRANCE)                       */}
                      {/* ========================================================================= */}
                      {/* Group 2 Census */}
                      <td className="p-1 border-r border-slate-200 bg-indigo-50/40 font-bold text-indigo-950 border-l-2 border-indigo-500">{row.group2CensusTotal}</td>
                      <td className="p-1 border-r border-slate-200 bg-indigo-50/40 text-pink-700 font-medium">{row.group2CensusFemale}</td>

                      {/* Group 2 Enrolled - EDITABLE INPUT IN GREEN */}
                      <td className="p-1 border-r border-slate-200 bg-emerald-50">
                        <input
                          type="number"
                          min={0}
                          value={row.group2EnrolledTotal}
                          onChange={(e) => handlePrimaryEnrolledChange(row.id, 'group2EnrolledTotal', e.target.value)}
                          className="w-11 text-center font-bold text-emerald-950 bg-white border border-emerald-400 rounded px-1 py-0.5 shadow-2xs focus:ring-2 focus:ring-emerald-500"
                          title="បញ្ចូលចំនួនកុមារក្រុម២ បានចុះឈ្មោះ សរុប"
                        />
                      </td>
                      <td className="p-1 border-r border-slate-200 bg-emerald-50">
                        <input
                          type="number"
                          min={0}
                          value={row.group2EnrolledFemale}
                          onChange={(e) => handlePrimaryEnrolledChange(row.id, 'group2EnrolledFemale', e.target.value)}
                          className="w-11 text-center font-bold text-pink-800 bg-white border border-emerald-400 rounded px-1 py-0.5 shadow-2xs focus:ring-2 focus:ring-pink-500"
                          title="បញ្ចូលចំនួនកុមារក្រុម២ បានចុះឈ្មោះ ស្រី"
                        />
                      </td>

                      {/* Group 2 Remaining Out of School */}
                      <td className="p-1 border-r border-slate-200 bg-rose-50/70 font-extrabold text-rose-900">
                        <span className={row.group2RemainingTotal > 0 ? 'inline-block px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-black' : 'text-slate-400'}>
                          {row.group2RemainingTotal}
                        </span>
                      </td>
                      <td className="p-1 border-r border-slate-200 bg-rose-50/70 text-pink-800 font-bold">
                        {row.group2RemainingFemale}
                      </td>

                      {/* Group 2 Rate % */}
                      <td className="p-1 border-r border-slate-200 bg-blue-100">
                        {getRateBadge(row.group2RateTotal)}
                      </td>
                      <td className="p-1 border-r border-slate-300 bg-blue-100">
                        {getRateBadge(row.group2RateFemale, true)}
                      </td>

                      {/* ========================================================================= */}
                      {/* AGE 6 TO 11 COHORTS                                                       */}
                      {/* ========================================================================= */}
                      {/* Age 6 */}
                      <td className="p-1 border-r border-slate-200">{row.age6CensusTotal}</td>
                      <td className="p-1 border-r border-slate-200 bg-emerald-50/60 font-semibold text-emerald-950">
                        <input
                          type="number"
                          min={0}
                          value={row.age6EnrolledTotal}
                          onChange={(e) => handlePrimaryEnrolledChange(row.id, 'age6EnrolledTotal', e.target.value)}
                          className="w-10 text-center font-bold text-emerald-900 bg-transparent hover:bg-white focus:bg-white border-0 hover:border rounded py-0.5"
                        />
                      </td>
                      <td className="p-1 border-r border-slate-200 text-amber-800 font-medium">{row.age6RemainingTotal}</td>
                      <td className="p-1 border-r border-slate-300 bg-blue-50/50">{getRateBadge(row.age6RateTotal)}</td>

                      {/* Age 7 */}
                      <td className="p-1 border-r border-slate-200">{row.age7CensusTotal}</td>
                      <td className="p-1 border-r border-slate-200 bg-emerald-50/60 font-semibold text-emerald-950">
                        <input
                          type="number"
                          min={0}
                          value={row.age7EnrolledTotal}
                          onChange={(e) => handlePrimaryEnrolledChange(row.id, 'age7EnrolledTotal', e.target.value)}
                          className="w-10 text-center font-bold text-emerald-900 bg-transparent hover:bg-white focus:bg-white border-0 hover:border rounded py-0.5"
                        />
                      </td>
                      <td className="p-1 border-r border-slate-200 text-amber-800 font-medium">{row.age7RemainingTotal}</td>
                      <td className="p-1 border-r border-slate-300 bg-blue-50/50">{getRateBadge(row.age7RateTotal)}</td>

                      {/* Age 8 */}
                      <td className="p-1 border-r border-slate-200">{row.age8CensusTotal}</td>
                      <td className="p-1 border-r border-slate-200 bg-emerald-50/60 font-semibold text-emerald-950">
                        <input
                          type="number"
                          min={0}
                          value={row.age8EnrolledTotal}
                          onChange={(e) => handlePrimaryEnrolledChange(row.id, 'age8EnrolledTotal', e.target.value)}
                          className="w-10 text-center font-bold text-emerald-900 bg-transparent hover:bg-white focus:bg-white border-0 hover:border rounded py-0.5"
                        />
                      </td>
                      <td className="p-1 border-r border-slate-200 text-amber-800 font-medium">{row.age8RemainingTotal}</td>
                      <td className="p-1 border-r border-slate-300 bg-blue-50/50">{getRateBadge(row.age8RateTotal)}</td>

                      {/* Age 9 */}
                      <td className="p-1 border-r border-slate-200">{row.age9CensusTotal}</td>
                      <td className="p-1 border-r border-slate-200 bg-emerald-50/60 font-semibold text-emerald-950">
                        <input
                          type="number"
                          min={0}
                          value={row.age9EnrolledTotal}
                          onChange={(e) => handlePrimaryEnrolledChange(row.id, 'age9EnrolledTotal', e.target.value)}
                          className="w-10 text-center font-bold text-emerald-900 bg-transparent hover:bg-white focus:bg-white border-0 hover:border rounded py-0.5"
                        />
                      </td>
                      <td className="p-1 border-r border-slate-200 text-amber-800 font-medium">{row.age9RemainingTotal}</td>
                      <td className="p-1 border-r border-slate-300 bg-blue-50/50">{getRateBadge(row.age9RateTotal)}</td>

                      {/* Age 10 */}
                      <td className="p-1 border-r border-slate-200">{row.age10CensusTotal}</td>
                      <td className="p-1 border-r border-slate-200 bg-emerald-50/60 font-semibold text-emerald-950">
                        <input
                          type="number"
                          min={0}
                          value={row.age10EnrolledTotal}
                          onChange={(e) => handlePrimaryEnrolledChange(row.id, 'age10EnrolledTotal', e.target.value)}
                          className="w-10 text-center font-bold text-emerald-900 bg-transparent hover:bg-white focus:bg-white border-0 hover:border rounded py-0.5"
                        />
                      </td>
                      <td className="p-1 border-r border-slate-200 text-amber-800 font-medium">{row.age10RemainingTotal}</td>
                      <td className="p-1 border-r border-slate-300 bg-blue-50/50">{getRateBadge(row.age10RateTotal)}</td>

                      {/* Age 11 */}
                      <td className="p-1 border-r border-slate-200">{row.age11CensusTotal}</td>
                      <td className="p-1 border-r border-slate-200 bg-emerald-50/60 font-semibold text-emerald-950">
                        <input
                          type="number"
                          min={0}
                          value={row.age11EnrolledTotal}
                          onChange={(e) => handlePrimaryEnrolledChange(row.id, 'age11EnrolledTotal', e.target.value)}
                          className="w-10 text-center font-bold text-emerald-900 bg-transparent hover:bg-white focus:bg-white border-0 hover:border rounded py-0.5"
                        />
                      </td>
                      <td className="p-1 border-r border-slate-200 text-amber-800 font-medium">{row.age11RemainingTotal}</td>
                      <td className="p-1 border-r border-slate-300 bg-blue-50/50">{getRateBadge(row.age11RateTotal)}</td>

                      {/* ========================================================================= */}
                      {/* PRIMARY SCHOOL TOTAL (AGES 6-11)                                          */}
                      {/* ========================================================================= */}
                      <td className="p-1 border-r border-slate-200 bg-emerald-50/40 font-bold border-l-2 border-emerald-500">{row.primaryCensusTotal}</td>
                      <td className="p-1 border-r border-slate-200 bg-emerald-50/40 text-pink-700">{row.primaryCensusFemale}</td>
                      <td className="p-1 border-r border-slate-200 bg-emerald-100 font-black text-emerald-950 text-sm">{row.primaryEnrolledTotal}</td>
                      <td className="p-1 border-r border-slate-200 bg-emerald-100 font-black text-pink-900 text-sm">{row.primaryEnrolledFemale}</td>
                      <td className="p-1 border-r border-slate-200 bg-rose-50 font-bold text-rose-900">{row.primaryRemainingTotal}</td>
                      <td className="p-1 border-r border-slate-200 bg-rose-50 text-pink-800 font-semibold">{row.primaryRemainingFemale}</td>
                      <td className="p-1 border-r border-slate-200 bg-blue-100 font-black">{getRateBadge(row.primaryRateTotal)}</td>
                      <td className="p-1 border-r border-slate-300 bg-blue-100 font-black">{getRateBadge(row.primaryRateFemale, true)}</td>

                      {/* 12+ Years */}
                      <td className="p-1 border-r border-slate-200">{row.age12PlusCensusTotal}</td>
                      <td className="p-1 border-r border-slate-200 text-pink-700">{row.age12PlusCensusFemale}</td>
                      <td className="p-1 border-r border-slate-200 bg-slate-100 font-bold">{row.age12PlusEnrolledTotal}</td>
                      <td className="p-1 border-r border-slate-300 bg-slate-100 text-pink-700 font-bold">{row.age12PlusEnrolledFemale}</td>

                      {/* Remarks */}
                      <td className="p-1 text-left">
                        <input
                          type="text"
                          value={row.remarks || ''}
                          onChange={(e) => handlePrimaryRemarksChange(row.id, e.target.value)}
                          placeholder="កំណត់សំគាល់..."
                          className="w-full text-xs text-slate-700 bg-transparent hover:bg-slate-100 focus:bg-white rounded px-1.5 py-0.5"
                        />
                      </td>
                    </tr>
                  ))}

                  {/* ========================================================================= */}
                  {/* GRAND TOTAL ROW (សរុបរួម)                                                */}
                  {/* ========================================================================= */}
                  <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-400">
                    <td className="p-2.5 text-left border-r border-slate-300 font-extrabold text-blue-900 sticky left-0 bg-slate-100 z-10 whitespace-nowrap">
                      <span>សរុបរួម</span>
                    </td>

                    {/* Pop */}
                    <td className="p-1.5 border-r border-slate-200 font-black">{primaryGrandTotal.populationTotal.toLocaleString()}</td>
                    <td className="p-1.5 border-r border-slate-300 font-black text-pink-800">{primaryGrandTotal.populationFemale.toLocaleString()}</td>
                    <td className="p-1.5 border-r border-slate-300 font-black bg-slate-200/50">{primaryGrandTotal.householdCount}</td>

                    {/* Group 2 */}
                    <td className="p-1 border-r border-slate-200 bg-indigo-100 font-black text-indigo-950 border-l-2 border-indigo-500">{primaryGrandTotal.group2CensusTotal}</td>
                    <td className="p-1 border-r border-slate-200 bg-indigo-100 font-black text-pink-800">{primaryGrandTotal.group2CensusFemale}</td>
                    <td className="p-1 border-r border-slate-200 bg-emerald-200 font-black text-emerald-950 text-sm">{primaryGrandTotal.group2EnrolledTotal}</td>
                    <td className="p-1 border-r border-slate-200 bg-emerald-200 font-black text-pink-900 text-sm">{primaryGrandTotal.group2EnrolledFemale}</td>
                    <td className="p-1 border-r border-slate-200 bg-rose-100 font-black text-rose-900 text-sm">{primaryGrandTotal.group2RemainingTotal}</td>
                    <td className="p-1 border-r border-slate-200 bg-rose-100 font-black text-pink-800">{primaryGrandTotal.group2RemainingFemale}</td>
                    <td className="p-1 border-r border-slate-200 bg-blue-200 font-black text-sm">{getRateBadge(primaryGrandTotal.group2RateTotal)}</td>
                    <td className="p-1 border-r border-slate-300 bg-blue-200 font-black text-sm">{getRateBadge(primaryGrandTotal.group2RateFemale, true)}</td>

                    {/* Age 6 to 11 Totals */}
                    <td className="p-1 border-r border-slate-200">{primaryGrandTotal.age6CensusTotal}</td>
                    <td className="p-1 border-r border-slate-200 font-bold bg-emerald-100">{primaryGrandTotal.age6EnrolledTotal}</td>
                    <td className="p-1 border-r border-slate-200 text-amber-900 font-bold">{primaryGrandTotal.age6RemainingTotal}</td>
                    <td className="p-1 border-r border-slate-300 bg-blue-100 font-bold">{getRateBadge(primaryGrandTotal.age6RateTotal)}</td>

                    <td className="p-1 border-r border-slate-200">{primaryGrandTotal.age7CensusTotal}</td>
                    <td className="p-1 border-r border-slate-200 font-bold bg-emerald-100">{primaryGrandTotal.age7EnrolledTotal}</td>
                    <td className="p-1 border-r border-slate-200 text-amber-900 font-bold">{primaryGrandTotal.age7RemainingTotal}</td>
                    <td className="p-1 border-r border-slate-300 bg-blue-100 font-bold">{getRateBadge(primaryGrandTotal.age7RateTotal)}</td>

                    <td className="p-1 border-r border-slate-200">{primaryGrandTotal.age8CensusTotal}</td>
                    <td className="p-1 border-r border-slate-200 font-bold bg-emerald-100">{primaryGrandTotal.age8EnrolledTotal}</td>
                    <td className="p-1 border-r border-slate-200 text-amber-900 font-bold">{primaryGrandTotal.age8RemainingTotal}</td>
                    <td className="p-1 border-r border-slate-300 bg-blue-100 font-bold">{getRateBadge(primaryGrandTotal.age8RateTotal)}</td>

                    <td className="p-1 border-r border-slate-200">{primaryGrandTotal.age9CensusTotal}</td>
                    <td className="p-1 border-r border-slate-200 font-bold bg-emerald-100">{primaryGrandTotal.age9EnrolledTotal}</td>
                    <td className="p-1 border-r border-slate-200 text-amber-900 font-bold">{primaryGrandTotal.age9RemainingTotal}</td>
                    <td className="p-1 border-r border-slate-300 bg-blue-100 font-bold">{getRateBadge(primaryGrandTotal.age9RateTotal)}</td>

                    <td className="p-1 border-r border-slate-200">{primaryGrandTotal.age10CensusTotal}</td>
                    <td className="p-1 border-r border-slate-200 font-bold bg-emerald-100">{primaryGrandTotal.age10EnrolledTotal}</td>
                    <td className="p-1 border-r border-slate-200 text-amber-900 font-bold">{primaryGrandTotal.age10RemainingTotal}</td>
                    <td className="p-1 border-r border-slate-300 bg-blue-100 font-bold">{getRateBadge(primaryGrandTotal.age10RateTotal)}</td>

                    <td className="p-1 border-r border-slate-200">{primaryGrandTotal.age11CensusTotal}</td>
                    <td className="p-1 border-r border-slate-200 font-bold bg-emerald-100">{primaryGrandTotal.age11EnrolledTotal}</td>
                    <td className="p-1 border-r border-slate-200 text-amber-900 font-bold">{primaryGrandTotal.age11RemainingTotal}</td>
                    <td className="p-1 border-r border-slate-300 bg-blue-100 font-bold">{getRateBadge(primaryGrandTotal.age11RateTotal)}</td>

                    {/* Primary Total */}
                    <td className="p-1 border-r border-slate-200 bg-emerald-100 font-black border-l-2 border-emerald-500">{primaryGrandTotal.primaryCensusTotal}</td>
                    <td className="p-1 border-r border-slate-200 bg-emerald-100 font-black text-pink-800">{primaryGrandTotal.primaryCensusFemale}</td>
                    <td className="p-1 border-r border-slate-200 bg-emerald-200 font-black text-emerald-950 text-sm">{primaryGrandTotal.primaryEnrolledTotal}</td>
                    <td className="p-1 border-r border-slate-200 bg-emerald-200 font-black text-pink-900 text-sm">{primaryGrandTotal.primaryEnrolledFemale}</td>
                    <td className="p-1 border-r border-slate-200 bg-rose-100 font-black text-rose-900 text-sm">{primaryGrandTotal.primaryRemainingTotal}</td>
                    <td className="p-1 border-r border-slate-200 bg-rose-100 font-black text-pink-800 text-sm">{primaryGrandTotal.primaryRemainingFemale}</td>
                    <td className="p-1 border-r border-slate-200 bg-blue-200 font-black text-sm">{getRateBadge(primaryGrandTotal.primaryRateTotal)}</td>
                    <td className="p-1 border-r border-slate-300 bg-blue-200 font-black text-sm">{getRateBadge(primaryGrandTotal.primaryRateFemale, true)}</td>

                    {/* 12+ Years */}
                    <td className="p-1 border-r border-slate-200 font-bold">{primaryGrandTotal.age12PlusCensusTotal}</td>
                    <td className="p-1 border-r border-slate-200 text-pink-800 font-bold">{primaryGrandTotal.age12PlusCensusFemale}</td>
                    <td className="p-1 border-r border-slate-200 bg-slate-200 font-black">{primaryGrandTotal.age12PlusEnrolledTotal}</td>
                    <td className="p-1 border-r border-slate-300 bg-slate-200 text-pink-800 font-black">{primaryGrandTotal.age12PlusEnrolledFemale}</td>

                    <td className="p-1 text-slate-500 italic text-xs">សរុបទាំងមូល</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: PRE-SCHOOL (AGE 3-5 YEARS) COMPARISON TABLE                       */}
      {/* ========================================================================= */}
      {activeMode === 'preschool' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  {language === 'km' 
                    ? 'តារាងប្រៀបធៀប៖ ទិន្នន័យកុមារមត្តេយ្យក្នុងភូមិ និង ចំនួនសិស្សចុះឈ្មោះចូលរៀន (៣-៥ ឆ្នាំ)' 
                    : 'Comparison Table: Village Census vs Enrolled Students (Ages 3-5)'}
                </h3>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                ឯកសារភ្ជាប់ MoEYS Sheet
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-[10px] text-center border-collapse leading-tight font-khmer">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 font-bold">
                    <th rowSpan={3} className="py-1 px-1.5 text-left border-r border-slate-300 min-w-[115px] sticky left-0 bg-slate-100 z-20">
                      {language === 'km' ? 'ឈ្មោះភូមិរដ្ឋបាលចំណុះអោយសាលា' : 'Feeder Village Name'}
                    </th>
                    <th colSpan={2} rowSpan={2} className="p-2 border-r border-slate-300 bg-slate-50">
                      {language === 'km' ? 'ចំនួនប្រជាជន' : 'Population'}
                    </th>
                    <th rowSpan={3} className="p-2 border-r border-slate-300 bg-slate-50 min-w-[70px]">
                      {language === 'km' ? 'ចំនួនគ្រួសារ' : 'Households'}
                    </th>
                    <th colSpan={16} className="p-2 border-r border-slate-300 bg-amber-50 text-amber-950">
                      {language === 'km' ? 'ទិន្ន័យកុមារក្នុងភូមិ' : 'Children in Village'}
                    </th>
                    <th colSpan={8} className="p-2 border-r border-slate-300 bg-emerald-100 text-emerald-950 border-l-2 border-emerald-500 font-black">
                      {language === 'km' ? 'ចំនួនសិស្សបានចុះឈ្មោះចូលរៀន ឆ្នាំសិក្សា ២០២៦-២០២៧' : 'Enrolled Students 2026-2027'}
                    </th>
                    <th colSpan={8} className="p-2 border-r border-slate-300 bg-blue-100 text-blue-950 font-black">
                      {language === 'km' ? '% ទិន្ន័យការមាន៣-៥ បានចុះឈ្មោះចូលរៀន' : '% Enrolled Rate (Ages 3-5)'}
                    </th>
                    <th rowSpan={3} className="p-2 bg-slate-50 min-w-[150px]">
                      {language === 'km' ? 'កំណត់សំគាល់' : 'Remarks'}
                    </th>
                  </tr>

                  <tr className="bg-slate-50 text-slate-700 border-b border-slate-300 font-bold text-[11px]">
                    <th colSpan={2} className="p-1 border-r border-slate-300 bg-amber-50/70">0 ឆ្នាំ</th>
                    <th colSpan={2} className="p-1 border-r border-slate-300 bg-amber-50/70">១ឆ្នាំ</th>
                    <th colSpan={2} className="p-1 border-r border-slate-300 bg-amber-50/70">២ឆ្នាំ</th>
                    <th colSpan={2} className="p-1 border-r border-slate-300 bg-amber-100 font-extrabold">០-២ឆ្នាំ</th>
                    <th colSpan={2} className="p-1 border-r border-slate-300 bg-amber-50/70">៣ឆ្នាំ</th>
                    <th colSpan={2} className="p-1 border-r border-slate-300 bg-amber-50/70">៤ឆ្នាំ</th>
                    <th colSpan={2} className="p-1 border-r border-slate-300 bg-amber-50/70">៥ឆ្នាំ</th>
                    <th colSpan={2} className="p-1 border-r border-slate-300 bg-amber-200 font-black">៣-៥ឆ្នាំ</th>

                    <th colSpan={2} className="p-1 border-r border-slate-300 bg-emerald-50 border-l-2 border-emerald-500 font-bold">៣ឆ្នាំ</th>
                    <th colSpan={2} className="p-1 border-r border-slate-300 bg-emerald-50 font-bold">៤ឆ្នាំ</th>
                    <th colSpan={2} className="p-1 border-r border-slate-300 bg-emerald-50 font-bold">៥ឆ្នាំ</th>
                    <th colSpan={2} className="p-1 border-r border-slate-300 bg-emerald-200 font-black">៣-៥ឆ្នាំ</th>

                    <th colSpan={2} className="p-1 border-r border-slate-300 bg-blue-50 font-bold">៣ឆ្នាំ</th>
                    <th colSpan={2} className="p-1 border-r border-slate-300 bg-blue-50 font-bold">៤ឆ្នាំ</th>
                    <th colSpan={2} className="p-1 border-r border-slate-300 bg-blue-50 font-bold">៥ឆ្នាំ</th>
                    <th colSpan={2} className="p-1 border-r border-slate-300 bg-blue-200 font-black">៣-៥ឆ្នាំ</th>
                  </tr>

                  <tr className="bg-slate-100 text-slate-600 border-b border-slate-300 text-[10px]">
                    <th className="p-1 border-r border-slate-200">សរុប</th><th className="p-1 border-r border-slate-300 text-pink-700">ស្រី</th>
                    <th className="p-1 border-r border-slate-200">សរុប</th><th className="p-1 border-r border-slate-300 text-pink-700">ស្រី</th>
                    <th className="p-1 border-r border-slate-200">សរុប</th><th className="p-1 border-r border-slate-300 text-pink-700">ស្រី</th>
                    <th className="p-1 border-r border-slate-200">សរុប</th><th className="p-1 border-r border-slate-300 text-pink-700">ស្រី</th>
                    <th className="p-1 border-r border-slate-200 bg-amber-100 font-bold">សរុប</th><th className="p-1 border-r border-slate-300 bg-amber-100 text-pink-800 font-bold">ស្រី</th>
                    <th className="p-1 border-r border-slate-200">សរុប</th><th className="p-1 border-r border-slate-300 text-pink-700">ស្រី</th>
                    <th className="p-1 border-r border-slate-200">សរុប</th><th className="p-1 border-r border-slate-300 text-pink-700">ស្រី</th>
                    <th className="p-1 border-r border-slate-200">សរុប</th><th className="p-1 border-r border-slate-300 text-pink-700">ស្រី</th>
                    <th className="p-1 border-r border-slate-300 bg-amber-200 font-black">សរុប</th><th className="p-1 border-r border-slate-300 bg-amber-200 text-pink-900 font-black">ស្រី</th>

                    <th className="p-1 border-r border-slate-200 bg-emerald-100 border-l-2 border-emerald-500 font-bold">សរុប</th><th className="p-1 border-r border-slate-300 bg-emerald-100 text-pink-800 font-bold">ស្រី</th>
                    <th className="p-1 border-r border-slate-200 bg-emerald-100 font-bold">សរុប</th><th className="p-1 border-r border-slate-300 bg-emerald-100 text-pink-800 font-bold">ស្រី</th>
                    <th className="p-1 border-r border-slate-200 bg-emerald-100 font-bold">សរុប</th><th className="p-1 border-r border-slate-300 bg-emerald-100 text-pink-800 font-bold">ស្រី</th>
                    <th className="p-1 border-r border-slate-200 bg-emerald-200 font-black">សរុប</th><th className="p-1 border-r border-slate-300 bg-emerald-200 text-pink-900 font-black">ស្រី</th>

                    <th className="p-1 border-r border-slate-200 bg-blue-50 font-bold">សរុប</th><th className="p-1 border-r border-slate-300 bg-blue-50 text-pink-800 font-bold">ស្រី</th>
                    <th className="p-1 border-r border-slate-200 bg-blue-50 font-bold">សរុប</th><th className="p-1 border-r border-slate-300 bg-blue-50 text-pink-800 font-bold">ស្រី</th>
                    <th className="p-1 border-r border-slate-200 bg-blue-50 font-bold">សរុប</th><th className="p-1 border-r border-slate-300 bg-blue-50 text-pink-800 font-bold">ស្រី</th>
                    <th className="p-1 border-r border-slate-200 bg-blue-200 font-black">សរុប</th><th className="p-1 border-r border-slate-300 bg-blue-200 text-pink-900 font-black">ស្រី</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {preschoolRows.map(row => (
                    <tr key={row.id} className="hover:bg-slate-50 transition group">
                      <td className="py-1 px-1.5 text-left border-r border-slate-300 font-bold text-slate-900 sticky left-0 bg-white group-hover:bg-slate-50 z-10 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${row.villageName.includes('មុខឈ្នាង') ? 'bg-amber-500' : 'bg-blue-600'}`} />
                          <span>{row.villageName}</span>
                        </div>
                      </td>

                      <td className="p-1.5 border-r border-slate-200 font-semibold">{row.populationTotal}</td>
                      <td className="p-1.5 border-r border-slate-300 text-pink-700">{row.populationFemale}</td>
                      <td className="p-1.5 border-r border-slate-300 font-bold bg-slate-50/50">{row.householdCount}</td>

                      <td className="p-1 border-r border-slate-200">{row.age0Total}</td><td className="p-1 border-r border-slate-300 text-pink-600">{row.age0Female}</td>
                      <td className="p-1 border-r border-slate-200">{row.age1Total}</td><td className="p-1 border-r border-slate-300 text-pink-600">{row.age1Female}</td>
                      <td className="p-1 border-r border-slate-200">{row.age2Total}</td><td className="p-1 border-r border-slate-300 text-pink-600">{row.age2Female}</td>
                      <td className="p-1 border-r border-slate-200 bg-amber-50 font-bold">{row.age0to2Total}</td><td className="p-1 border-r border-slate-300 bg-amber-50 text-pink-700 font-bold">{row.age0to2Female}</td>

                      <td className="p-1 border-r border-slate-200">{row.age3Total}</td><td className="p-1 border-r border-slate-300 text-pink-600">{row.age3Female}</td>
                      <td className="p-1 border-r border-slate-200">{row.age4Total}</td><td className="p-1 border-r border-slate-300 text-pink-600">{row.age4Female}</td>
                      <td className="p-1 border-r border-slate-200">{row.age5Total}</td><td className="p-1 border-r border-slate-300 text-pink-600">{row.age5Female}</td>
                      <td className="p-1 border-r border-slate-300 bg-amber-100 font-black">{row.age3to5Total}</td><td className="p-1 border-r border-slate-300 bg-amber-100 text-pink-800 font-black">{row.age3to5Female}</td>

                      {/* Editable Enrolled 3-5 */}
                      <td className="p-1 border-r border-slate-200 bg-emerald-50 border-l-2 border-emerald-500">
                        <input
                          type="number"
                          min={0}
                          value={row.enrolled3Total}
                          onChange={(e) => handlePreschoolEnrolledChange(row.id, 'enrolled3Total', e.target.value)}
                          className="w-11 text-center font-bold text-emerald-950 bg-white border border-emerald-400 rounded px-1 py-0.5 shadow-2xs focus:ring-2 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="p-1 border-r border-slate-300 bg-emerald-50">
                        <input
                          type="number"
                          min={0}
                          value={row.enrolled3Female}
                          onChange={(e) => handlePreschoolEnrolledChange(row.id, 'enrolled3Female', e.target.value)}
                          className="w-11 text-center font-bold text-pink-800 bg-white border border-emerald-400 rounded px-1 py-0.5 shadow-2xs focus:ring-2 focus:ring-pink-500"
                        />
                      </td>

                      <td className="p-1 border-r border-slate-200 bg-emerald-50">
                        <input
                          type="number"
                          min={0}
                          value={row.enrolled4Total}
                          onChange={(e) => handlePreschoolEnrolledChange(row.id, 'enrolled4Total', e.target.value)}
                          className="w-11 text-center font-bold text-emerald-950 bg-white border border-emerald-400 rounded px-1 py-0.5 shadow-2xs focus:ring-2 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="p-1 border-r border-slate-300 bg-emerald-50">
                        <input
                          type="number"
                          min={0}
                          value={row.enrolled4Female}
                          onChange={(e) => handlePreschoolEnrolledChange(row.id, 'enrolled4Female', e.target.value)}
                          className="w-11 text-center font-bold text-pink-800 bg-white border border-emerald-400 rounded px-1 py-0.5 shadow-2xs focus:ring-2 focus:ring-pink-500"
                        />
                      </td>

                      <td className="p-1 border-r border-slate-200 bg-emerald-50">
                        <input
                          type="number"
                          min={0}
                          value={row.enrolled5Total}
                          onChange={(e) => handlePreschoolEnrolledChange(row.id, 'enrolled5Total', e.target.value)}
                          className="w-11 text-center font-bold text-emerald-950 bg-white border border-emerald-400 rounded px-1 py-0.5 shadow-2xs focus:ring-2 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="p-1 border-r border-slate-300 bg-emerald-50">
                        <input
                          type="number"
                          min={0}
                          value={row.enrolled5Female}
                          onChange={(e) => handlePreschoolEnrolledChange(row.id, 'enrolled5Female', e.target.value)}
                          className="w-11 text-center font-bold text-pink-800 bg-white border border-emerald-400 rounded px-1 py-0.5 shadow-2xs focus:ring-2 focus:ring-pink-500"
                        />
                      </td>

                      <td className="p-1 border-r border-slate-200 bg-emerald-100 font-black text-emerald-950 text-sm">{row.enrolled3to5Total}</td>
                      <td className="p-1 border-r border-slate-300 bg-emerald-100 font-black text-pink-900 text-sm">{row.enrolled3to5Female}</td>

                      <td className="p-1 border-r border-slate-200 bg-blue-50">{getRateBadge(row.rate3Total)}</td>
                      <td className="p-1 border-r border-slate-300 bg-blue-50">{getRateBadge(row.rate3Female, true)}</td>
                      <td className="p-1 border-r border-slate-200 bg-blue-50">{getRateBadge(row.rate4Total)}</td>
                      <td className="p-1 border-r border-slate-300 bg-blue-50">{getRateBadge(row.rate4Female, true)}</td>
                      <td className="p-1 border-r border-slate-200 bg-blue-50">{getRateBadge(row.rate5Total)}</td>
                      <td className="p-1 border-r border-slate-300 bg-blue-50">{getRateBadge(row.rate5Female, true)}</td>
                      <td className="p-1 border-r border-slate-200 bg-blue-100 font-black">{getRateBadge(row.rate3to5Total)}</td>
                      <td className="p-1 border-r border-slate-300 bg-blue-100 font-black">{getRateBadge(row.rate3to5Female, true)}</td>

                      <td className="p-1 text-left">
                        <input
                          type="text"
                          value={row.remarks || ''}
                          onChange={(e) => handlePreschoolRemarksChange(row.id, e.target.value)}
                          placeholder="កំណត់សំគាល់..."
                          className="w-full text-xs text-slate-700 bg-transparent hover:bg-slate-100 focus:bg-white rounded px-1.5 py-0.5"
                        />
                      </td>
                    </tr>
                  ))}

                  <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-400">
                    <td className="p-2.5 text-left border-r border-slate-300 font-extrabold text-blue-900 sticky left-0 bg-slate-100 z-10 whitespace-nowrap">
                      <span>សរុបរួម</span>
                    </td>
                    <td className="p-1.5 border-r border-slate-200 font-black">{preschoolGrandTotal.populationTotal.toLocaleString()}</td>
                    <td className="p-1.5 border-r border-slate-300 font-black text-pink-800">{preschoolGrandTotal.populationFemale.toLocaleString()}</td>
                    <td className="p-1.5 border-r border-slate-300 font-black bg-slate-200/50">{preschoolGrandTotal.householdCount}</td>

                    <td className="p-1 border-r border-slate-200">{preschoolGrandTotal.age0Total}</td><td className="p-1 border-r border-slate-300 text-pink-700">{preschoolGrandTotal.age0Female}</td>
                    <td className="p-1 border-r border-slate-200">{preschoolGrandTotal.age1Total}</td><td className="p-1 border-r border-slate-300 text-pink-700">{preschoolGrandTotal.age1Female}</td>
                    <td className="p-1 border-r border-slate-200">{preschoolGrandTotal.age2Total}</td><td className="p-1 border-r border-slate-300 text-pink-700">{preschoolGrandTotal.age2Female}</td>
                    <td className="p-1 border-r border-slate-200 bg-amber-100 font-black">{preschoolGrandTotal.age0to2Total}</td><td className="p-1 border-r border-slate-300 bg-amber-100 text-pink-800 font-black">{preschoolGrandTotal.age0to2Female}</td>
                    <td className="p-1 border-r border-slate-200">{preschoolGrandTotal.age3Total}</td><td className="p-1 border-r border-slate-300 text-pink-700">{preschoolGrandTotal.age3Female}</td>
                    <td className="p-1 border-r border-slate-200">{preschoolGrandTotal.age4Total}</td><td className="p-1 border-r border-slate-300 text-pink-700">{preschoolGrandTotal.age4Female}</td>
                    <td className="p-1 border-r border-slate-200">{preschoolGrandTotal.age5Total}</td><td className="p-1 border-r border-slate-300 text-pink-700">{preschoolGrandTotal.age5Female}</td>
                    <td className="p-1 border-r border-slate-300 bg-amber-200 font-black">{preschoolGrandTotal.age3to5Total}</td><td className="p-1 border-r border-slate-300 bg-amber-200 text-pink-900 font-black">{preschoolGrandTotal.age3to5Female}</td>

                    <td className="p-1 border-r border-slate-200 bg-emerald-100 font-black border-l-2 border-emerald-500">{preschoolGrandTotal.enrolled3Total}</td>
                    <td className="p-1 border-r border-slate-300 bg-emerald-100 font-black text-pink-900">{preschoolGrandTotal.enrolled3Female}</td>
                    <td className="p-1 border-r border-slate-200 bg-emerald-100 font-black">{preschoolGrandTotal.enrolled4Total}</td>
                    <td className="p-1 border-r border-slate-300 bg-emerald-100 font-black text-pink-900">{preschoolGrandTotal.enrolled4Female}</td>
                    <td className="p-1 border-r border-slate-200 bg-emerald-100 font-black">{preschoolGrandTotal.enrolled5Total}</td>
                    <td className="p-1 border-r border-slate-300 bg-emerald-100 font-black text-pink-900">{preschoolGrandTotal.enrolled5Female}</td>
                    <td className="p-1 border-r border-slate-200 bg-emerald-200 font-black text-sm">{preschoolGrandTotal.enrolled3to5Total}</td>
                    <td className="p-1 border-r border-slate-300 bg-emerald-200 font-black text-pink-900 text-sm">{preschoolGrandTotal.enrolled3to5Female}</td>

                    <td className="p-1 border-r border-slate-200 bg-blue-100">{getRateBadge(preschoolGrandTotal.rate3Total)}</td>
                    <td className="p-1 border-r border-slate-300 bg-blue-100">{getRateBadge(preschoolGrandTotal.rate3Female, true)}</td>
                    <td className="p-1 border-r border-slate-200 bg-blue-100">{getRateBadge(preschoolGrandTotal.rate4Total)}</td>
                    <td className="p-1 border-r border-slate-300 bg-blue-100">{getRateBadge(preschoolGrandTotal.rate4Female, true)}</td>
                    <td className="p-1 border-r border-slate-200 bg-blue-100">{getRateBadge(preschoolGrandTotal.rate5Total)}</td>
                    <td className="p-1 border-r border-slate-300 bg-blue-100">{getRateBadge(preschoolGrandTotal.rate5Female, true)}</td>
                    <td className="p-1 border-r border-slate-200 bg-blue-200 font-black text-sm">{getRateBadge(preschoolGrandTotal.rate3to5Total)}</td>
                    <td className="p-1 border-r border-slate-300 bg-blue-200 font-black text-sm">{getRateBadge(preschoolGrandTotal.rate3to5Female, true)}</td>

                    <td className="p-1 text-slate-500 italic text-xs">សរុបទាំងមូល</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: WHOLE-SCHOOL STATISTICS DISPLAY (Requested by user)              */}
      {/* ========================================================================= */}
      {activeMode === 'school-stats' && (
        <div className="space-y-6">
          {/* School Overview Banner */}
          <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-blue-900 rounded-2xl p-6 text-white shadow-xl border border-indigo-800/40">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                    សាលាបឋមសិក្សា រោគ • កម្រងស្ពានស្រែង
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-400/20 text-blue-300 border border-blue-400/30">
                    កូដសាលា៖ 01030401017
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-2">
                  {language === 'km' ? 'ស្ថិតិទូទាំងសាលារៀន និងប្រៀបធៀបកុមារក្នុងតំបន់សេវា' : 'School-Wide Enrollment & Catchment Statistics'}
                </h2>
                <p className="text-sm text-indigo-200/90 mt-1 max-w-2xl">
                  {language === 'km' 
                    ? `ទិន្នន័យសរុបសិស្សដែលកំពុងរៀននៅសាលាបឋមសិក្សារោគ សរុប ${schoolStats.totalStudents} នាក់ (ស្រី ${schoolStats.totalFemales} នាក់ ស្មើនឹង ${schoolStats.femalePercentage}%) ចែកចេញជា ${schoolStats.gradeStats.length} កម្រិតថ្នាក់ និង ${schoolStats.totalClasses} បន្ទប់/ក្រុម។`
                    : `Total enrolled students at Rouk Primary School: ${schoolStats.totalStudents} (${schoolStats.totalFemales} girls, ${schoolStats.femalePercentage}%) across ${schoolStats.gradeStats.length} grades and ${schoolStats.totalClasses} sections.`}
                </p>
              </div>

              {/* Gender Parity Big Badge */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-center min-w-[200px] self-start md:self-auto">
                <span className="text-xs text-blue-200 font-semibold">{language === 'km' ? 'សមាមាត្រសិស្សស្រី' : 'Female Parity'}</span>
                <div className="text-3xl font-black text-pink-300 mt-1">{schoolStats.femalePercentage}%</div>
                <span className="text-[11px] text-emerald-300 font-medium">{schoolStats.totalFemales} ស្រី / {schoolStats.totalStudents} សរុប</span>
              </div>
            </div>

            {/* 4 Cards Key Performance Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/15">
              <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/10">
                <div className="flex items-center gap-1.5 text-xs text-blue-200">
                  <GraduationCap className="w-4 h-4 text-blue-300" />
                  <span>សិស្សកំពុងរៀនសរុប</span>
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-white">{schoolStats.totalStudents}</span>
                  <span className="text-xs text-pink-300">({schoolStats.totalFemales} ស្រី)</span>
                </div>
                <p className="text-[10px] text-blue-200 mt-0.5">មត្តេយ្យ & បឋមសិក្សា</p>
              </div>

              <div className="bg-emerald-500/20 backdrop-blur-xs rounded-xl p-3 border border-emerald-400/30">
                <div className="flex items-center gap-1.5 text-xs text-emerald-200 font-semibold">
                  <UserCheck className="w-4 h-4 text-emerald-300" />
                  <span>កុមារក្រុម២ (៧០-៨២ខែ) រៀន</span>
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-white">{schoolStats.group2.enrolledTotal}</span>
                  <span className="text-xs text-emerald-200 font-medium">({schoolStats.group2.enrolledFemale} ស្រី)</span>
                </div>
                <p className="text-[10px] text-emerald-300 mt-0.5">សម្រេច {schoolStats.group2.enrollmentRate}% នៃជំរឿន</p>
              </div>

              <div className="bg-rose-500/20 backdrop-blur-xs rounded-xl p-3 border border-rose-400/30">
                <div className="flex items-center gap-1.5 text-xs text-rose-200 font-semibold">
                  <UserX className="w-4 h-4 text-rose-300" />
                  <span>ក្រុម២ នៅសល់មិនទាន់ចុះឈ្មោះ</span>
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-rose-100">{schoolStats.group2.remainingTotal}</span>
                  <span className="text-xs text-rose-200 font-medium">({schoolStats.group2.remainingFemale} ស្រី)</span>
                </div>
                <p className="text-[10px] text-rose-300 mt-0.5">សិស្សមិនទាន់មានក្នុងបញ្ជីថ្នាក់ទី១</p>
              </div>

              <div className="bg-amber-500/20 backdrop-blur-xs rounded-xl p-3 border border-amber-400/30">
                <div className="flex items-center gap-1.5 text-xs text-amber-200 font-semibold">
                  <HeartHandshake className="w-4 h-4 text-amber-300" />
                  <span>សិស្សមានប័ណ្ណក្រីក្រ</span>
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-white">{schoolStats.equity.idPoorTotal}</span>
                  <span className="text-xs text-amber-200">({schoolStats.equity.idPoorPercentage}%)</span>
                </div>
                <p className="text-[10px] text-amber-300 mt-0.5">ក្រ១, ក្រ២ និងងាយរងគ្រោះ</p>
              </div>
            </div>
          </div>

          {/* Grid Layout: Grade Statistics & Village Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Grade-by-Grade Breakdown Table (2 Columns wide) */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    {language === 'km' ? 'ស្ថិតិសិស្សតាមកម្រិតថ្នាក់ (Enrollment by Grade)' : 'Enrollment by Grade'}
                  </h3>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {schoolStats.gradeStats.length} កម្រិតថ្នាក់
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                      <th className="p-2.5">កម្រិតថ្នាក់ (Grade)</th>
                      <th className="p-2.5 text-center">បន្ទប់/ក្រុម</th>
                      <th className="p-2.5 text-center font-bold">សិស្សសរុប</th>
                      <th className="p-2.5 text-center text-pink-700">សិស្សស្រី</th>
                      <th className="p-2.5 text-center">% សិស្សស្រី</th>
                      <th className="p-2.5 text-right min-w-[120px]">សមាមាត្រសិស្សក្នុងសាលា</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {schoolStats.gradeStats.map(g => {
                      const shareRate = schoolStats.totalStudents > 0 
                        ? parseFloat(((g.total / schoolStats.totalStudents) * 100).toFixed(1)) 
                        : 0;
                      return (
                        <tr key={g.gradeName} className="hover:bg-slate-50/80 transition">
                          <td className="p-2.5 font-bold text-slate-900 flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${g.gradeName === 'ថ្នាក់ទី១' ? 'bg-amber-500' : 'bg-blue-600'}`} />
                            <span>{g.gradeName}</span>
                            {g.gradeName === 'ថ្នាក់ទី១' && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-900 font-bold border border-amber-300">
                                ក្រុម២
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 text-center text-slate-600 font-medium">
                            {g.sections.join(', ')} ({g.sections.length} បន្ទប់)
                          </td>
                          <td className="p-2.5 text-center font-black text-slate-900 text-sm">
                            {g.total}
                          </td>
                          <td className="p-2.5 text-center font-bold text-pink-700">
                            {g.female}
                          </td>
                          <td className="p-2.5 text-center">
                            <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                              g.femaleRate >= 45 && g.femaleRate <= 55 
                                ? 'bg-emerald-100 text-emerald-900' 
                                : 'bg-blue-100 text-blue-900'
                            }`}>
                              {g.femaleRate}%
                            </span>
                          </td>
                          <td className="p-2.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-[11px] text-slate-500 font-medium">{shareRate}%</span>
                              <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                                <div 
                                  className="bg-indigo-600 h-full rounded-full" 
                                  style={{ width: `${Math.min(100, shareRate)}%` }}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-300">
                      <td className="p-2.5 text-blue-950 font-black">សរុបរួមទាំងសាលា</td>
                      <td className="p-2.5 text-center text-slate-700">{schoolStats.totalClasses} បន្ទប់</td>
                      <td className="p-2.5 text-center text-blue-950 text-sm font-black">{schoolStats.totalStudents}</td>
                      <td className="p-2.5 text-center text-pink-800 text-sm font-black">{schoolStats.totalFemales}</td>
                      <td className="p-2.5 text-center text-pink-900 font-black">{schoolStats.femalePercentage}%</td>
                      <td className="p-2.5 text-right text-slate-700">១០០%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Feeder Village Distribution Card (1 Column wide) */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    {language === 'km' ? 'ប្រភពសិស្សតាមភូមិ' : 'Student Origin by Village'}
                  </h3>
                </div>
              </div>

              <div className="space-y-3">
                {schoolStats.villageStats.map(v => (
                  <div key={v.villageName} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs sm:text-sm">
                        <span className={`w-2 h-2 rounded-full ${
                          v.villageName.includes('មុខឈ្នាង') ? 'bg-amber-500' : v.villageName.includes('រោគ') ? 'bg-blue-600' : 'bg-purple-500'
                        }`} />
                        <span>{v.villageName}</span>
                      </div>
                      <span className="text-xs font-black text-slate-900">
                        {v.total} នាក់ ({v.percentage}%)
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          v.villageName.includes('មុខឈ្នាង') ? 'bg-amber-500' : v.villageName.includes('រោគ') ? 'bg-blue-600' : 'bg-purple-500'
                        }`}
                        style={{ width: `${Math.min(100, v.percentage)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>{language === 'km' ? `សិស្សស្រី៖ ${v.female} នាក់` : `Female: ${v.female}`}</span>
                      <span>{language === 'km' ? `សមាមាត្រ៖ ${v.percentage}%` : `${v.percentage}% share`}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Health & Nutrition Equity Box */}
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-blue-600" />
                  <span>{language === 'km' ? 'សុខភាព និងសមធម៌សិស្ស' : 'Health & Equity Status'}</span>
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200">
                    <span className="text-amber-800 text-[11px] font-medium block">ប័ណ្ណក្រីក្រ (ID-Poor)</span>
                    <span className="text-base font-black text-amber-950">{schoolStats.equity.idPoorTotal} នាក់</span>
                  </div>
                  <div className="p-2.5 bg-blue-50 rounded-lg border border-blue-200">
                    <span className="text-blue-800 text-[11px] font-medium block">ពិនិត្យភ្នែក (Eye Issues)</span>
                    <span className="text-base font-black text-blue-950">{schoolStats.equity.eyeIssuesTotal} នាក់</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Drilldown List: Remaining Group 2 Children (Out-of-school roster for mobilization) */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <UserX className="w-5 h-5 text-rose-600" />
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    {language === 'km' ? 'បញ្ជីកុមារ ក្រុម២ (៧០-៨២ ខែ) ដែលនៅសល់មិនទាន់ចុះឈ្មោះចូលរៀន' : 'Remaining Group 2 Children Roster (Out-of-School Target)'}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {language === 'km'
                    ? `មានកុមារចំនួន ${remainingGroup2Children.length} នាក់ ក្នុងទិន្នន័យជំរឿនពិត ដែលត្រូវប្រមូលមកចុះឈ្មោះចូលរៀនថ្នាក់ទី១ នៅសាលាបឋមសិក្សារោគ`
                    : `Identified ${remainingGroup2Children.length} children from census who need to be mobilized into Grade 1`}
                </p>
              </div>

              {/* Search filter for remaining children */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={remainingSearchQuery}
                  onChange={(e) => setRemainingSearchQuery(e.target.value)}
                  placeholder={language === 'km' ? 'ស្វែងរកតាមឈ្មោះ, ខ្នងផ្ទះ, ភូមិ...' : 'Search name, household...'}
                  className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {remainingGroup2Children.length === 0 ? (
              <div className="text-center py-8 text-slate-500 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="font-bold text-sm text-slate-700">
                  {language === 'km' ? 'អបអរសាទរ! កុមារក្រុម២ ទាំងអស់បានចុះឈ្មោះចូលរៀនរួចរាល់ ១០០%' : 'All Group 2 children have been enrolled!'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[10px] text-left border-collapse leading-tight font-khmer">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[9.5px]">
                      <th className="py-1 px-1.5 w-8 text-center">ល.រ</th>
                      <th className="py-1 px-1.5 min-w-[110px]">គោត្តនាម និង នាម</th>
                      <th className="py-1 px-1 text-center w-10">ភេទ</th>
                      <th className="py-1 px-1.5 w-20">ថ្ងៃខែឆ្នាំកំណើត</th>
                      <th className="py-1 px-1.5 text-center w-16">អាយុ (ខែ)</th>
                      <th className="py-1 px-1.5 w-20">លេខកូដខ្នងផ្ទះ</th>
                      <th className="py-1 px-1.5 min-w-[70px]">ភូមិ</th>
                      <th className="py-1 px-1.5 min-w-[85px]">ទំនាក់ទំនងគ្រួសារ</th>
                      <th className="py-1 px-1.5 text-center w-14">សកម្មភាព</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {remainingGroup2Children.map((c, idx) => {
                      const mos = calculateAgeInMonths(c.dob, c.age);
                      return (
                        <tr key={c.id} className="hover:bg-amber-50/50 transition">
                          <td className="py-1 px-1.5 text-slate-500 font-mono text-center">{idx + 1}</td>
                          <td className="py-1 px-1.5 font-bold text-slate-900">{c.name}</td>
                          <td className="py-1 px-1 text-center font-bold">
                            <span className={c.gender === 'ស្រី' ? 'text-pink-700' : 'text-blue-700'}>
                              {c.gender}
                            </span>
                          </td>
                          <td className="py-1 px-1.5 text-slate-600 font-mono">{c.dob || '—'}</td>
                          <td className="py-1 px-1.5 text-center font-black text-indigo-700">{mos} ខែ</td>
                          <td className="py-1 px-1.5 font-mono text-slate-700 bg-slate-50/80 font-bold">
                            {c.householdCode || c.householdId}
                          </td>
                          <td className="py-1 px-1.5 font-medium text-slate-800">
                            <span className={`px-1.5 py-0.2 rounded text-[9.5px] font-semibold ${
                              c.village === 'មុខឈ្នាង' ? 'bg-amber-100 text-amber-900' : 'bg-blue-100 text-blue-900'
                            }`}>
                              {c.village || 'រោគ'}
                            </span>
                          </td>
                          <td className="py-1 px-1.5 text-slate-600">{c.relationship || 'កូន'}</td>
                          <td className="py-1 px-1.5 text-center">
                            {onSelectCitizen && (
                              <button
                                onClick={() => onSelectCitizen(c)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold text-[10px] shadow-2xs transition"
                              >
                                <span>{language === 'km' ? 'ព័ត៌មាន' : 'View'}</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Official Signatures Section for Official Reports */}
      <OfficialSignatureSection
        language={language}
        defaultLocation="រោគ"
        reportType="school"
      />
    </div>
  );
};
