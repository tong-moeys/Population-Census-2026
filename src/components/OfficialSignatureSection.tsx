import React, { useState } from 'react';
import { Calendar, Settings2, Check, RefreshCw, MapPin, Feather, Sparkles } from 'lucide-react';
import { 
  SignatureDateConfig, 
  getDefaultSignatureConfig, 
  formatKhmerLunarDate, 
  formatKhmerSolarDate,
  getApproximateLunarDate,
  KHMER_WEEKDAYS,
  KHMER_LUNAR_MONTHS,
  KHMER_ZODIAC_YEARS,
  KHMER_SAK,
  toKhmerNum
} from '../utils/khmerDateUtils';
import { Language } from '../types/census';
import { OfficialReportFooter } from './OfficialReportFooter';

interface SignatoryTitles {
  leftHeading: string;
  leftTitle: string;
  leftName: string;
  centerHeading: string;
  centerTitle: string;
  centerName: string;
  rightHeading?: string;
  rightTitle: string;
  rightName: string;
}

interface OfficialSignatureSectionProps {
  language?: Language;
  defaultLocation?: string;
  defaultSignatories?: Partial<SignatoryTitles>;
  reportType?: 'school' | 'enrollment' | 'census';
}

export const OfficialSignatureSection: React.FC<OfficialSignatureSectionProps> = ({
  language = 'km',
  defaultLocation = 'រោគ',
  defaultSignatories,
  reportType = 'school'
}) => {
  const [config, setConfig] = useState<SignatureDateConfig>(() => {
    const base = getDefaultSignatureConfig();
    return {
      ...base,
      location: defaultLocation || base.location
    };
  });

  const [showConfigPanel, setShowConfigPanel] = useState(false);

  // Signatory role state
  const [signatories, setSignatories] = useState<SignatoryTitles>(() => {
    if (reportType === 'enrollment') {
      return {
        leftHeading: 'បានឃើញ និងបញ្ជាក់',
        leftTitle: 'មេឃុំ / ចៅសង្កាត់',
        leftName: '',
        centerHeading: 'បានឃើញ និងឯកភាព',
        centerTitle: 'នាយកសាលាបឋមសិក្សា',
        centerName: '',
        rightHeading: '',
        rightTitle: 'គ្រូទទួលបន្ទុកចុះឈ្មោះ',
        rightName: '',
        ...defaultSignatories
      };
    }
    return {
      leftHeading: 'បានឃើញ និងអនុម័ត',
      leftTitle: 'មេឃុំ / ចៅសង្កាត់',
      leftName: '',
      centerHeading: 'បានឃើញ និងឯកភាព',
      centerTitle: 'ប្រធានកម្រង / នាយកសាលា',
      centerName: '',
      rightHeading: '',
      rightTitle: 'អ្នកទទួលបន្ទុកស្ថិតិ',
      rightName: 'លោក អ៊ុន ប៊ុនទុង',
      ...defaultSignatories
    };
  });

  // Handle date change in custom mode
  const handleDateChange = (isoDate: string) => {
    try {
      const parts = isoDate.split('-');
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      const lunar = getApproximateLunarDate(d);
      setConfig(prev => ({
        ...prev,
        solarDate: isoDate,
        lunarDayOfWeek: lunar.dayOfWeek,
        lunarMoonPhase: lunar.moonPhase,
        lunarDayOfMonth: lunar.lunarDay,
        lunarMonth: lunar.lunarMonth,
        lunarYear: lunar.animalYear,
        lunarSak: lunar.sak,
        buddhistYear: lunar.beYear
      }));
    } catch {
      setConfig(prev => ({ ...prev, solarDate: isoDate }));
    }
  };

  // Reset to today
  const handleResetToToday = () => {
    const def = getDefaultSignatureConfig();
    setConfig(prev => ({
      ...def,
      location: prev.location,
      showLunar: prev.showLunar,
      showSolar: prev.showSolar
    }));
  };

  // Formatted date strings
  const lunarDateStr = formatKhmerLunarDate(config);
  const solarDateStr = formatKhmerSolarDate(config);

  return (
    <div className="pt-6 border-t-2 border-slate-300 mt-8 space-y-4">
      {/* Control bar hidden to preserve pristine official document look */}

      {/* Expanded Configuration Modal / Panel (Hidden during print) */}
      {showConfigPanel && (
        <div className="p-4 bg-white rounded-xl border border-blue-200 shadow-sm space-y-4 no-print animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h4 className="text-xs font-bold text-blue-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>{language === 'km' ? 'កំណត់ជម្រើសកាលបរិច្ឆេទចុះហត្ថលេខា (ចន្ទគតិ & សុរិយគតិ)' : 'Configure Signing Dates (Lunar & Solar)'}</span>
            </h4>
            <button
              onClick={handleResetToToday}
              className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-semibold"
            >
              <RefreshCw className="w-3 h-3" />
              <span>{language === 'km' ? 'កំណត់ឡើងវិញតាមថ្ងៃនេះ' : 'Reset Today'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Mode Selector */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                {language === 'km' ? 'របៀបកាលបរិច្ឆេទ' : 'Date Mode'}
              </label>
              <select
                value={config.mode}
                onChange={(e) => setConfig(prev => ({ ...prev, mode: e.target.value as SignatureDateConfig['mode'] }))}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none font-medium"
              >
                <option value="auto">{language === 'km' ? 'ស្វ័យប្រវត្តិតាមថ្ងៃនេះ' : 'Auto (Today)'}</option>
                <option value="custom">{language === 'km' ? 'ជ្រើសរើសតាមចិត្ត (Custom)' : 'Custom'}</option>
                <option value="blank">{language === 'km' ? 'ទម្រង់ចុចៗ (.........) សម្រាប់សរសេរដៃ' : 'Blank Dots for manual fill'}</option>
              </select>
            </div>

            {/* Location (ធ្វើនៅ...) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                {language === 'km' ? 'ទីកន្លែងធ្វើ (ឧ. រោគ ឬ សាលាបឋមសិក្សារោគ)' : 'Location / Place'}
              </label>
              <div className="relative">
                <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={config.location}
                  onChange={(e) => setConfig(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="រោគ"
                  className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none"
                />
              </div>
            </div>

            {/* Solar Date picker */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                {language === 'km' ? 'កាលបរិច្ឆេទសុរិយគតិ (Solar Date)' : 'Solar Date'}
              </label>
              <input
                type="date"
                value={config.solarDate}
                disabled={config.mode === 'blank'}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none disabled:opacity-50"
              />
            </div>
          </div>

          {/* Lunar Date manual fine-tuning (Visible when custom or auto) */}
          {config.mode !== 'blank' && (
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
              <span className="text-[11px] font-bold text-amber-950 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-700" />
                <span>{language === 'km' ? 'កាលបរិច្ឆេទចន្ទគតិ (Khmer Lunar Calendar Details)' : 'Khmer Lunar Calendar Details'}</span>
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 text-xs">
                {/* Day of Week */}
                <div>
                  <label className="block text-[10px] text-slate-600 mb-0.5">ថ្ងៃ</label>
                  <select
                    value={config.lunarDayOfWeek}
                    onChange={(e) => setConfig(prev => ({ ...prev, lunarDayOfWeek: e.target.value }))}
                    className="w-full p-1 bg-white border border-amber-200 rounded text-xs"
                  >
                    {KHMER_WEEKDAYS.map(w => (
                      <option key={w} value={w}>ថ្ងៃ{w}</option>
                    ))}
                  </select>
                </div>

                {/* Waxing / Waning Day (1 - 15) */}
                <div>
                  <label className="block text-[10px] text-slate-600 mb-0.5">ថ្ងៃកើត/រោច</label>
                  <select
                    value={config.lunarDayOfMonth}
                    onChange={(e) => setConfig(prev => ({ ...prev, lunarDayOfMonth: parseInt(e.target.value, 10) }))}
                    className="w-full p-1 bg-white border border-amber-200 rounded text-xs"
                  >
                    {Array.from({ length: 15 }, (_, i) => i + 1).map(d => (
                      <option key={d} value={d}>{toKhmerNum(d)}</option>
                    ))}
                  </select>
                </div>

                {/* Moon Phase (កើត / រោច) */}
                <div>
                  <label className="block text-[10px] text-slate-600 mb-0.5">ដំណាក់ព្រះចន្ទ</label>
                  <select
                    value={config.lunarMoonPhase}
                    onChange={(e) => setConfig(prev => ({ ...prev, lunarMoonPhase: e.target.value as 'កើត' | 'រោច' }))}
                    className="w-full p-1 bg-white border border-amber-200 rounded text-xs font-bold"
                  >
                    <option value="កើត">កើត (Waxing)</option>
                    <option value="រោច">រោច (Waning)</option>
                  </select>
                </div>

                {/* Lunar Month */}
                <div>
                  <label className="block text-[10px] text-slate-600 mb-0.5">ខែចន្ទគតិ</label>
                  <select
                    value={config.lunarMonth}
                    onChange={(e) => setConfig(prev => ({ ...prev, lunarMonth: e.target.value }))}
                    className="w-full p-1 bg-white border border-amber-200 rounded text-xs font-semibold"
                  >
                    {KHMER_LUNAR_MONTHS.map(m => (
                      <option key={m} value={m}>ខែ{m}</option>
                    ))}
                  </select>
                </div>

                {/* Animal Year */}
                <div>
                  <label className="block text-[10px] text-slate-600 mb-0.5">ឆ្នាំរាសីចក្រ</label>
                  <select
                    value={config.lunarYear}
                    onChange={(e) => setConfig(prev => ({ ...prev, lunarYear: e.target.value }))}
                    className="w-full p-1 bg-white border border-amber-200 rounded text-xs"
                  >
                    {KHMER_ZODIAC_YEARS.map(y => (
                      <option key={y} value={y}>ឆ្នាំ{y}</option>
                    ))}
                  </select>
                </div>

                {/* Sak Era */}
                <div>
                  <label className="block text-[10px] text-slate-600 mb-0.5">ស័ក</label>
                  <select
                    value={config.lunarSak}
                    onChange={(e) => setConfig(prev => ({ ...prev, lunarSak: e.target.value }))}
                    className="w-full p-1 bg-white border border-amber-200 rounded text-xs"
                  >
                    {KHMER_SAK.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* Buddhist Era (ព.ស.) */}
                <div>
                  <label className="block text-[10px] text-slate-600 mb-0.5">ពុទ្ធសករាជ (ព.ស.)</label>
                  <input
                    type="number"
                    value={config.buddhistYear}
                    onChange={(e) => setConfig(prev => ({ ...prev, buddhistYear: parseInt(e.target.value, 10) || 2570 }))}
                    className="w-full p-1 bg-white border border-amber-200 rounded text-xs text-center font-bold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Signatories customization */}
          <div className="border-t border-slate-100 pt-3">
            <span className="text-[11px] font-bold text-slate-700 block mb-2">
              {language === 'km' ? 'កែសម្រួលតួនាទី និងឈ្មោះអ្នកចុះហត្ថលេខាទាំង ៣ ផ្នែក' : 'Customize Signatory Roles and Names'}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Left Signatory */}
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  {language === 'km' ? 'ផ្នែកខាងឆ្វេង (Left)' : 'Left Column'}
                </span>
                <input
                  type="text"
                  value={signatories.leftHeading}
                  onChange={(e) => setSignatories(prev => ({ ...prev, leftHeading: e.target.value }))}
                  placeholder="បានឃើញ និងបញ្ជាក់"
                  className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded font-semibold text-slate-900"
                />
                <input
                  type="text"
                  value={signatories.leftTitle}
                  onChange={(e) => setSignatories(prev => ({ ...prev, leftTitle: e.target.value }))}
                  placeholder="មេឃុំ / ចៅសង្កាត់"
                  className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded text-slate-700"
                />
                <input
                  type="text"
                  value={signatories.leftName}
                  onChange={(e) => setSignatories(prev => ({ ...prev, leftName: e.target.value }))}
                  placeholder="(ឈ្មោះពេញ - ទុកទទេក៏បាន)"
                  className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded text-slate-500 italic"
                />
              </div>

              {/* Center Signatory */}
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  {language === 'km' ? 'ផ្នែកកណ្ដាល (Center)' : 'Center Column'}
                </span>
                <input
                  type="text"
                  value={signatories.centerHeading}
                  onChange={(e) => setSignatories(prev => ({ ...prev, centerHeading: e.target.value }))}
                  placeholder="បានឃើញ និងឯកភាព"
                  className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded font-semibold text-slate-900"
                />
                <input
                  type="text"
                  value={signatories.centerTitle}
                  onChange={(e) => setSignatories(prev => ({ ...prev, centerTitle: e.target.value }))}
                  placeholder="នាយកសាលាបឋមសិក្សា"
                  className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded text-slate-700"
                />
                <input
                  type="text"
                  value={signatories.centerName}
                  onChange={(e) => setSignatories(prev => ({ ...prev, centerName: e.target.value }))}
                  placeholder="(ឈ្មោះពេញ - ទុកទទេក៏បាន)"
                  className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded text-slate-500 italic"
                />
              </div>

              {/* Right Signatory (Reporter) */}
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  {language === 'km' ? 'ផ្នែកខាងស្ដាំ (កាលបរិច្ឆេទ & អ្នកទទួលបន្ទុក)' : 'Right Column'}
                </span>
                <div className="flex items-center gap-3 text-[11px] font-medium text-slate-600 py-0.5">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.showLunar}
                      onChange={(e) => setConfig(prev => ({ ...prev, showLunar: e.target.checked }))}
                      className="rounded text-blue-600"
                    />
                    <span>{language === 'km' ? 'បង្ហាញចន្ទគតិ' : 'Lunar'}</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.showSolar}
                      onChange={(e) => setConfig(prev => ({ ...prev, showSolar: e.target.checked }))}
                      className="rounded text-blue-600"
                    />
                    <span>{language === 'km' ? 'បង្ហាញសុរិយគតិ' : 'Solar'}</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={signatories.rightTitle}
                  onChange={(e) => setSignatories(prev => ({ ...prev, rightTitle: e.target.value }))}
                  placeholder="អ្នកទទួលបន្ទុកស្ថិតិ"
                  className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded font-semibold text-slate-700"
                />
                <input
                  type="text"
                  value={signatories.rightName}
                  onChange={(e) => setSignatories(prev => ({ ...prev, rightName: e.target.value }))}
                  placeholder="(ឈ្មោះពេញ - ទុកទទេក៏បាន)"
                  className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded text-slate-500 italic"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* OFFICIAL ADMINISTRATIVE SIGNATURE LAYOUT (Print & Preview) */}
      {/* ========================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center text-xs text-slate-900 pt-2 print:break-inside-avoid">
        {/* Left Column: បានឃើញ និងបញ្ជាក់ (មេឃុំ/ចៅសង្កាត់ ឬ មេភូមិ) */}
        <div className="flex flex-col justify-between min-h-[140px] space-y-1">
          <div>
            <p className="font-bold text-slate-900 text-xs sm:text-sm">
              {signatories.leftHeading || 'បានឃើញ និងបញ្ជាក់'}
            </p>
            <p className="font-semibold text-slate-700 mt-0.5">
              {signatories.leftTitle || 'មេឃុំ / ចៅសង្កាត់'}
            </p>
          </div>

          <div className="py-6 flex items-center justify-center">
            <span className="text-[11px] text-slate-400 font-medium italic border border-dashed border-slate-200 rounded-md px-3 py-1">
              (ហត្ថលេខា និងត្រា)
            </span>
          </div>

          <div>
            {signatories.leftName ? (
              <p className="font-bold text-slate-900 underline underline-offset-4">{signatories.leftName}</p>
            ) : (
              <p className="text-slate-300 font-mono tracking-widest text-[11px]">........................................</p>
            )}
          </div>
        </div>

        {/* Center Column: បានឃើញ និងឯកភាព (ប្រធានកម្រង / នាយកសាលា) */}
        <div className="flex flex-col justify-between min-h-[140px] space-y-1">
          <div>
            <p className="font-bold text-slate-900 text-xs sm:text-sm">
              {signatories.centerHeading || 'បានឃើញ និងឯកភាព'}
            </p>
            <p className="font-semibold text-slate-700 mt-0.5">
              {signatories.centerTitle || 'ប្រធានកម្រង / នាយកសាលា'}
            </p>
          </div>

          <div className="py-6 flex items-center justify-center">
            <span className="text-[11px] text-slate-400 font-medium italic border border-dashed border-slate-200 rounded-md px-3 py-1">
              (ហត្ថលេខា និងត្រា)
            </span>
          </div>

          <div>
            {signatories.centerName ? (
              <p className="font-bold text-slate-900 underline underline-offset-4">{signatories.centerName}</p>
            ) : (
              <p className="text-slate-300 font-mono tracking-widest text-[11px]">........................................</p>
            )}
          </div>
        </div>

        {/* Right Column: Lunar Date & Solar Date (Align Left), Reporter Title & Signature (Align Center) */}
        <div className="flex flex-col justify-between min-h-[140px] space-y-1">
          <div className="space-y-1">
            <div className="text-left space-y-0.5">
              {/* Lunar Date (កាលបរិច្ឆេទចន្ទគតិ) */}
              {config.showLunar && (
                <p className="text-[11px] font-medium text-slate-700 leading-tight">
                  {lunarDateStr}
                </p>
              )}

              {/* Solar Date (កាលបរិច្ឆេទសុរិយគតិ) */}
              {config.showSolar && (
                <p className="font-bold text-slate-900 text-xs sm:text-[13px] leading-tight">
                  {solarDateStr}
                </p>
              )}
            </div>

            <p className="font-semibold text-slate-800 pt-1 text-center">
              {signatories.rightTitle || 'អ្នកទទួលបន្ទុកស្ថិតិ'}
            </p>
          </div>

          <div className="py-6 flex items-center justify-center">
            <span className="text-[11px] text-slate-400 font-medium italic border border-dashed border-slate-200 rounded-md px-3 py-1">
              (ហត្ថលេខា និងឈ្មោះ)
            </span>
          </div>

          <div className="text-center">
            {signatories.rightName ? (
              <p className="font-bold text-slate-900 underline underline-offset-4">{signatories.rightName}</p>
            ) : (
              <p className="text-slate-300 font-mono tracking-widest text-[11px]">........................................</p>
            )}
          </div>
        </div>
      </div>

      {/* Official Administrative Address at Bottom of Document */}
      <OfficialReportFooter schoolCode="01030401017" />
    </div>
  );
};
