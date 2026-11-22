import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Download, 
  Printer, 
  RotateCcw, 
  Save, 
  CheckCircle2, 
  School, 
  MapPin, 
  Edit3, 
  Users, 
  GraduationCap, 
  Baby, 
  RefreshCw,
  BarChart3,
  Award,
  Eye,
  HeartHandshake,
  UserCheck,
  UserX,
  Search,
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
  Info
} from 'lucide-react';
import { User } from 'firebase/auth';
import { Citizen, Language } from '../types/census';
import { StudentRecord } from '../types/student';
import { 
  VillageComparisonRow, 
  PrimaryVillageComparisonRow,
  VillageMigrationOverride,
  VillageMigrationOverrideMap,
  VillageAgeMigrationRow
} from '../types/comparison';
import { 
  loadSavedComparisonRows, 
  saveComparisonRows, 
  computeRowRates, 
  computeGrandTotal, 
  generatePreschoolBaseline,
  syncPreschoolRowsWithSystemData,
  exportComparisonToCSV,
  DEFAULT_COMPARISON_ROWS,
  loadSavedPrimaryComparisonRows,
  savePrimaryComparisonRows,
  computePrimaryRowRates,
  computePrimaryGrandTotal,
  generatePrimaryBaseline,
  syncPrimaryRowsWithSystemData,
  exportPrimaryComparisonToCSV,
  computeSchoolWideStatistics,
  loadMigrationOverrides,
  saveMigrationOverrides,
  computeVillageAgeMigrationRows,
  exportMigrationAnalysisToCSV
} from '../utils/comparisonData';
import { calculateAgeInMonths } from '../utils/enrollmentUtils';
import { OfficialReportHeader } from './OfficialReportHeader';
import { OfficialSignatureSection } from './OfficialSignatureSection';

