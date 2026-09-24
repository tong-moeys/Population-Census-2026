import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  Eye, 
  Edit3, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Download,
  Users,
  Building2,
  Calendar,
  X,
  MapPin
} from 'lucide-react';
import { Citizen, Language } from '../types/census';
import { translations, translateOccupation, translateRole, translateGender } from '../utils/translations';

interface CitizensTableProps {
  citizens: Citizen[];
  language: Language;
  onSelectCitizen: (citizen: Citizen) => void;
  onEditCitizen: (citizen: Citizen) => void;
  onDeleteCitizen: (id: number) => void;
  onAddNewCitizen: () => void;
  initialOccupationFilter?: string;
  initialGenderFilter?: string;
  onClearInitialFilters?: () => void;
}

type SortField = 'id' | 'name' | 'age' | 'householdId' | 'dob' | 'village';
type SortOrder = 'asc' | 'desc';

export const CitizensTable: React.FC<CitizensTableProps> = ({
  citizens,
  language,
  onSelectCitizen,
  onEditCitizen,
  onDeleteCitizen,
  onAddNewCitizen,
  initialOccupationFilter,
  initialGenderFilter,
  onClearInitialFilters
}) => {
  const t = translations[language];

  // Search and Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState(initialGenderFilter || 'all');
  const [occupationFilter, setOccupationFilter] = useState(initialOccupationFilter || 'all');
  const [villageFilter, setVillageFilter] = useState('all');
  const [ageRangeFilter, setAgeRangeFilter] = useState('all');
  const [householdFilter, setHouseholdFilter] = useState('');

  // Sorting
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Distinct occupations for filter dropdown
  const distinctOccupations = useMemo(() => {
    const set = new Set<string>();
    citizens.forEach(c => {
      if (c.occupation) set.add(c.occupation);
    });
    return Array.from(set).sort();
  }, [citizens]);

  // Distinct villages for filter dropdown
  const distinctVillages = useMemo(() => {
    const set = new Set<string>();
    citizens.forEach(c => {
      const v = c.village?.trim() || 'រោគ';
      if (v) set.add(v);
    });
    if (!set.has('រោគ')) set.add('រោគ');
    return Array.from(set).sort();
  }, [citizens]);

  // Handle Sort Toggle
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  // Filtered and Sorted Citizens
  const filteredCitizens = useMemo(() => {
    return citizens.filter(c => {
      const citizenVillage = c.village?.trim() || 'រោគ';

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchesName = c.name.toLowerCase().includes(query);
        const matchesId = String(c.originalId || c.id).includes(query);
        const matchesOcc = c.occupation.toLowerCase().includes(query);
        const matchesRel = c.relationship.toLowerCase().includes(query);
        const matchesDob = c.dob.toLowerCase().includes(query);
        const matchesHId = String(c.householdId).includes(query);
        const matchesVillage = citizenVillage.toLowerCase().includes(query);
        if (!matchesName && !matchesId && !matchesOcc && !matchesRel && !matchesDob && !matchesHId && !matchesVillage) {
          return false;
        }
      }

      // Gender filter
      if (genderFilter !== 'all' && c.gender !== genderFilter) {
        return false;
      }

      // Occupation filter
      if (occupationFilter !== 'all' && c.occupation !== occupationFilter) {
        return false;
      }

      // Village filter
      if (villageFilter !== 'all' && citizenVillage !== villageFilter) {
        return false;
      }

      // Household filter
      if (householdFilter.trim()) {
        if (String(c.householdId) !== householdFilter.trim()) {
          return false;
        }
      }

      // Age range filter
      if (ageRangeFilter !== 'all') {
        if (ageRangeFilter === 'child' && c.age >= 18) return false;
        if (ageRangeFilter === 'youth' && (c.age < 18 || c.age > 35)) return false;
        if (ageRangeFilter === 'adult' && (c.age < 36 || c.age > 59)) return false;
        if (ageRangeFilter === 'senior' && c.age < 60) return false;
      }

      return true;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortField === 'id') {
        comparison = a.id - b.id;
      } else if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name, 'km');
      } else if (sortField === 'age') {
        comparison = a.age - b.age;
      } else if (sortField === 'village') {
        const vA = a.village?.trim() || 'រោគ';
        const vB = b.village?.trim() || 'រោគ';
        comparison = vA.localeCompare(vB, 'km');
      } else if (sortField === 'householdId') {
        comparison = Number(a.householdId) - Number(b.householdId);
      } else if (sortField === 'dob') {
        comparison = a.dob.localeCompare(b.dob);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [citizens, searchTerm, genderFilter, occupationFilter, villageFilter, ageRangeFilter, householdFilter, sortField, sortOrder]);

  // Paginated records
  const totalPages = Math.ceil(filteredCitizens.length / pageSize) || 1;
  const paginatedCitizens = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCitizens.slice(start, start + pageSize);
  }, [filteredCitizens, currentPage, pageSize]);

  // Reset filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setGenderFilter('all');
    setOccupationFilter('all');
    setVillageFilter('all');
    setAgeRangeFilter('all');
    setHouseholdFilter('');
    setCurrentPage(1);
    if (onClearInitialFilters) onClearInitialFilters();
  };

  const hasActiveFilters = searchTerm || genderFilter !== 'all' || occupationFilter !== 'all' || villageFilter !== 'all' || ageRangeFilter !== 'all' || householdFilter;

  // Export filtered to CSV
  const handleExportFilteredCSV = () => {
    const headers = ['ID', 'OriginalID', 'Name', 'Gender', 'DOB', 'Age', 'Village', 'Relationship', 'Occupation', 'HouseholdID'];
    const rows = filteredCitizens.map(c => [
      c.id,
      `"${c.originalId}"`,
      `"${c.name}"`,
      `"${c.gender}"`,
      `"${c.dob}"`,
      c.age,
      `"${c.village?.trim() || 'រោគ'}"`,
      `"${c.relationship}"`,
      `"${c.occupation}"`,
      c.householdId
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `census-2026-filtered-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter Panel */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              placeholder={t.searchPlaceholder}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportFilteredCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition"
              title={t.exportCSV}
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t.exportCSV}</span>
            </button>
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                {language === 'km' ? 'កំណត់ឡើងវិញ' : 'Reset Filters'}
              </button>
            )}
          </div>
        </div>

        {/* Filter dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2 border-t border-slate-100">
          {/* Gender */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              {t.gender}
            </label>
            <select
              value={genderFilter}
              onChange={(e) => { setGenderFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
            >
              <option value="all">{t.filterGender}</option>
              <option value="ប្រុស">{translateGender('ប្រុស', language)}</option>
              <option value="ស្រី">{translateGender('ស្រី', language)}</option>
            </select>
          </div>

          {/* Occupation */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              {t.occupation}
            </label>
            <select
              value={occupationFilter}
              onChange={(e) => { setOccupationFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
            >
              <option value="all">{t.filterOccupation}</option>
              {distinctOccupations.map(occ => (
                <option key={occ} value={occ}>
                  {translateOccupation(occ, language)}
                </option>
              ))}
            </select>
          </div>

          {/* Village (ភូមិ) */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              {t.village}
            </label>
            <select
              value={villageFilter}
              onChange={(e) => { setVillageFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none font-medium"
            >
              <option value="all">{t.filterVillage}</option>
              {distinctVillages.map(v => (
                <option key={v} value={v}>
                  {language === 'km' ? `ភូមិ ${v}` : `Village ${v}`}
                </option>
              ))}
            </select>
          </div>

          {/* Age Group */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              {t.age}
            </label>
            <select
              value={ageRangeFilter}
              onChange={(e) => { setAgeRangeFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
            >
              <option value="all">{t.filterAgeGroup}</option>
              <option value="child">{language === 'km' ? 'កុមារ (< ១៨)' : 'Children (< 18)'}</option>
              <option value="youth">{language === 'km' ? 'យុវជន (១៨-៣៥)' : 'Youth (18-35)'}</option>
              <option value="adult">{language === 'km' ? 'មនុស្សពេញវ័យ (៣៦-៥៩)' : 'Adults (36-59)'}</option>
              <option value="senior">{language === 'km' ? 'មនុស្សចាស់ (៦០+)' : 'Seniors (60+)'}</option>
            </select>
          </div>

          {/* Household Number */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              {t.householdId}
            </label>
            <input
              type="text"
              value={householdFilter}
              onChange={(e) => { setHouseholdFilter(e.target.value); setCurrentPage(1); }}
              placeholder={language === 'km' ? 'លេខផ្ទះ...' : 'HH #...'}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Table Results Bar */}
      <div className="flex items-center justify-between px-1 text-xs text-slate-500">
        <div>
          <span>{t.recordsFound}: </span>
          <span className="font-bold text-slate-900">{filteredCitizens.length.toLocaleString()}</span>
          {hasActiveFilters && (
            <span className="ml-1 text-slate-400">({language === 'km' ? 'ពីសរុប ' : 'of total '} {citizens.length.toLocaleString()})</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span>{language === 'km' ? 'ចំនួនក្នុងមួយទំព័រ' : 'Rows per page'}:</span>
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
            className="px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-700 outline-none"
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px] tracking-wider select-none">
              <tr>
                <th 
                  onClick={() => handleSort('id')} 
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition"
                >
                  <div className="flex items-center gap-1">
                    <span>{t.id}</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('name')} 
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition"
                >
                  <div className="flex items-center gap-1">
                    <span>{t.fullName}</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4">
                  <span>{t.gender}</span>
                </th>
                <th 
                  onClick={() => handleSort('dob')} 
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition hidden md:table-cell"
                >
                  <div className="flex items-center gap-1">
                    <span>{t.dob}</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('age')} 
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition"
                >
                  <div className="flex items-center gap-1">
                    <span>{t.age}</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('village')} 
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition"
                >
                  <div className="flex items-center gap-1 text-emerald-700">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{t.village}</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4 hidden sm:table-cell">
                  <span>{t.relationship}</span>
                </th>
                <th className="py-3 px-4">
                  <span>{t.occupation}</span>
                </th>
                <th 
                  onClick={() => handleSort('householdId')} 
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition"
                >
                  <div className="flex items-center gap-1">
                    <span>{t.householdId}</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4 text-right">
                  <span>{t.actions}</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedCitizens.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-medium text-slate-700">{t.noResults}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {language === 'km' ? 'សូមសាកល្បងស្វែងរកពាក្យគន្លឹះផ្សេង ឬកំណត់តម្រងឡើងវិញ' : 'Try adjusting your search criteria or resetting filters'}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedCitizens.map((c) => {
                  const isMale = c.gender === 'ប្រុស';
                  return (
                    <tr 
                      key={c.id} 
                      className="hover:bg-slate-50/80 transition group cursor-pointer"
                      onClick={() => onSelectCitizen(c)}
                    >
                      <td className="py-3 px-4 font-mono text-xs text-slate-500">
                        #{c.originalId || c.id}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 group-hover:text-blue-600 transition">
                        {c.name}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          isMale 
                            ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                            : 'bg-pink-50 text-pink-700 border border-pink-200'
                        }`}>
                          {translateGender(c.gender, language)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 hidden md:table-cell text-xs font-mono">
                        {c.dob || '—'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {c.age} <span className="text-[11px] font-normal text-slate-400">{t.yearsOld}</span>
                      </td>
                      <td className="py-3 px-4">
                        {c.village?.trim() === 'មុខឈ្នាង' ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-xs text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200">
                            <MapPin className="w-3 h-3 text-amber-600 shrink-0" />
                            <span>ភូមិមុខឈ្នាង</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-semibold text-xs text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
                            <MapPin className="w-3 h-3 text-blue-600 shrink-0" />
                            <span>{c.village?.trim() || 'រោគ'}</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600 hidden sm:table-cell">
                        <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs">
                          {translateRole(c.relationship, language)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        <span className="font-medium text-xs">
                          {translateOccupation(c.occupation, language)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 font-mono text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                          <Building2 className="w-3 h-3 text-indigo-500" />
                          #{c.householdId}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onSelectCitizen(c)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title={t.details}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEditCitizen(c)}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                            title={t.editCitizen}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(t.confirmDelete)) {
                                onDeleteCitizen(c.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title={t.deleteCitizen}
                          >
                            <Trash2 className="w-4 h-4" />
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

        {/* Pagination Bar */}
        {filteredCitizens.length > 0 && (
          <div className="py-3 px-4 bg-slate-50/50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div>
              <span>{t.page} </span>
              <span className="font-bold text-slate-900">{currentPage}</span>
              <span> {t.of} </span>
              <span className="font-bold text-slate-900">{totalPages}</span>
              <span className="ml-2 text-slate-400">
                ({((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, filteredCitizens.length)} of {filteredCitizens.length.toLocaleString()})
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                title={t.prev}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                title={t.next}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
