import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { loadParsedCensus } from './utils/censusData';
import { Citizen, DemographicStats, Household, Language, ViewTab, EnrollmentStatus } from './types/census';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { CitizensTable } from './components/CitizensTable';
import { HouseholdsView } from './components/HouseholdsView';
import { AgePyramidView } from './components/AgePyramidView';
import { AnalyticsView } from './components/AnalyticsView';
import { SchoolReportView } from './components/SchoolReportView';
import { EnrollmentCampaignView } from './components/EnrollmentCampaignView';
import { CitizenModal } from './components/CitizenModal';
import { CitizenFormModal } from './components/CitizenFormModal';
import { translations } from './utils/translations';
import { 
  auth, 
  signInWithGoogle, 
  signOutUser, 
  syncCitizenToFirestore, 
  deleteCitizenFromFirestore, 
  batchSyncCitizens,
  fetchCitizensFromFirestore,
  testConnection
} from './firebase';

export const App: React.FC = () => {
  // Initialize with the 2,071 census records
  const initialData = useMemo(() => loadParsedCensus(), []);
  const [citizens, setCitizens] = useState<Citizen[]>(initialData.citizens);
  const [language, setLanguage] = useState<Language>('km');
  const [currentTab, setCurrentTab] = useState<ViewTab>('dashboard');

  // Firebase Auth & Cloud Sync States
  const [user, setUser] = useState<User | null>(null);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncProgress, setSyncProgress] = useState<number>(0);
  const [syncToast, setSyncToast] = useState<string | null>(null);

  // Modals & Details
  const [selectedCitizen, setSelectedCitizen] = useState<Citizen | null>(null);
  const [citizenToEdit, setCitizenToEdit] = useState<Citizen | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);

  // Quick filters passed from Dashboard to Citizens Table
  const [occupationFilter, setOccupationFilter] = useState<string>('all');
  const [genderFilter, setGenderFilter] = useState<string>('all');

  const t = translations[language];

  // Check Firebase connection and listen to auth changes
  useEffect(() => {
    testConnection().then(connected => {
      setIsFirebaseConnected(connected);
    });

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setIsFirebaseConnected(true);
      }
    });

    return () => unsubscribe();
  }, []);

  const showToast = (message: string) => {
    setSyncToast(message);
    setTimeout(() => {
      setSyncToast(null);
    }, 4000);
  };

  // Cloud Sync Handler
  const handleSyncToFirebase = async () => {
    if (!user) {
      try {
        const signedInUser = await signInWithGoogle();
        if (!signedInUser) {
          showToast(language === 'km' ? 'សូមចូលគណនី Google ដើម្បីសមកាលកម្មទិន្នន័យ' : 'Please sign in to sync with Firebase');
          return;
        }
      } catch (err) {
        console.info('Sign-in cancelled or not completed:', err);
        showToast(language === 'km' ? 'សូមចូលគណនី Google ជាមុនសិន' : 'Please sign in with Google first');
        return;
      }
    }

    try {
      setIsSyncing(true);
      setSyncProgress(0);
      showToast(language === 'km' ? 'កំពុងផ្ញើទិន្នន័យទៅកាន់ Firebase...' : 'Uploading records to Firebase Cloud...');
      
      const count = await batchSyncCitizens(citizens, (p) => {
        setSyncProgress(p);
      });

      showToast(language === 'km' 
        ? `បានសមកាលកម្មទិន្នន័យពលរដ្ឋ ${count.toLocaleString()} នាក់ ទៅ Firebase ដោយជោគជ័យ!` 
        : `Successfully synced ${count.toLocaleString()} records to Firebase!`);
    } catch (err) {
      console.warn('Sync notice:', err);
      showToast(language === 'km' ? 'មានបញ្ហាក្នុងការសមកាលកម្ម Firebase' : 'Error syncing to Firebase');
    } finally {
      setIsSyncing(false);
      setSyncProgress(0);
    }
  };

  // Cloud Fetch Handler
  const handleLoadFromFirebase = async () => {
    try {
      setIsSyncing(true);
      showToast(language === 'km' ? 'កំពុងទាញយកទិន្នន័យពី Firebase...' : 'Fetching data from Firebase...');
      const cloudCitizens = await fetchCitizensFromFirestore();
      if (cloudCitizens && cloudCitizens.length > 0) {
        setCitizens(cloudCitizens);
        showToast(language === 'km' 
          ? `បានទាញយកទិន្នន័យ ${cloudCitizens.length.toLocaleString()} នាក់ (ភូមិ រោគ) ពី Firebase ដោយជោគជ័យ!`
          : `Loaded ${cloudCitizens.length.toLocaleString()} records from Firebase!`);
      } else {
        showToast(language === 'km' ? 'ពុំមានទិន្នន័យលើ Cloud នៅឡើយទេ សូមចុច Sync' : 'No records found in cloud yet, please sync');
      }
    } catch (err) {
      console.warn('Fetch note:', err);
      showToast(language === 'km' ? 'មានបញ្ហាក្នុងការទាញយកទិន្នន័យពី Firebase' : 'Error fetching from Firebase');
    } finally {
      setIsSyncing(false);
    }
  };

  // Google Login / Logout
  const handleSignIn = async () => {
    try {
      const u = await signInWithGoogle();
      if (u) {
        showToast(language === 'km' ? `ស្វាគមន៍ ${u.displayName || u.email}` : `Welcome ${u.displayName || u.email}`);
      } else {
        showToast(language === 'km' ? 'ការចូលគណនីត្រូវបានបោះបង់' : 'Sign-in cancelled');
      }
    } catch (err) {
      console.info('Sign in note:', err);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      showToast(language === 'km' ? 'បានចាកចេញពីប្រព័ន្ធ' : 'Signed out successfully');
    } catch (err) {
      console.info('Sign out note:', err);
    }
  };

  // Recalculate households & stats whenever citizens array changes
  const { households, stats } = useMemo(() => {
    const householdMap = new Map<string, Citizen[]>();
    for (const citizen of citizens) {
      const v = citizen.village || 'រោគ';
      const hKey = `${v}_${citizen.householdId}`;
      if (!householdMap.has(hKey)) {
        householdMap.set(hKey, []);
      }
      householdMap.get(hKey)!.push(citizen);
    }

    const hList: Household[] = [];
    householdMap.forEach((members) => {
      const head = members.find(m => m.relationship === 'ប្តី' || m.relationship === 'ឪពុក') 
        || members.find(m => m.relationship === 'ម្តាយ') 
        || members[0];

      const hId = members[0]?.householdId || 1;
      const hVillage = members[0]?.village || 'រោគ';

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
        id: hId,
        headName: head?.name || `គ្រួសារ #${hId}`,
        village: hVillage,
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

    hList.sort((a, b) => {
      if (a.village !== b.village) {
        return a.village === 'មុខឈ្នាង' ? -1 : 1;
      }
      return Number(a.id) - Number(b.id);
    });

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

  // Handlers for Add, Edit, Delete with Firebase persistence
  const handleSaveCitizen = useCallback((citizenData: Omit<Citizen, 'id'> & { id?: number }) => {
    if (citizenData.id) {
      // Edit
      const updatedRecord: Citizen = { 
        ...citizenData,
        village: citizenData.village?.trim() || 'រោគ'
      } as Citizen;
      setCitizens(prev => prev.map(c => c.id === citizenData.id ? updatedRecord : c));
      if (selectedCitizen && selectedCitizen.id === citizenData.id) {
        setSelectedCitizen(updatedRecord);
      }
      // If user is authenticated, sync to Firestore
      if (user) {
        syncCitizenToFirestore(updatedRecord).catch(err => {
          console.warn('Background sync failed:', err);
        });
      }
    } else {
      // Add
      setCitizens(prev => {
        const nextId = prev.length > 0 ? Math.max(...prev.map(c => c.id)) + 1 : 1;
        const newRecord: Citizen = {
          ...citizenData,
          id: nextId,
          originalId: citizenData.originalId || nextId,
          school: citizenData.school || 'ប.សរោគ',
          village: citizenData.village?.trim() || 'រោគ'
        };
        if (user) {
          syncCitizenToFirestore(newRecord).catch(err => {
            console.warn('Background sync failed:', err);
          });
        }
        return [newRecord, ...prev];
      });
    }
    showToast(language === 'km' ? 'ទិន្នន័យត្រូវបានរក្សាទុក' : 'Record saved successfully');
  }, [selectedCitizen, user, language]);

  const handleDeleteCitizen = useCallback((id: number) => {
    setCitizens(prev => prev.filter(c => c.id !== id));
    if (selectedCitizen && selectedCitizen.id === id) {
      setSelectedCitizen(null);
    }
    if (user) {
      deleteCitizenFromFirestore(id).catch(err => {
        console.warn('Background delete failed:', err);
      });
    }
    showToast(language === 'km' ? 'បានលុបទិន្នន័យរួចរាល់' : 'Record deleted successfully');
  }, [selectedCitizen, user, language]);

  // Quick filters from dashboard
  const handleFilterByOccupation = (occ: string) => {
    setOccupationFilter(occ);
    setCurrentTab('citizens');
  };

  const handleFilterByGender = (gender: string) => {
    setGenderFilter(gender);
    setCurrentTab('citizens');
  };

  const handleUpdateChildStatus = useCallback(async (citizenId: number, status: EnrollmentStatus) => {
    setCitizens(prev => prev.map(c => c.id === citizenId ? { ...c, enrollmentStatus: status } : c));
    const target = citizens.find(c => c.id === citizenId);
    if (target) {
      const updated = { ...target, enrollmentStatus: status };
      if (user) {
        syncCitizenToFirestore(updated).catch(err => {
          console.info('Status save note:', err);
        });
      }
    }
    const label = status === 'enrolled' 
      ? (language === 'km' ? 'បានចុះឈ្មោះចូលរៀន' : 'Enrolled')
      : status === 'contacted'
        ? (language === 'km' ? 'បានចុះជួប/តាមដាន' : 'Visited')
        : status === 'moved'
          ? (language === 'km' ? 'ផ្លាស់ទីលំនៅ' : 'Moved')
          : (language === 'km' ? 'មិនទាន់ចុះឈ្មោះ' : 'Pending');
    showToast(`${language === 'km' ? 'ស្ថានភាព៖ ' : 'Status: '}${label}`);
  }, [citizens, user, language]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'OriginalID', 'Name', 'Gender', 'DOB', 'Age', 'Relationship', 'Occupation', 'HouseholdID', 'School'];
    const rows = citizens.map(c => [
      c.id,
      `"${c.originalId}"`,
      `"${c.name}"`,
      `"${c.gender}"`,
      `"${c.dob}"`,
      c.age,
      `"${c.relationship}"`,
      `"${c.occupation}"`,
      c.householdId,
      `"${c.school || 'ប.សរោគ'}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `population-census-2026-cambodia-rouk.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export JSON
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({
      censusYear: 2026,
      schoolCatchment: 'ប.សរោគ (Rouk Primary School)',
      exportedAt: new Date().toISOString(),
      stats,
      citizens,
      households
    }, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `population-census-2026-rouk-primary-school.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-khmer">
      {/* Toast Notification */}
      {syncToast && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-3 duration-200">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{syncToast}</span>
        </div>
      )}

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
        user={user}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        onSyncToFirebase={handleSyncToFirebase}
        onLoadFromFirebase={handleLoadFromFirebase}
        isSyncing={isSyncing}
        syncProgress={syncProgress}
        isFirebaseConnected={isFirebaseConnected}
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

        {currentTab === 'school-report' && (
          <SchoolReportView
            citizens={citizens}
            language={language}
          />
        )}

        {currentTab === 'enrollment' && (
          <EnrollmentCampaignView
            citizens={citizens}
            households={households}
            language={language}
            onUpdateCitizenStatus={handleUpdateChildStatus}
            onSelectCitizen={setSelectedCitizen}
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
            <span className="font-semibold text-slate-700">សាលាបឋមសិក្សា រោគ (ប.សរោគ)</span>
            <span>•</span>
            <span>{t.appTitle}</span>
            <span>•</span>
            <span className="text-emerald-600 font-medium">Firebase Connected</span>
          </div>
          <div>
            <span>{language === 'km' ? 'ប្រព័ន្ធគ្រប់គ្រងទិន្នន័យប្រជាពលរដ្ឋ និងស្ថិតិតំបន់សេវាសាលារៀន ឆ្នាំ២០២៦' : 'Catchment Census & Demographic Management System 2026'}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
