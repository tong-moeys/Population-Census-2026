import React from 'react';

interface OfficialReportFooterProps {
  schoolCode?: string;
  className?: string;
}

export const OfficialReportFooter: React.FC<OfficialReportFooterProps> = ({
  schoolCode = '01030401017',
  className = '',
}) => {
  return (
    <div className={`pt-3 border-t border-slate-300 print:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-800 print:text-[11px] print:break-inside-avoid ${className}`}>
      <div className="flex flex-wrap items-center gap-1.5 font-medium leading-relaxed">
        <span className="font-bold text-slate-950">អសយដ្ឋាន :</span>
        <span>ក្រុង/ស្រុក/ខណ្ឌ : <strong className="font-bold text-slate-950">ភ្នំស្រុក</strong></span>
        <span className="text-slate-400">•</span>
        <span>ឃុំ/សង្កាត់ : <strong className="font-bold text-slate-950">ស្ពានស្រែង</strong></span>
        <span className="text-slate-400">•</span>
        <span>ភូមិ/ក្រុម : <strong className="font-bold text-slate-950">រោគ</strong></span>
      </div>
      {schoolCode && (
        <div className="text-xs text-slate-600 print:text-[11px] font-semibold font-mono tracking-wider bg-slate-100 print:bg-transparent px-2 py-0.5 rounded">
          លេខកូដសាលា : <span className="font-bold text-slate-900">{schoolCode}</span>
        </div>
      )}
    </div>
  );
};
