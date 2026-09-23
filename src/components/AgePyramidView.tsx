import React, { useState } from 'react';
import { 
  TrendingUp, 
  Users, 
  Info, 
  HelpCircle,
  BarChart,
  ShieldCheck,
  Award
} from 'lucide-react';
import { DemographicStats, Language } from '../types/census';
import { translations } from '../utils/translations';

interface AgePyramidViewProps {
  stats: DemographicStats;
  language: Language;
}

export const AgePyramidView: React.FC<AgePyramidViewProps> = ({
  stats,
  language
}) => {
  const t = translations[language];
  const [hoveredCohort, setHoveredCohort] = useState<string | null>(null);

  // Maximum value for scale
  const maxCohortValue = Math.max(
    ...stats.agePyramid.map(p => Math.max(p.male, p.female)),
    1
  );

  // Dependency Ratio calculations
  // Under 15
  const youth = stats.ageGroups.under15;
  // 65+
  const seniors65 = stats.agePyramid
    .filter(p => ['65-69', '70-74', '75-79', '80+'].includes(p.bracket))
    .reduce((acc, p) => acc + p.male + p.female, 0);
  // Working age 15-64
  const workingAge = stats.totalPopulation - youth - seniors65;

  const youthDependencyRatio = workingAge > 0 
    ? ((youth / workingAge) * 100).toFixed(1) 
    : '0';
  const oldAgeDependencyRatio = workingAge > 0 
    ? ((seniors65 / workingAge) * 100).toFixed(1) 
    : '0';
  const totalDependencyRatio = workingAge > 0 
    ? (((youth + seniors65) / workingAge) * 100).toFixed(1) 
    : '0';

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              {t.pyramid} (Age-Sex Population Pyramid)
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {language === 'km' 
                ? 'បង្ហាញការបែងចែកចំនួនប្រជាជនតាមកម្រិតអាយុ និងភេទ ៥ឆ្នាំម្ដង សម្រាប់ឆ្នាំ២០២៦' 
                : 'Cohort distribution by 5-year age groups across male and female populations for 2026'}
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-blue-600 inline-block shadow-xs" />
              <span className="text-slate-700">{t.males} ({stats.maleCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-pink-500 inline-block shadow-xs" />
              <span className="text-slate-700">{t.females} ({stats.femaleCount})</span>
            </div>
          </div>
        </div>

        {/* Pyramid Graphic */}
        <div className="mt-6 max-w-3xl mx-auto space-y-1.5">
          {/* Header row */}
          <div className="grid grid-cols-11 text-[11px] font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100 text-center">
            <span className="col-span-5 text-right pr-4 text-blue-700">{t.males}</span>
            <span className="col-span-1 text-slate-600">{t.age}</span>
            <span className="col-span-5 text-left pl-4 text-pink-700">{t.females}</span>
          </div>

          {stats.agePyramid.map((cohort) => {
            const maleWidth = (cohort.male / maxCohortValue) * 100;
            const femaleWidth = (cohort.female / maxCohortValue) * 100;
            const isHovered = hoveredCohort === cohort.bracket;

            return (
              <div
                key={cohort.bracket}
                onMouseEnter={() => setHoveredCohort(cohort.bracket)}
                onMouseLeave={() => setHoveredCohort(null)}
                className={`grid grid-cols-11 items-center py-1 rounded transition-colors ${
                  isHovered ? 'bg-slate-100/80' : 'hover:bg-slate-50'
                }`}
              >
                {/* Male Bar (aligned right) */}
                <div className="col-span-5 flex items-center justify-end gap-2 pr-4">
                  <span className="text-[11px] font-mono font-medium text-slate-600">
                    {cohort.male}
                  </span>
                  <div className="w-48 bg-slate-100 h-5 rounded-l-md overflow-hidden flex justify-end">
                    <div
                      style={{ width: `${maleWidth}%` }}
                      className="bg-blue-600 h-full transition-all duration-300 rounded-l-xs"
                      title={`${cohort.bracket} Males: ${cohort.male}`}
                    />
                  </div>
                </div>

                {/* Cohort Age Label (center) */}
                <div className="col-span-1 text-center font-bold font-mono text-xs text-slate-800 bg-slate-100/60 py-1 rounded">
                  {cohort.bracket}
                </div>

                {/* Female Bar (aligned left) */}
                <div className="col-span-5 flex items-center justify-start gap-2 pl-4">
                  <div className="w-48 bg-slate-100 h-5 rounded-r-md overflow-hidden flex justify-start">
                    <div
                      style={{ width: `${femaleWidth}%` }}
                      className="bg-pink-500 h-full transition-all duration-300 rounded-r-xs"
                      title={`${cohort.bracket} Females: ${cohort.female}`}
                    />
                  </div>
                  <span className="text-[11px] font-mono font-medium text-slate-600">
                    {cohort.female}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Demographic Indicators & Dependency Ratio Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Dependency Ratio */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {language === 'km' ? 'អត្រាបន្ទុកសរុប' : 'Total Dependency Ratio'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <BarChart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{totalDependencyRatio}%</span>
          </div>
          <p className="mt-2 text-xs text-slate-500 leading-relaxed">
            {language === 'km'
              ? 'ចំនួនអ្នកក្នុងបន្ទុក (កុមារ + មនុស្សចាស់) ធៀបនឹងមនុស្សក្នុងវ័យធ្វើការ ១០០ នាក់។'
              : 'Dependents (children + seniors) per 100 working-age citizens.'}
          </p>
        </div>

        {/* Youth Dependency Ratio */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {language === 'km' ? 'អត្រាអ្នកបន្ទុកកុមារ' : 'Youth Dependency Ratio'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{youthDependencyRatio}%</span>
          </div>
          <p className="mt-2 text-xs text-slate-500 leading-relaxed">
            {language === 'km'
              ? 'កុមារក្រោម ១៥ ឆ្នាំ ចំនួន ' + youth + ' នាក់ ធៀបនឹងវ័យធ្វើការ។'
              : 'Youth under 15 years (' + youth + ' persons) per 100 working-age population.'}
          </p>
        </div>

        {/* Old-Age Dependency Ratio */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {language === 'km' ? 'អត្រាអ្នកបន្ទុកមនុស្សចាស់' : 'Old-Age Dependency Ratio'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{oldAgeDependencyRatio}%</span>
          </div>
          <p className="mt-2 text-xs text-slate-500 leading-relaxed">
            {language === 'km'
              ? 'មនុស្សវ័យចំណាស់ ៦៥ ឆ្នាំឡើង ចំនួន ' + seniors65 + ' នាក់ ធៀបនឹងវ័យធ្វើការ។'
              : 'Elderly 65+ years (' + seniors65 + ' persons) per 100 working-age population.'}
          </p>
        </div>
      </div>
    </div>
  );
};
