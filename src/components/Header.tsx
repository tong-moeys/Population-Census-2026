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
  Baby
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
  isFirebaseConnected
}) => {
  const t = translations[language];

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs">
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
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  {language === 'km' ? 'ភូមិមុខឈ្នាង' : 'Mukh Chhnang'}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
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
                <span>{language === 'km' ? 'តំបន់សេវា ប.សមុខឈ្នាង និង ប.សរោគ' : 'Mukh Chhnang & Rouk Primary Catchment'}</span>
                <span className="hidden sm:inline text-slate-300">•</span>
                <span className="font-semibold text-slate-700">
                  {totalRecords.toLocaleString()} {t.recordsFound}
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 no-print">
            {/* Firebase Sync Button */}
            <button
              onClick={onSyncToFirebase}
              disabled={isSyncing}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
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

            {/* Firebase Load / Refresh Button */}
            {onLoadFromFirebase && (
              <button
                onClick={onLoadFromFirebase}
                disabled={isSyncing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition"
                title={t.loadFromFirebase}
              >
                <CloudDownload className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">{t.loadFromFirebase}</span>
                <span className="sm:hidden">Fetch</span>
              </button>
            )}

            {/* Google Authentication */}
            {user ? (
              <div className="flex items-center gap-2 pl-1">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-7 h-7 rounded-full border border-slate-200"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                    {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <button
                  onClick={onSignOut}
                  className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  title={t.logout}
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onSignIn}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition"
              >
                <LogIn className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">{t.loginWithGoogle}</span>
                <span className="sm:hidden">Login</span>
              </button>
            )}

            {/* Language Switcher */}
            <button
              onClick={() => onLanguageChange(language === 'km' ? 'en' : 'km')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition"
              title="Change Language"
            >
              <Globe2 className="w-3.5 h-3.5 text-blue-600" />
              <span>{language === 'km' ? 'EN' : 'ខ្មែរ'}</span>
            </button>

            {/* Add Citizen */}
            <button
              onClick={onAddNewCitizen}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition active:scale-95"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.addCitizen}</span>
            </button>

            {/* Export Buttons */}
            <button
              onClick={onExportCSV}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition"
              title={t.exportCSV}
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">CSV</span>
            </button>

            <button
              onClick={onPrint}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition"
              title={t.printReport}
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex space-x-1 sm:space-x-3 overflow-x-auto py-2 no-scrollbar no-print" aria-label="Tabs">
          <button
            onClick={() => onTabChange('dashboard')}
            className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
              currentTab === 'dashboard'
                ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            {t.dashboard}
          </button>

          {/* School Catchment Report Tab - User's explicit focus */}
          <button
            onClick={() => onTabChange('school-report')}
            className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
              currentTab === 'school-report'
                ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <School className="w-4 h-4 text-blue-600" />
            <span>{t.schoolReport}</span>
            <span className="px-1.5 py-0.5 text-[10px] bg-blue-100 text-blue-800 rounded font-semibold">
              {language === 'km' ? 'តំបន់សេវា' : 'Catchment'}
            </span>
          </button>

          {/* Student Enrollment Lists Tab (Group 1: 3-5 yrs, Group 2: 70-80 mos) */}
          <button
            onClick={() => onTabChange('enrollment')}
            className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
              currentTab === 'enrollment'
                ? 'bg-emerald-50 text-emerald-800 border-b-2 border-emerald-600 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Baby className="w-4 h-4 text-emerald-600" />
            <span>{t.enrollmentCampaign}</span>
            <span className="px-1.5 py-0.5 text-[10px] bg-emerald-100 text-emerald-900 rounded-full font-bold">
              {language === 'km' ? '២ ក្រុម' : '2 Groups'}
            </span>
          </button>

          <button
            onClick={() => onTabChange('citizens')}
            className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
              currentTab === 'citizens'
                ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            {t.citizens}
          </button>

          <button
            onClick={() => onTabChange('households')}
            className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
              currentTab === 'households'
                ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Home className="w-4 h-4" />
            {t.households}
          </button>

          <button
            onClick={() => onTabChange('pyramid')}
            className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
              currentTab === 'pyramid'
                ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            {t.pyramid}
          </button>

          <button
            onClick={() => onTabChange('analytics')}
            className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
              currentTab === 'analytics'
                ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            {t.analytics}
          </button>
        </nav>
      </div>
    </header>
  );
};
