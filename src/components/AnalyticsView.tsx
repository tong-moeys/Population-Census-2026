import React from 'react';
import { 
  BarChart3, 
  Briefcase, 
  Users, 
  GraduationCap, 
  Heart, 
  Building, 
  Layers,
  PieChart
} from 'lucide-react';
import { DemographicStats, Household, Language, Citizen } from '../types/census';
import { translations, translateOccupation, translateRole } from '../utils/translations';

interface AnalyticsViewProps {
  stats: DemographicStats;
  households: Household[];
  citizens: Citizen[];
  language: Language;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  stats,
  households,
  citizens,
  language
}) => {
  const t = translations[language];

  // Generational breakdown
  // Gen Alpha: born ~2013-2026 (age 0-13 in 2026)
  // Gen Z: born ~1997-2012 (age 14-29 in 2026)
  // Millennials (Gen Y): born ~1981-1996 (age 30-45 in 2026)
  // Gen X: born ~1965-1980 (age 46-61 in 2026)
  // Boomers & Elders: born <= 1964 (age 62+ in 2026)
  const genAlpha = citizens.filter(c => c.age <= 13).length;
  const genZ = citizens.filter(c => c.age >= 14 && c.age <= 29).length;
  const millennials = citizens.filter(c => c.age >= 30 && c.age <= 45).length;
  const genX = citizens.filter(c => c.age >= 46 && c.age <= 61).length;
  const boomerElders = citizens.filter(c => c.age >= 62).length;

  const generations = [
    { 
      name: language === 'km' ? 'ជំនាន់ Alpha (អាយុ ០-១៣)' : 'Gen Alpha (0-13)', 
      count: genAlpha, 
      color: 'bg-emerald-500', 
      textColor: 'text-emerald-700' 
    },
    { 
      name: language === 'km' ? 'ជំនាន់ Z (អាយុ ១៤-២៩)' : 'Gen Z (14-29)', 
      count: genZ, 
      color: 'bg-blue-500', 
      textColor: 'text-blue-700' 
    },
    { 
      name: language === 'km' ? 'ជំនាន់ Y / Millennials (អាយុ ៣០-៤៥)' : 'Millennials (30-45)', 
      count: millennials, 
      color: 'bg-indigo-500', 
      textColor: 'text-indigo-700' 
    },
    { 
      name: language === 'km' ? 'ជំនាន់ X (អាយុ ៤៦-៦១)' : 'Gen X (46-61)', 
      count: genX, 
      color: 'bg-purple-500', 
      textColor: 'text-purple-700' 
    },
    { 
      name: language === 'km' ? 'ជំនាន់ Baby Boomers / ជរា (៦២+)' : 'Boomers & Elders (62+)', 
      count: boomerElders, 
      color: 'bg-amber-500', 
      textColor: 'text-amber-700' 
    }
  ];

  // Household Family Structure Classification
  // Multi-generational: has grandparents + parents + children/grandchildren
  let multiGenerationalCount = 0;
  let nuclearCount = 0;
  let coupleOrSingleCount = 0;

  households.forEach(h => {
    const hasGrandchild = h.members.some(m => m.relationship === 'ចៅ');
    const hasGrandparent = h.members.some(m => m.relationship === 'ម្តាយ' || m.relationship === 'ឪពុក' || m.relationship === 'ម្ដាយក្មេក' || m.age >= 65);
    const hasChildren = h.members.some(m => m.relationship === 'កូន');

    if ((hasGrandchild && hasGrandparent) || (hasGrandchild && hasChildren)) {
      multiGenerationalCount++;
    } else if (hasChildren && (h.members.some(m => m.relationship === 'ប្តី') || h.members.some(m => m.relationship === 'ប្រពន្ធ'))) {
      nuclearCount++;
    } else {
      coupleOrSingleCount++;
    }
  });

  return (
    <div className="space-y-6">
      {/* Overview */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-2xs">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-600" />
          {t.analytics}
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          {language === 'km' 
            ? 'ការវិភាគរចនាសម្ព័ន្ធជំនាន់ និងប្រភេទគ្រួសារ ផ្អែកលើទិន្នន័យជំរឿនឆ្នាំ២០២៦' 
            : 'Generational cohorts and household structural typology based on 2026 census data'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Generational Cohorts */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-2xs">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
            <Layers className="w-5 h-5 text-blue-600" />
            {language === 'km' ? 'ការបែងចែកតាមជំនាន់ (Generations)' : 'Generational Cohort Distribution'}
          </h3>

          <div className="space-y-4">
            {generations.map((gen, idx) => {
              const percent = ((gen.count / stats.totalPopulation) * 100).toFixed(1);
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{gen.name}</span>
                    <span className="text-slate-500 font-medium">
                      {gen.count.toLocaleString()} {t.members} ({percent}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div 
                      className={`${gen.color} h-full rounded-full transition-all duration-500`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 p-3.5 rounded-lg bg-blue-50/60 border border-blue-100 text-xs text-blue-900 leading-relaxed">
            <strong>{language === 'km' ? 'សេចក្តីសង្ខេប៖ ' : 'Summary: '}</strong>
            {language === 'km'
              ? 'ជំនាន់ Z និង Alpha បូកបញ្ចូលគ្នាមានចំណែកជាង ៥០% នៃប្រជាជនសរុប ដែលបង្ហាញពីមូលដ្ឋានប្រជាសាស្ត្រវ័យក្មេងខ្លាំង និងសក្ដានុពលអភិវឌ្ឍន៍រយៈពេលវែង។'
              : 'Gen Z and Gen Alpha combined constitute over 50% of the population, highlighting a very youthful demographic foundation for sustainable community development.'}
          </div>
        </div>

        {/* Household Structure Typology */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-2xs">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
            <Building className="w-5 h-5 text-purple-600" />
            {language === 'km' ? 'រចនាសម្ព័ន្ធ និងប្រភេទគ្រួសារ' : 'Household Structural Typology'}
          </h3>

          <div className="grid grid-cols-1 gap-4">
            {/* Extended / Multi-generational */}
            <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-900 uppercase tracking-wide">
                  {language === 'km' ? 'គ្រួសារពហុជំនាន់ (ជីដូនជីតា+ឪពុកម្តាយ+កូន/ចៅ)' : 'Multi-generational Family'}
                </span>
                <span className="text-xs font-bold text-purple-700">
                  {((multiGenerationalCount / stats.totalHouseholds) * 100).toFixed(0)}%
                </span>
              </div>
              <div className="mt-2 text-2xl font-black text-purple-950">
                {multiGenerationalCount} <span className="text-xs font-normal text-purple-700">{language === 'km' ? 'គ្រួសារ' : 'households'}</span>
              </div>
              <p className="mt-1 text-xs text-purple-800">
                {language === 'km'
                  ? 'រស់នៅជុំគ្នាពី ៣ ទៅ ៤ ជំនាន់ (មានចៅ និងជីដូនជីតា)'
                  : 'Extended households spanning 3 to 4 generations living together'}
              </p>
            </div>

            {/* Nuclear Family */}
            <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-900 uppercase tracking-wide">
                  {language === 'km' ? 'គ្រួសារស្នូល (ឪពុកម្តាយ + កូន)' : 'Nuclear Family'}
                </span>
                <span className="text-xs font-bold text-blue-700">
                  {((nuclearCount / stats.totalHouseholds) * 100).toFixed(0)}%
                </span>
              </div>
              <div className="mt-2 text-2xl font-black text-blue-950">
                {nuclearCount} <span className="text-xs font-normal text-blue-700">{language === 'km' ? 'គ្រួសារ' : 'households'}</span>
              </div>
              <p className="mt-1 text-xs text-blue-800">
                {language === 'km'
                  ? 'ឪពុកម្តាយរស់នៅជាមួយកូនក្នុងបន្ទុក'
                  : 'Traditional nuclear family units with parents and children'}
              </p>
            </div>

            {/* Couples / Other */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  {language === 'km' ? 'គ្រួសារទោល ឬប្តីប្រពន្ធគ្មានកូន' : 'Couples / Single / Other'}
                </span>
                <span className="text-xs font-bold text-slate-600">
                  {((coupleOrSingleCount / stats.totalHouseholds) * 100).toFixed(0)}%
                </span>
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900">
                {coupleOrSingleCount} <span className="text-xs font-normal text-slate-500">{language === 'km' ? 'គ្រួសារ' : 'households'}</span>
              </div>
              <p className="mt-1 text-xs text-slate-600">
                {language === 'km'
                  ? 'ប្តីប្រពន្ធវ័យចំណាស់ ឬបុគ្គលរស់នៅម្នាក់ឯង'
                  : 'Empty nesters, couples without co-resident children, or singles'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
