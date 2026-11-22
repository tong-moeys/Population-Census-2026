import React, { useState, useMemo } from 'react';
import { 
  GraduationCap, 
  School, 
  Download, 
  Printer, 
  Info, 
  Baby, 
  BookOpen, 
  Users, 
  MapPin, 
  Building2, 
  Layers, 
  Table as TableIcon,
  LogIn,
  LogOut,
  User as UserIcon,
  ShieldCheck
} from 'lucide-react';
import { User } from 'firebase/auth';
import { Citizen, Language, SchoolCatchmentReportRow, ViewTab } from '../types/census';
import { translations } from '../utils/translations';
import { OfficialSignatureSection } from './OfficialSignatureSection';
import { OfficialReportHeader } from './OfficialReportHeader';

interface SchoolReportViewProps {
  citizens: Citizen[];
  language: Language;
  onFilterAgeAndSchool?: (minAge: number, maxAge: number) => void;
  user?: User | null;
  onSignIn?: () => void;
  onSignOut?: () => void;
  onNavigateTab?: (tab: ViewTab) => void;
}

export const SchoolReportView: React.FC<SchoolReportViewProps> = ({
  citizens,
  language,
  user,
  onSignIn,
  onSignOut,
  onNavigateTab
}) => {
  const t = translations[language];
  const [reportMode, setReportMode] = useState<'village' | 'school' | 'both'>('village');
  const [activeTableTab, setActiveTableTab] = useState<'master' | 'all' | 'table1' | 'table2'>('all');

  // Helper to compute a report row for any list of citizens
  const computeReportRow = (list: Citizen[], name: string, isMainDataset = true): SchoolCatchmentReportRow => {
    const calc = (min: number, max: number) => {
      const match = list.filter(c => c.age >= min && c.age <= max);
      const female = match.filter(c => c.gender === 'ស្រី').length;
      return { total: match.length, female };
    };

    const age0 = calc(0, 0);
    const age1 = calc(1, 1);
    const age2 = calc(2, 2);
    const age3 = calc(3, 3);
    const total0to3 = {
      total: age0.total + age1.total + age2.total + age3.total,
      female: age0.female + age1.female + age2.female + age3.female
    };

    const age4 = calc(4, 4);
    const age5 = calc(5, 5);
    const age6 = calc(6, 6);
    const total4to6 = {
      total: age4.total + age5.total + age6.total,
      female: age4.female + age5.female + age6.female
    };

    const age7 = calc(7, 7);
    const age8 = calc(8, 8);
    const age9 = calc(9, 9);
    const age10 = calc(10, 10);
    const age11 = calc(11, 11);
    const total7to11 = {
      total: age7.total + age8.total + age9.total + age10.total + age11.total,
      female: age7.female + age8.female + age9.female + age10.female + age11.female
    };

    const age12 = calc(12, 12);
    const age13 = calc(13, 13);
    const age14 = calc(14, 14);
    const total12to14 = {
      total: age12.total + age13.total + age14.total,
      female: age12.female + age13.female + age14.female
    };

    const age15 = calc(15, 15);
    const age16 = calc(16, 16);
    const age17 = calc(17, 17);
    const total15to17 = {
      total: age15.total + age16.total + age17.total,
      female: age15.female + age16.female + age17.female
    };

    const age18 = calc(18, 18);
    const age19to25 = calc(19, 25);
    const age26to45 = calc(26, 45);
    const age46plus = calc(46, 150);
    const total18plus = {
      total: age18.total + age19to25.total + age26to45.total + age46plus.total,
      female: age18.female + age19to25.female + age26to45.female + age46plus.female
    };

    const grandTotal = {
      total: list.length,
      female: list.filter(c => c.gender === 'ស្រី').length
    };

    const uniqueHouseholds = new Set(list.map(c => `${(c.village || 'រោគ').trim()}_${c.householdCode || c.householdId}`)).size;

    return {
      schoolName: name,
      isMainDataset,
      age0, age1, age2, age3, total0to3,
      age4, age5, age6, total4to6,
      age7, age8, age9, age10, age11, total7to11,
      age12, age13, age14, total12to14,
      age15, age16, age17, total15to17,
      age18, age19to25, age26to45, age46plus, total18plus,
      grandTotal,
      householdCount: uniqueHouseholds
    };
  };

  // 1. Data for ភូមិរោគ (Feeder village 1 of ប.សរោគ)
  const roakCitizens = useMemo(() => {
    return citizens.filter(c => (c.village || '').trim() !== 'មុខឈ្នាង');
  }, [citizens]);

  // 2. Data for ភូមិមុខឈ្នាង (Feeder village 2 of ប.សរោគ)
  const mukhChhnangCitizens = useMemo(() => {
    return citizens.filter(c => (c.village || '').trim() === 'មុខឈ្នាង');
  }, [citizens]);

  // Computed Report Rows for Host School's 2 Feeder Villages
  const roakVillageRow = useMemo(() => {
    return computeReportRow(roakCitizens, language === 'km' ? 'ភូមិរោគ' : 'Roak Village', true);
  }, [roakCitizens, language]);

  const mukhChhnangVillageRow = useMemo(() => {
    return computeReportRow(mukhChhnangCitizens, language === 'km' ? 'ភូមិមុខឈ្នាង' : 'Mukh Chhnang Village', true);
  }, [mukhChhnangCitizens, language]);

  // Primary School Rouk (ប.សរោគ): Feeder villages are BOTH ភូមិរោគ and ភូមិមុខឈ្នាង (All current surveyed citizens)
  const roakSchoolRow = useMemo(() => {
    return computeReportRow(
      citizens,
      language === 'km' ? 'ប.សរោគ' : 'Rouk Primary School (Feeder: Roak & Mukh Chhnang)',
      true
    );
  }, [citizens, language]);

  // Other Cluster Primary Schools: Feeder villages designated, census to be entered later once conducted
  const zeroCount = { total: 0, female: 0 };
  const speanSrengSchoolRow: SchoolCatchmentReportRow = {
    schoolName: language === 'km' ? 'ប.សស្ពានស្រែង' : 'Spean Sreng Primary (Pending Census)',
    isMainDataset: false,
    age0: zeroCount, age1: zeroCount, age2: zeroCount, age3: zeroCount, total0to3: zeroCount,
    age4: zeroCount, age5: zeroCount, age6: zeroCount, total4to6: zeroCount,
    age7: zeroCount, age8: zeroCount, age9: zeroCount, age10: zeroCount, age11: zeroCount, total7to11: zeroCount,
    age12: zeroCount, age13: zeroCount, age14: zeroCount, total12to14: zeroCount,
    age15: zeroCount, age16: zeroCount, age17: zeroCount, total15to17: zeroCount,
    age18: zeroCount, age19to25: zeroCount, age26to45: zeroCount, age46plus: zeroCount, total18plus: zeroCount,
    grandTotal: zeroCount,
    householdCount: 0
  };

  const mukhChhnangSchoolRow: SchoolCatchmentReportRow = {
    schoolName: language === 'km' ? 'ប.សមុខឈ្នាង' : 'Mukh Chhnang Primary (Pending Census)',
    isMainDataset: false,
    age0: zeroCount, age1: zeroCount, age2: zeroCount, age3: zeroCount, total0to3: zeroCount,
    age4: zeroCount, age5: zeroCount, age6: zeroCount, total4to6: zeroCount,
    age7: zeroCount, age8: zeroCount, age9: zeroCount, age10: zeroCount, age11: zeroCount, total7to11: zeroCount,
    age12: zeroCount, age13: zeroCount, age14: zeroCount, total12to14: zeroCount,
    age15: zeroCount, age16: zeroCount, age17: zeroCount, total15to17: zeroCount,
    age18: zeroCount, age19to25: zeroCount, age26to45: zeroCount, age46plus: zeroCount, total18plus: zeroCount,
    grandTotal: zeroCount,
    householdCount: 0
  };

  const pongroKandalSchoolRow: SchoolCatchmentReportRow = {
    schoolName: language === 'km' ? 'ប.សពង្រកណ្ដោល' : 'Pongro Kandal Primary (Pending Census)',
    isMainDataset: false,
    age0: zeroCount, age1: zeroCount, age2: zeroCount, age3: zeroCount, total0to3: zeroCount,
    age4: zeroCount, age5: zeroCount, age6: zeroCount, total4to6: zeroCount,
    age7: zeroCount, age8: zeroCount, age9: zeroCount, age10: zeroCount, age11: zeroCount, total7to11: zeroCount,
    age12: zeroCount, age13: zeroCount, age14: zeroCount, total12to14: zeroCount,
    age15: zeroCount, age16: zeroCount, age17: zeroCount, total15to17: zeroCount,
    age18: zeroCount, age19to25: zeroCount, age26to45: zeroCount, age46plus: zeroCount, total18plus: zeroCount,
    grandTotal: zeroCount,
    householdCount: 0
  };

  const grandTotalRow = useMemo(() => {
    return computeReportRow(citizens, language === 'km' ? 'សរុបរួម' : 'Grand Total', true);
  }, [citizens, language]);

  const villageRows = useMemo(
    () => [roakVillageRow, mukhChhnangVillageRow],
    [roakVillageRow, mukhChhnangVillageRow]
  );

  const schoolClusterRows = useMemo(
    () => [speanSrengSchoolRow, roakSchoolRow, mukhChhnangSchoolRow, pongroKandalSchoolRow],
    [speanSrengSchoolRow, roakSchoolRow, mukhChhnangSchoolRow, pongroKandalSchoolRow]
  );

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Name / Village / School',
      'Age 0 Tot', 'Age 0 Fem', 'Age 1 Tot', 'Age 1 Fem', 'Age 2 Tot', 'Age 2 Fem', 'Age 3 Tot', 'Age 3 Fem', 'Tot 0-3', 'Fem 0-3',
      'Age 4 Tot', 'Age 4 Fem', 'Age 5 Tot', 'Age 5 Fem', 'Age 6 Tot', 'Age 6 Fem', 'Tot 4-6', 'Fem 4-6',
      'Age 7 Tot', 'Age 7 Fem', 'Age 8 Tot', 'Age 8 Fem', 'Age 9 Tot', 'Age 9 Fem', 'Age 10 Tot', 'Age 10 Fem', 'Age 11 Tot', 'Age 11 Fem', 'Tot 7-11', 'Fem 7-11',
      'Age 12 Tot', 'Age 12 Fem', 'Age 13 Tot', 'Age 13 Fem', 'Age 14 Tot', 'Age 14 Fem', 'Tot 12-14', 'Fem 12-14',
      'Age 15 Tot', 'Age 15 Fem', 'Age 16 Tot', 'Age 16 Fem', 'Age 17 Tot', 'Age 17 Fem', 'Tot 15-17', 'Fem 15-17',
      'Age 18 Tot', 'Age 18 Fem', 'Age 19-25 Tot', 'Age 19-25 Fem', 'Age 26-45 Tot', 'Age 26-45 Fem', 'Age 46+ Tot', 'Age 46+ Fem', 'Tot 18+', 'Fem 18+',
      'Grand Total', 'Grand Total Fem', 'Households'
    ];

    const makeRow = (s: SchoolCatchmentReportRow) => [
      `"${s.schoolName}"`,
      s.age0.total, s.age0.female, s.age1.total, s.age1.female, s.age2.total, s.age2.female, s.age3.total, s.age3.female, s.total0to3.total, s.total0to3.female,
      s.age4.total, s.age4.female, s.age5.total, s.age5.female, s.age6.total, s.age6.female, s.total4to6.total, s.total4to6.female,
      s.age7.total, s.age7.female, s.age8.total, s.age8.female, s.age9.total, s.age9.female, s.age10.total, s.age10.female, s.age11.total, s.age11.female, s.total7to11.total, s.total7to11.female,
      s.age12.total, s.age12.female, s.age13.total, s.age13.female, s.age14.total, s.age14.female, s.total12to14.total, s.total12to14.female,
      s.age15.total, s.age15.female, s.age16.total, s.age16.female, s.age17.total, s.age17.female, s.total15to17.total, s.total15to17.female,
      s.age18.total, s.age18.female, s.age19to25.total, s.age19to25.female, s.age26to45.total, s.age26to45.female, s.age46plus.total, s.age46plus.female, s.total18plus.total, s.total18plus.female,
      s.grandTotal.total, s.grandTotal.female, s.householdCount
    ];

    const dataRows =
      reportMode === 'village'
        ? [...villageRows.map(makeRow), makeRow(grandTotalRow)]
        : reportMode === 'school'
        ? [...schoolClusterRows.map(makeRow), makeRow(grandTotalRow)]
        : [
            ...villageRows.map(makeRow),
            makeRow(grandTotalRow),
            [],
            ...schoolClusterRows.map(makeRow),
            makeRow(grandTotalRow)
          ];

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [
      headers.join(','),
      ...dataRows.map(r => r.join(','))
    ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `demographic-report-${reportMode}-moeys-2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Shared Renderer for Master Table / Table 1 / Table 2
  const renderTablesBlock = (rows: SchoolCatchmentReportRow[], modeKind: 'village' | 'school', sectionTitle?: string) => {
    const modeSuffix =
      modeKind === 'village'
        ? (language === 'km' ? 'តាមភូមិចំណុះ ប.សរោគ' : 'By Feeder Village')
        : (language === 'km' ? 'តាមកម្រងសាលារៀន / ឃុំ' : 'By Cluster School');
    const entityColHeader =
      modeKind === 'village'
        ? (language === 'km' ? 'ឈ្មោះភូមិចំណុះ' : 'Village Name')
        : (language === 'km' ? 'ឈ្មោះសាលា' : 'School Name');

    return (
      <div className="space-y-5 print:space-y-3">
        {sectionTitle && (
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 print:bg-transparent print:border-0 print:border-b print:border-slate-400 print:rounded-none print:px-0 print:py-1">
            <div className="flex items-center gap-2">
              {modeKind === 'village' ? (
                <MapPin className="w-4 h-4 text-emerald-700" />
              ) : (
                <Building2 className="w-4 h-4 text-indigo-700" />
              )}
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base print:text-xs">
                {sectionTitle}
              </h3>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white text-slate-700 border border-slate-200 print:hidden">
              {modeKind === 'village'
                ? (language === 'km' ? '២ ភូមិចំណុះ (ភូមិរោគ & ភូមិមុខឈ្នាង)' : '2 Feeder Villages')
                : (language === 'km' ? '៤ សាលាក្នុងកម្រង' : '4 Cluster Schools')}
            </span>
          </div>
        )}

        {/* ======================================================== */}
        {/* 1. MASTER TABLE VIEW (Continuous official MoEYS Sheet) */}
        {/* ======================================================== */}
        {activeTableTab === 'master' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden print:overflow-visible print:shadow-none print:rounded-lg print:break-inside-avoid">
            <div className="p-4 print:p-2 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${modeKind === 'village' ? 'bg-emerald-600' : 'bg-indigo-600'}`} />
                <h3 className="font-bold text-slate-900 text-sm sm:text-base print:text-xs">
                  {language === 'km'
                    ? `តារាងស្ថិតិពេញលេញ៖ ស្ថិតិកុមារ និងប្រជាជន (${modeSuffix})`
                    : `Full Master Table: Demographic Census by Age Cohort (${modeSuffix})`}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs print:text-[9px] font-semibold px-2.5 py-1 print:px-1.5 print:py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {language === 'km' ? 'គ្រប់កម្រិតអាយុ ០ ដល់ ១៨+ ឆ្នាំ' : 'All Cohorts 0 to 18+ Yrs'}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full text-xs text-center border-collapse print-ultra-wide-table">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b border-slate-300 font-bold">
                    <th rowSpan={2} className="p-2.5 text-left border-r border-slate-300 min-w-[140px] sticky left-0 print:static bg-slate-100 z-10">
                      {entityColHeader}
                    </th>
                    {/* 0-3 */}
                    <th colSpan={2} className="p-2 border-r border-slate-300 bg-amber-50 text-amber-900">០ឆ្នាំ</th>
                    <th colSpan={2} className="p-2 border-r border-slate-300 bg-amber-50 text-amber-900">១ឆ្នាំ</th>
                    <th colSpan={2} className="p-2 border-r border-slate-300 bg-amber-50 text-amber-900">២ឆ្នាំ</th>
                    <th colSpan={2} className="p-2 border-r border-slate-300 bg-amber-50 text-amber-900">៣ឆ្នាំ</th>
                    <th colSpan={2} className="p-2 border-r border-slate-300 bg-amber-100 font-extrabold text-amber-950">សរុប (០-៣)</th>
                    {/* 4-6 */}
                    <th colSpan={2} className="p-2 border-r border-slate-300 bg-emerald-50 text-emerald-900">៤ឆ្នាំ</th>
                    <th colSpan={2} className="p-2 border-r border-slate-300 bg-emerald-50 text-emerald-900">៥ឆ្នាំ</th>
                    <th colSpan={2} className="p-2 border-r border-slate-300 bg-emerald-50 text-emerald-900">៦ឆ្នាំ</th>
                    <th colSpan={2} className="p-2 border-r border-slate-300 bg-emerald-100 font-extrabold text-emerald-950">សរុប (៤-៦)</th>
                    {/* 7-11 */}
                    <th colSpan={2} className="p-2 border-r border-slate-300 bg-cyan-50 text-cyan-900">៧ឆ្នាំ</th>
                    <th colSpan={2} className="p-2 border-r border-slate-300 bg-cyan-50 text-cyan-900">៨ឆ្នាំ</th>
                    <th colSpan={2} className="p-2 border-r border-slate-300 bg-cyan-50 text-cyan-900">៩ឆ្នាំ</th>
                    <th colSpan={2} className="p-2 border-r border-slate-300 bg-cyan-50 text-cyan-900">១០ឆ្នាំ</th>
                    <th colSpan={2} className="p-2 border-r border-slate-300 bg-cyan-50 text-cyan-900">១១ឆ្នាំ</th>
                    <th colSpan={2} className="p-2 border-r border-slate-300 bg-cyan-100 font-extrabold text-cyan-950">សរុប (៧-១១)</th>
                    {/* 12-14 */}
                    <th colSpan={2} className="p-2 border-r border-slate-300 bg-indigo-50 text-indigo-900">១២-១៤ឆ្នាំ</th>
                    {/* 15-17 */}
                    <th colSpan={2} className="p-2 border-r border-slate-300 bg-purple-50 text-purple-900">១៥-១៧ឆ្នាំ</th>
                    {/* 18+ */}
                    <th colSpan={2} className="p-2 border-r border-slate-300 bg-slate-200 text-slate-900">១៨+ ឆ្នាំ</th>
                    {/* Grand total & households */}
                    <th colSpan={2} className="p-2 border-r border-slate-300 bg-blue-200 font-black text-blue-950">សរុបរួម</th>
                    <th rowSpan={2} className="p-2 bg-slate-200 font-black text-slate-900 min-w-[80px]">
                      {language === 'km' ? 'ចំនួនគ្រួសារ' : 'Households'}
                    </th>
                  </tr>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-300 text-[11px]">
                    {/* 0-3 */}
                    <th className="p-1.5 border-r border-slate-200">សរុប</th><th className="p-1.5 border-r border-slate-300 text-pink-600">ស្រី</th>
                    <th className="p-1.5 border-r border-slate-200">សរុប</th><th className="p-1.5 border-r border-slate-300 text-pink-600">ស្រី</th>
                    <th className="p-1.5 border-r border-slate-200">សរុប</th><th className="p-1.5 border-r border-slate-300 text-pink-600">ស្រី</th>
                    <th className="p-1.5 border-r border-slate-200">សរុប</th><th className="p-1.5 border-r border-slate-300 text-pink-600">ស្រី</th>
                    <th className="p-1.5 border-r border-slate-200 bg-amber-100 font-bold">សរុប</th><th className="p-1.5 border-r border-slate-300 bg-amber-100 text-pink-700 font-bold">ស្រី</th>
                    {/* 4-6 */}
                    <th className="p-1.5 border-r border-slate-200">សរុប</th><th className="p-1.5 border-r border-slate-300 text-pink-600">ស្រី</th>
                    <th className="p-1.5 border-r border-slate-200">សរុប</th><th className="p-1.5 border-r border-slate-300 text-pink-600">ស្រី</th>
                    <th className="p-1.5 border-r border-slate-200">សរុប</th><th className="p-1.5 border-r border-slate-300 text-pink-600">ស្រី</th>
                    <th className="p-1.5 border-r border-slate-200 bg-emerald-100 font-bold">សរុប</th><th className="p-1.5 border-r border-slate-300 bg-emerald-100 text-pink-700 font-bold">ស្រី</th>
                    {/* 7-11 */}
                    <th className="p-1.5 border-r border-slate-200">សរុប</th><th className="p-1.5 border-r border-slate-300 text-pink-600">ស្រី</th>
                    <th className="p-1.5 border-r border-slate-200">សរុប</th><th className="p-1.5 border-r border-slate-300 text-pink-600">ស្រី</th>
                    <th className="p-1.5 border-r border-slate-200">សរុប</th><th className="p-1.5 border-r border-slate-300 text-pink-600">ស្រី</th>
                    <th className="p-1.5 border-r border-slate-200">សរុប</th><th className="p-1.5 border-r border-slate-300 text-pink-600">ស្រី</th>
                    <th className="p-1.5 border-r border-slate-200">សរុប</th><th className="p-1.5 border-r border-slate-300 text-pink-600">ស្រី</th>
                    <th className="p-1.5 border-r border-slate-200 bg-cyan-100 font-bold">សរុប</th><th className="p-1.5 border-r border-slate-300 bg-cyan-100 text-pink-700 font-bold">ស្រី</th>
                    {/* 12-14 */}
                    <th className="p-1.5 border-r border-slate-200 bg-indigo-100 font-bold">សរុប</th><th className="p-1.5 border-r border-slate-300 bg-indigo-100 text-pink-700 font-bold">ស្រី</th>
                    {/* 15-17 */}
                    <th className="p-1.5 border-r border-slate-200 bg-purple-100 font-bold">សរុប</th><th className="p-1.5 border-r border-slate-300 bg-purple-100 text-pink-700 font-bold">ស្រី</th>
                    {/* 18+ */}
                    <th className="p-1.5 border-r border-slate-200 bg-slate-300 font-bold">សរុប</th><th className="p-1.5 border-r border-slate-300 bg-slate-300 text-pink-700 font-bold">ស្រី</th>
                    {/* Grand total */}
                    <th className="p-1.5 border-r border-slate-200 bg-blue-200 font-bold text-blue-950">សរុប</th><th className="p-1.5 border-r border-slate-300 bg-blue-200 text-pink-800 font-bold">ស្រី</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {rows.map((row) => (
                    <tr
                      key={row.schoolName}
                      className={`hover:bg-blue-50/60 transition ${row.isMainDataset ? 'bg-blue-50/20 font-semibold' : ''}`}
                    >
                      <td className="p-2.5 text-left border-r border-slate-200 font-medium sticky left-0 print:static bg-inherit z-10 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {row.isMainDataset && (
                            <span className={`w-2 h-2 rounded-full ${row.schoolName.includes('មុខឈ្នាង') ? 'bg-amber-500' : 'bg-blue-600'}`} />
                          )}
                          <span className="font-bold text-slate-900">{row.schoolName}</span>
                        </div>
                      </td>

                      {/* 0 */}
                      <td className="p-2 border-r border-slate-200">{row.age0.total}</td>
                      <td className="p-2 border-r border-slate-300 text-pink-600">{row.age0.female}</td>
                      {/* 1 */}
                      <td className="p-2 border-r border-slate-200">{row.age1.total}</td>
                      <td className="p-2 border-r border-slate-300 text-pink-600">{row.age1.female}</td>
                      {/* 2 */}
                      <td className="p-2 border-r border-slate-200">{row.age2.total}</td>
                      <td className="p-2 border-r border-slate-300 text-pink-600">{row.age2.female}</td>
                      {/* 3 */}
                      <td className="p-2 border-r border-slate-200">{row.age3.total}</td>
                      <td className="p-2 border-r border-slate-300 text-pink-600">{row.age3.female}</td>
                      {/* 0-3 */}
                      <td className="p-2 border-r border-slate-200 bg-amber-50/60 font-bold text-amber-900">{row.total0to3.total}</td>
                      <td className="p-2 border-r border-slate-300 bg-amber-50/60 font-bold text-pink-700">{row.total0to3.female}</td>

                      {/* 4 */}
                      <td className="p-2 border-r border-slate-200">{row.age4.total}</td>
                      <td className="p-2 border-r border-slate-300 text-pink-600">{row.age4.female}</td>
                      {/* 5 */}
                      <td className="p-2 border-r border-slate-200">{row.age5.total}</td>
                      <td className="p-2 border-r border-slate-300 text-pink-600">{row.age5.female}</td>
                      {/* 6 */}
                      <td className="p-2 border-r border-slate-200">{row.age6.total}</td>
                      <td className="p-2 border-r border-slate-300 text-pink-600">{row.age6.female}</td>
                      {/* 4-6 */}
                      <td className="p-2 border-r border-slate-200 bg-emerald-50/60 font-bold text-emerald-900">{row.total4to6.total}</td>
                      <td className="p-2 border-r border-slate-300 bg-emerald-50/60 font-bold text-pink-700">{row.total4to6.female}</td>

                      {/* 7 */}
                      <td className="p-2 border-r border-slate-200">{row.age7.total}</td>
                      <td className="p-2 border-r border-slate-300 text-pink-600">{row.age7.female}</td>
                      {/* 8 */}
                      <td className="p-2 border-r border-slate-200">{row.age8.total}</td>
                      <td className="p-2 border-r border-slate-300 text-pink-600">{row.age8.female}</td>
                      {/* 9 */}
                      <td className="p-2 border-r border-slate-200">{row.age9.total}</td>
                      <td className="p-2 border-r border-slate-300 text-pink-600">{row.age9.female}</td>
                      {/* 10 */}
                      <td className="p-2 border-r border-slate-200">{row.age10.total}</td>
                      <td className="p-2 border-r border-slate-300 text-pink-600">{row.age10.female}</td>
                      {/* 11 */}
                      <td className="p-2 border-r border-slate-200">{row.age11.total}</td>
                      <td className="p-2 border-r border-slate-300 text-pink-600">{row.age11.female}</td>
                      {/* 7-11 */}
                      <td className="p-2 border-r border-slate-200 bg-cyan-50/60 font-bold text-cyan-900">{row.total7to11.total}</td>
                      <td className="p-2 border-r border-slate-300 bg-cyan-50/60 font-bold text-pink-700">{row.total7to11.female}</td>

                      {/* 12-14 */}
                      <td className="p-2 border-r border-slate-200 bg-indigo-50/60 font-bold text-indigo-900">{row.total12to14.total}</td>
                      <td className="p-2 border-r border-slate-300 bg-indigo-50/60 font-bold text-pink-700">{row.total12to14.female}</td>

                      {/* 15-17 */}
                      <td className="p-2 border-r border-slate-200 bg-purple-50/60 font-bold text-purple-900">{row.total15to17.total}</td>
                      <td className="p-2 border-r border-slate-300 bg-purple-50/60 font-bold text-pink-700">{row.total15to17.female}</td>

                      {/* 18+ */}
                      <td className="p-2 border-r border-slate-200 bg-slate-200/70 font-bold text-slate-900">{row.total18plus.total}</td>
                      <td className="p-2 border-r border-slate-300 bg-slate-200/70 font-bold text-pink-700">{row.total18plus.female}</td>

                      {/* Grand Total */}
                      <td className="p-2 border-r border-slate-200 bg-blue-100 font-extrabold text-blue-950">{row.grandTotal.total}</td>
                      <td className="p-2 border-r border-slate-300 bg-blue-100 font-extrabold text-pink-700">{row.grandTotal.female}</td>

                      {/* Households */}
                      <td className="p-2 font-bold text-slate-800 bg-slate-50">{row.householdCount}</td>
                    </tr>
                  ))}

                  {/* Grand Total Row */}
                  <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                    <td className="p-2.5 text-left border-r border-slate-300 sticky left-0 print:static bg-slate-100 z-10">
                      <span className="font-extrabold text-blue-900">{language === 'km' ? 'សរុបរួម' : 'Grand Total'}</span>
                    </td>
                    {/* 0 */}
                    <td className="p-2 border-r border-slate-200">{grandTotalRow.age0.total}</td>
                    <td className="p-2 border-r border-slate-300 text-pink-700">{grandTotalRow.age0.female}</td>
                    {/* 1 */}
                    <td className="p-2 border-r border-slate-200">{grandTotalRow.age1.total}</td>
                    <td className="p-2 border-r border-slate-300 text-pink-700">{grandTotalRow.age1.female}</td>
                    {/* 2 */}
                    <td className="p-2 border-r border-slate-200">{grandTotalRow.age2.total}</td>
                    <td className="p-2 border-r border-slate-300 text-pink-700">{grandTotalRow.age2.female}</td>
                    {/* 3 */}
                    <td className="p-2 border-r border-slate-200">{grandTotalRow.age3.total}</td>
                    <td className="p-2 border-r border-slate-300 text-pink-700">{grandTotalRow.age3.female}</td>
                    {/* 0-3 */}
                    <td className="p-2 border-r border-slate-200 bg-amber-100 text-amber-950">{grandTotalRow.total0to3.total}</td>
                    <td className="p-2 border-r border-slate-300 bg-amber-100 text-pink-700">{grandTotalRow.total0to3.female}</td>

                    {/* 4 */}
                    <td className="p-2 border-r border-slate-200">{grandTotalRow.age4.total}</td>
                    <td className="p-2 border-r border-slate-300 text-pink-700">{grandTotalRow.age4.female}</td>
                    {/* 5 */}
                    <td className="p-2 border-r border-slate-200">{grandTotalRow.age5.total}</td>
                    <td className="p-2 border-r border-slate-300 text-pink-700">{grandTotalRow.age5.female}</td>
                    {/* 6 */}
                    <td className="p-2 border-r border-slate-200">{grandTotalRow.age6.total}</td>
                    <td className="p-2 border-r border-slate-300 text-pink-700">{grandTotalRow.age6.female}</td>
                    {/* 4-6 */}
                    <td className="p-2 border-r border-slate-200 bg-emerald-100 text-emerald-950">{grandTotalRow.total4to6.total}</td>
                    <td className="p-2 border-r border-slate-300 bg-emerald-100 text-pink-700">{grandTotalRow.total4to6.female}</td>

                    {/* 7 */}
                    <td className="p-2 border-r border-slate-200">{grandTotalRow.age7.total}</td>
                    <td className="p-2 border-r border-slate-300 text-pink-700">{grandTotalRow.age7.female}</td>
                    {/* 8 */}
                    <td className="p-2 border-r border-slate-200">{grandTotalRow.age8.total}</td>
                    <td className="p-2 border-r border-slate-300 text-pink-700">{grandTotalRow.age8.female}</td>
                    {/* 9 */}
                    <td className="p-2 border-r border-slate-200">{grandTotalRow.age9.total}</td>
                    <td className="p-2 border-r border-slate-300 text-pink-700">{grandTotalRow.age9.female}</td>
                    {/* 10 */}
                    <td className="p-2 border-r border-slate-200">{grandTotalRow.age10.total}</td>
                    <td className="p-2 border-r border-slate-300 text-pink-700">{grandTotalRow.age10.female}</td>
                    {/* 11 */}
                    <td className="p-2 border-r border-slate-200">{grandTotalRow.age11.total}</td>
                    <td className="p-2 border-r border-slate-300 text-pink-700">{grandTotalRow.age11.female}</td>
                    {/* 7-11 */}
                    <td className="p-2 border-r border-slate-200 bg-cyan-100 text-cyan-950">{grandTotalRow.total7to11.total}</td>
                    <td className="p-2 border-r border-slate-300 bg-cyan-100 text-pink-700">{grandTotalRow.total7to11.female}</td>

                    {/* 12-14 */}
                    <td className="p-2 border-r border-slate-200 bg-indigo-100 text-indigo-950">{grandTotalRow.total12to14.total}</td>
                    <td className="p-2 border-r border-slate-300 bg-indigo-100 text-pink-700">{grandTotalRow.total12to14.female}</td>

                    {/* 15-17 */}
                    <td className="p-2 border-r border-slate-200 bg-purple-100 text-purple-950">{grandTotalRow.total15to17.total}</td>
                    <td className="p-2 border-r border-slate-300 bg-purple-100 text-pink-700">{grandTotalRow.total15to17.female}</td>

                    {/* 18+ */}
                    <td className="p-2 border-r border-slate-200 bg-slate-300 text-slate-950">{grandTotalRow.total18plus.total}</td>
                    <td className="p-2 border-r border-slate-300 bg-slate-300 text-pink-700">{grandTotalRow.total18plus.female}</td>

                    {/* Grand total */}
                    <td className="p-2 border-r border-slate-200 bg-blue-200 text-blue-950 font-black">{grandTotalRow.grandTotal.total}</td>
                    <td className="p-2 border-r border-slate-300 bg-blue-200 text-pink-800 font-black">{grandTotalRow.grandTotal.female}</td>

                    {/* Households */}
                    <td className="p-2 font-black text-slate-900 bg-slate-100">{grandTotalRow.householdCount}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 2. TABLE 1: 0 - 11 YEARS OLD */}
        {/* ======================================================== */}
        {(activeTableTab === 'all' || activeTableTab === 'table1') && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden print:overflow-visible print:shadow-none print:rounded-lg print:break-inside-avoid">
            <div className="p-4 print:p-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${modeKind === 'village' ? 'bg-emerald-600' : 'bg-blue-600'}`} />
                <h3 className="font-bold text-slate-900 text-sm sm:text-base print:text-xs">
                  {language === 'km'
                    ? `តារាងទី១៖ ស្ថិតិកុមារតាមកម្រិតអាយុ ០ ដល់ ១១ ឆ្នាំ (${modeSuffix})`
                    : `Table 1: Children Population from 0 to 11 Years (${modeSuffix})`}
                </h3>
              </div>
              <span className="text-xs print:text-[9px] font-semibold px-2.5 py-1 print:px-1.5 print:py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                {language === 'km' ? '០ ដល់ ១១ ឆ្នាំ (មត្តេយ្យ & បឋម)' : '0 to 11 Years'}
              </span>
            </div>

            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full text-xs text-center border-collapse print-wide-table">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b border-slate-300 font-bold">
                    <th rowSpan={2} className="p-2.5 text-left border-r border-slate-300 min-w-[140px] sticky left-0 print:static bg-slate-100 z-10">
                      {entityColHeader}
                    </th>
                    <th colSpan={2} className="p-2 border-r border-slate-300 bg-amber-50 text-amber-900">០ឆ្នាំ</th>
                    <th colSpan={2} className="p-2 border-r border-slate-300 bg-amber-50 text-amber-900">១ឆ្នាំ</th>
                    <th colSpan={2} className="p-2 border-r border-slate-300 bg-amber-50 text-amber-900">២ឆ្នាំ</th>
                    <th colSpan={2} className="p-2 border-r border-slate-300 bg-amber-50 text-amber-900">៣ឆ្នាំ</th>
                    <th colSpan={2} className="p-2 border-r border-slate-300 bg-amber-100 font-extrabold text-amber-950">សរុប (០-៣)</th>

                    <th colSpan={2} className="p-2 border-r border-slate-300 bg-emerald-50 text-emerald-900">៤ឆ្នាំ</th>
                    <th colSpan={2} className="p-2 border-r border-slate-300 bg-emerald-50 text-emerald-900">៥ឆ្នាំ</th>
                    <th colSpan={2} className="p-2 border-r border-slate-300 bg-emerald-50 text-emerald-900">៦ឆ្នាំ</th>
                    <th colSpan={2} className="p-2 border-r border-slate-300 bg-emerald-100 font-extrabold text-emerald-950">សរុប (៤-៦)</th>

                    <th colSpan={2} className="p-2 border-r border-slate-300 bg-cyan-50 text-cyan-900">៧ឆ្នាំ</th>
                    <th colSpan={2} className="p-2 border-r border-slate-300 bg-cyan-50 text-cyan-900">៨ឆ្នាំ</th>
                    <th colSpan={2} className="p-2 border-r border-slate-300 bg-cyan-50 text-cyan-900">៩ឆ្នាំ</th>
                    <th colSpan={2} className="p-2 border-r border-slate-300 bg-cyan-50 text-cyan-900">១០ឆ្នាំ</th>
                    <th colSpan={2} className="p-2 border-r border-slate-300 bg-cyan-50 text-cyan-900">១១ឆ្នាំ</th>
                    <th colSpan={2} className="p-2 bg-cyan-100 font-extrabold text-cyan-950">សរុប (៧-១១)</th>
                  </tr>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-300 text-[11px]">
                    {/* 0-3 */}
                    <th className="p-1.5 border-r border-slate-200">សរុប</th>
                    <th className="p-1.5 border-r border-slate-300 text-pink-600">ស្រី</th>
                    <th className="p-1.5 border-r border-slate-200">សរុប</th>
                    <th className="p-1.5 border-r border-slate-300 text-pink-600">ស្រី</th>
                    <th className="p-1.5 border-r border-slate-200">សរុប</th>
                    <th className="p-1.5 border-r border-slate-300 text-pink-600">ស្រី</th>
                    <th className="p-1.5 border-r border-slate-200">សរុប</th>
                    <th className="p-1.5 border-r border-slate-300 text-pink-600">ស្រី</th>
                    <th className="p-1.5 border-r border-slate-200 bg-amber-100 font-bold">សរុប</th>
                    <th className="p-1.5 border-r border-slate-300 bg-amber-100 text-pink-700 font-bold">ស្រី</th>

                    {/* 4-6 */}
                    <th className="p-1.5 border-r border-slate-200">សរុប</th>
                    <th className="p-1.5 border-r border-slate-300 text-pink-600">ស្រី</th>
                    <th className="p-1.5 border-r border-slate-200">សរុប</th>
                    <th className="p-1.5 border-r border-slate-300 text-pink-600">ស្រី</th>
                    <th className="p-1.5 border-r border-slate-200">សរុប</th>
                    <th className="p-1.5 border-r border-slate-300 text-pink-600">ស្រី</th>
                    <th className="p-1.5 border-r border-slate-200 bg-emerald-100 font-bold">សរុប</th>
                    <th className="p-1.5 border-r border-slate-300 bg-emerald-100 text-pink-700 font-bold">ស្រី</th>

                    {/* 7-11 */}
                    <th className="p-1.5 border-r border-slate-200">សរុប</th>
                    <th className="p-1.5 border-r border-slate-300 text-pink-600">ស្រី</th>
                    <th className="p-1.5 border-r border-slate-200">សរុប</th>
                    <th className="p-1.5 border-r border-slate-300 text-pink-600">ស្រី</th>
                    <th className="p-1.5 border-r border-slate-200">សរុប</th>
                    <th className="p-1.5 border-r border-slate-300 text-pink-600">ស្រី</th>
                    <th className="p-1.5 border-r border-slate-200">សរុប</th>
                    <th className="p-1.5 border-r border-slate-300 text-pink-600">ស្រី</th>
                    <th className="p-1.5 border-r border-slate-200">សរុប</th>
                    <th className="p-1.5 border-r border-slate-300 text-pink-600">ស្រី</th>
                    <th className="p-1.5 border-r border-slate-200 bg-cyan-100 font-bold">សរុប</th>
                    <th className="p-1.5 bg-cyan-100 text-pink-700 font-bold">ស្រី</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {rows.map((row) => (
                    <tr
                      key={row.schoolName}
                      className={`hover:bg-blue-50/60 transition ${row.isMainDataset ? 'bg-blue-50/20 font-semibold' : ''}`}
                    >
                      <td className="p-2.5 text-left border-r border-slate-200 font-medium sticky left-0 print:static bg-inherit z-10 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {row.isMainDataset && (
                            <span className={`w-2 h-2 rounded-full ${row.schoolName.includes('មុខឈ្នាង') ? 'bg-amber-500' : 'bg-blue-600'}`} />
                          )}
                          <span className="font-bold text-slate-900">{row.schoolName}</span>
                        </div>
                      </td>

                      {/* 0 */}
                      <td className="p-2 border-r border-slate-200">{row.age0.total}</td>
                      <td className="p-2 border-r border-slate-300 text-pink-600">{row.age0.female}</td>
                      {/* 1 */}
                      <td className="p-2 border-r border-slate-200">{row.age1.total}</td>
                      <td className="p-2 border-r border-slate-300 text-pink-600">{row.age1.female}</td>
                      {/* 2 */}
                      <td className="p-2 border-r border-slate-200">{row.age2.total}</td>
                      <td className="p-2 border-r border-slate-300 text-pink-600">{row.age2.female}</td>
                      {/* 3 */}
                      <td className="p-2 border-r border-slate-200">{row.age3.total}</td>
                      <td className="p-2 border-r border-slate-300 text-pink-600">{row.age3.female}</td>
                      {/* 0-3 Total */}
                      <td className="p-2 border-r border-slate-200 bg-amber-50/60 font-bold text-amber-900">{row.total0to3.total}</td>
                      <td className="p-2 border-r border-slate-300 bg-amber-50/60 font-bold text-pink-700">{row.total0to3.female}</td>

                      {/* 4 */}
                      <td className="p-2 border-r border-slate-200">{row.age4.total}</td>
                      <td className="p-2 border-r border-slate-300 text-pink-600">{row.age4.female}</td>
                      {/* 5 */}
                      <td className="p-2 border-r border-slate-200">{row.age5.total}</td>
                      <td className="p-2 border-r border-slate-300 text-pink-600">{row.age5.female}</td>
                      {/* 6 */}
                      <td className="p-2 border-r border-slate-200">{row.age6.total}</td>
                      <td className="p-2 border-r border-slate-300 text-pink-600">{row.age6.female}</td>
                      {/* 4-6 Total */}
                      <td className="p-2 border-r border-slate-200 bg-emerald-50/60 font-bold text-emerald-900">{row.total4to6.total}</td>
                      <td className="p-2 border-r border-slate-300 bg-emerald-50/60 font-bold text-pink-700">{row.total4to6.female}</td>

                      {/* 7 */}
                      <td className="p-2 border-r border-slate-200">{row.age7.total}</td>
                      <td className="p-2 border-r border-slate-300 text-pink-600">{row.age7.female}</td>
                      {/* 8 */}
                      <td className="p-2 border-r border-slate-200">{row.age8.total}</td>
                      <td className="p-2 border-r border-slate-300 text-pink-600">{row.age8.female}</td>
                      {/* 9 */}
                      <td className="p-2 border-r border-slate-200">{row.age9.total}</td>
                      <td className="p-2 border-r border-slate-300 text-pink-600">{row.age9.female}</td>
                      {/* 10 */}
                      <td className="p-2 border-r border-slate-200">{row.age10.total}</td>
                      <td className="p-2 border-r border-slate-300 text-pink-600">{row.age10.female}</td>
                      {/* 11 */}
                      <td className="p-2 border-r border-slate-200">{row.age11.total}</td>
                      <td className="p-2 border-r border-slate-300 text-pink-600">{row.age11.female}</td>
                      {/* 7-11 Total */}
                      <td className="p-2 border-r border-slate-200 bg-cyan-50/60 font-bold text-cyan-900">{row.total7to11.total}</td>
                      <td className="p-2 bg-cyan-50/60 font-bold text-pink-700">{row.total7to11.female}</td>
                    </tr>
                  ))}

                  {/* Grand Total Row */}
                  <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                    <td className="p-2.5 text-left border-r border-slate-300 sticky left-0 print:static bg-slate-100 z-10">
                      <span className="font-extrabold text-blue-900">{language === 'km' ? 'សរុបរួម' : 'Total'}</span>
                    </td>
                    <td className="p-2 border-r border-slate-200">{grandTotalRow.age0.total}</td>
                    <td className="p-2 border-r border-slate-300 text-pink-700">{grandTotalRow.age0.female}</td>
                    <td className="p-2 border-r border-slate-200">{grandTotalRow.age1.total}</td>
                    <td className="p-2 border-r border-slate-300 text-pink-700">{grandTotalRow.age1.female}</td>
                    <td className="p-2 border-r border-slate-200">{grandTotalRow.age2.total}</td>
                    <td className="p-2 border-r border-slate-300 text-pink-700">{grandTotalRow.age2.female}</td>
                    <td className="p-2 border-r border-slate-200">{grandTotalRow.age3.total}</td>
                    <td className="p-2 border-r border-slate-300 text-pink-700">{grandTotalRow.age3.female}</td>
                    <td className="p-2 border-r border-slate-200 bg-amber-100 text-amber-950">{grandTotalRow.total0to3.total}</td>
                    <td className="p-2 border-r border-slate-300 bg-amber-100 text-pink-700">{grandTotalRow.total0to3.female}</td>

                    <td className="p-2 border-r border-slate-200">{grandTotalRow.age4.total}</td>
                    <td className="p-2 border-r border-slate-300 text-pink-700">{grandTotalRow.age4.female}</td>
                    <td className="p-2 border-r border-slate-200">{grandTotalRow.age5.total}</td>
                    <td className="p-2 border-r border-slate-300 text-pink-700">{grandTotalRow.age5.female}</td>
                    <td className="p-2 border-r border-slate-200">{grandTotalRow.age6.total}</td>
                    <td className="p-2 border-r border-slate-300 text-pink-700">{grandTotalRow.age6.female}</td>
                    <td className="p-2 border-r border-slate-200 bg-emerald-100 text-emerald-950">{grandTotalRow.total4to6.total}</td>
                    <td className="p-2 border-r border-slate-300 bg-emerald-100 text-pink-700">{grandTotalRow.total4to6.female}</td>

                    <td className="p-2 border-r border-slate-200">{grandTotalRow.age7.total}</td>
                    <td className="p-2 border-r border-slate-300 text-pink-700">{grandTotalRow.age7.female}</td>
                    <td className="p-2 border-r border-slate-200">{grandTotalRow.age8.total}</td>
                    <td className="p-2 border-r border-slate-300 text-pink-700">{grandTotalRow.age8.female}</td>
                    <td className="p-2 border-r border-slate-200">{grandTotalRow.age9.total}</td>
                    <td className="p-2 border-r border-slate-300 text-pink-700">{grandTotalRow.age9.female}</td>
                    <td className="p-2 border-r border-slate-200">{grandTotalRow.age10.total}</td>
                    <td className="p-2 border-r border-slate-300 text-pink-700">{grandTotalRow.age10.female}</td>
                    <td className="p-2 border-r border-slate-200">{grandTotalRow.age11.total}</td>
                    <td className="p-2 border-r border-slate-300 text-pink-700">{grandTotalRow.age11.female}</td>
                    <td className="p-2 border-r border-slate-200 bg-cyan-100 text-cyan-950">{grandTotalRow.total7to11.total}</td>
                    <td className="p-2 bg-cyan-100 text-pink-700">{grandTotalRow.total7to11.female}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 3. TABLE 2: 12 YEARS OLD & UP, TOTAL & HOUSEHOLDS */}
        {/* ======================================================== */}
        {(activeTableTab === 'all' || activeTableTab === 'table2') && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden print:overflow-visible print:shadow-none print:rounded-lg print:break-inside-avoid">
            <div className="p-4 print:p-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${modeKind === 'village' ? 'bg-emerald-600' : 'bg-indigo-600'}`} />
                <h3 className="font-bold text-slate-900 text-sm sm:text-base print:text-xs">
                  {language === 'km'
                    ? `តារាងទី២៖ ស្ថិតិអាយុ ១២ ឆ្នាំឡើង, សរុបរួម និងចំនួនគ្រួសារ (${modeSuffix})`
                    : `Table 2: Population 12+ Years, Grand Total & Households (${modeSuffix})`}
                </h3>
              </div>
              <span className="text-xs print:text-[9px] font-semibold px-2.5 py-1 print:px-1.5 print:py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                {language === 'km' ? '១២ ឆ្នាំឡើង និងសរុបរួម' : '12+ Years & Total'}
              </span>
            </div>

            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full text-xs text-center border-collapse print-wide-table">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b border-slate-300 font-bold">
                    <th rowSpan={2} className="p-2.5 text-left border-r border-slate-300 min-w-[140px] sticky left-0 print:static bg-slate-100 z-10">
                      {entityColHeader}
                    </th>
                    <th colSpan={2} className="p-2 border-r border-slate-300 bg-indigo-50 text-indigo-900">១២ឆ្នាំ</th>
                    <th colSpan={2} className="p-2 border-r border-slate-300 bg-indigo-50 text-indigo-900">១៣ឆ្នាំ</th>
                    <th colSpan={2} className="p-2 border-r border-slate-300 bg-indigo-50 text-indigo-900">១៤ឆ្នាំ</th>
                    <th colSpan={2} className="p-2 border-r border-slate-300 bg-indigo-100 font-extrabold text-indigo-950">សរុប (១២-១៤)</th>

                    <th colSpan={2} className="p-2 border-r border-slate-300 bg-purple-50 text-purple-900">១៥ឆ្នាំ</th>
                    <th colSpan={2} className="p-2 border-r border-slate-300 bg-purple-50 text-purple-900">១៦ឆ្នាំ</th>
                    <th colSpan={2} className="p-2 border-r border-slate-300 bg-purple-50 text-purple-900">១៧ឆ្នាំ</th>
                    <th colSpan={2} className="p-2 border-r border-slate-300 bg-purple-100 font-extrabold text-purple-950">សរុប (១៥-១៧)</th>

                    <th colSpan={2} className="p-2 border-r border-slate-300 bg-slate-200/70 text-slate-900">១៨ឆ្នាំ</th>
                    <th colSpan={2} className="p-2 border-r border-slate-300 bg-slate-200/70 text-slate-900">១៩-២៥ឆ្នាំ</th>
                    <th colSpan={2} className="p-2 border-r border-slate-300 bg-slate-200/70 text-slate-900">២៦-៤៥ឆ្នាំ</th>
                    <th colSpan={2} className="p-2 border-r border-slate-300 bg-slate-200/70 text-slate-900">៤៦ឆ្នាំឡើង</th>
                    <th colSpan={2} className="p-2 border-r border-slate-300 bg-slate-300 font-extrabold text-slate-950">សរុប (១៨+)</th>

                    <th colSpan={2} className="p-2 border-r border-slate-300 bg-blue-200 font-black text-blue-950">សរុបរួម</th>
                    <th rowSpan={2} className="p-2 bg-slate-200 font-black text-slate-900 min-w-[90px]">
                      {language === 'km' ? 'ចំនួនគ្រួសារ' : 'Households'}
                    </th>
                  </tr>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-300 text-[11px]">
                    {/* 12-14 */}
                    <th className="p-1.5 border-r border-slate-200">សរុប</th>
                    <th className="p-1.5 border-r border-slate-300 text-pink-600">ស្រី</th>
                    <th className="p-1.5 border-r border-slate-200">សរុប</th>
                    <th className="p-1.5 border-r border-slate-300 text-pink-600">ស្រី</th>
                    <th className="p-1.5 border-r border-slate-200">សរុប</th>
                    <th className="p-1.5 border-r border-slate-300 text-pink-600">ស្រី</th>
                    <th className="p-1.5 border-r border-slate-200 bg-indigo-100 font-bold">សរុប</th>
                    <th className="p-1.5 border-r border-slate-300 bg-indigo-100 text-pink-700 font-bold">ស្រី</th>

                    {/* 15-17 */}
                    <th className="p-1.5 border-r border-slate-200">សរុប</th>
                    <th className="p-1.5 border-r border-slate-300 text-pink-600">ស្រី</th>
                    <th className="p-1.5 border-r border-slate-200">សរុប</th>
                    <th className="p-1.5 border-r border-slate-300 text-pink-600">ស្រី</th>
                    <th className="p-1.5 border-r border-slate-200">សរុប</th>
                    <th className="p-1.5 border-r border-slate-300 text-pink-600">ស្រី</th>
                    <th className="p-1.5 border-r border-slate-200 bg-purple-100 font-bold">សរុប</th>
                    <th className="p-1.5 border-r border-slate-300 bg-purple-100 text-pink-700 font-bold">ស្រី</th>

                    {/* 18+ */}
                    <th className="p-1.5 border-r border-slate-200">សរុប</th>
                    <th className="p-1.5 border-r border-slate-300 text-pink-600">ស្រី</th>
                    <th className="p-1.5 border-r border-slate-200">សរុប</th>
                    <th className="p-1.5 border-r border-slate-300 text-pink-600">ស្រី</th>
                    <th className="p-1.5 border-r border-slate-200">សរុប</th>
                    <th className="p-1.5 border-r border-slate-300 text-pink-600">ស្រី</th>
                    <th className="p-1.5 border-r border-slate-200">សរុប</th>
                    <th className="p-1.5 border-r border-slate-300 text-pink-600">ស្រី</th>
                    <th className="p-1.5 border-r border-slate-200 bg-slate-300 font-bold">សរុប</th>
                    <th className="p-1.5 border-r border-slate-300 bg-slate-300 text-pink-700 font-bold">ស្រី</th>

                    {/* Grand total */}
                    <th className="p-1.5 border-r border-slate-200 bg-blue-200 font-bold text-blue-950">សរុប</th>
                    <th className="p-1.5 border-r border-slate-300 bg-blue-200 text-pink-800 font-bold">ស្រី</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {rows.map((row) => (
                    <tr
                      key={row.schoolName}
                      className={`hover:bg-blue-50/60 transition ${row.isMainDataset ? 'bg-blue-50/20 font-semibold' : ''}`}
                    >
                      <td className="p-2.5 text-left border-r border-slate-200 font-medium sticky left-0 print:static bg-inherit z-10 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {row.isMainDataset && (
                            <span className={`w-2 h-2 rounded-full ${row.schoolName.includes('មុខឈ្នាង') ? 'bg-amber-500' : 'bg-blue-600'}`} />
                          )}
                          <span className="font-bold text-slate-900">{row.schoolName}</span>
                        </div>
                      </td>

                      {/* 12 */}
                      <td className="p-2 border-r border-slate-200">{row.age12.total}</td>
                      <td className="p-2 border-r border-slate-300 text-pink-600">{row.age12.female}</td>
                      {/* 13 */}
                      <td className="p-2 border-r border-slate-200">{row.age13.total}</td>
                      <td className="p-2 border-r border-slate-300 text-pink-600">{row.age13.female}</td>
                      {/* 14 */}
                      <td className="p-2 border-r border-slate-200">{row.age14.total}</td>
                      <td className="p-2 border-r border-slate-300 text-pink-600">{row.age14.female}</td>
                      {/* 12-14 Total */}
                      <td className="p-2 border-r border-slate-200 bg-indigo-50/60 font-bold text-indigo-900">{row.total12to14.total}</td>
                      <td className="p-2 border-r border-slate-300 bg-indigo-50/60 font-bold text-pink-700">{row.total12to14.female}</td>

                      {/* 15 */}
                      <td className="p-2 border-r border-slate-200">{row.age15.total}</td>
                      <td className="p-2 border-r border-slate-300 text-pink-600">{row.age15.female}</td>
                      {/* 16 */}
                      <td className="p-2 border-r border-slate-200">{row.age16.total}</td>
                      <td className="p-2 border-r border-slate-300 text-pink-600">{row.age16.female}</td>
                      {/* 17 */}
                      <td className="p-2 border-r border-slate-200">{row.age17.total}</td>
                      <td className="p-2 border-r border-slate-300 text-pink-600">{row.age17.female}</td>
                      {/* 15-17 Total */}
                      <td className="p-2 border-r border-slate-200 bg-purple-50/60 font-bold text-purple-900">{row.total15to17.total}</td>
                      <td className="p-2 border-r border-slate-300 bg-purple-50/60 font-bold text-pink-700">{row.total15to17.female}</td>

                      {/* 18 */}
                      <td className="p-2 border-r border-slate-200">{row.age18.total}</td>
                      <td className="p-2 border-r border-slate-300 text-pink-600">{row.age18.female}</td>
                      {/* 19-25 */}
                      <td className="p-2 border-r border-slate-200">{row.age19to25.total}</td>
                      <td className="p-2 border-r border-slate-300 text-pink-600">{row.age19to25.female}</td>
                      {/* 26-45 */}
                      <td className="p-2 border-r border-slate-200">{row.age26to45.total}</td>
                      <td className="p-2 border-r border-slate-300 text-pink-600">{row.age26to45.female}</td>
                      {/* 46+ */}
                      <td className="p-2 border-r border-slate-200">{row.age46plus.total}</td>
                      <td className="p-2 border-r border-slate-300 text-pink-600">{row.age46plus.female}</td>
                      {/* 18+ Total */}
                      <td className="p-2 border-r border-slate-200 bg-slate-200/70 font-bold text-slate-900">{row.total18plus.total}</td>
                      <td className="p-2 border-r border-slate-300 bg-slate-200/70 font-bold text-pink-700">{row.total18plus.female}</td>

                      {/* Grand Total */}
                      <td className="p-2 border-r border-slate-200 bg-blue-100 font-extrabold text-blue-950">{row.grandTotal.total}</td>
                      <td className="p-2 border-r border-slate-300 bg-blue-100 font-extrabold text-pink-700">{row.grandTotal.female}</td>

                      {/* Households */}
                      <td className="p-2 font-bold text-slate-800 bg-slate-50">{row.householdCount}</td>
                    </tr>
                  ))}

                  {/* Grand Total Row */}
                  <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                    <td className="p-2.5 text-left border-r border-slate-300 sticky left-0 print:static bg-slate-100 z-10">
                      <span className="font-extrabold text-blue-900">{language === 'km' ? 'សរុបរួម' : 'Total'}</span>
                    </td>
                    <td className="p-2 border-r border-slate-200">{grandTotalRow.age12.total}</td>
                    <td className="p-2 border-r border-slate-300 text-pink-700">{grandTotalRow.age12.female}</td>
                    <td className="p-2 border-r border-slate-200">{grandTotalRow.age13.total}</td>
                    <td className="p-2 border-r border-slate-300 text-pink-700">{grandTotalRow.age13.female}</td>
                    <td className="p-2 border-r border-slate-200">{grandTotalRow.age14.total}</td>
                    <td className="p-2 border-r border-slate-300 text-pink-700">{grandTotalRow.age14.female}</td>
                    <td className="p-2 border-r border-slate-200 bg-indigo-100 text-indigo-950">{grandTotalRow.total12to14.total}</td>
                    <td className="p-2 border-r border-slate-300 bg-indigo-100 text-pink-700">{grandTotalRow.total12to14.female}</td>

                    <td className="p-2 border-r border-slate-200">{grandTotalRow.age15.total}</td>
                    <td className="p-2 border-r border-slate-300 text-pink-700">{grandTotalRow.age15.female}</td>
                    <td className="p-2 border-r border-slate-200">{grandTotalRow.age16.total}</td>
                    <td className="p-2 border-r border-slate-300 text-pink-700">{grandTotalRow.age16.female}</td>
                    <td className="p-2 border-r border-slate-200">{grandTotalRow.age17.total}</td>
                    <td className="p-2 border-r border-slate-300 text-pink-700">{grandTotalRow.age17.female}</td>
                    <td className="p-2 border-r border-slate-200 bg-purple-100 text-purple-950">{grandTotalRow.total15to17.total}</td>
                    <td className="p-2 border-r border-slate-300 bg-purple-100 text-pink-700">{grandTotalRow.total15to17.female}</td>

                    <td className="p-2 border-r border-slate-200">{grandTotalRow.age18.total}</td>
                    <td className="p-2 border-r border-slate-300 text-pink-700">{grandTotalRow.age18.female}</td>
                    <td className="p-2 border-r border-slate-200">{grandTotalRow.age19to25.total}</td>
                    <td className="p-2 border-r border-slate-300 text-pink-700">{grandTotalRow.age19to25.female}</td>
                    <td className="p-2 border-r border-slate-200">{grandTotalRow.age26to45.total}</td>
                    <td className="p-2 border-r border-slate-300 text-pink-700">{grandTotalRow.age26to45.female}</td>
                    <td className="p-2 border-r border-slate-200">{grandTotalRow.age46plus.total}</td>
                    <td className="p-2 border-r border-slate-300 text-pink-700">{grandTotalRow.age46plus.female}</td>
                    <td className="p-2 border-r border-slate-300 bg-slate-300 text-slate-950">{grandTotalRow.total18plus.total}</td>
                    <td className="p-2 border-r border-slate-300 bg-slate-300 text-pink-700">{grandTotalRow.total18plus.female}</td>

                    <td className="p-2 border-r border-slate-200 bg-blue-200 text-blue-950 font-black">{grandTotalRow.grandTotal.total}</td>
                    <td className="p-2 border-r border-slate-300 bg-blue-200 text-pink-800 font-black">{grandTotalRow.grandTotal.female}</td>

                    <td className="p-2 font-black text-slate-900 bg-slate-100">{grandTotalRow.householdCount}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  const reportHeaderTitle =
    reportMode === 'village'
      ? 'របាយការណ៍ស្ថិតិកុមារ និងប្រជាជនតាមភូមិចំណុះ សាលាបឋមសិក្សា រោគ'
      : reportMode === 'school'
      ? 'របាយការណ៍ស្ថិតិកុមារ និងប្រជាជនក្នុងតំបន់សេវា (កម្រងសាលារៀន / ឃុំ)'
      : 'របាយការណ៍ស្ថិតិកុមារ និងប្រជាជន (សាលាសាមី ប.សរោគ និងកម្រងសាលារៀន)';

  const reportHeaderSubtitle =
    reportMode === 'village'
      ? 'ភូមិចំណុះទាំង ២៖ ភូមិរោគ និង ភូមិមុខឈ្នាង • សាលាបឋមសិក្សា រោគ (កូដ 01030401017)'
      : reportMode === 'school'
      ? 'កម្រងសាលារៀន ស្ពានស្រែង (ប.សស្ពានស្រែង, ប.សរោគ, ប.សមុខឈ្នាង, ប.សពង្រកណ្ដោល)'
      : 'ភូមិរោគ និង ភូមិមុខឈ្នាង (សាលាសាមី ប.សរោគ) • កម្រងសាលារៀន ស្ពានស្រែង';

  return (
    <div className="space-y-5 print:space-y-3">
      {/* Official MoEYS Administrative Header */}
      <OfficialReportHeader
        title={reportHeaderTitle}
        subtitle={reportHeaderSubtitle}
        academicYear="ឆ្នាំសិក្សា ២០២៦ - ២០២៧"
      />

      {/* Top Banner Notice */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-xl border border-blue-800/40 relative overflow-hidden no-print">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                <School className="w-3.5 h-3.5 text-emerald-300" />
                <span>{language === 'km' ? 'សាលាបឋមសិក្សារោគ (ប.សរោគ)' : 'Rouk Primary School'}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-200 border border-blue-400/30">
                <MapPin className="w-3.5 h-3.5 text-blue-300" />
                <span>{language === 'km' ? `ភូមិរោគ (${roakCitizens.length.toLocaleString()} នាក់, ${roakVillageRow.householdCount} ខ្នង)` : `Roak (${roakCitizens.length} people)`}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-200 border border-amber-400/30">
                <MapPin className="w-3.5 h-3.5 text-amber-300" />
                <span>{language === 'km' ? `ភូមិមុខឈ្នាង (${mukhChhnangCitizens.length.toLocaleString()} នាក់, ${mukhChhnangVillageRow.householdCount} ខ្នង)` : `Mukh Chhnang (${mukhChhnangCitizens.length} people)`}</span>
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5 pt-1">
              <span>{language === 'km' ? 'ស្ថិតិកុមារ និងប្រជាជនក្នុងតំបន់សេវា (សាលាសាមី & កម្រង)' : 'Demographic Census Catchment Report (Host School & Cluster)'}</span>
            </h2>
            <p className="text-sm text-blue-200/90 max-w-3xl leading-relaxed">
              {language === 'km'
                ? `ទិន្នន័យជំរឿនបច្ចុប្បន្ន គឺចំណុះសាលាបឋមសិក្សារោគ (ប.សរោគ) ដែលមានភូមិចំណុះចំនួន ២ គឺភូមិរោគ (${roakCitizens.length.toLocaleString()} នាក់, ${roakVillageRow.householdCount} ខ្នងផ្ទះ) និងភូមិមុខឈ្នាង (${mukhChhnangCitizens.length.toLocaleString()} នាក់, ${mukhChhnangVillageRow.householdCount} ខ្នងផ្ទះ) សរុប ${citizens.length.toLocaleString()} នាក់ (${grandTotalRow.householdCount} ខ្នងផ្ទះ)។`
                : `Current census data belongs to Rouk Primary School catchment, with 2 feeder villages: Roak (${roakCitizens.length} residents, ${roakVillageRow.householdCount} HH) and Mukh Chhnang (${mukhChhnangCitizens.length} residents, ${mukhChhnangVillageRow.householdCount} HH), totaling ${citizens.length} residents (${grandTotalRow.householdCount} HH).`}
            </p>
            {onNavigateTab && (
              <div className="pt-2">
                <button
                  onClick={() => onNavigateTab('comparison')}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-md transition active:scale-95 cursor-pointer"
                >
                  <TableIcon className="w-4 h-4 text-slate-950" />
                  <span>{language === 'km' ? 'បើកតារាងប្រៀបធៀប និងបញ្ចូលទិន្នន័យកុមារចូលរៀន (៣-៥ ឆ្នាំ)' : 'Open Comparison Table & Data Entry (Age 3-5)'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Official Connected Profile */}
          <div className="flex items-center gap-3 bg-white/15 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/25 shadow-md self-start md:self-auto no-print">
            {user ? (
              <div className="flex items-center gap-3">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-10 h-10 rounded-full border-2 border-emerald-400 shadow-sm object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm border-2 border-emerald-400 shadow-sm">
                    {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-white text-sm leading-tight">
                      {user.displayName || user.email?.split('@')[0] || 'លោក អ៊ុន ប៊ុនទុង'}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Online" />
                  </div>
                  <p className="text-[11px] text-blue-200 font-medium">
                    {user.email || 'អ្នកទទួលបន្ទុកស្ថិតិ'}
                  </p>
                  <p className="text-[10px] text-emerald-300 font-semibold">
                    សាលាបឋមសិក្សា រោគ (កម្រងស្ពានស្រែង)
                  </p>
                </div>
                {onSignOut && (
                  <button
                    onClick={onSignOut}
                    className="p-1.5 ml-1 text-blue-200 hover:text-rose-300 hover:bg-white/10 rounded-lg transition cursor-pointer"
                    title={language === 'km' ? 'ចាកចេញ' : 'Logout'}
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-blue-600 text-white flex items-center justify-center font-bold text-sm border-2 border-amber-300 shadow-sm">
                  <School className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-white text-sm leading-tight">
                      លោក អ៊ុន ប៊ុនទុង
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-400/30 text-amber-200 border border-amber-300/40 font-medium">
                      ស្ថិតិ
                    </span>
                  </div>
                  <p className="text-[11px] text-blue-200 font-medium">
                    អ្នកទទួលបន្ទុកស្ថិតិ • សាលាបឋមសិក្សា រោគ
                  </p>
                  <p className="text-[10px] text-amber-300 font-mono">
                    កូដសាលា: 01030401017
                  </p>
                </div>
                {onSignIn && (
                  <button
                    onClick={onSignIn}
                    className="inline-flex items-center gap-1.5 ml-1 px-3 py-1.5 bg-white text-blue-900 hover:bg-blue-50 font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5 text-blue-600" />
                    <span>{language === 'km' ? 'ចូលគណនី' : 'Login'}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick Highlights Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-white/15">
          {/* Roak */}
          <div className="bg-blue-500/10 backdrop-blur-xs rounded-xl p-3 border border-blue-400/20">
            <div className="flex items-center gap-1.5 text-xs text-blue-200 font-semibold">
              <MapPin className="w-4 h-4 text-blue-300" />
              <span>{language === 'km' ? 'ភូមិរោគ' : 'Roak Village'}</span>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-bold text-white">{roakVillageRow.grandTotal.total}</span>
              <span className="text-xs text-blue-200">
                ({language === 'km' ? 'ស្រី' : 'F'}: {roakVillageRow.grandTotal.female}, {roakVillageRow.householdCount} {language === 'km' ? 'ខ្នង' : 'HH'})
              </span>
            </div>
          </div>

          {/* Mukh Chhnang */}
          <div className="bg-amber-500/10 backdrop-blur-xs rounded-xl p-3 border border-amber-400/20">
            <div className="flex items-center gap-1.5 text-xs text-amber-200 font-semibold">
              <MapPin className="w-4 h-4 text-amber-300" />
              <span>{language === 'km' ? 'ភូមិមុខឈ្នាង' : 'Mukh Chhnang Village'}</span>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-bold text-white">{mukhChhnangVillageRow.grandTotal.total}</span>
              <span className="text-xs text-amber-200">
                ({language === 'km' ? 'ស្រី' : 'F'}: {mukhChhnangVillageRow.grandTotal.female}, {mukhChhnangVillageRow.householdCount} {language === 'km' ? 'ខ្នង' : 'HH'})
              </span>
            </div>
          </div>

          {/* Children 0-6 years */}
          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/10">
            <div className="flex items-center gap-1.5 text-xs text-emerald-200">
              <Baby className="w-4 h-4 text-emerald-300" />
              <span>{language === 'km' ? 'កុមារ ០-៦ ឆ្នាំ (មត្តេយ្យ/តូច)' : 'Age 0-6 (Pre-school)'}</span>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-bold text-white">
                {grandTotalRow.total0to3.total + grandTotalRow.total4to6.total}
              </span>
              <span className="text-xs text-pink-300">
                ({language === 'km' ? 'ស្រី' : 'F'}: {grandTotalRow.total0to3.female + grandTotalRow.total4to6.female})
              </span>
            </div>
          </div>

          {/* Children 7-11 years (Primary) */}
          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/10">
            <div className="flex items-center gap-1.5 text-xs text-cyan-200">
              <GraduationCap className="w-4 h-4 text-cyan-300" />
              <span>{language === 'km' ? 'កុមារ ៧-១១ ឆ្នាំ (បឋម)' : 'Age 7-11 (Primary)'}</span>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-bold text-white">{grandTotalRow.total7to11.total}</span>
              <span className="text-xs text-pink-300">
                ({language === 'km' ? 'ស្រី' : 'F'}: {grandTotalRow.total7to11.female})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mode & Table Control Bar (no-print) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-3 sm:p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 no-print">
        {/* Form / Report Mode Selector */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>{language === 'km' ? 'ទម្រង់របាយការណ៍៖' : 'Form:'}</span>
          </span>

          <button
            type="button"
            onClick={() => setReportMode('village')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              reportMode === 'village'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>{language === 'km' ? 'ទម្រង់សាលាសាមី៖ ប.សរោគ (២ភូមិចំណុះ)' : 'Host School: Rouk (2 Villages)'}</span>
          </button>

          <button
            type="button"
            onClick={() => setReportMode('school')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              reportMode === 'school'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>{language === 'km' ? 'ទម្រង់ឃុំ / កម្រងសាលារៀន (៤សាលា)' : 'Cluster / Commune (4 Schools)'}</span>
          </button>

          <button
            type="button"
            onClick={() => setReportMode('both')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              reportMode === 'both'
                ? 'bg-blue-700 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>{language === 'km' ? 'បង្ហាញទាំង ២ ទម្រង់' : 'Show Both Forms'}</span>
          </button>
        </div>

        {/* Table Layout Switcher & Export / Print */}
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="inline-flex flex-wrap items-center bg-slate-100 p-1 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => setActiveTableTab('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                activeTableTab === 'all' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {language === 'km' ? 'តារាងទី១ & ទី២' : 'Table 1 & 2'}
            </button>
            <button
              type="button"
              onClick={() => setActiveTableTab('master')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                activeTableTab === 'master' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {language === 'km' ? 'តារាងពេញ (០-១៨+)' : 'Master (0-18+)'}
            </button>
            <button
              type="button"
              onClick={() => setActiveTableTab('table1')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                activeTableTab === 'table1' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {language === 'km' ? '០-១១ ឆ្នាំ' : '0-11 Yrs'}
            </button>
            <button
              type="button"
              onClick={() => setActiveTableTab('table2')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                activeTableTab === 'table2' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {language === 'km' ? '១២+ & សរុប' : '12+ & Total'}
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>CSV</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{language === 'km' ? 'បោះពុម្ព' : 'Print'}</span>
          </button>
        </div>
      </div>

      {/* Report Tables by Mode */}
      {(reportMode === 'village' || reportMode === 'both') &&
        renderTablesBlock(
          villageRows,
          'village',
          language === 'km'
            ? 'ទម្រង់សាលាសាមី៖ សាលាបឋមសិក្សា រោគ (២ ភូមិចំណុះ៖ ភូមិរោគ និង ភូមិមុខឈ្នាង)'
            : 'Host School Form: Rouk Primary School (2 Feeder Villages)'
        )}

      {(reportMode === 'school' || reportMode === 'both') &&
        renderTablesBlock(
          schoolClusterRows,
          'school',
          reportMode === 'both'
            ? language === 'km'
              ? 'ទម្រង់ឃុំ / កម្រងសាលារៀន៖ ស្ពានស្រែង (៤ សាលា)'
              : 'Cluster / Commune Form: Spean Sreng Cluster (4 Schools)'
            : undefined
        )}

      {/* MoEYS School Catchment Explanation Note */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 space-y-1.5 no-print">
        <div className="flex items-center gap-1.5 font-bold text-slate-800">
          <Info className="w-4 h-4 text-blue-600" />
          <span>{language === 'km' ? 'សម្គាល់លើទិន្នន័យស្ថិតិសាលារៀន និងភូមិចំណុះ' : 'Educational Catchment Statistics Notes'}</span>
        </div>
        <p className="leading-relaxed">
          {language === 'km'
            ? `• សាលាបឋមសិក្សា រោគ (សាលាសាមី) មានភូមិចំណុះចំនួន ២ គឺ ភូមិរោគ (${roakCitizens.length.toLocaleString()} នាក់, ${roakVillageRow.householdCount} ខ្នង) និង ភូមិមុខឈ្នាង (${mukhChhnangCitizens.length.toLocaleString()} នាក់, ${mukhChhnangVillageRow.householdCount} ខ្នង) សរុប ${citizens.length.toLocaleString()} នាក់ (${grandTotalRow.householdCount} ខ្នង)។ ក្រុមអាយុ ០-៣ ឆ្នាំ (កុមារតូច), ៤-៦ ឆ្នាំ (មត្តេយ្យសិក្សា), ៧-១១ ឆ្នាំ (កម្រិតបឋមសិក្សា ថ្នាក់ទី១-៦), ១២-១៤ ឆ្នាំ (អនុវិទ្យាល័យ) និង ១៥-១៧ ឆ្នាំ (វិទ្យាល័យ)។`
            : `• Host school Rouk Primary serves 2 feeder villages: Roak (${roakCitizens.length} residents, ${roakVillageRow.householdCount} HH) and Mukh Chhnang (${mukhChhnangCitizens.length} residents, ${mukhChhnangVillageRow.householdCount} HH), totaling ${citizens.length} residents (${grandTotalRow.householdCount} HH). Age cohorts match early childhood, pre-school, primary, and secondary education standards.`}
        </p>
      </div>

      {/* Official Signatures Block with Khmer Lunar & Solar dates (Shown on Print & Preview) */}
      <OfficialSignatureSection
        language={language}
        defaultLocation="រោគ"
        reportType="school"
      />
    </div>
  );
};
