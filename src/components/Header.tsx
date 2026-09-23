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
  UserPlus
} from 'lucide-react';
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
  totalRecords
}) => {
  const t = translations[language];

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top bar with Branding & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between py-3 gap-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                  {t.appTitle}
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                  2026
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                <span>{t.appSubtitle}</span>
                <span className="hidden sm:inline text-slate-300">•</span>
                <span className="hidden sm:inline font-medium text-slate-700">
                  {totalRecords.toLocaleString()} {t.recordsFound}
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 no-print">
            {/* Language Switcher */}
            <button
              onClick={() => onLanguageChange(language === 'km' ? 'en' : 'km')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition"
              title="Change Language"
            >
              <Globe2 className="w-3.5 h-3.5 text-blue-600" />
              <span>{language === 'km' ? 'English' : 'ភាសាខ្មែរ'}</span>
            </button>

            {/* Add Citizen */}
            <button
              onClick={onAddNewCitizen}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition active:scale-95"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{t.addCitizen}</span>
            </button>

            {/* Export Dropdown / Buttons */}
            <button
              onClick={onExportCSV}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition shadow-2xs"
              title={t.exportCSV}
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">CSV</span>
            </button>

            <button
              onClick={onExportJSON}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition shadow-2xs"
              title={t.exportJSON}
            >
              <Download className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">JSON</span>
            </button>

            <button
              onClick={onPrint}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition shadow-2xs"
              title={t.printReport}
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">{t.printReport}</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex space-x-1 sm:space-x-4 overflow-x-auto py-2 no-scrollbar no-print" aria-label="Tabs">
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
