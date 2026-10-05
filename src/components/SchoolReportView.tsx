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
import { Citizen, Language, SchoolCatchmentReportRow } from '../types/census';
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
}

export const SchoolReportView: React.FC<SchoolReportViewProps> = ({
  citizens,
  language,
  user,
  onSignIn,
  onSignOut
}) => {
  const t = translations[language];
  const [reportMode, setReportMode] = useState<'village' | 'school'>('school');
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

    const uniqueHouseholds = new Set(list.map(c => `${c.village || 'រោគ'}_${c.householdCode || c.householdId}`)).size;

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

  // 1. Data for ភូមិមុខឈ្នាង (Feeder village of ប.សរោគ)
  const mukhChhnangCitizens = useMemo(() => {
    return citizens.filter(c => c.village === 'មុខឈ្នាង');
  }, [citizens]);

  // 2. Data for ភូមិរោគ (Feeder village of ប.សរោគ)
  const roakCitizens = useMemo(() => {
    return citizens.filter(c => c.village === 'រោគ' || c.village !== 'មុខឈ្នាង');
  }, [citizens]);

  // Computed Report Rows for Feeder Villages
  const mukhChhnangVillageRow = useMemo(() => {
    return computeReportRow(mukhChhnangCitizens, language === 'km' ? 'ភូមិមុខឈ្នាង (ចំណុះ ប.សរោគ)' : 'Mukh Chhnang Village (Rouk Feeder)', true);
  }, [mukhChhnangCitizens, language]);

  const roakVillageRow = useMemo(() => {
    return computeReportRow(roakCitizens, language === 'km' ? 'ភូមិរោគ (ចំណុះ ប.សរោគ)' : 'Roak Village (Rouk Feeder)', true);
  }, [roakCitizens, language]);

  // Primary School Rouk (ប.សរោគ): Feeder villages are BOTH ភូមិរោគ and ភូមិមុខឈ្នាង (All current surveyed citizens)
  const roakSchoolRow = useMemo(() => {
    return computeReportRow(
      citizens, 
      language === 'km' ? 'ប.សរោគ' : 'Rouk Primary School (Feeder: Roak & Mukh Chhnang)', 
      true
    );
  }, [citizens, language]);

  // Other Cluster Primary Schools: Feeder villages designated, but census will be entered later once conducted
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

  // Rows to display based on selected mode
  const currentRows: SchoolCatchmentReportRow[] = useMemo(() => {
    if (reportMode === 'village') {
      return [mukhChhnangVillageRow, roakVillageRow];
    } else {
      return [speanSrengSchoolRow, roakSchoolRow, mukhChhnangSchoolRow, pongroKandalSchoolRow];
    }
  }, [reportMode, mukhChhnangVillageRow, roakVillageRow, speanSrengSchoolRow, roakSchoolRow, mukhChhnangSchoolRow, pongroKandalSchoolRow]);

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

    const dataRows = [
      ...currentRows.map(makeRow),
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

  return (
    <div className="space-y-6">
      {/* Official MoEYS Administrative Header */}
      <OfficialReportHeader
        title="របាយការណ៍ស្ថិតិកុមារ និងប្រជាជនក្នុងតំបន់សេវា (តាមភូមិ និងសាលារៀន)"
        subtitle="ភូមិមុខឈ្នាង និង ភូមិរោគ • សាលាបឋមសិក្សា រោគ"
        academicYear="ឆ្នាំសិក្សា ២០២៦ - ២០២៧"
      />

      {/* Top Banner Notice */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-blue-800/40 relative overflow-hidden no-print">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                <School className="w-3.5 h-3.5 text-emerald-300" />
                <span>{language === 'km' ? 'សាលាបឋមសិក្សារោគ (ប.សរោគ)' : 'Rouk Primary School'}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-200 border border-amber-400/30">
                <MapPin className="w-3.5 h-3.5 text-amber-300" />
                <span>{language === 'km' ? `ភូមិមុខឈ្នាង (${mukhChhnangCitizens.length.toLocaleString()} នាក់, ${mukhChhnangVillageRow.householdCount} ខ្នង)` : `Mukh Chhnang (${mukhChhnangCitizens.length} people)`}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-200 border border-blue-400/30">
                <MapPin className="w-3.5 h-3.5 text-blue-300" />
                <span>{language === 'km' ? `ភូមិរោគ (${roakCitizens.length.toLocaleString()} នាក់, ${roakVillageRow.householdCount} ខ្នង)` : `Roak (${roakCitizens.length} people)`}</span>
              </span>
            </div>
            
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5 pt-1">
              <span>{language === 'km' ? 'ស្ថិតិកុមារ និងប្រជាជនក្នុងតំបន់សេវា (តាមភូមិ និងសាលារៀន)' : 'Demographic Census Catchment Report (Villages & Schools)'}</span>
            </h2>
            <p className="text-sm text-blue-200/90 max-w-3xl leading-relaxed">
              {language === 'km' 
                ? `ទិន្នន័យជំរឿនបច្ចុប្បន្ន គឺចំណុះសាលាបឋមសិក្សារោគ (ប.សរោគ) ដែលមានភូមិចំណុះចំនួន២ គឺភូមិមុខឈ្នាង (${mukhChhnangCitizens.length.toLocaleString()} នាក់, ${mukhChhnangVillageRow.householdCount} ខ្នងផ្ទះ) និងភូមិរោគ (${roakCitizens.length.toLocaleString()} នាក់, ${roakVillageRow.householdCount} ខ្នងផ្ទះ) សរុប ${citizens.length.toLocaleString()} នាក់ (${grandTotalRow.householdCount} ខ្នងផ្ទះ)។ ចំណែកសាលា ៣ ទៀត (ប.សស្ពានស្រែង, ប.សមុខឈ្នាង, ប.សពង្រកណ្ដោល) មានភូមិចំណុះរបស់សាលារួចហើយ នឹងត្រូវបញ្ចូលពេលក្រោយធ្វើជំរឿនតាមភូមិចំណុះរួច។`
                : `Current census data belongs to Rouk Primary School catchment, with 2 feeder villages: Mukh Chhnang (${mukhChhnangCitizens.length} residents, ${mukhChhnangVillageRow.householdCount} HH) and Roak (${roakCitizens.length} residents, ${roakVillageRow.householdCount} HH), totaling ${citizens.length} residents (${grandTotalRow.householdCount} HH). Other cluster schools will be populated after their feeder village census is conducted.`}
            </p>
          </div>

          {/* Official Connected Profile (Replaces CSV & Print buttons on the right) */}
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
                    className="p-1.5 ml-1 text-blue-200 hover:text-rose-300 hover:bg-white/10 rounded-lg transition"
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
                    className="inline-flex items-center gap-1.5 ml-1 px-3 py-1.5 bg-white text-blue-900 hover:bg-blue-50 font-bold text-xs rounded-xl shadow-xs transition"
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/15">
          {/* Mukh Chhnang */}
          <div className="bg-amber-500/10 backdrop-blur-xs rounded-xl p-3 border border-amber-400/20">
            <div className="flex items-center gap-1.5 text-xs text-amber-200 font-semibold">
              <MapPin className="w-4 h-4 text-amber-300" />
              <span>{language === 'km' ? 'ភូមិមុខឈ្នាង' : 'Mukh Chhnang Village (Rouk Feeder)'}</span>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-bold text-white">{mukhChhnangVillageRow.grandTotal.total}</span>
              <span className="text-xs text-amber-200">
                ({language === 'km' ? 'ស្រី' : 'F'}: {mukhChhnangVillageRow.grandTotal.female}, {mukhChhnangVillageRow.householdCount} {language === 'km' ? 'ខ្នង' : 'HH'})
              </span>
            </div>
          </div>

          {/* Roak */}
          <div className="bg-blue-500/10 backdrop-blur-xs rounded-xl p-3 border border-blue-400/20">
            <div className="flex items-center gap-1.5 text-xs text-blue-200 font-semibold">
              <MapPin className="w-4 h-4 text-blue-300" />
              <span>{language === 'km' ? 'ភូមិរោគ' : 'Roak Village (Rouk Feeder)'}</span>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-bold text-white">{roakVillageRow.grandTotal.total}</span>
              <span className="text-xs text-blue-200">
                ({language === 'km' ? 'ស្រី' : 'F'}: {roakVillageRow.grandTotal.female}, {roakVillageRow.householdCount} {language === 'km' ? 'ខ្នង' : 'HH'})
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

      {/* ======================================================== */}
      {/* 1. MASTER TABLE VIEW (Continuous official MoEYS Sheet) */}
      {/* ======================================================== */}
      {activeTableTab === 'master' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                {language === 'km' 
                  ? `តារាងស្ថិតិពេញលេញ៖ ស្ថិតិកុមារ និងប្រជាជនក្នុងតំបន់សេវា (${reportMode === 'village' ? 'តាមភូមិ' : 'តាមសាលារៀន'})`
                  : `Full Master Table: Demographic Census by Age Cohort (${reportMode === 'village' ? 'By Village' : 'By School'})`}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                {language === 'km' ? 'គ្រប់កម្រិតអាយុ ០ ដល់ ១៨+ ឆ្នាំ' : 'All Cohorts 0 to 18+ Yrs'}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-center border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-300 font-bold">
                  <th rowSpan={2} className="p-2.5 text-left border-r border-slate-300 min-w-[150px] sticky left-0 bg-slate-100 z-10">
                    {reportMode === 'village' 
                      ? (language === 'km' ? 'ឈ្មោះភូមិ' : 'Village Name')
                      : (language === 'km' ? 'ឈ្មោះសាលា' : 'School Name')}
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
                {currentRows.map((row) => (
                  <tr 
                    key={row.schoolName}
                    className={`hover:bg-blue-50/60 transition ${row.isMainDataset ? 'bg-blue-50/20 font-semibold' : ''}`}
                  >
                    <td className="p-2.5 text-left border-r border-slate-200 font-medium sticky left-0 bg-inherit z-10 whitespace-nowrap">
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
                  <td className="p-2.5 text-left border-r border-slate-300 sticky left-0 bg-slate-100 z-10">
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
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                {language === 'km' 
                  ? `តារាងទី១៖ ស្ថិតិកុមារតាមកម្រិតអាយុ ០ ដល់ ១១ ឆ្នាំ (${reportMode === 'village' ? 'តាមភូមិ' : 'តាមសាលារៀន'})`
                  : `Table 1: Children Population from 0 to 11 Years (${reportMode === 'village' ? 'By Village' : 'By School'})`}
              </h3>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {language === 'km' ? '០ ដល់ ១១ ឆ្នាំ (មត្តេយ្យ & បឋម)' : '0 to 11 Years'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-center border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-300 font-bold">
                  <th rowSpan={2} className="p-2.5 text-left border-r border-slate-300 min-w-[140px] sticky left-0 bg-slate-100 z-10">
                    {reportMode === 'village' 
                      ? (language === 'km' ? 'ឈ្មោះភូមិ' : 'Village Name')
                      : (language === 'km' ? 'ឈ្មោះសាលា' : 'School Name')}
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
                {currentRows.map((row) => (
                  <tr 
                    key={row.schoolName}
                    className={`hover:bg-blue-50/60 transition ${row.isMainDataset ? 'bg-blue-50/20 font-semibold' : ''}`}
                  >
                    <td className="p-2.5 text-left border-r border-slate-200 font-medium sticky left-0 bg-inherit z-10 whitespace-nowrap">
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
                  <td className="p-2.5 text-left border-r border-slate-300 sticky left-0 bg-slate-100 z-10">
                    <span className="font-extrabold text-blue-900">{language === 'km' ? 'សរុប' : 'Total'}</span>
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
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                {language === 'km' 
                  ? `តារាងទី២៖ ស្ថិតិអាយុ ១២ ឆ្នាំឡើង, សរុបរួម និងចំនួនគ្រួសារ (${reportMode === 'village' ? 'តាមភូមិ' : 'តាមសាលារៀន'})`
                  : `Table 2: Population 12+ Years, Grand Total & Households (${reportMode === 'village' ? 'By Village' : 'By School'})`}
              </h3>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              {language === 'km' ? '១២ ឆ្នាំឡើង និងសរុបរួម' : '12+ Years & Total'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-center border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-300 font-bold">
                  <th rowSpan={2} className="p-2.5 text-left border-r border-slate-300 min-w-[140px] sticky left-0 bg-slate-100 z-10">
                    {reportMode === 'village' 
                      ? (language === 'km' ? 'ឈ្មោះភូមិ' : 'Village Name')
                      : (language === 'km' ? 'ឈ្មោះសាលា' : 'School Name')}
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
                {currentRows.map((row) => (
                  <tr 
                    key={row.schoolName}
                    className={`hover:bg-blue-50/60 transition ${row.isMainDataset ? 'bg-blue-50/20 font-semibold' : ''}`}
                  >
                    <td className="p-2.5 text-left border-r border-slate-200 font-medium sticky left-0 bg-inherit z-10 whitespace-nowrap">
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
                  <td className="p-2.5 text-left border-r border-slate-300 sticky left-0 bg-slate-100 z-10">
                    <span className="font-extrabold text-blue-900">{language === 'km' ? 'សរុប' : 'Total'}</span>
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

      {/* Official Signatures Block with Khmer Lunar & Solar dates (Shown on Print & Preview) */}
      <OfficialSignatureSection
        language={language}
        defaultLocation="រោគ"
        reportType="school"
      />

      {/* MoEYS School Catchment Explanation Note */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 space-y-1.5 no-print">
        <div className="flex items-center gap-1.5 font-bold text-slate-800">
          <Info className="w-4 h-4 text-blue-600" />
          <span>{language === 'km' ? 'សម្គាល់លើទិន្នន័យស្ថិតិសាលារៀន និងភូមិ' : 'Educational Catchment Statistics Notes'}</span>
        </div>
        <p className="leading-relaxed">
          {language === 'km'
            ? '• ទិន្នន័យត្រូវបានបែងចែកតាមភូមិផ្លូវការ៖ ភូមិមុខឈ្នាង (row 1-390 ចំនួន ៣៩០ នាក់ សាលាបឋមសិក្សា មុខឈ្នាង) និង ភូមិរោគ (បន្ទាប់ពី row 390 ចំនួន ១,៦៧២ នាក់ សាលាបឋមសិក្សា រោគ)។ ក្រុមអាយុ ០-៣ ឆ្នាំ (កុមារតូច), ៤-៦ ឆ្នាំ (មត្តេយ្យសិក្សា), ៧-១១ ឆ្នាំ (កម្រិតបឋមសិក្សា ថ្នាក់ទី១-៦), ១២-១៤ ឆ្នាំ (អនុវិទ្យាល័យ) និង ១៥-១៧ ឆ្នាំ (វិទ្យាល័យ)។'
            : '• Dataset is categorized by official villages: Mukh Chhnang Village (rows 1-390: 390 residents) and Roak Village (subsequent rows: 1,672 residents). Age cohorts match early childhood, pre-school, primary, and secondary education standards.'}
        </p>
      </div>
    </div>
  );
};
