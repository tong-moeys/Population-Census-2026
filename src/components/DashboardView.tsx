import React from 'react';
import { 
  Users, 
  Home, 
  UserCheck, 
  Activity, 
  Baby, 
  Briefcase, 
  HeartHandshake, 
  ChevronRight,
  ShieldAlert,
  GraduationCap
} from 'lucide-react';
import { DemographicStats, Language, ViewTab } from '../types/census';
import { translations, translateOccupation, translateRole } from '../utils/translations';

interface DashboardViewProps {
  stats: DemographicStats;
  language: Language;
  onNavigateTab: (tab: ViewTab) => void;
  onFilterByOccupation?: (occupation: string) => void;
  onFilterByGender?: (gender: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  language,
  onNavigateTab,
  onFilterByOccupation,
  onFilterByGender
}) => {
  const t = translations[language];

  const malePercent = stats.totalPopulation > 0 
    ? ((stats.maleCount / stats.totalPopulation) * 100).toFixed(1) 
    : '0';
  const femalePercent = stats.totalPopulation > 0 
    ? ((stats.femaleCount / stats.totalPopulation) * 100).toFixed(1) 
    : '0';

  const femaleToMaleRatio = stats.maleCount > 0 
    ? (stats.femaleCount / stats.maleCount).toFixed(2) 
    : '0';

  return (
    <div className="space-y-6">
      {/* Top Welcome / Census Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 transform skew-x-12 pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-xs mb-3">
            <Activity className="w-3.5 h-3.5" />
            {t.sourceData}
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {language === 'km' ? 'ស្ថិតិជំរឿនប្រជាជន ឆ្នាំ២០២៦' : 'Kingdom of Cambodia - Census 2026'}
          </h2>
          <p className="mt-2 text-blue-100 text-sm sm:text-base leading-relaxed">
            {language === 'km' 
              ? 'ទិន្នន័យប្រជាសាស្ត្រថ្នាក់មូលដ្ឋាន គ្របដណ្តប់ប្រជាពលរដ្ឋសរុប ' + stats.totalPopulation.toLocaleString() + ' នាក់ ក្នុង ' + stats.totalHouseholds + ' គ្រួសារ។' 
              : 'Official local administrative census records covering ' + stats.totalPopulation.toLocaleString() + ' registered residents across ' + stats.totalHouseholds + ' households.'}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigateTab('citizens')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-blue-800 font-semibold text-xs sm:text-sm rounded-xl shadow-xs hover:bg-blue-50 transition active:scale-95"
            >
              <span>{t.citizens}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigateTab('households')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-800/80 hover:bg-blue-800 text-white font-medium text-xs sm:text-sm rounded-xl border border-white/20 transition active:scale-95"
            >
              <span>{t.households}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigateTab('pyramid')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-800/80 hover:bg-blue-800 text-white font-medium text-xs sm:text-sm rounded-xl border border-white/20 transition active:scale-95"
            >
              <span>{t.pyramid}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Population */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {t.totalPopulation}
            </span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {stats.totalPopulation.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500">{t.members}</span>
          </div>
          <div className="mt-3 text-xs text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100">
            <span>{stats.maleCount} {t.males}</span>
            <span>•</span>
            <span>{stats.femaleCount} {t.females}</span>
          </div>
        </div>

        {/* Total Households */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {t.totalHouseholds}
            </span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Home className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {stats.totalHouseholds.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500">{language === 'km' ? 'ខ្នងផ្ទះ' : 'units'}</span>
          </div>
          <div className="mt-3 text-xs text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100">
            <span>{t.avgHouseholdSize}:</span>
            <span className="font-semibold text-slate-700">{stats.averageHouseholdSize} {t.members}</span>
          </div>
        </div>

        {/* Average Age */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {t.avgAge}
            </span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {stats.averageAge}
            </span>
            <span className="text-xs text-slate-500">{t.yearsOld}</span>
          </div>
          <div className="mt-3 text-xs text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100">
            <span>{language === 'km' ? 'ក្មេងបំផុត' : 'Min'}: {stats.minAge}</span>
            <span>•</span>
            <span>{language === 'km' ? 'ចាស់បំផុត' : 'Max'}: {stats.maxAge}</span>
          </div>
        </div>

        {/* Working Age / Dependency */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {t.workingAge}
            </span>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {stats.ageGroups.age25to59.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500">
              ({((stats.ageGroups.age25to59 / stats.totalPopulation) * 100).toFixed(0)}%)
            </span>
          </div>
          <div className="mt-3 text-xs text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100">
            <span>{t.children}: {stats.ageGroups.under15}</span>
            <span>•</span>
            <span>{t.seniors}: {stats.ageGroups.senior60plus}</span>
          </div>
        </div>
      </div>

      {/* Second Row: Gender Split & Age Cohorts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gender Breakdown Card */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-2xs">
          <h3 className="text-base font-bold text-slate-900 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-blue-600" />
              {language === 'km' ? 'ការបែងចែកតាមភេទ' : 'Gender Breakdown'}
            </span>
            <span className="text-xs font-normal text-slate-500">
              {t.genderRatio}: {femaleToMaleRatio}
            </span>
          </h3>

          <div className="mt-5 space-y-4">
            {/* Visual ratio bar */}
            <div className="h-4 w-full rounded-full bg-slate-100 overflow-hidden flex shadow-inner">
              <div 
                style={{ width: `${malePercent}%` }} 
                className="bg-blue-600 transition-all duration-500" 
                title={`${t.males}: ${malePercent}%`}
              />
              <div 
                style={{ width: `${femalePercent}%` }} 
                className="bg-pink-500 transition-all duration-500" 
                title={`${t.females}: ${femalePercent}%`}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div 
                onClick={() => onFilterByGender && onFilterByGender('ប្រុស')}
                className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 hover:border-blue-300 transition cursor-pointer"
              >
                <div className="flex items-center justify-between text-blue-900">
                  <span className="text-xs font-semibold">{t.males}</span>
                  <span className="text-xs font-bold text-blue-700">{malePercent}%</span>
                </div>
                <div className="mt-1 text-2xl font-black text-blue-950">
                  {stats.maleCount.toLocaleString()}
                </div>
                <p className="mt-1 text-xs text-blue-600">
                  {language === 'km' ? 'ចុចដើម្បីមើល' : 'Click to filter'}
                </p>
              </div>

              <div 
                onClick={() => onFilterByGender && onFilterByGender('ស្រី')}
                className="p-3.5 rounded-xl bg-pink-50/60 border border-pink-100 hover:border-pink-300 transition cursor-pointer"
              >
                <div className="flex items-center justify-between text-pink-900">
                  <span className="text-xs font-semibold">{t.females}</span>
                  <span className="text-xs font-bold text-pink-700">{femalePercent}%</span>
                </div>
                <div className="mt-2 text-2xl font-black text-pink-950">
                  {stats.femaleCount.toLocaleString()}
                </div>
                <p className="mt-1 text-xs text-pink-600">
                  {language === 'km' ? 'ចុចដើម្បីមើល' : 'Click to filter'}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-600 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>
                {language === 'km' 
                  ? 'តុល្យភាពយេនឌ័រមានភាពស្មើគ្នាល្អ ដោយប្រុសមាន ' + malePercent + '% និងស្រីមាន ' + femalePercent + '%'
                  : 'Gender balance is well-proportioned with ' + malePercent + '% male and ' + femalePercent + '% female.'}
              </span>
            </div>
          </div>
        </div>

        {/* Age Demographics Breakdown */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-2xs lg:col-span-2">
          <h3 className="text-base font-bold text-slate-900 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Baby className="w-5 h-5 text-indigo-600" />
              {t.ageDistribution}
            </span>
            <button
              onClick={() => onNavigateTab('pyramid')}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
            >
              <span>{t.pyramid}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </h3>

          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Children */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-500 font-medium">{t.children}</span>
              <div className="mt-1 text-xl sm:text-2xl font-black text-slate-900">
                {stats.ageGroups.under15.toLocaleString()}
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-600">
                <span className="w-2 h-2 rounded-full bg-cyan-500" />
                <span>{((stats.ageGroups.under15 / stats.totalPopulation) * 100).toFixed(1)}%</span>
              </div>
            </div>

            {/* Youth */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-500 font-medium">
                {language === 'km' ? 'យុវជន (១៥-២៤)' : 'Youth (15-24)'}
              </span>
              <div className="mt-1 text-xl sm:text-2xl font-black text-slate-900">
                {stats.ageGroups.age15to24.toLocaleString()}
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-600">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span>{((stats.ageGroups.age15to24 / stats.totalPopulation) * 100).toFixed(1)}%</span>
              </div>
            </div>

            {/* Adults */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-500 font-medium">
                {language === 'km' ? 'មនុស្សពេញវ័យ (២៥-៥៩)' : 'Adults (25-59)'}
              </span>
              <div className="mt-1 text-xl sm:text-2xl font-black text-slate-900">
                {stats.ageGroups.age25to59.toLocaleString()}
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-600">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                <span>{((stats.ageGroups.age25to59 / stats.totalPopulation) * 100).toFixed(1)}%</span>
              </div>
            </div>

            {/* Seniors */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-500 font-medium">{t.seniors}</span>
              <div className="mt-1 text-xl sm:text-2xl font-black text-slate-900">
                {stats.ageGroups.senior60plus.toLocaleString()}
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-600">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>{((stats.ageGroups.senior60plus / stats.totalPopulation) * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-indigo-900">
            <div>
              <span className="font-semibold">{language === 'km' ? 'អាយុកណ្ដាល (Median Age)៖ ' : 'Median Age: '}</span>
              <span className="font-bold text-indigo-950">{stats.medianAge} {t.yearsOld}</span>
              <span className="mx-2 text-indigo-300">•</span>
              <span className="font-semibold">{language === 'km' ? 'ទំហំគ្រួសារធំបំផុត៖ ' : 'Largest Household: '}</span>
              <span className="font-bold text-indigo-950">{stats.largestHouseholdSize} {t.members}</span>
            </div>
            <span className="text-indigo-700 bg-white/80 px-2.5 py-1 rounded-md border border-indigo-200">
              {language === 'km' ? 'វ័យក្មេង និងសក្តានុពលខ្ពស់' : 'Young & Dynamic Demographic'}
            </span>
          </div>
        </div>
      </div>

      {/* Third Row: Top Occupations & Household Roles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Occupations */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-emerald-600" />
              {t.occupationDistribution}
            </h3>
            <button
              onClick={() => onNavigateTab('citizens')}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
            >
              {language === 'km' ? 'មើលទាំងអស់' : 'View All'}
            </button>
          </div>

          <div className="space-y-3">
            {stats.topOccupations.slice(0, 7).map((item, idx) => {
              const label = translateOccupation(item.name, language);
              return (
                <div 
                  key={idx}
                  onClick={() => onFilterByOccupation && onFilterByOccupation(item.name)}
                  className="group p-2 rounded-lg hover:bg-slate-50 transition cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-800 group-hover:text-blue-600 transition flex items-center gap-2">
                      <span className="w-5 text-slate-400 font-mono text-[11px]">{idx + 1}.</span>
                      {label}
                    </span>
                    <span className="text-slate-500 font-medium">
                      {item.count.toLocaleString()} {t.members} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 group-hover:bg-emerald-600 transition h-full rounded-full"
                      style={{ width: `${Math.min(100, item.percentage * 2)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Relationship Distribution */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-pink-600" />
              {t.familyDistribution}
            </h3>
            <button
              onClick={() => onNavigateTab('households')}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
            >
              {t.households}
            </button>
          </div>

          <div className="space-y-3">
            {stats.relationshipDistribution.slice(0, 7).map((item, idx) => {
              const label = translateRole(item.name, language);
              return (
                <div key={idx} className="p-2 rounded-lg hover:bg-slate-50 transition">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-800 flex items-center gap-2">
                      <span className="w-5 text-slate-400 font-mono text-[11px]">{idx + 1}.</span>
                      {label}
                    </span>
                    <span className="text-slate-500 font-medium">
                      {item.count.toLocaleString()} {t.members} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-pink-500 transition h-full rounded-full"
                      style={{ width: `${Math.min(100, item.percentage * 2)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