const PRIMARY_AGE_COHORTS = [
  {
    age: 6,
    labelKm: '៦ ឆ្នាំ',
    labelEn: 'Age 6',
    censusTotalKey: 'age6CensusTotal',
    censusFemaleKey: 'age6CensusFemale',
    enrolledTotalKey: 'age6EnrolledTotal',
    enrolledFemaleKey: 'age6EnrolledFemale',
    remainingTotalKey: 'age6RemainingTotal',
    remainingFemaleKey: 'age6RemainingFemale',
    rateTotalKey: 'age6RateTotal',
    rateFemaleKey: 'age6RateFemale',
    headerBg: 'bg-blue-50 text-blue-950'
  },
  {
    age: 7,
    labelKm: '៧ ឆ្នាំ',
    labelEn: 'Age 7',
    censusTotalKey: 'age7CensusTotal',
    censusFemaleKey: 'age7CensusFemale',
    enrolledTotalKey: 'age7EnrolledTotal',
    enrolledFemaleKey: 'age7EnrolledFemale',
    remainingTotalKey: 'age7RemainingTotal',
    remainingFemaleKey: 'age7RemainingFemale',
    rateTotalKey: 'age7RateTotal',
    rateFemaleKey: 'age7RateFemale',
    headerBg: 'bg-sky-50 text-sky-950'
  },
  {
    age: 8,
    labelKm: '៨ ឆ្នាំ',
    labelEn: 'Age 8',
    censusTotalKey: 'age8CensusTotal',
    censusFemaleKey: 'age8CensusFemale',
    enrolledTotalKey: 'age8EnrolledTotal',
    enrolledFemaleKey: 'age8EnrolledFemale',
    remainingTotalKey: 'age8RemainingTotal',
    remainingFemaleKey: 'age8RemainingFemale',
    rateTotalKey: 'age8RateTotal',
    rateFemaleKey: 'age8RateFemale',
    headerBg: 'bg-blue-50 text-blue-950'
  },
  {
    age: 9,
    labelKm: '៩ ឆ្នាំ',
    labelEn: 'Age 9',
    censusTotalKey: 'age9CensusTotal',
    censusFemaleKey: 'age9CensusFemale',
    enrolledTotalKey: 'age9EnrolledTotal',
    enrolledFemaleKey: 'age9EnrolledFemale',
    remainingTotalKey: 'age9RemainingTotal',
    remainingFemaleKey: 'age9RemainingFemale',
    rateTotalKey: 'age9RateTotal',
    rateFemaleKey: 'age9RateFemale',
    headerBg: 'bg-sky-50 text-sky-950'
  },
  {
    age: 10,
    labelKm: '១០ ឆ្នាំ',
    labelEn: 'Age 10',
    censusTotalKey: 'age10CensusTotal',
    censusFemaleKey: 'age10CensusFemale',
    enrolledTotalKey: 'age10EnrolledTotal',
    enrolledFemaleKey: 'age10EnrolledFemale',
    remainingTotalKey: 'age10RemainingTotal',
    remainingFemaleKey: 'age10RemainingFemale',
    rateTotalKey: 'age10RateTotal',
    rateFemaleKey: 'age10RateFemale',
    headerBg: 'bg-blue-50 text-blue-950'
  },
  {
    age: 11,
    labelKm: '១១ ឆ្នាំ',
    labelEn: 'Age 11',
    censusTotalKey: 'age11CensusTotal',
    censusFemaleKey: 'age11CensusFemale',
    enrolledTotalKey: 'age11EnrolledTotal',
    enrolledFemaleKey: 'age11EnrolledFemale',
    remainingTotalKey: 'age11RemainingTotal',
    remainingFemaleKey: 'age11RemainingFemale',
    rateTotalKey: 'age11RateTotal',
    rateFemaleKey: 'age11RateFemale',
    headerBg: 'bg-sky-50 text-sky-950'
  }
] as const;

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
  // Mode: Primary 6+ / Group 2 | Pre-school 3-5 | Whole School Stats
  const [activeMode, setActiveMode] = useState<'primary' | 'preschool' | 'school-stats'>('primary');

  // Pre-school 3-5 Years Data State
  const [preschoolRows, setPreschoolRows] = useState<VillageComparisonRow[]>(() => loadSavedComparisonRows());

  // Primary 6+ Years & Group 2 Data State (Auto-populated from citizens & students)
  const [primaryRows, setPrimaryRows] = useState<PrimaryVillageComparisonRow[]>(() => 
    loadSavedPrimaryComparisonRows(citizens, students)
  );

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isCloudSaving, setIsCloudSaving] = useState(false);
  const [remainingSearchQuery, setRemainingSearchQuery] = useState('');
  const [migrationOverrides, setMigrationOverrides] = useState<VillageMigrationOverrideMap>(() => loadMigrationOverrides());
  const [migrationAgeFilter, setMigrationAgeFilter] = useState<string>('all');
  const [migrationStatusFilter, setMigrationStatusFilter] = useState<'all' | 'under' | 'over' | 'exact'>('all');
  const [includeEmptyOutside, setIncludeEmptyOutside] = useState<boolean>(false);
  const isInitialMountRef = useRef(true);

  // Sync live census and student updates into comparison rows when source records change
  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }
    setPrimaryRows(prev => syncPrimaryRowsWithSystemData(prev, citizens, students, true));
    setPreschoolRows(prev => syncPreschoolRowsWithSystemData(prev, citizens, students, true));
  }, [citizens, students]);

  // Reset age filter tab safely if switching between Preschool and Primary modes
  useEffect(() => {
    if (activeMode === 'preschool' && !['all', '3', '4', '5'].includes(migrationAgeFilter)) {
      setMigrationAgeFilter('all');
    } else if (activeMode === 'primary' && ['3', '4', '5'].includes(migrationAgeFilter)) {
      setMigrationAgeFilter('all');
    }
  }, [activeMode, migrationAgeFilter]);

  // Auto-save preschool rows to localStorage
  useEffect(() => {
    saveComparisonRows(preschoolRows);
  }, [preschoolRows]);

  // Auto-save primary rows to localStorage
  useEffect(() => {
    savePrimaryComparisonRows(primaryRows);
  }, [primaryRows]);

  // Auto-save migration overrides to localStorage
  useEffect(() => {
    saveMigrationOverrides(migrationOverrides);
  }, [migrationOverrides]);

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

  // Horizontal Village × Age Migration & <100% / >100% Cause Analysis
  const migrationMode: 'primary' | 'preschool' | 'all' =
    activeMode === 'school-stats' ? 'all' : activeMode;

  const allMigrationRows = useMemo(() => {
    return computeVillageAgeMigrationRows({
      mode: migrationMode,
      primaryRows,
      preschoolRows,
      citizens,
      students,
      overrides: migrationOverrides,
      includeEmptyOutside
    });
  }, [migrationMode, primaryRows, preschoolRows, citizens, students, migrationOverrides, includeEmptyOutside]);

  const migrationAgeTabs = useMemo(() => {
    const seen = new Map<string, string>();
    for (const r of allMigrationRows) {
      if (!seen.has(r.ageKey)) seen.set(r.ageKey, r.ageLabelKm);
    }
    return Array.from(seen.entries()).map(([ageKey, ageLabelKm]) => ({ ageKey, ageLabelKm }));
  }, [allMigrationRows]);

  const filteredMigrationRows = useMemo(() => {
    return allMigrationRows.filter(r => {
      if (migrationAgeFilter !== 'all' && r.ageKey !== migrationAgeFilter) return false;
      if (migrationStatusFilter !== 'all' && r.varianceStatus !== migrationStatusFilter) return false;
      return true;
    });
  }, [allMigrationRows, migrationAgeFilter, migrationStatusFilter]);

  const groupedMigrationSections = useMemo(() => {
    const groups = new Map<string, { ageKey: string; ageLabelKm: string; rows: VillageAgeMigrationRow[] }>();
    for (const r of filteredMigrationRows) {
      if (!groups.has(r.ageKey)) {
        groups.set(r.ageKey, { ageKey: r.ageKey, ageLabelKm: r.ageLabelKm, rows: [] });
      }
      groups.get(r.ageKey)!.rows.push(r);
    }
    return Array.from(groups.values());
  }, [filteredMigrationRows]);

  const migrationSummaryTotals = useMemo(() => {
    const underCount = allMigrationRows.filter(r => r.varianceStatus === 'under').length;
    const overCount = allMigrationRows.filter(r => r.varianceStatus === 'over').length;
    const exactCount = allMigrationRows.filter(r => r.varianceStatus === 'exact').length;
    const totalIn = allMigrationRows.reduce((s, r) => s + r.inMigrationTotal, 0);
    const totalOut = allMigrationRows.reduce((s, r) => s + r.outMigrationTotal, 0);
    const totalNotEnrolled = allMigrationRows.reduce((s, r) => s + r.notEnrolledRemainingTotal, 0);
    return { underCount, overCount, exactCount, totalIn, totalOut, totalNotEnrolled };
  }, [allMigrationRows]);

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

  const handleSyncPreschoolFromData = () => {
    const fresh = generatePreschoolBaseline(citizens, students);
    setPreschoolRows(fresh);
    saveComparisonRows(fresh);
    triggerSaveToast();
  };

  // Handlers for Village × Age Migration Overrides
  const handleMigrationOverrideChange = (
    rowKey: string,
    field: keyof VillageMigrationOverride,
    rawValue: string
  ) => {
    setMigrationOverrides(prev => {
      const existing = prev[rowKey] || {};
      if (field === 'customReason') {
        return {
          ...prev,
          [rowKey]: { ...existing, customReason: rawValue }
        };
      }
      const parsed = rawValue.trim() === '' ? undefined : Math.max(0, parseInt(rawValue, 10) || 0);
      return {
        ...prev,
        [rowKey]: { ...existing, [field]: parsed }
      };
    });
  };

  const handleResetMigrationOverrides = () => {
    setMigrationOverrides({});
    saveMigrationOverrides({});
    triggerSaveToast();
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
  const getRateBadge = (rate: number, _isFemale = false, outsideEnrolled?: number) => {
    if (outsideEnrolled !== undefined) {
      if (outsideEnrolled > 0) {
        return (
          <span
            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-300"
            title="សិស្សចំណូលមកពីភូមិក្រៅតំបន់សេវា"
          >
            +{outsideEnrolled}
          </span>
        );
      }
      return <span className="text-[10px] text-slate-400">—</span>;
    }
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
    <div className="space-y-6 print:space-y-3">
      {/* Official MoEYS Administrative Header */}
      <OfficialReportHeader
        title={
          activeMode === 'primary'
            ? 'តារាងប្រៀបធៀបទិន្នន័យកុមារបឋមសិក្សា (តាមអាយុ ៦ ឆ្នាំឡើង & ក្រុម២)'
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
          {/* Tab 1: Primary School 6+ & Group 2 (By Age Only) */}
          <button
            onClick={() => setActiveMode('primary')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
              activeMode === 'primary'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-2 ring-blue-600/20'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>{language === 'km' ? 'បឋមសិក្សា (តាមអាយុ ៦ ឆ្នាំឡើង & ក្រុម២)' : 'Primary School (By Age 6+ & Group 2)'}</span>
            <span className={`px-2 py-0.5 text-[11px] rounded-full font-black ${
              activeMode === 'primary' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-900'
            }`}>
              {language === 'km' ? 'អាយុ ៦-១២+' : 'Ages 6-12+'}
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

          {/* Tab 3: Whole-School Statistics */}
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
                title="ទាញយកទិន្នន័យស្រស់ពីបញ្ជីប្រជាជន និងបញ្ជីសិស្ស"
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
                onClick={handleSyncPreschoolFromData}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition"
                title="ទាញយកទិន្នន័យស្រស់ពីបញ្ជីប្រជាជន និងបញ្ជីសិស្ស"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{language === 'km' ? 'ទាញពីប្រព័ន្ធ' : 'Refresh from Data'}</span>
              </button>
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
                    <span>{language === 'km' ? 'រាប់តាមអាយុពិត (៦-១២+ ឆ្នាំ & ក្រុម២ ៧០-៨២ ខែ)' : 'Counted strictly by exact Age'}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-200 border border-cyan-400/30">
                    <Edit3 className="w-3.5 h-3.5 text-cyan-300" />
                    <span>{language === 'km' ? 'ជួរឈរពណ៌បៃតង អាចវាយបញ្ចូលទិន្នន័យផ្ទាល់ (សរុប & ស្រី)' : 'Green inputs (Total & Female) are editable'}</span>
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2 pt-1">
                  <span>{language === 'km' ? 'តារាងប្រៀបធៀបកុមារបឋមសិក្សា តាមអាយុ (៦ ឆ្នាំឡើង & ក្រុម២)' : 'Primary School Catchment Comparison by Age (6+ & Group 2)'}</span>
                </h2>

                <p className="text-sm text-blue-200/90 max-w-3xl leading-relaxed">
                  {language === 'km'
                    ? 'តារាងនេះទាញទិន្នន័យប្រជាជន ជំរឿន និងចំនួនសិស្សកំពុងរៀនដោយស្វ័យប្រវត្តិ ផ្ទៀងផ្ទាត់តាមអាយុពិត (៦ ឆ្នាំ ដល់ ១២+ ឆ្នាំ និងក្រុម២ អាយុ ៧០-៨២ ខែ) ដោយមានជួរឈរ "សរុប" និង "ស្រី" គ្រប់ផ្នែកទាំងអស់។'
                    : 'This table automatically pulls population, census, and active students by exact age (Ages 6 to 12+ and Group 2: 70-82 months) with Total and Female breakdown on every metric column.'}
                </p>
              </div>

              {/* Group 2 Key Metric Indicator */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 self-start lg:self-auto min-w-[240px]">
                <div className="flex items-center justify-between text-xs text-blue-200 font-semibold mb-1">
                  <span>{language === 'km' ? 'កុមារក្រុម២ (៧០-៨២ ខែ)' : 'Group 2 (70-82 Mos)'}</span>
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
                  <span>{language === 'km' ? 'កុមារអាយុ ៦-១១ ឆ្នាំ' : 'Ages 6-11 Total'}</span>
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-white">{primaryGrandTotal.primaryEnrolledTotal}</span>
                  <span className="text-xs text-indigo-200 font-medium">
                    / {primaryGrandTotal.primaryCensusTotal} ({primaryGrandTotal.primaryRateTotal.toFixed(1)}%)
                  </span>
                </div>
                <p className="text-[10px] text-indigo-300 mt-0.5">
                  {language === 'km' ? `ស្រីរៀន៖ ${primaryGrandTotal.primaryEnrolledFemale} / នៅសល់៖ ${primaryGrandTotal.primaryRemainingTotal}` : `Female: ${primaryGrandTotal.primaryEnrolledFemale} | Rem: ${primaryGrandTotal.primaryRemainingTotal}`}
                </p>
              </div>
            </div>
          </div>

          {/* Primary School Comparison Table Component */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden print:overflow-visible print:shadow-none print:rounded-lg">
            <div className="p-4 print:p-2 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm sm:text-base print:text-xs">
                  {language === 'km' 
                    ? 'តារាងប្រៀបធៀបតាមអាយុ៖ កុមារក្រុម២ (៧០-៨២ ខែ) និងអាយុ ៦ ដល់ ១២+ ឆ្នាំ (សរុប / ស្រី)' 
                    : 'Age-Based Comparison Table: Group 2 (70-82 Mos) & Ages 6 to 12+ (Total / Female)'}
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 no-print">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-400" />
                  <span>{language === 'km' ? 'សិស្សរៀន (សរុប/ស្រី អាចកែសម្រួលបាន)' : 'Enrolled (Total/Female Editable)'}</span>
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

            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full text-[10px] text-center border-collapse leading-tight font-khmer print-ultra-wide-table">
                <thead>
                  {/* LEVEL 1 HEADERS */}
                  <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 font-bold">
                    <th rowSpan={3} className="py-1 px-1.5 text-left border-r border-slate-300 min-w-[110px] sticky left-0 bg-slate-100 z-20 print:static">
                      {language === 'km' ? 'ឈ្មោះភូមិរដ្ឋបាលចំណុះ' : 'Feeder Village'}
                    </th>
                    <th colSpan={2} rowSpan={2} className="p-1.5 border-r border-slate-300 bg-slate-50">
                      {language === 'km' ? 'ចំនួនប្រជាជន' : 'Population'}
                    </th>
                    <th rowSpan={3} className="p-1.5 border-r border-slate-300 bg-slate-50 min-w-[56px]">
                      {language === 'km' ? 'គ្រួសារ' : 'Households'}
                    </th>

                    {/* Group 2 Main Section (8 columns) */}
                    <th colSpan={8} className="p-1.5 border-r border-slate-300 bg-indigo-100 text-indigo-950 border-l-2 border-indigo-500 font-black">
                      {language === 'km' ? 'កុមារក្រុម២ (៧០-៨២ ខែ)' : 'Group 2 Children (70-82 Mos)'}
                    </th>

                    {/* Primary Ages: 6, 7, 8, 9, 10, 11 (8 columns each: ជំរឿន សរុប|ស្រី, រៀន សរុប|ស្រី, នៅសល់ សរុប|ស្រី, % សរុប|ស្រី) */}
                    {PRIMARY_AGE_COHORTS.map(cohort => (
                      <th
                        key={cohort.age}
                        colSpan={8}
                        className={`p-1.5 border-r border-slate-300 border-l-2 border-l-blue-400 font-black ${cohort.headerBg}`}
                      >
                        {language === 'km' ? cohort.labelKm : cohort.labelEn}
                      </th>
                    ))}

                    {/* Primary School Total (8 columns) */}
                    <th colSpan={8} className="p-1.5 border-r border-slate-300 bg-emerald-100 text-emerald-950 border-l-2 border-emerald-500 font-black">
                      {language === 'km' ? 'សរុបកុមារបឋមសិក្សា (៦-១១ ឆ្នាំ)' : 'Total Primary (Ages 6-11)'}
                    </th>

                    {/* Age 12+ (4 columns) */}
                    <th colSpan={4} className="p-1.5 border-r border-slate-300 bg-slate-200/70 text-slate-900 border-l-2 border-l-slate-400 font-bold">
                      {language === 'km' ? '១២ ឆ្នាំឡើង' : '12+ Years'}
                    </th>

                    <th rowSpan={3} className="p-1.5 bg-slate-50 min-w-[140px]">
                      {language === 'km' ? 'កំណត់សំគាល់' : 'Remarks'}
                    </th>
                  </tr>

                  {/* LEVEL 2 HEADERS */}
                  <tr className="bg-slate-50 text-slate-700 border-b border-slate-300 font-bold text-[10px]">
                    {/* Group 2 Subheaders (8 cols) */}
                    <th colSpan={2} className="p-1 border-r border-slate-300 bg-indigo-50 border-l-2 border-indigo-500 text-indigo-900">ជំរឿនពិត</th>
                    <th colSpan={2} className="p-1 border-r border-slate-300 bg-emerald-100 text-emerald-950 font-black">សិស្សរៀន</th>
                    <th colSpan={2} className="p-1 border-r border-slate-300 bg-rose-50 text-rose-900">នៅសល់</th>
                    <th colSpan={2} className="p-1 border-r border-slate-300 bg-blue-100 text-blue-950 font-black">% ចូលរៀន</th>

                    {/* Age 6 to 11 Subheaders (8 cols each) */}
                    {PRIMARY_AGE_COHORTS.map(cohort => (
                      <React.Fragment key={cohort.age}>
                        <th colSpan={2} className="p-1 border-r border-slate-200 border-l-2 border-l-blue-400 bg-slate-50">ជំរឿន</th>
                        <th colSpan={2} className="p-1 border-r border-slate-200 bg-emerald-50 text-emerald-900 font-bold">សិស្សរៀន</th>
                        <th colSpan={2} className="p-1 border-r border-slate-200 bg-amber-50/70 text-amber-800">នៅសល់</th>
                        <th colSpan={2} className="p-1 border-r border-slate-300 bg-blue-50 font-bold">%</th>
                      </React.Fragment>
                    ))}

                    {/* Primary Total (8 columns) */}
                    <th colSpan={2} className="p-1 border-r border-slate-200 bg-emerald-50 border-l-2 border-emerald-500 font-bold">ជំរឿនសរុប</th>
                    <th colSpan={2} className="p-1 border-r border-slate-200 bg-emerald-100 font-black text-emerald-950">សិស្សរៀន</th>
                    <th colSpan={2} className="p-1 border-r border-slate-200 bg-rose-50 text-rose-900 font-bold">នៅសល់សរុប</th>
                    <th colSpan={2} className="p-1 border-r border-slate-300 bg-blue-100 text-blue-950 font-black">% ចូលរៀន</th>

                    {/* 12+ Years */}
                    <th colSpan={2} className="p-1 border-r border-slate-200 border-l-2 border-l-slate-400">ជំរឿន</th>
                    <th colSpan={2} className="p-1 border-r border-slate-300 bg-emerald-50 text-emerald-900 font-bold">សិស្សរៀន</th>
                  </tr>

                  {/* LEVEL 3 HEADERS: សរុប | ស្រី FOR EVERY COLUMN GROUP */}
                  <tr className="bg-slate-100 text-slate-600 border-b border-slate-300 text-[9.5px]">
                    {/* Population */}
                    <th className="p-1 border-r border-slate-200">សរុប</th>
                    <th className="p-1 border-r border-slate-300 text-pink-700 font-bold">ស្រី</th>

                    {/* Group 2 */}
                    <th className="p-1 border-r border-slate-200 bg-indigo-50 border-l-2 border-indigo-500">សរុប</th>
                    <th className="p-1 border-r border-slate-200 bg-indigo-50 text-pink-700 font-bold">ស្រី</th>
                    <th className="p-1 border-r border-slate-200 bg-emerald-100 font-bold text-emerald-950">សរុប</th>
                    <th className="p-1 border-r border-slate-200 bg-emerald-100 text-pink-800 font-bold">ស្រី</th>
                    <th className="p-1 border-r border-slate-200 bg-rose-50 text-rose-800 font-semibold">សរុប</th>
                    <th className="p-1 border-r border-slate-200 bg-rose-50 text-pink-700 font-bold">ស្រី</th>
                    <th className="p-1 border-r border-slate-200 bg-blue-100 font-bold">សរុប</th>
                    <th className="p-1 border-r border-slate-300 bg-blue-100 text-pink-800 font-bold">ស្រី</th>

                    {/* Age 6 to 11 gender columns (Total | Female on Census, Enrolled, Remaining, %) */}
                    {PRIMARY_AGE_COHORTS.map(cohort => (
                      <React.Fragment key={cohort.age}>
                        <th className="p-0.5 border-r border-slate-200 border-l-2 border-l-blue-400">សរុប</th>
                        <th className="p-0.5 border-r border-slate-200 text-pink-700 font-bold">ស្រី</th>
                        <th className="p-0.5 border-r border-slate-200 bg-emerald-50 text-emerald-900 font-bold">សរុប</th>
                        <th className="p-0.5 border-r border-slate-200 bg-emerald-50 text-pink-800 font-bold">ស្រី</th>
                        <th className="p-0.5 border-r border-slate-200 bg-amber-50/70 text-amber-800">សរុប</th>
                        <th className="p-0.5 border-r border-slate-200 bg-amber-50/70 text-pink-700 font-bold">ស្រី</th>
                        <th className="p-0.5 border-r border-slate-200 bg-blue-50 font-semibold">សរុប</th>
                        <th className="p-0.5 border-r border-slate-300 bg-blue-50 text-pink-800 font-bold">ស្រី</th>
                      </React.Fragment>
                    ))}

                    {/* Primary Total gender */}
                    <th className="p-1 border-r border-slate-200 bg-emerald-50 border-l-2 border-emerald-500 font-semibold">សរុប</th>
                    <th className="p-1 border-r border-slate-200 bg-emerald-50 text-pink-700 font-bold">ស្រី</th>
                    <th className="p-1 border-r border-slate-200 bg-emerald-100 font-bold text-emerald-950">សរុប</th>
                    <th className="p-1 border-r border-slate-200 bg-emerald-100 text-pink-800 font-bold">ស្រី</th>
                    <th className="p-1 border-r border-slate-200 bg-rose-50 text-rose-800">សរុប</th>
                    <th className="p-1 border-r border-slate-200 bg-rose-50 text-pink-700 font-bold">ស្រី</th>
                    <th className="p-1 border-r border-slate-200 bg-blue-100 font-black">សរុប</th>
                    <th className="p-1 border-r border-slate-300 bg-blue-100 text-pink-800 font-black">ស្រី</th>

                    {/* 12+ Years */}
                    <th className="p-1 border-r border-slate-200 border-l-2 border-l-slate-400">សរុប</th>
                    <th className="p-1 border-r border-slate-200 text-pink-700 font-bold">ស្រី</th>
                    <th className="p-1 border-r border-slate-200 bg-emerald-50 font-semibold text-emerald-950">សរុប</th>
                    <th className="p-1 border-r border-slate-300 bg-emerald-50 text-pink-800 font-bold">ស្រី</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {primaryRows.map(row => (
                    <tr key={row.id} className="hover:bg-slate-50 transition group">
                      {/* Village Name */}
                      <td className="py-1 px-1.5 text-left border-r border-slate-300 font-bold text-slate-900 sticky left-0 bg-white group-hover:bg-slate-50 z-10 print:static whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${
                            row.id === 'outside' ? 'bg-purple-600' : row.villageName.includes('មុខឈ្នាង') ? 'bg-amber-500' : 'bg-blue-600'
                          }`} />
                          <span>{row.villageName}</span>
                        </div>
                      </td>

                      {/* Population */}
                      <td className="p-1 border-r border-slate-200 font-semibold text-slate-800">{row.populationTotal}</td>
                      <td className="p-1 border-r border-slate-300 text-pink-700 font-medium">{row.populationFemale}</td>

                      {/* Households */}
                      <td className="p-1 border-r border-slate-300 font-bold text-slate-800 bg-slate-50/50">{row.householdCount}</td>

                      {/* GROUP 2 CHILDREN (70-82 MONTHS) */}
                      <td className="p-1 border-r border-slate-200 bg-indigo-50/40 font-bold text-indigo-950 border-l-2 border-indigo-500">{row.group2CensusTotal}</td>
                      <td className="p-1 border-r border-slate-200 bg-indigo-50/40 text-pink-700 font-medium">{row.group2CensusFemale}</td>

                      <td className="p-0.5 border-r border-slate-200 bg-emerald-50">
                        <input
                          type="number"
                          min={0}
                          value={row.group2EnrolledTotal}
                          onChange={(e) => handlePrimaryEnrolledChange(row.id, 'group2EnrolledTotal', e.target.value)}
                          className="w-9 text-center font-bold text-emerald-950 bg-white border border-emerald-400 rounded px-0.5 py-0.5 text-[10px] shadow-2xs focus:ring-2 focus:ring-emerald-500"
                          title="បញ្ចូលចំនួនកុមារក្រុម២ សិស្សរៀន សរុប"
                        />
                      </td>
                      <td className="p-0.5 border-r border-slate-200 bg-emerald-50">
                        <input
                          type="number"
                          min={0}
                          value={row.group2EnrolledFemale}
                          onChange={(e) => handlePrimaryEnrolledChange(row.id, 'group2EnrolledFemale', e.target.value)}
                          className="w-9 text-center font-bold text-pink-800 bg-white border border-emerald-400 rounded px-0.5 py-0.5 text-[10px] shadow-2xs focus:ring-2 focus:ring-pink-500"
                          title="បញ្ចូលចំនួនកុមារក្រុម២ សិស្សរៀន ស្រី"
                        />
                      </td>

                      <td className="p-1 border-r border-slate-200 bg-rose-50/70 font-extrabold text-rose-900">
                        <span className={row.group2RemainingTotal > 0 ? 'inline-block px-1 py-0.5 rounded bg-rose-100 text-rose-800 font-black' : 'text-slate-400'}>
                          {row.group2RemainingTotal}
                        </span>
                      </td>
                      <td className="p-1 border-r border-slate-200 bg-rose-50/70 text-pink-800 font-bold">
                        {row.group2RemainingFemale}
                      </td>

                      <td className="p-0.5 border-r border-slate-200 bg-blue-100">
                        {getRateBadge(row.group2RateTotal, false, row.id === 'outside' ? row.group2EnrolledTotal : undefined)}
                      </td>
                      <td className="p-0.5 border-r border-slate-300 bg-blue-100">
                        {getRateBadge(row.group2RateFemale, true, row.id === 'outside' ? row.group2EnrolledFemale : undefined)}
                      </td>

                      {/* AGE 6 TO 11 COHORTS (With Total & Female on Census, Enrolled, Remaining, %) */}
                      {PRIMARY_AGE_COHORTS.map(cohort => {
                        const cTot = row[cohort.censusTotalKey];
                        const cFem = row[cohort.censusFemaleKey];
                        const eTot = row[cohort.enrolledTotalKey];
                        const eFem = row[cohort.enrolledFemaleKey];
                        const rTot = row[cohort.remainingTotalKey];
                        const rFem = row[cohort.remainingFemaleKey];
                        const pctTot = row[cohort.rateTotalKey];
                        const pctFem = row[cohort.rateFemaleKey];
                        return (
                          <React.Fragment key={cohort.age}>
                            <td className="p-1 border-r border-slate-200 border-l-2 border-l-blue-400 font-semibold text-slate-800">{cTot}</td>
                            <td className="p-1 border-r border-slate-200 text-pink-700 font-medium">{cFem}</td>

                            <td className="p-0.5 border-r border-slate-200 bg-emerald-50/70">
                              <input
                                type="number"
                                min={0}
                                value={eTot}
                                onChange={(e) => handlePrimaryEnrolledChange(row.id, cohort.enrolledTotalKey, e.target.value)}
                                className="w-9 text-center font-bold text-emerald-950 bg-white/80 hover:bg-white focus:bg-white border border-emerald-300 rounded px-0.5 py-0.5 text-[10px]"
                                title={`${cohort.labelKm} - សិស្សរៀន សរុប`}
                              />
                            </td>
                            <td className="p-0.5 border-r border-slate-200 bg-emerald-50/70">
                              <input
                                type="number"
                                min={0}
                                value={eFem}
                                onChange={(e) => handlePrimaryEnrolledChange(row.id, cohort.enrolledFemaleKey, e.target.value)}
                                className="w-9 text-center font-bold text-pink-800 bg-white/80 hover:bg-white focus:bg-white border border-emerald-300 rounded px-0.5 py-0.5 text-[10px]"
                                title={`${cohort.labelKm} - សិស្សរៀន ស្រី`}
                              />
                            </td>

                            <td className="p-1 border-r border-slate-200 bg-amber-50/40 text-amber-800 font-semibold">{rTot}</td>
                            <td className="p-1 border-r border-slate-200 bg-amber-50/40 text-pink-700 font-medium">{rFem}</td>

                            <td className="p-0.5 border-r border-slate-200 bg-blue-50/50">{getRateBadge(pctTot, false, row.id === 'outside' ? eTot : undefined)}</td>
                            <td className="p-0.5 border-r border-slate-300 bg-blue-50/50">{getRateBadge(pctFem, true, row.id === 'outside' ? eFem : undefined)}</td>
                          </React.Fragment>
                        );
                      })}

                      {/* PRIMARY SCHOOL TOTAL (AGES 6-11) */}
                      <td className="p-1 border-r border-slate-200 bg-emerald-50/40 font-bold border-l-2 border-emerald-500">{row.primaryCensusTotal}</td>
                      <td className="p-1 border-r border-slate-200 bg-emerald-50/40 text-pink-700 font-semibold">{row.primaryCensusFemale}</td>
                      <td className="p-1 border-r border-slate-200 bg-emerald-100 font-black text-emerald-950 text-xs">{row.primaryEnrolledTotal}</td>
                      <td className="p-1 border-r border-slate-200 bg-emerald-100 font-black text-pink-900 text-xs">{row.primaryEnrolledFemale}</td>
                      <td className="p-1 border-r border-slate-200 bg-rose-50 font-bold text-rose-900">{row.primaryRemainingTotal}</td>
                      <td className="p-1 border-r border-slate-200 bg-rose-50 text-pink-800 font-semibold">{row.primaryRemainingFemale}</td>
                      <td className="p-0.5 border-r border-slate-200 bg-blue-100 font-black">{getRateBadge(row.primaryRateTotal, false, row.id === 'outside' ? row.primaryEnrolledTotal : undefined)}</td>
                      <td className="p-0.5 border-r border-slate-300 bg-blue-100 font-black">{getRateBadge(row.primaryRateFemale, true, row.id === 'outside' ? row.primaryEnrolledFemale : undefined)}</td>

                      {/* 12+ Years (Census Total|Female & Editable Enrolled Total|Female) */}
                      <td className="p-1 border-r border-slate-200 border-l-2 border-l-slate-400 font-semibold">{row.age12PlusCensusTotal}</td>
                      <td className="p-1 border-r border-slate-200 text-pink-700 font-medium">{row.age12PlusCensusFemale}</td>
                      <td className="p-0.5 border-r border-slate-200 bg-emerald-50/70">
                        <input
                          type="number"
                          min={0}
                          value={row.age12PlusEnrolledTotal}
                          onChange={(e) => handlePrimaryEnrolledChange(row.id, 'age12PlusEnrolledTotal', e.target.value)}
                          className="w-9 text-center font-bold text-emerald-950 bg-white/80 hover:bg-white focus:bg-white border border-emerald-300 rounded px-0.5 py-0.5 text-[10px]"
                          title="១២ ឆ្នាំឡើង - សិស្សរៀន សរុប"
                        />
                      </td>
                      <td className="p-0.5 border-r border-slate-300 bg-emerald-50/70">
                        <input
                          type="number"
                          min={0}
                          value={row.age12PlusEnrolledFemale}
                          onChange={(e) => handlePrimaryEnrolledChange(row.id, 'age12PlusEnrolledFemale', e.target.value)}
                          className="w-9 text-center font-bold text-pink-800 bg-white/80 hover:bg-white focus:bg-white border border-emerald-300 rounded px-0.5 py-0.5 text-[10px]"
                          title="១២ ឆ្នាំឡើង - សិស្សរៀន ស្រី"
                        />
                      </td>

                      {/* Remarks */}
                      <td className="p-1 text-left">
                        <input
                          type="text"
                          value={row.remarks || ''}
                          onChange={(e) => handlePrimaryRemarksChange(row.id, e.target.value)}
                          placeholder="កំណត់សំគាល់..."
                          className="w-full min-w-[120px] text-[10px] text-slate-700 bg-transparent hover:bg-slate-100 focus:bg-white rounded px-1 py-0.5"
                        />
                      </td>
                    </tr>
                  ))}

                  {/* GRAND TOTAL ROW (សរុបរួម) */}
                  <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-400">
                    <td className="p-2 text-left border-r border-slate-300 font-extrabold text-blue-900 sticky left-0 bg-slate-100 z-10 print:static whitespace-nowrap">
                      <span>សរុបរួម</span>
                    </td>

                    {/* Pop */}
                    <td className="p-1 border-r border-slate-200 font-black">{primaryGrandTotal.populationTotal.toLocaleString()}</td>
                    <td className="p-1 border-r border-slate-300 font-black text-pink-800">{primaryGrandTotal.populationFemale.toLocaleString()}</td>
                    <td className="p-1 border-r border-slate-300 font-black bg-slate-200/50">{primaryGrandTotal.householdCount}</td>

                    {/* Group 2 */}
                    <td className="p-1 border-r border-slate-200 bg-indigo-100 font-black text-indigo-950 border-l-2 border-indigo-500">{primaryGrandTotal.group2CensusTotal}</td>
                    <td className="p-1 border-r border-slate-200 bg-indigo-100 font-black text-pink-800">{primaryGrandTotal.group2CensusFemale}</td>
                    <td className="p-1 border-r border-slate-200 bg-emerald-200 font-black text-emerald-950 text-xs">{primaryGrandTotal.group2EnrolledTotal}</td>
                    <td className="p-1 border-r border-slate-200 bg-emerald-200 font-black text-pink-900 text-xs">{primaryGrandTotal.group2EnrolledFemale}</td>
                    <td className="p-1 border-r border-slate-200 bg-rose-100 font-black text-rose-900 text-xs">{primaryGrandTotal.group2RemainingTotal}</td>
                    <td className="p-1 border-r border-slate-200 bg-rose-100 font-black text-pink-800">{primaryGrandTotal.group2RemainingFemale}</td>
                    <td className="p-0.5 border-r border-slate-200 bg-blue-200 font-black">{getRateBadge(primaryGrandTotal.group2RateTotal)}</td>
                    <td className="p-0.5 border-r border-slate-300 bg-blue-200 font-black">{getRateBadge(primaryGrandTotal.group2RateFemale, true)}</td>

                    {/* Age 6 to 11 Totals */}
                    {PRIMARY_AGE_COHORTS.map(cohort => (
                      <React.Fragment key={cohort.age}>
                        <td className="p-1 border-r border-slate-200 border-l-2 border-l-blue-400 font-bold">{primaryGrandTotal[cohort.censusTotalKey]}</td>
                        <td className="p-1 border-r border-slate-200 font-bold text-pink-800">{primaryGrandTotal[cohort.censusFemaleKey]}</td>
                        <td className="p-1 border-r border-slate-200 font-black bg-emerald-100 text-emerald-950">{primaryGrandTotal[cohort.enrolledTotalKey]}</td>
                        <td className="p-1 border-r border-slate-200 font-black bg-emerald-100 text-pink-900">{primaryGrandTotal[cohort.enrolledFemaleKey]}</td>
                        <td className="p-1 border-r border-slate-200 bg-amber-100/60 text-amber-900 font-bold">{primaryGrandTotal[cohort.remainingTotalKey]}</td>
                        <td className="p-1 border-r border-slate-200 bg-amber-100/60 text-pink-800 font-bold">{primaryGrandTotal[cohort.remainingFemaleKey]}</td>
                        <td className="p-0.5 border-r border-slate-200 bg-blue-100 font-bold">{getRateBadge(primaryGrandTotal[cohort.rateTotalKey])}</td>
                        <td className="p-0.5 border-r border-slate-300 bg-blue-100 font-bold">{getRateBadge(primaryGrandTotal[cohort.rateFemaleKey], true)}</td>
                      </React.Fragment>
                    ))}

                    {/* Primary Total */}
                    <td className="p-1 border-r border-slate-200 bg-emerald-100 font-black border-l-2 border-emerald-500">{primaryGrandTotal.primaryCensusTotal}</td>
                    <td className="p-1 border-r border-slate-200 bg-emerald-100 font-black text-pink-800">{primaryGrandTotal.primaryCensusFemale}</td>
                    <td className="p-1 border-r border-slate-200 bg-emerald-200 font-black text-emerald-950 text-xs">{primaryGrandTotal.primaryEnrolledTotal}</td>
                    <td className="p-1 border-r border-slate-200 bg-emerald-200 font-black text-pink-900 text-xs">{primaryGrandTotal.primaryEnrolledFemale}</td>
                    <td className="p-1 border-r border-slate-200 bg-rose-100 font-black text-rose-900 text-xs">{primaryGrandTotal.primaryRemainingTotal}</td>
                    <td className="p-1 border-r border-slate-200 bg-rose-100 font-black text-pink-800 text-xs">{primaryGrandTotal.primaryRemainingFemale}</td>
                    <td className="p-0.5 border-r border-slate-200 bg-blue-200 font-black">{getRateBadge(primaryGrandTotal.primaryRateTotal)}</td>
                    <td className="p-0.5 border-r border-slate-300 bg-blue-200 font-black">{getRateBadge(primaryGrandTotal.primaryRateFemale, true)}</td>

                    {/* 12+ Years */}
                    <td className="p-1 border-r border-slate-200 border-l-2 border-l-slate-400 font-bold">{primaryGrandTotal.age12PlusCensusTotal}</td>
                    <td className="p-1 border-r border-slate-200 text-pink-800 font-bold">{primaryGrandTotal.age12PlusCensusFemale}</td>
                    <td className="p-1 border-r border-slate-200 bg-emerald-100 font-black">{primaryGrandTotal.age12PlusEnrolledTotal}</td>
                    <td className="p-1 border-r border-slate-300 bg-emerald-100 text-pink-800 font-black">{primaryGrandTotal.age12PlusEnrolledFemale}</td>

                    <td className="p-1 text-slate-500 italic text-[10px]">សរុបទាំងមូល</td>
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
        <div className="space-y-6 print:space-y-3">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden print:overflow-visible print:shadow-none print:rounded-lg">
            <div className="p-4 print:p-2 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm sm:text-base print:text-xs">
                  {language === 'km' 
                    ? 'តារាងប្រៀបធៀប៖ ទិន្នន័យកុមារមត្តេយ្យក្នុងភូមិ និង ចំនួនសិស្សចុះឈ្មោះចូលរៀន (៣-៥ ឆ្នាំ)' 
                    : 'Comparison Table: Village Census vs Enrolled Students (Ages 3-5)'}
                </h3>
              </div>
              <span className="text-xs print:text-[9px] font-semibold px-2.5 py-1 print:px-1.5 print:py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                ឯកសារភ្ជាប់ MoEYS Sheet
              </span>
            </div>

            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full text-[10px] text-center border-collapse leading-tight font-khmer print-ultra-wide-table">
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
                          <span className={`w-2 h-2 rounded-full ${
                            row.id === 'outside' ? 'bg-purple-600' : row.villageName.includes('មុខឈ្នាង') ? 'bg-amber-500' : 'bg-blue-600'
                          }`} />
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

                      <td className="p-1 border-r border-slate-200 bg-blue-50">{getRateBadge(row.rate3Total, false, row.id === 'outside' ? row.enrolled3Total : undefined)}</td>
                      <td className="p-1 border-r border-slate-300 bg-blue-50">{getRateBadge(row.rate3Female, true, row.id === 'outside' ? row.enrolled3Female : undefined)}</td>
                      <td className="p-1 border-r border-slate-200 bg-blue-50">{getRateBadge(row.rate4Total, false, row.id === 'outside' ? row.enrolled4Total : undefined)}</td>
                      <td className="p-1 border-r border-slate-300 bg-blue-50">{getRateBadge(row.rate4Female, true, row.id === 'outside' ? row.enrolled4Female : undefined)}</td>
                      <td className="p-1 border-r border-slate-200 bg-blue-50">{getRateBadge(row.rate5Total, false, row.id === 'outside' ? row.enrolled5Total : undefined)}</td>
                      <td className="p-1 border-r border-slate-300 bg-blue-50">{getRateBadge(row.rate5Female, true, row.id === 'outside' ? row.enrolled5Female : undefined)}</td>
                      <td className="p-1 border-r border-slate-200 bg-blue-100 font-black">{getRateBadge(row.rate3to5Total, false, row.id === 'outside' ? row.enrolled3to5Total : undefined)}</td>
                      <td className="p-1 border-r border-slate-300 bg-blue-100 font-black">{getRateBadge(row.rate3to5Female, true, row.id === 'outside' ? row.enrolled3to5Female : undefined)}</td>

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

              <div className="overflow-x-auto print:overflow-visible">
                <table className="w-full text-xs text-left border-collapse print-standard-table">
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
              <div className="relative w-full sm:w-64 no-print">
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
              <div className="overflow-x-auto print:overflow-visible">
                <table className="w-full text-[10px] text-left border-collapse leading-tight font-khmer print-standard-table">
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
                      <th className="py-1 px-1.5 text-center w-14 no-print">សកម្មភាព</th>
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
                          <td className="py-1 px-1.5 text-center no-print">
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

      {/* ========================================================================= */}
      {/* VILLAGE × AGE HORIZONTAL ROW BREAKDOWN (ជួរដេកភូមិ) & MIGRATION REASONS */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden print:overflow-visible print:shadow-none print:rounded-lg">
        <div className="p-4 bg-gradient-to-r from-slate-50 via-blue-50/50 to-purple-50/40 border-b border-slate-200 space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-indigo-600" />
                <h3 className="font-black text-slate-900 text-sm sm:text-base">
                  {language === 'km'
                    ? 'តារាងប្រមូលទិន្នន័យតាមភូមិ (ជួរដេកភូមិ) — វិភាគចំណូល-ចំណាកស្រុក និងមូលហេតុភាគរយ (<១០០% / >១០០%)'
                    : 'Horizontal Village Breakdown by Age — In/Out Migration & <100% / >100% Causes'}
                </h3>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                {language === 'km'
                  ? 'បង្ហាញជួរដេកភូមិ (ភូមិរោគ • ភូមិមុខឈ្នាង • មកពីភូមិផ្សេង) សម្រាប់អាយុនីមួយៗ ដើម្បីកំណត់ចំនួនចំណូល-ចំណាកស្រុក និងពន្យល់មូលហេតុដែលភាគរយចូលរៀន <១០០% ឬ >១០០% ឱ្យបានច្បាស់។'
                  : 'Displays horizontal feeder village rows per age to track in-migration, out-migration, and exact reasons whenever enrollment is <100% or >100%.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 no-print">
              <button
                type="button"
                onClick={() => setIncludeEmptyOutside(v => !v)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition ${
                  includeEmptyOutside
                    ? 'bg-purple-600 text-white border-purple-700'
                    : 'bg-white text-purple-800 border-purple-200 hover:bg-purple-50'
                }`}
                title="បង្ហាញជួរដេក «មកពីភូមិផ្សេង» គ្រប់អាយុ ទោះបីទិន្នន័យស្មើ 0"
              >
                {includeEmptyOutside ? 'លាក់ជួរភូមិផ្សេង=0' : '+ បង្ហាញជួរភូមិផ្សេង'}
              </button>

              <button
                type="button"
                onClick={handleResetMigrationOverrides}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold rounded-lg bg-white text-slate-700 hover:bg-slate-100 border border-slate-300 transition"
                title="ទាញតម្លៃចំណូល-ចំណាកស្រុកស្វ័យប្រវត្តិពីប្រព័ន្ធឡើងវិញ"
              >
                <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                <span>{language === 'km' ? 'គណនាស្វ័យប្រវត្តិ' : 'Auto Recalculate'}</span>
              </button>

              <button
                type="button"
                onClick={() => exportMigrationAnalysisToCSV(filteredMigrationRows, migrationMode)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{language === 'km' ? 'នាំចេញ CSV (តាមភូមិ)' : 'Export CSV'}</span>
              </button>
            </div>
          </div>

          {/* Summary KPI Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
            <div className="bg-white rounded-xl p-2.5 border border-rose-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-rose-700 block">ភាគរយ &lt; ១០០%</span>
                <span className="text-base font-black text-rose-900">{migrationSummaryTotals.underCount} ជួរភូមិ</span>
              </div>
              <ArrowDownRight className="w-4 h-4 text-rose-600" />
            </div>

            <div className="bg-white rounded-xl p-2.5 border border-purple-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-purple-700 block">ភាគរយ &gt; ១០០%</span>
                <span className="text-base font-black text-purple-900">{migrationSummaryTotals.overCount} ជួរភូមិ</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-purple-600" />
            </div>

            <div className="bg-white rounded-xl p-2.5 border border-emerald-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-700 block">គ្រប់ = ១០០%</span>
                <span className="text-base font-black text-emerald-900">{migrationSummaryTotals.exactCount} ជួរភូមិ</span>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>

            <div className="bg-purple-50/70 rounded-xl p-2.5 border border-purple-200">
              <span className="text-[10px] font-bold text-purple-800 block">ចំណូលសរុប (In)</span>
              <span className="text-base font-black text-purple-950">+{migrationSummaryTotals.totalIn} នាក់</span>
            </div>

            <div className="bg-amber-50/80 rounded-xl p-2.5 border border-amber-200">
              <span className="text-[10px] font-bold text-amber-800 block">ចំណាកស្រុក (Out)</span>
              <span className="text-base font-black text-amber-950">-{migrationSummaryTotals.totalOut} នាក់</span>
            </div>

            <div className="bg-rose-50/80 rounded-xl p-2.5 border border-rose-200">
              <span className="text-[10px] font-bold text-rose-800 block">មិនទាន់ចុះឈ្មោះ/សាលាផ្សេង</span>
              <span className="text-base font-black text-rose-950">{migrationSummaryTotals.totalNotEnrolled} នាក់</span>
            </div>
          </div>

          {/* Filter Pills: By Exact Age & By Variance Status */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/80 no-print">
            {/* Age Filter */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-700 mr-1">
                {language === 'km' ? 'ត្រងតាមអាយុ៖' : 'Age:'}
              </span>
              <button
                type="button"
                onClick={() => setMigrationAgeFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                  migrationAgeFilter === 'all'
                    ? 'bg-slate-800 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {language === 'km' ? 'គ្រប់អាយុ' : 'All Ages'}
              </button>
              {migrationAgeTabs.map(tab => (
                <button
                  key={tab.ageKey}
                  type="button"
                  onClick={() => setMigrationAgeFilter(prev => prev === tab.ageKey ? 'all' : tab.ageKey)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                    migrationAgeFilter === tab.ageKey
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs'
                      : 'bg-white text-indigo-950 border-indigo-200 hover:bg-indigo-50'
                  }`}
                >
                  {tab.ageLabelKm}
                </button>
              ))}
            </div>

            {/* Variance Status Filter */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-700 mr-1">
                {language === 'km' ? 'ភាគរយ៖' : 'Rate:'}
              </span>
              {[
                { key: 'all' as const, label: 'ទាំងអស់', activeCls: 'bg-slate-800 text-white border-slate-900' },
                { key: 'under' as const, label: '< ១០០% (ខ្វះ)', activeCls: 'bg-rose-600 text-white border-rose-700' },
                { key: 'over' as const, label: '> ១០០% (ចំណូល/លើស)', activeCls: 'bg-purple-600 text-white border-purple-700' },
                { key: 'exact' as const, label: '= ១០០% (គ្រប់)', activeCls: 'bg-emerald-600 text-white border-emerald-700' }
              ].map(opt => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setMigrationStatusFilter(opt.key)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                    migrationStatusFilter === opt.key
                      ? opt.activeCls
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Horizontal Table Grouped by Age with Village Rows */}
        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full text-[10.5px] text-center border-collapse font-khmer print-standard-table">
            <thead>
              <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 font-bold">
                <th rowSpan={2} className="py-2 px-2 text-left border-r border-slate-300 min-w-[95px]">អាយុ</th>
                <th rowSpan={2} className="py-2 px-2 text-left border-r border-slate-300 min-w-[140px]">ឈ្មោះភូមិ (ជួរដេកភូមិ)</th>
                <th colSpan={2} className="p-1.5 border-r border-slate-300 bg-indigo-50 text-indigo-950">ជំរឿនពិត</th>
                <th colSpan={2} className="p-1.5 border-r border-slate-300 bg-emerald-50 text-emerald-950">សិស្សកំពុងរៀន</th>
                <th colSpan={2} className="p-1.5 border-r border-slate-300 bg-slate-50 text-slate-900">លំអៀង (+/-)</th>
                <th colSpan={2} className="p-1.5 border-r border-slate-300 bg-blue-50 text-blue-950">% ចូលរៀន</th>
                <th colSpan={2} className="p-1.5 border-r border-slate-300 bg-purple-50 text-purple-950">ចំណូល (In)</th>
                <th colSpan={2} className="p-1.5 border-r border-slate-300 bg-amber-50 text-amber-950">ចំណាកស្រុក (Out)</th>
                <th colSpan={2} className="p-1.5 border-r border-slate-300 bg-rose-50 text-rose-950">មិនទាន់ចុះឈ្មោះ</th>
                <th rowSpan={2} className="p-2 text-left border-r border-slate-300 min-w-[240px] bg-slate-50">
                  មូលហេតុភាគរយ (&lt;១០០% / &gt;១០០%)
                </th>
                <th rowSpan={2} className="p-2 text-left min-w-[150px] bg-slate-50">កំណត់សំគាល់បន្ថែម</th>
              </tr>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-300 text-[9.5px] font-bold">
                <th className="p-1 border-r border-slate-200 bg-indigo-50">សរុប</th>
                <th className="p-1 border-r border-slate-300 bg-indigo-50 text-pink-700">ស្រី</th>
                <th className="p-1 border-r border-slate-200 bg-emerald-50">សរុប</th>
                <th className="p-1 border-r border-slate-300 bg-emerald-50 text-pink-700">ស្រី</th>
                <th className="p-1 border-r border-slate-200">សរុប</th>
                <th className="p-1 border-r border-slate-300 text-pink-700">ស្រី</th>
                <th className="p-1 border-r border-slate-200 bg-blue-50">សរុប</th>
                <th className="p-1 border-r border-slate-300 bg-blue-50 text-pink-700">ស្រី</th>
                <th className="p-1 border-r border-slate-200 bg-purple-50">សរុប</th>
                <th className="p-1 border-r border-slate-300 bg-purple-50 text-pink-700">ស្រី</th>
                <th className="p-1 border-r border-slate-200 bg-amber-50">សរុប</th>
                <th className="p-1 border-r border-slate-300 bg-amber-50 text-pink-700">ស្រី</th>
                <th className="p-1 border-r border-slate-200 bg-rose-50">សរុប</th>
                <th className="p-1 border-r border-slate-300 bg-rose-50 text-pink-700">ស្រី</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {groupedMigrationSections.length === 0 ? (
                <tr>
                  <td colSpan={18} className="py-8 text-center text-slate-400">
                    {language === 'km' ? 'មិនមានទិន្នន័យត្រូវនឹងលក្ខខណ្ឌតម្រងនេះទេ' : 'No rows match the selected filters'}
                  </td>
                </tr>
              ) : (
                groupedMigrationSections.map(group => {
                  const subCensusTot = group.rows.reduce((s, r) => s + r.censusTotal, 0);
                  const subCensusFem = group.rows.reduce((s, r) => s + r.censusFemale, 0);
                  const subEnrolledTot = group.rows.reduce((s, r) => s + r.enrolledTotal, 0);
                  const subEnrolledFem = group.rows.reduce((s, r) => s + r.enrolledFemale, 0);
                  const subDiffTot = subEnrolledTot - subCensusTot;
                  const subDiffFem = subEnrolledFem - subCensusFem;
                  const subRateTot = subCensusTot > 0 ? parseFloat(((subEnrolledTot / subCensusTot) * 100).toFixed(1)) : 0;
                  const subRateFem = subCensusFem > 0 ? parseFloat(((subEnrolledFem / subCensusFem) * 100).toFixed(1)) : 0;
                  const subInTot = group.rows.reduce((s, r) => s + r.inMigrationTotal, 0);
                  const subInFem = group.rows.reduce((s, r) => s + r.inMigrationFemale, 0);
                  const subOutTot = group.rows.reduce((s, r) => s + r.outMigrationTotal, 0);
                  const subOutFem = group.rows.reduce((s, r) => s + r.outMigrationFemale, 0);
                  const subRemTot = group.rows.reduce((s, r) => s + r.notEnrolledRemainingTotal, 0);
                  const subRemFem = group.rows.reduce((s, r) => s + r.notEnrolledRemainingFemale, 0);

                  return (
                    <React.Fragment key={group.ageKey}>
                      {group.rows.map((row, idx) => (
                        <tr key={row.rowKey} className="hover:bg-slate-50/90 transition">
                          {idx === 0 && (
                            <td
                              rowSpan={group.rows.length + 1}
                              className="py-1.5 px-2 text-left border-r border-slate-300 bg-slate-50/80 font-black text-indigo-950 align-top whitespace-nowrap"
                            >
                              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-100 text-indigo-950 border border-indigo-200 text-[11px]">
                                {group.ageLabelKm}
                              </div>
                            </td>
                          )}

                          {/* Village Horizontal Row Label */}
                          <td className="py-1.5 px-2 text-left border-r border-slate-300 font-bold text-slate-900 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  row.villageId === 'outside'
                                    ? 'bg-purple-600'
                                    : row.villageId === 'mukh_chhnang'
                                      ? 'bg-amber-500'
                                      : 'bg-blue-600'
                                }`}
                              />
                              <span>{row.villageName}</span>
                            </div>
                          </td>

                          {/* Census */}
                          <td className="p-1 border-r border-slate-200 bg-indigo-50/30 font-bold">{row.censusTotal}</td>
                          <td className="p-1 border-r border-slate-300 bg-indigo-50/30 text-pink-700 font-semibold">{row.censusFemale}</td>

                          {/* Enrolled */}
                          <td className="p-1 border-r border-slate-200 bg-emerald-50/30 font-black text-emerald-900">{row.enrolledTotal}</td>
                          <td className="p-1 border-r border-slate-300 bg-emerald-50/30 text-pink-800 font-bold">{row.enrolledFemale}</td>

                          {/* Diff (+/-) */}
                          <td className={`p-1 border-r border-slate-200 font-extrabold ${
                            row.diffTotal > 0 ? 'text-purple-800 bg-purple-50/40' : row.diffTotal < 0 ? 'text-rose-700 bg-rose-50/40' : 'text-emerald-700'
                          }`}>
                            {row.diffTotal > 0 ? `+${row.diffTotal}` : row.diffTotal}
                          </td>
                          <td className={`p-1 border-r border-slate-300 font-bold ${
                            row.diffFemale > 0 ? 'text-purple-700 bg-purple-50/40' : row.diffFemale < 0 ? 'text-rose-700 bg-rose-50/40' : 'text-pink-700'
                          }`}>
                            {row.diffFemale > 0 ? `+${row.diffFemale}` : row.diffFemale}
                          </td>

                          {/* Enrollment % */}
                          <td className="p-1 border-r border-slate-200 bg-blue-50/30">
                            {row.villageId === 'outside' ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-300">
                                ចំណូល +{row.enrolledTotal}
                              </span>
                            ) : getRateBadge(row.rateTotal)}
                          </td>
                          <td className="p-1 border-r border-slate-300 bg-blue-50/30">
                            {row.villageId === 'outside' ? (
                              <span className="text-slate-400 text-[10px]">—</span>
                            ) : getRateBadge(row.rateFemale, true)}
                          </td>

                          {/* Editable In-Migration */}
                          <td className="p-0.5 border-r border-slate-200 bg-purple-50/40">
                            <input
                              type="number"
                              min={0}
                              value={row.inMigrationTotal}
                              onChange={(e) => handleMigrationOverrideChange(row.rowKey, 'inMigrationTotal', e.target.value)}
                              className="w-10 text-center font-bold text-purple-950 bg-white border border-purple-300 rounded px-0.5 py-0.5 text-[10px] focus:ring-2 focus:ring-purple-500"
                              title="កែចំនួនកុមារចំណូល (សរុប)"
                            />
                          </td>
                          <td className="p-0.5 border-r border-slate-300 bg-purple-50/40">
                            <input
                              type="number"
                              min={0}
                              value={row.inMigrationFemale}
                              onChange={(e) => handleMigrationOverrideChange(row.rowKey, 'inMigrationFemale', e.target.value)}
                              className="w-10 text-center font-bold text-pink-800 bg-white border border-purple-300 rounded px-0.5 py-0.5 text-[10px] focus:ring-2 focus:ring-pink-500"
                              title="កែចំនួនកុមារចំណូល (ស្រី)"
                            />
                          </td>

                          {/* Editable Out-Migration */}
                          <td className="p-0.5 border-r border-slate-200 bg-amber-50/40">
                            <input
                              type="number"
                              min={0}
                              value={row.outMigrationTotal}
                              onChange={(e) => handleMigrationOverrideChange(row.rowKey, 'outMigrationTotal', e.target.value)}
                              className="w-10 text-center font-bold text-amber-950 bg-white border border-amber-300 rounded px-0.5 py-0.5 text-[10px] focus:ring-2 focus:ring-amber-500"
                              title="កែចំនួនចំណាកស្រុក/ផ្លាស់លំនៅ-ឈប់រៀន (សរុប)"
                            />
                          </td>
                          <td className="p-0.5 border-r border-slate-300 bg-amber-50/40">
                            <input
                              type="number"
                              min={0}
                              value={row.outMigrationFemale}
                              onChange={(e) => handleMigrationOverrideChange(row.rowKey, 'outMigrationFemale', e.target.value)}
                              className="w-10 text-center font-bold text-pink-800 bg-white border border-amber-300 rounded px-0.5 py-0.5 text-[10px] focus:ring-2 focus:ring-pink-500"
                              title="កែចំនួនចំណាកស្រុក/ផ្លាស់លំនៅ-ឈប់រៀន (ស្រី)"
                            />
                          </td>

                          {/* Remaining Not-Enrolled / Attending Elsewhere */}
                          <td className="p-1 border-r border-slate-200 bg-rose-50/40 font-bold text-rose-900">
                            {row.notEnrolledRemainingTotal}
                          </td>
                          <td className="p-1 border-r border-slate-300 bg-rose-50/40 text-pink-700 font-semibold">
                            {row.notEnrolledRemainingFemale}
                          </td>

                          {/* Clear <100% / >100% Reason */}
                          <td className="py-1.5 px-2 text-left border-r border-slate-300 text-[10.5px] leading-snug">
                            <div className="flex items-start gap-1.5">
                              {row.varianceStatus === 'over' ? (
                                <span className="shrink-0 mt-0.5 px-1.5 py-0.2 rounded text-[9.5px] font-black bg-purple-100 text-purple-900 border border-purple-300">
                                  &gt;100%
                                </span>
                              ) : row.varianceStatus === 'under' ? (
                                <span className="shrink-0 mt-0.5 px-1.5 py-0.2 rounded text-[9.5px] font-black bg-rose-100 text-rose-900 border border-rose-300">
                                  &lt;100%
                                </span>
                              ) : row.varianceStatus === 'exact' ? (
                                <span className="shrink-0 mt-0.5 px-1.5 py-0.2 rounded text-[9.5px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                                  =100%
                                </span>
                              ) : null}
                              <span className="text-slate-700 font-medium">{row.autoReasonKm}</span>
                            </div>
                          </td>

                          {/* Custom Reason / Note Input */}
                          <td className="p-1 text-left">
                            <input
                              type="text"
                              value={row.customReason}
                              onChange={(e) => handleMigrationOverrideChange(row.rowKey, 'customReason', e.target.value)}
                              placeholder="បញ្ជាក់មូលហេតុជាក់ស្តែង..."
                              className="w-full text-[10px] text-slate-800 bg-transparent hover:bg-slate-100 focus:bg-white rounded px-1.5 py-0.5 border border-transparent focus:border-slate-300"
                            />
                          </td>
                        </tr>
                      ))}

                      {/* Subtotal Horizontal Row per Age */}
                      <tr className="bg-slate-100/90 font-extrabold text-slate-900 border-b-2 border-slate-300">
                        <td className="py-1.5 px-2 text-left border-r border-slate-300 text-indigo-950 whitespace-nowrap">
                          សរុប ({group.ageLabelKm})
                        </td>
                        <td className="p-1 border-r border-slate-200">{subCensusTot}</td>
                        <td className="p-1 border-r border-slate-300 text-pink-800">{subCensusFem}</td>
                        <td className="p-1 border-r border-slate-200 text-emerald-950">{subEnrolledTot}</td>
                        <td className="p-1 border-r border-slate-300 text-pink-900">{subEnrolledFem}</td>
                        <td className={`p-1 border-r border-slate-200 ${
                          subDiffTot > 0 ? 'text-purple-900' : subDiffTot < 0 ? 'text-rose-800' : 'text-emerald-800'
                        }`}>
                          {subDiffTot > 0 ? `+${subDiffTot}` : subDiffTot}
                        </td>
                        <td className={`p-1 border-r border-slate-300 ${
                          subDiffFem > 0 ? 'text-purple-800' : subDiffFem < 0 ? 'text-rose-800' : 'text-pink-800'
                        }`}>
                          {subDiffFem > 0 ? `+${subDiffFem}` : subDiffFem}
                        </td>
                        <td className="p-1 border-r border-slate-200 bg-blue-100/60">{getRateBadge(subRateTot)}</td>
                        <td className="p-1 border-r border-slate-300 bg-blue-100/60">{getRateBadge(subRateFem, true)}</td>
                        <td className="p-1 border-r border-slate-200 text-purple-950 bg-purple-100/50">{subInTot}</td>
                        <td className="p-1 border-r border-slate-300 text-pink-900 bg-purple-100/50">{subInFem}</td>
                        <td className="p-1 border-r border-slate-200 text-amber-950 bg-amber-100/50">{subOutTot}</td>
                        <td className="p-1 border-r border-slate-300 text-pink-900 bg-amber-100/50">{subOutFem}</td>
                        <td className="p-1 border-r border-slate-200 text-rose-900 bg-rose-100/50">{subRemTot}</td>
                        <td className="p-1 border-r border-slate-300 text-pink-900 bg-rose-100/50">{subRemFem}</td>
                        <td colSpan={2} className="py-1.5 px-2 text-left text-[10px] text-slate-700 font-bold">
                          {subDiffTot > 0
                            ? `លើសជំរឿនសរុប +${subDiffTot} នាក់ (${subRateTot}%) • ចំណូល +${subInTot} / ចំណាកស្រុក -${subOutTot}`
                            : subDiffTot < 0
                              ? `ខ្វះជំរឿនសរុប ${subDiffTot} នាក់ (${subRateTot}%) • ចំណាកស្រុក -${subOutTot} / មិនទាន់ចុះឈ្មោះ ${subRemTot}`
                              : `គ្រប់ជំរឿនសរុប ${subEnrolledTot}/${subCensusTot} (${subRateTot}%)`}
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Signatures Section for Official Reports */}
      <OfficialSignatureSection
        language={language}
        defaultLocation="រោគ"
        reportType="school"
      />
    </div>
  );
};
