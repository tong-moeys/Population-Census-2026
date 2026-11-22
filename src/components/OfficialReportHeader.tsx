import React from 'react';
import { useReportVisibility } from '../contexts/ReportVisibilityContext';

interface OfficialReportHeaderProps {
  title: string;
  subtitle?: string;
  academicYear?: string;
  showOnScreen?: boolean;
}

export const OfficialReportHeader: React.FC<OfficialReportHeaderProps> = ({
  title,
  subtitle,
  academicYear = 'ឆ្នាំសិក្សា ២០២៦ - ២០២៧',
  showOnScreen = true,
}) => {
  const { hideHeaderFooter } = useReportVisibility();

  return (
    <div
      className={`${showOnScreen ? 'block' : 'hidden print:block'} bg-white print:bg-transparent rounded-xl ${
        hideHeaderFooter ? 'p-3 sm:p-4 mb-3 sm:mb-4' : 'p-5 sm:p-6 mb-6'
      } border border-slate-200 print:border-0 print:p-0 print:mb-2 shadow-xs print:shadow-none text-slate-900`}
    >
      {/* Top Ministry & Kingdom Header (Hidden on screen when hideHeaderFooter=true, always printed) */}
      <div
        className={`${
          hideHeaderFooter ? 'hidden print:flex' : 'flex'
        } flex-col sm:flex-row print:flex-row items-center sm:items-start print:items-start justify-between gap-4 pb-4 print:pb-2 border-b-2 border-slate-800 print:border-b-2 print:border-slate-900`}
      >
        {/* Left Side: Ministry & School Hierarchy */}
        <div className="text-center sm:text-left print:text-left space-y-1 print:space-y-0.5 text-xs sm:text-[13px] print:text-[11px] leading-relaxed">
          <p className="font-bold text-slate-950 text-sm sm:text-base print:text-xs">ក្រសួងអប់រំ យុវជន និងកីឡា</p>
          <p className="font-semibold text-slate-800">មន្ទីរអប់រំ យុវជន និងកីឡារាជធានី ខេត្តបន្ទាយមានជ័យ</p>
          <p className="font-medium text-slate-800">
            <span className="font-bold text-slate-950">កម្រងសាលារៀន :</span> ស្ពានស្រែង
          </p>
          <p className="font-medium text-slate-800">
            <span className="font-bold text-slate-950">ឈ្មោះសាលា :</span> សាលាបឋមសិក្សា រោគ
          </p>
          <p className="font-medium text-slate-800">
            <span className="font-bold text-slate-950">លេខកូដសាលា :</span> <span className="font-mono font-bold text-slate-950 text-sm print:text-xs tracking-wider">01030401017</span>
          </p>
        </div>

        {/* Right Side: Kingdom of Cambodia Motto */}
        <div className="text-center space-y-1 print:space-y-0.5 min-w-[200px] order-first sm:order-last print:order-last">
          <h3 className="text-base sm:text-lg print:text-sm font-bold text-slate-950 tracking-wider">
            ព្រះរាជាណាចក្រកម្ពុជា
          </h3>
          <h4 className="text-xs sm:text-sm print:text-xs font-bold text-slate-900 tracking-widest">
            ជាតិ សាសនា ព្រះមហាក្សត្រ
          </h4>
          <div className="flex justify-center pt-0.5">
            <span className="text-slate-500 font-serif tracking-widest text-xs select-none">~ ~ 𑁋𑁋𑁋 ~ ~</span>
          </div>
        </div>
      </div>

      {/* Main Report Title */}
      <div className={`text-center ${hideHeaderFooter ? 'mt-0 print:mt-2' : 'mt-5 print:mt-2'} space-y-1 print:space-y-0.5`}>
        <h2 className="text-sm sm:text-xl print:text-sm font-black text-slate-950 uppercase tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-[11px] sm:text-sm text-slate-700 font-medium max-w-2xl mx-auto">
            {subtitle}
          </p>
        )}
        {academicYear && (
          <p className="text-[11px] sm:text-xs font-bold text-blue-900 print:text-slate-800 tracking-wide">
            {academicYear}
          </p>
        )}
      </div>
    </div>
  );
};
