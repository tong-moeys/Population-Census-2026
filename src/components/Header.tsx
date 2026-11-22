import React from 'react';
import { 
  Users, 
  Home, 
  BarChart3, 
  TrendingUp, 
  FileText, 
  Download, 
  Printer, 
  Globe2, 
  UserPlus,
  School,
  Cloud,
  CloudUpload,
  CloudDownload,
  CheckCircle2,
  LogIn,
  LogOut,
  Sparkles,
  Loader2,
  Baby,
  GraduationCap,
  FileSpreadsheet,
  Minimize2
} from 'lucide-react';
import { User } from 'firebase/auth';
import { Language, ViewTab } from '../types/census';
import { translations } from '../utils/translations';

interface HeaderProps {
  currentTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onExportCSV: () => void;
  onExportJSON: () => void;
  onPrint: () => void;
  onAddNewCitizen: () => void;
  totalRecords: number;
  user: User | null;
  onSignIn: () => void;
  onSignOut: () => void;
  onSyncToFirebase: () => void;
  onLoadFromFirebase?: () => void;
  isSyncing: boolean;
  syncProgress?: number;
  isFirebaseConnected: boolean;
  onHideHeaderFooter?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  language,
  onLanguageChange,
  onExportCSV,
  onExportJSON,
  onPrint,
  onAddNewCitizen,
  totalRecords,
  user,
  onSignIn,
  onSignOut,
  onSyncToFirebase,
  onLoadFromFirebase,
  isSyncing,
  syncProgress,
  isFirebaseConnected,
  onHideHeaderFooter
}) => {
  const t = translations[language];

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs no-print print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top bar with Branding & Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between py-3 gap-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <School className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                  {t.appTitle}
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                  {language === 'km' ? 'ប.សរោគ' : 'Rouk Primary'}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                  {language === 'km' ? 'ភូមិមុខឈ្នាង' : 'Mukh Chhnang'}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                  {language === 'km' ? 'ភូមិរោគ' : 'Roak Village'}
                </span>
                {isFirebaseConnected && (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Firebase
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 flex flex-wrap items-center gap-2 mt-0.5">
                <span>{language === 'km' ? 'សាលាបឋមសិក្សារោគ (ភូមិចំណុះ៖ ភូមិរោគ & ភូមិមុខឈ្នាង)' : 'Rouk Primary Catchment (Feeder: Roak & Mukh Chhnang)'}</span>
                <span className="hidden sm:inline text-slate-300">•</span>
                <span className="font-semibold text-slate-700">
                  {totalRecords.toLocaleString()} {t.recordsFound}
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 no-print">
            {/* Group 1: Cloud Sync & Account */}
            <div className="inline-flex flex-wrap items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl p-1">
              <button
                onClick={onSyncToFirebase}
                disabled={isSyncing}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border transition ${
                  isSyncing 
                    ? 'bg-blue-50 text-blue-600 border-blue-200 cursor-wait' 
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                }`}
                title={t.syncToFirebase}
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                    <span>{t.syncing || 'Syncing'} {syncProgress ? `${syncProgress}%` : ''}</span>
                  </>
                ) : (
                  <>
                    <CloudUpload className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="hidden sm:inline">{t.syncToFirebase}</span>
                    <span className="sm:hidden">Sync</span>
                  </>
                )}
              </button>

              {onLoadFromFirebase && (
                <button
                  onClick={onLoadFromFirebase}
                  disabled={isSyncing}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition"
                  title={t.loadFromFirebase}
                >
                  <CloudDownload className="w-3.5 h-3.5 text-blue-600" />
                  <span className="hidden sm:inline">{t.loadFromFirebase}</span>
                  <span className="sm:hidden">Fetch</span>
                </button>
              )}

              {user ? (
                <div className="flex items-center gap-1.5 pl-1">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="w-6 h-6 rounded-full border border-slate-200"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                      {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <button
                    onClick={onSignOut}
                    className="p-1 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    title={t.logout}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={onSignIn}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition"
                >
                  <LogIn className="w-3.5 h-3.5 text-blue-600" />
                  <span className="hidden sm:inline">{t.loginWithGoogle}</span>
                  <span className="sm:hidden">Login</span>
                </button>
              )}
            </div>

            {/* Group 2: Citizen Input & Export Actions */}
            <div className="inline-flex flex-wrap items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl p-1">
              <button
                onClick={onAddNewCitizen}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition active:scale-95"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.addCitizen}</span>
              </button>

              <button
                onClick={onExportCSV}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition"
                title={t.exportCSV}
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">CSV</span>
              </button>

              <button
                onClick={onPrint}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition"
                title={t.printReport}
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden md:inline">{language === 'km' ? 'បោះពុម្ព' : 'Print'}</span>
              </button>
            </div>

            {/* Group 3: Language */}
            <button
              onClick={() => onLanguageChange(language === 'km' ? 'en' : 'km')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition"
              title="Change Language"
            >
              <Globe2 className="w-3.5 h-3.5 text-blue-600" />
              <span>{language === 'km' ? 'EN' : 'ខ្មែរ'}</span>
            </button>
          </div>
        </div>

        {/* Left-Aligned Grouped Controls + Tab Navigation */}
        <div className="flex flex-wrap items-center justify-start gap-2 py-2 no-print">
          {/* Left Group: Select Tab + Hide Header/Footer */}
          <div className="inline-flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded-xl p-1 shrink-0">
            <select
              value={currentTab}
              onChange={(e) => onTabChange(e.target.value as ViewTab)}
              className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20"
              aria-label="Select Tab"
            >
              <optgroup label={language === 'km' ? 'របាយការណ៍ & ស្ថិតិ' : 'Reports & Stats'}>
                <option value="comparison">{t.comparisonTable}</option>
                <option value="school-report">{t.schoolReport}</option>
                <option value="enrollment">{t.enrollmentCampaign}</option>
              </optgroup>
              <optgroup label={language === 'km' ? 'បញ្ជីឈ្មោះ & គ្រួសារ' : 'Rosters & Households'}>
                <option value="students">{t.students}</option>
                <option value="citizens">{t.citizens}</option>
                <option value="households">{t.households}</option>
              </optgroup>
              <optgroup label={language === 'km' ? 'សង្ខេប & វិភាគ' : 'Summary & Analytics'}>
                <option value="dashboard">{t.dashboard}</option>
                <option value="pyramid">{t.pyramid}</option>
                <option value="analytics">{t.analytics}</option>
              </optgroup>
            </select>

            {onHideHeaderFooter && (
              <button
                type="button"
                onClick={onHideHeaderFooter}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-white hover:bg-slate-200 text-slate-800 border border-slate-200 transition cursor-pointer"
                title={language === 'km' ? 'លាក់ Header & Footer (បង្ហាញពេញអេក្រង់)' : 'Hide Header & Footer'}
              >
                <Minimize2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>{language === 'km' ? 'លាក់ Header / Footer' : 'Hide Header/Footer'}</span>
              </button>
            )}
          </div>

          <nav className="flex items-center gap-2 overflow-x-auto no-scrollbar" aria-label="Tabs">
            {/* Tab Group 1: Reports & Mobilization */}
            <div className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1 shrink-0">
              <button
                onClick={() => onTabChange('comparison')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                  currentTab === 'comparison'
                    ? 'bg-amber-100 text-amber-950 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-amber-600" />
                <span>{t.comparisonTable}</span>
              </button>

              <button
                onClick={() => onTabChange('school-report')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                  currentTab === 'school-report'
                    ? 'bg-blue-100 text-blue-900 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                }`}
              >
                <School className="w-3.5 h-3.5 text-blue-600" />
                <span>{t.schoolReport}</span>
              </button>

              <button
                onClick={() => onTabChange('enrollment')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                  currentTab === 'enrollment'
                    ? 'bg-emerald-100 text-emerald-900 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                }`}
              >
                <Baby className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t.enrollmentCampaign}</span>
              </button>
            </div>

            {/* Tab Group 2: Rosters & Households */}
            <div className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1 shrink-0">
              <button
                onClick={() => onTabChange('students')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                  currentTab === 'students'
                    ? 'bg-indigo-100 text-indigo-900 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                <span>{t.students}</span>
              </button>

              <button
                onClick={() => onTabChange('citizens')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                  currentTab === 'citizens'
                    ? 'bg-blue-100 text-blue-900 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{t.citizens}</span>
              </button>

              <button
                onClick={() => onTabChange('households')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                  currentTab === 'households'
                    ? 'bg-blue-100 text-blue-900 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                <span>{t.households}</span>
              </button>
            </div>

            {/* Tab Group 3: Summary & Analytics */}
            <div className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1 shrink-0">
              <button
                onClick={() => onTabChange('dashboard')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                  currentTab === 'dashboard'
                    ? 'bg-blue-100 text-blue-900 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>{t.dashboard}</span>
              </button>

              <button
                onClick={() => onTabChange('pyramid')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                  currentTab === 'pyramid'
                    ? 'bg-blue-100 text-blue-900 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{t.pyramid}</span>
              </button>

              <button
                onClick={() => onTabChange('analytics')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                  currentTab === 'analytics'
                    ? 'bg-blue-100 text-blue-900 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>{t.analytics}</span>
              </button>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};
