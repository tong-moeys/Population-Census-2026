import React, { useState, useMemo, useCallback } from 'react';
import { loadParsedCensus } from './utils/censusData';
import { Citizen, DemographicStats, Household, Language, ViewTab } from './types/census';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { CitizensTable } from './components/CitizensTable';
import { HouseholdsView } from './components/HouseholdsView';
import { AgePyramidView } from './components/AgePyramidView';
import { AnalyticsView } from './components/AnalyticsView';
import { CitizenModal } from './components/CitizenModal';
import { CitizenFormModal } from './components/CitizenFormModal';
import { translations } from './utils/translations';

export const App: React.FC = () => {
  // Initialize with the 2,071 census records
  const initialData = useMemo(() => loadParsedCensus(), []);
  const [citizens, setCitizens] = useState<Citizen[]>(initialData.citizens);
  const [language, setLanguage] = useState<Language>('km');
  const [currentTab, setCurrentTab] = useState<ViewTab>('dashboard');

  // Modals & Details
  const [selectedCitizen, setSelectedCitizen] = useState<Citizen | null>(null);
  const [citizenToEdit, setCitizenToEdit] = useState<Citizen | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);

  // Quick filters passed from Dashboard to Citizens Table
  const [occupationFilter, setOccupationFilter] = useState<string>('all');
  const [genderFilter, setGenderFilter] = useState<string>('all');

  const t = translations[language];

  // Recalculate households & stats whenever citizens array changes
  const { households, stats } = useMemo(() => {
    const householdMap = new Map<number, Citizen[]>();
    for (const citizen of citizens) {
      const hId = citizen.householdId;
      if (!householdMap.has(hId)) {
        householdMap.set(hId, []);
      }
      householdMap.get(hId)!.push(citizen);
    }

    const hList: Household[] = [];
    householdMap.forEach((members, id) => {
      const head = members.find(m => m.relationship === 'ប្តី' || m.relationship === 'ឪពុក') 
        || members.find(m => m.relationship === 'ម្តាយ') 
        || members[0];

      const malesCount = members.filter(m => m.gender === 'ប្រុស').length;
      const femalesCount = members.filter(m => m.gender === 'ស្រី').length;
      const childrenCount = members.filter(m => m.age < 18).length;
      const workingAgeCount = members.filter(m => m.age >= 18 && m.age < 60).length;
      const seniorsCount = members.filter(m => m.age >= 60).length;

      const occupations: Record<string, number> = {};
      for (const m of members) {
        const occ = m.occupation || 'ផ្សេងៗ';
        occupations[occ] = (occupations[occ] || 0) + 1;
      }

      hList.push({
        id,
        headName: head?.name || `គ្រួសារ #${id}`,
        membersCount: members.length,
        members,
        malesCount,
        femalesCount,
        childrenCount,
        workingAgeCount,
        seniorsCount,
        occupations
      });
    });

    hList.sort((a, b) => Number(a.id) - Number(b.id));

    const totalPopulation = citizens.length;
    const totalHouseholds = hList.length;
    const maleCount = citizens.filter(c => c.gender === 'ប្រុស').length;
    const femaleCount = citizens.filter(c => c.gender === 'ស្រី').length;
    const unknownGenderCount = totalPopulation - maleCount - femaleCount;

    const totalAge = citizens.reduce((acc, c) => acc + c.age, 0);
    const averageAge = totalPopulation > 0 ? parseFloat((totalAge / totalPopulation).toFixed(1)) : 0;

    const sortedAges = [...citizens.map(c => c.age)].sort((a, b) => a - b);
    const medianAge = sortedAges.length > 0 
      ? (sortedAges.length % 2 === 0 
          ? (sortedAges[sortedAges.length / 2 - 1] + sortedAges[sortedAges.length / 2]) / 2 
          : sortedAges[Math.floor(sortedAges.length / 2)])
      : 0;
    const minAge = sortedAges.length > 0 ? sortedAges[0] : 0;
    const maxAge = sortedAges.length > 0 ? sortedAges[sortedAges.length - 1] : 0;

    const under15 = citizens.filter(c => c.age < 15).length;
    const age15to24 = citizens.filter(c => c.age >= 15 && c.age <= 24).length;
    const age25to59 = citizens.filter(c => c.age >= 25 && c.age <= 59).length;
    const senior60plus = citizens.filter(c => c.age >= 60).length;

    const pyramidCohorts = [
      { label: '80+', min: 80, max: 200 },
      { label: '75-79', min: 75, max: 79 },
      { label: '70-74', min: 70, max: 74 },
      { label: '65-69', min: 65, max: 69 },
      { label: '60-64', min: 60, max: 64 },
      { label: '55-59', min: 55, max: 59 },
      { label: '50-54', min: 50, max: 54 },
      { label: '45-49', min: 45, max: 49 },
      { label: '40-44', min: 40, max: 44 },
      { label: '35-39', min: 35, max: 39 },
      { label: '30-34', min: 30, max: 34 },
      { label: '25-29', min: 25, max: 29 },
      { label: '20-24', min: 20, max: 24 },
      { label: '15-19', min: 15, max: 19 },
      { label: '10-14', min: 10, max: 14 },
      { label: '5-9', min: 5, max: 9 },
      { label: '0-4', min: 0, max: 4 },
    ];

    const agePyramid = pyramidCohorts.map(cohort => {
      const male = citizens.filter(c => c.gender === 'ប្រុស' && c.age >= cohort.min && c.age <= cohort.max).length;
      const female = citizens.filter(c => c.gender === 'ស្រី' && c.age >= cohort.min && c.age <= cohort.max).length;
      return { bracket: cohort.label, male, female };
    });

    const occupationCounts: Record<string, number> = {};
    for (const c of citizens) {
      const occ = c.occupation || 'ផ្សេងៗ';
      occupationCounts[occ] = (occupationCounts[occ] || 0) + 1;
    }
    const topOccupations = Object.entries(occupationCounts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: parseFloat(((count / totalPopulation) * 100).toFixed(1))
      }))
      .sort((a, b) => b.count - a.count);

    const relationshipCounts: Record<string, number> = {};
    for (const c of citizens) {
      const rel = c.relationship || 'ផ្សេងៗ';
      relationshipCounts[rel] = (relationshipCounts[rel] || 0) + 1;
    }
    const relationshipDistribution = Object.entries(relationshipCounts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: parseFloat(((count / totalPopulation) * 100).toFixed(1))
      }))
      .sort((a, b) => b.count - a.count);

    const averageHouseholdSize = totalHouseholds > 0 
      ? parseFloat((totalPopulation / totalHouseholds).toFixed(1)) 
      : 0;
    
    const largestHouseholdSize = hList.reduce((max, h) => Math.max(max, h.membersCount), 0);

    const computedStats: DemographicStats = {
      totalPopulation,
      totalHouseholds,
      maleCount,
      femaleCount,
      unknownGenderCount,
      averageAge,
      medianAge,
      minAge,
      maxAge,
      ageGroups: { under15, age15to24, age25to59, senior60plus },
      agePyramid,
      topOccupations,
      relationshipDistribution,
      averageHouseholdSize,
      largestHouseholdSize
    };

    return { households: hList, stats: computedStats };
  }, [citizens]);

  // Selected Citizen's Household
  const currentSelectedHousehold = useMemo(() => {
    if (!selectedCitizen) return null;
    return households.find(h => h.id === selectedCitizen.householdId) || null;
  }, [selectedCitizen, households]);

  // Handlers for Add, Edit, Delete
  const handleSaveCitizen = useCallback((citizenData: Omit<Citizen, 'id'> & { id?: number }) => {
    if (citizenData.id) {
      // Edit
      setCitizens(prev => prev.map(c => c.id === citizenData.id ? { ...c, ...citizenData } as Citizen : c));
      if (selectedCitizen && selectedCitizen.id === citizenData.id) {
        setSelectedCitizen(prev => prev ? { ...prev, ...citizenData } as Citizen : null);
      }
    } else {
      // Add
      setCitizens(prev => {
        const nextId = prev.length > 0 ? Math.max(...prev.map(c => c.id)) + 1 : 1;
        const newRecord: Citizen = {
          ...citizenData,
          id: nextId,
          originalId: citizenData.originalId || nextId,
        };
        return [newRecord, ...prev];
      });
    }
  }, [selectedCitizen]);

  const handleDeleteCitizen = useCallback((id: number) => {
    setCitizens(prev => prev.filter(c => c.id !== id));
    if (selectedCitizen && selectedCitizen.id === id) {
      setSelectedCitizen(null);
    }
  }, [selectedCitizen]);

  // Quick filters from dashboard
  const handleFilterByOccupation = (occ: string) => {
    setOccupationFilter(occ);
    setCurrentTab('citizens');
  };

  const handleFilterByGender = (gender: string) => {
    setGenderFilter(gender);
    setCurrentTab('citizens');
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'OriginalID', 'Name', 'Gender', 'DOB', 'Age', 'Relationship', 'Occupation', 'HouseholdID'];
    const rows = citizens.map(c => [
      c.id,
      `"${c.originalId}"`,
      `"${c.name}"`,
      `"${c.gender}"`,
      `"${c.dob}"`,
      c.age,
      `"${c.relationship}"`,
      `"${c.occupation}"`,
      c.householdId
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `population-census-2026-cambodia.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export JSON
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({
      censusYear: 2026,
      exportedAt: new Date().toISOString(),
      stats,
      citizens,
      households
    }, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `population-census-2026.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-khmer">
      {/* Header */}
      <Header
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        language={language}
        onLanguageChange={setLanguage}
        onExportCSV={handleExportCSV}
        onExportJSON={handleExportJSON}
        onPrint={handlePrint}
        onAddNewCitizen={() => {
          setCitizenToEdit(null);
          setIsFormModalOpen(true);
        }}
        totalRecords={citizens.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {currentTab === 'dashboard' && (
          <DashboardView
            stats={stats}
            language={language}
            onNavigateTab={setCurrentTab}
            onFilterByOccupation={handleFilterByOccupation}
            onFilterByGender={handleFilterByGender}
          />
        )}

        {currentTab === 'citizens' && (
          <CitizensTable
            citizens={citizens}
            language={language}
            onSelectCitizen={setSelectedCitizen}
            onEditCitizen={(c) => {
              setCitizenToEdit(c);
              setIsFormModalOpen(true);
            }}
            onDeleteCitizen={handleDeleteCitizen}
            onAddNewCitizen={() => {
              setCitizenToEdit(null);
              setIsFormModalOpen(true);
            }}
            initialOccupationFilter={occupationFilter}
            initialGenderFilter={genderFilter}
            onClearInitialFilters={() => {
              setOccupationFilter('all');
              setGenderFilter('all');
            }}
          />
        )}

        {currentTab === 'households' && (
          <HouseholdsView
            households={households}
            language={language}
            onSelectCitizen={setSelectedCitizen}
          />
        )}

        {currentTab === 'pyramid' && (
          <AgePyramidView
            stats={stats}
            language={language}
          />
        )}

        {currentTab === 'analytics' && (
          <AnalyticsView
            stats={stats}
            households={households}
            citizens={citizens}
            language={language}
          />
        )}
      </main>

      {/* Citizen Profile Details Modal */}
      <CitizenModal
        citizen={selectedCitizen}
        household={currentSelectedHousehold}
        language={language}
        onClose={() => setSelectedCitizen(null)}
        onEdit={(c) => {
          setCitizenToEdit(c);
          setIsFormModalOpen(true);
        }}
        onDelete={handleDeleteCitizen}
        onSelectRelative={(rel) => setSelectedCitizen(rel)}
      />

      {/* Add / Edit Citizen Form Modal */}
      <CitizenFormModal
        isOpen={isFormModalOpen}
        citizenToEdit={citizenToEdit}
        language={language}
        onClose={() => {
          setIsFormModalOpen(false);
          setCitizenToEdit(null);
        }}
        onSave={handleSaveCitizen}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">{t.appTitle}</span>
            <span>•</span>
            <span>{t.sourceData}</span>
          </div>
          <div>
            <span>{language === 'km' ? 'ប្រព័ន្ធគ្រប់គ្រងទិន្នន័យប្រជាពលរដ្ឋ ឆ្នាំ២០២៦' : 'Population & Household Census System 2026'}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
