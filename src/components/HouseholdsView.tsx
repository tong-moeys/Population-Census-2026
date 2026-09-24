import React, { useState, useMemo } from 'react';
import { 
  Home, 
  Users, 
  Search, 
  UserCheck, 
  ChevronDown, 
  ChevronUp, 
  Baby, 
  Briefcase, 
  Building2,
  Filter,
  MapPin
} from 'lucide-react';
import { Household, Language, Citizen } from '../types/census';
import { translations, translateOccupation, translateRole, translateGender } from '../utils/translations';

interface HouseholdsViewProps {
  households: Household[];
  language: Language;
  onSelectCitizen: (citizen: Citizen) => void;
}

export const HouseholdsView: React.FC<HouseholdsViewProps> = ({
  households,
  language,
  onSelectCitizen
}) => {
  const t = translations[language];

  const [searchTerm, setSearchTerm] = useState('');
  const [sizeFilter, setSizeFilter] = useState<'all' | 'small' | 'medium' | 'large'>('all');
  const [villageFilter, setVillageFilter] = useState<'all' | string>('all');
  const [expandedHouseholdKey, setExpandedHouseholdKey] = useState<string | null>(null);

  const filteredHouseholds = useMemo(() => {
    return households.filter(h => {
      const v = h.village?.trim() || 'រោគ';
      // Village filter
      if (villageFilter !== 'all' && v !== villageFilter) {
        return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchesId = String(h.id).includes(query);
        const matchesHead = h.headName.toLowerCase().includes(query);
        const matchesMember = h.members.some(m => m.name.toLowerCase().includes(query));
        const matchesVillage = v.toLowerCase().includes(query);
        if (!matchesId && !matchesHead && !matchesMember && !matchesVillage) {
          return false;
        }
      }

      // Size filter
      if (sizeFilter === 'small' && h.membersCount > 3) return false;
      if (sizeFilter === 'medium' && (h.membersCount < 4 || h.membersCount > 6)) return false;
      if (sizeFilter === 'large' && h.membersCount < 7) return false;

      return true;
    });
  }, [households, searchTerm, sizeFilter, villageFilter]);

  const toggleExpand = (hKey: string) => {
    setExpandedHouseholdKey(prev => (prev === hKey ? null : hKey));
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t.searchHouseholds}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Village Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">
                {t.village}:
              </span>
              <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
                <button
                  onClick={() => setVillageFilter('all')}
                  className={`px-2.5 py-1 rounded-md font-medium transition ${
                    villageFilter === 'all' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t.filterVillage}
                </button>
                <button
                  onClick={() => setVillageFilter('មុខឈ្នាង')}
                  className={`px-2.5 py-1 rounded-md font-medium transition ${
                    villageFilter === 'មុខឈ្នាង' ? 'bg-amber-500 text-white font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {language === 'km' ? 'ភូមិមុខឈ្នាង' : 'Mukh Chhnang'}
                </button>
                <button
                  onClick={() => setVillageFilter('រោគ')}
                  className={`px-2.5 py-1 rounded-md font-medium transition ${
                    villageFilter === 'រោគ' ? 'bg-blue-600 text-white font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {language === 'km' ? 'ភូមិរោគ' : 'Roak Village'}
                </button>
              </div>
            </div>

            {/* Size Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">
                {language === 'km' ? 'ទំហំគ្រួសារ' : 'Size'}:
              </span>
              <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
                <button
                  onClick={() => setSizeFilter('all')}
                  className={`px-2.5 py-1 rounded-md font-medium transition ${
                    sizeFilter === 'all' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t.filterAll}
                </button>
                <button
                  onClick={() => setSizeFilter('small')}
                  className={`px-2.5 py-1 rounded-md font-medium transition ${
                    sizeFilter === 'small' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  1-3 {t.members}
                </button>
                <button
                  onClick={() => setSizeFilter('medium')}
                  className={`px-2.5 py-1 rounded-md font-medium transition ${
                    sizeFilter === 'medium' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  4-6 {t.members}
                </button>
                <button
                  onClick={() => setSizeFilter('large')}
                  className={`px-2.5 py-1 rounded-md font-medium transition ${
                    sizeFilter === 'large' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  7+ {t.members}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>
            {language === 'km' ? 'បង្ហាញគ្រួសារសរុប' : 'Displaying households'}:{' '}
            <strong className="text-slate-900">{filteredHouseholds.length}</strong> / {households.length}
          </span>
          <span>
            {language === 'km' ? 'ចុចលើគ្រួសារនីមួយៗដើម្បីមើលសមាជិកទាំងអស់' : 'Click household card to expand/collapse members'}
          </span>
        </div>
      </div>

      {/* Household Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredHouseholds.map(h => {
          const hKey = `${h.village || 'រោគ'}_${h.id}`;
          const isExpanded = expandedHouseholdKey === hKey;
          const isMukhChhnang = h.village === 'មុខឈ្នាង';
          return (
            <div 
              key={hKey}
              className={`bg-white rounded-xl border transition-all duration-200 overflow-hidden ${
                isExpanded 
                  ? 'border-blue-500 shadow-md ring-2 ring-blue-500/10' 
                  : 'border-slate-200 shadow-2xs hover:shadow-sm hover:border-slate-300'
              }`}
            >
              {/* Header */}
              <div 
                onClick={() => toggleExpand(hKey)}
                className="p-5 cursor-pointer bg-gradient-to-b from-slate-50/50 to-white"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                      isMukhChhnang ? 'bg-amber-100 text-amber-900' : 'bg-blue-100 text-blue-800'
                    }`}>
                      #{h.id}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-500 flex items-center gap-2">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5" />
                          {language === 'km' ? 'ខ្នងផ្ទះលេខ ' : 'Household #'}{h.id}
                        </span>
                        <span>•</span>
                        {isMukhChhnang ? (
                          <span className="inline-flex items-center gap-1 text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 text-[11px] font-bold">
                            <MapPin className="w-3 h-3 text-amber-600" />
                            <span>ភូមិមុខឈ្នាង</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 text-[11px] font-bold">
                            <MapPin className="w-3 h-3 text-blue-600" />
                            <span>{language === 'km' ? `ភូមិ ${h.village || 'រោគ'}` : `Village ${h.village || 'រោគ'}`}</span>
                          </span>
                        )}
                      </div>
                      <h4 className="text-base font-bold text-slate-900 mt-0.5">
                        {h.headName}
                      </h4>
                    </div>
                  </div>

                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                    {h.membersCount} {t.members}
                  </span>
                </div>

                {/* Sub metrics badges */}
                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px] pt-3 border-t border-slate-100">
                  <div className="p-1.5 rounded-lg bg-blue-50/60 text-blue-900">
                    <span className="text-slate-500 block text-[10px]">{t.males}</span>
                    <span className="font-bold">{h.malesCount}</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-pink-50/60 text-pink-900">
                    <span className="text-slate-500 block text-[10px]">{t.females}</span>
                    <span className="font-bold">{h.femalesCount}</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-indigo-50/60 text-indigo-900">
                    <span className="text-slate-500 block text-[10px]">{t.children}</span>
                    <span className="font-bold">{h.childrenCount}</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-blue-600 font-semibold pt-2">
                  <span>{isExpanded ? (language === 'km' ? 'បង្រួម' : 'Collapse') : (language === 'km' ? 'មើលសមាជិកគ្រួសារ' : 'View Members')}</span>
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>

              {/* Members Expanded Accordion */}
              {isExpanded && (
                <div className="p-4 bg-slate-50/80 border-t border-slate-200 space-y-2">
                  <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    {t.familyTree} ({h.members.length})
                  </h5>

                  <div className="space-y-2">
                    {h.members.map((m, idx) => (
                      <div 
                        key={m.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCitizen(m);
                        }}
                        className="p-2.5 rounded-lg bg-white border border-slate-200 hover:border-blue-400 hover:shadow-xs transition cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{m.name}</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                              m.gender === 'ប្រុស' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                            }`}>
                              {translateGender(m.gender, language)}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                            <span className="font-medium text-slate-700">{translateRole(m.relationship, language)}</span>
                            <span>•</span>
                            <span>{m.age} {t.yearsOld}</span>
                            <span>•</span>
                            <span>{translateOccupation(m.occupation, language)}</span>
                          </div>
                        </div>

                        <span className="text-[11px] text-blue-600 hover:underline font-semibold">
                          {t.details}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
