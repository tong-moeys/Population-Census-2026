import React from 'react';
import { 
  X, 
  Printer, 
  User, 
  Calendar, 
  MapPin, 
  Heart, 
  Eye, 
  ShieldAlert, 
  GraduationCap, 
  Phone, 
  Users, 
  School,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { StudentRecord } from '../types/student';
import { Language } from '../types/census';
import { translations } from '../utils/translations';
import { OfficialSignatureSection } from './OfficialSignatureSection';

interface StudentProfileModalProps {
  student: StudentRecord | null;
  language: Language;
  onClose: () => void;
  onEdit?: (student: StudentRecord) => void;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  student,
  language,
  onClose,
  onEdit
}) => {
  if (!student) return null;

  const t = translations[language];

  const handlePrint = () => {
    window.print();
  };

  const getEyeBadge = () => {
    switch (student.eyeCheck) {
      case 'normal':
        return <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-xs font-semibold border border-emerald-200">ធម្មតា (Normal)</span>;
      case 'glasses':
        return <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-xs font-semibold border border-blue-200">ពាក់វ៉ែនតា (Glasses)</span>;
      case 'impaired':
        return <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-xs font-semibold border border-rose-200">គំហើញខ្សោយ (Impaired)</span>;
      default:
        return <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded text-xs">មិនទាន់ពិនិត្យ</span>;
    }
  };

  const getPoorBadge = () => {
    switch (student.poorCard) {
      case 'idpoor1':
        return <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-100 px-2 py-0.5 rounded text-xs font-bold border border-amber-300">ក្រីក្រកម្រិត ១ (IDPoor 1)</span>;
      case 'idpoor2':
        return <span className="inline-flex items-center gap-1 text-blue-800 bg-blue-100 px-2 py-0.5 rounded text-xs font-bold border border-blue-300">ក្រីក្រកម្រិត ២ (IDPoor 2)</span>;
      case 'vulnerable':
        return <span className="inline-flex items-center gap-1 text-purple-800 bg-purple-100 px-2 py-0.5 rounded text-xs font-bold border border-purple-300">គ្រួសារងាយរងគ្រោះ</span>;
      default:
        return <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-xs font-medium">គ្មានប័ណ្ណក្រីក្រ (ទូទៅ)</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-4xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between no-print border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold">
                {language === 'km' ? 'សលាកបត្រព័ត៌មានផ្ទាល់ខ្លួនសិស្ស (EMIS Profile)' : 'Official Student Profile Form'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {student.name} • {student.studentCode} • {student.grade}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={() => onEdit(student)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              >
                {t.editStudent}
              </button>
            )}
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition"
            >
              <Printer className="w-4 h-4" />
              <span>{language === 'km' ? 'បោះពុម្ពសលាកបត្រ' : 'Print Profile'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official MoEYS Student Profile Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 font-khmer text-slate-800 bg-white">
          {/* Official MoEYS Header */}
          <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start text-center sm:text-left gap-4 pb-4 border-b-2 border-slate-800">
            <div>
              <p className="text-xs sm:text-sm font-bold text-slate-700">ក្រសួងអប់រំ យុវជន និងកីឡា</p>
              <p className="text-xs font-medium text-slate-600">មន្ទីរអប់រំ យុវជន និងកីឡាខេត្តកំពង់ធំ</p>
              <p className="text-xs font-medium text-slate-600">ការិយាល័យអប់រំ យុវជន និងកីឡា ស្រុកស្ទឹងសែន</p>
              <p className="text-sm font-bold text-blue-900 mt-0.5">សាលាបឋមសិក្សារោគ</p>
            </div>

            <div className="text-center sm:text-right">
              <p className="text-xs sm:text-sm font-bold text-slate-900">ព្រះរាជាណាចក្រកម្ពុជា</p>
              <p className="text-xs font-bold text-slate-800">ជាតិ សាសនា ព្រះមហាក្សត្រ</p>
              <div className="flex justify-center sm:justify-end my-1">
                <span className="w-20 h-0.5 bg-amber-500 rounded-full" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                ឆ្នាំសិក្សា៖ <span className="font-bold text-slate-800">{student.academicYear}</span>
              </p>
            </div>
          </div>

          {/* Form Title & Student Photo Banner */}
          <div className="mt-5 flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-4">
              {/* Photo Box */}
              <div className="w-24 h-32 rounded-lg bg-slate-200 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 p-2 shrink-0">
                {student.photoUrl ? (
                  <img src={student.photoUrl} alt={student.name} className="w-full h-full object-cover rounded" />
                ) : (
                  <>
                    <User className="w-8 h-8 text-slate-400" />
                    <span className="text-[9px] text-center mt-1 leading-tight text-slate-500">រូបថត 4x6<br/>Photo</span>
                  </>
                )}
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                  {student.grade} - បន្ទប់ {student.section}
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                  {student.name}
                </h2>
                {student.latinName && (
                  <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                    {student.latinName}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-600">
                  <span className="font-semibold bg-white px-2 py-0.5 rounded border border-slate-200">
                    អត្តលេខសិស្ស៖ <span className="font-bold text-slate-900">{student.studentCode}</span>
                  </span>
                  <span className="font-semibold bg-white px-2 py-0.5 rounded border border-slate-200">
                    ភេទ៖ <span className="font-bold text-slate-900">{student.gender}</span>
                  </span>
                  <span className="font-semibold bg-white px-2 py-0.5 rounded border border-slate-200">
                    អាយុ៖ <span className="font-bold text-slate-900">{student.age} ឆ្នាំ</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right space-y-1 sm:border-l sm:border-slate-200 sm:pl-4">
              <div className="text-xs text-slate-500">ស្ថានភាពសិស្ស</div>
              <div className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded text-xs inline-block border border-emerald-200">
                {student.status === 'active' ? '✓ កំពុងសិក្សា (Active)' : student.status}
              </div>
              <div className="text-[11px] text-slate-500 mt-2">ថ្ងៃចូលរៀន៖ <span className="font-semibold text-slate-800">{student.enrollmentDate}</span></div>
            </div>
          </div>

          {/* Section 1: Personal & Physical Health Information */}
          <div className="mt-6">
            <h4 className="text-xs font-bold uppercase text-blue-900 border-b border-blue-200 pb-1 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-blue-600" />
              ១. ព័ត៌មានផ្ទាល់ខ្លួន និងការលូតលាស់រាងកាយ (Personal & Health)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 text-xs">
              <div className="space-y-2">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">ថ្ងៃ ខែ ឆ្នាំកំណើត៖</span>
                  <span className="font-bold text-slate-900">{student.dob}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">អាយុគិតជាខែ៖</span>
                  <span className="font-bold text-slate-900">{student.ageMonths ? `${student.ageMonths} ខែ` : `${student.age * 12} ខែ`}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">កម្ពស់ (Height)៖</span>
                  <span className="font-bold text-slate-900">{student.heightCm ? `${student.heightCm} ស.ម (cm)` : 'មិនទាន់វាស់'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">ទម្ងន់ (Weight)៖</span>
                  <span className="font-bold text-slate-900">{student.weightKg ? `${student.weightKg} គ.ក្រ (kg)` : 'មិនទាន់ថ្លឹង'}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500">លទ្ធផលពិនិត្យគំហើញភ្នែក៖</span>
                  <div>{getEyeBadge()}</div>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500">ប័ណ្ណសមធម៌ / ក្រីក្រ៖</span>
                  <div>{getPoorBadge()}</div>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">ពិការភាព (Disability)៖</span>
                  <span className="font-medium text-slate-800">{student.disability || 'គ្មាន (ធម្មតា)'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">ថ្នាក់រៀនមុន (Previous Grade)៖</span>
                  <span className="font-medium text-slate-800">{student.previousGrade || 'គ្មាន'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Addresses */}
          <div className="mt-6">
            <h4 className="text-xs font-bold uppercase text-blue-900 border-b border-blue-200 pb-1 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-blue-600" />
              ២. ទីកន្លែងកំណើត និង អាសយដ្ឋានបច្ចុប្បន្ន (Birth Place & Address)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-700 block mb-1">ទីកន្លែងកំណើត (Place of Birth)</span>
                <p className="text-slate-600 leading-relaxed">
                  ភូមិ <strong>{student.pobVillage}</strong>, ឃុំ <strong>{student.pobCommune}</strong>, ស្រុក <strong>{student.pobDistrict}</strong>, ខេត្ត <strong>{student.pobProvince}</strong>
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-700 block mb-1">អាសយដ្ឋានបច្ចុប្បន្ន (Current Residence)</span>
                <p className="text-slate-600 leading-relaxed">
                  ភូមិ <strong>{student.currentVillage}</strong>, ឃុំ <strong>{student.currentCommune}</strong>, ស្រុក <strong>{student.currentDistrict}</strong>, ខេត្ត <strong>{student.currentProvince}</strong>
                </p>
                <p className="text-[11px] text-blue-700 font-medium mt-1">
                  ខ្នងផ្ទះជំរឿនលេខ៖ {student.householdCode || '1R1'} (តំបន់សេវាបឋមសិក្សារោគ)
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Family, Parents & Guardian Information */}
          <div className="mt-6">
            <h4 className="text-xs font-bold uppercase text-blue-900 border-b border-blue-200 pb-1 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-blue-600" />
              ៣. ព័ត៌មានឪពុក ម្តាយ និង អាណាព្យាបាល (Parents & Guardian)
            </h4>

            <div className="overflow-x-auto mt-3">
              <table className="w-full text-xs text-left border border-slate-200">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2 border-r border-slate-200">ត្រូវជា</th>
                    <th className="p-2 border-r border-slate-200">គោត្តនាម និងនាម</th>
                    <th className="p-2 border-r border-slate-200">ស្ថានភាព</th>
                    <th className="p-2 border-r border-slate-200">មុខរបរ</th>
                    <th className="p-2">លេខទូរស័ព្ទទំនាក់ទំនង</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="p-2 font-bold text-slate-700 bg-slate-50 border-r border-slate-200">ឪពុក</td>
                    <td className="p-2 font-bold text-slate-900 border-r border-slate-200">{student.fatherName}</td>
                    <td className="p-2 border-r border-slate-200">{student.fatherLiving ? 'នៅរស់' : 'ទទួលមរណភាព'}</td>
                    <td className="p-2 border-r border-slate-200">{student.fatherOccupation || 'កសិករ'}</td>
                    <td className="p-2 font-mono">{student.fatherPhone || '—'}</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold text-slate-700 bg-slate-50 border-r border-slate-200">ម្តាយ</td>
                    <td className="p-2 font-bold text-slate-900 border-r border-slate-200">{student.motherName}</td>
                    <td className="p-2 border-r border-slate-200">{student.motherLiving ? 'នៅរស់' : 'ទទួលមរណភាព'}</td>
                    <td className="p-2 border-r border-slate-200">{student.motherOccupation || 'កសិករ'}</td>
                    <td className="p-2 font-mono">{student.motherPhone || '—'}</td>
                  </tr>
                  {student.guardianName && student.guardianName !== student.fatherName && student.guardianName !== student.motherName && (
                    <tr>
                      <td className="p-2 font-bold text-slate-700 bg-slate-50 border-r border-slate-200">អាណាព្យាបាល</td>
                      <td className="p-2 font-bold text-slate-900 border-r border-slate-200">{student.guardianName}</td>
                      <td className="p-2 border-r border-slate-200">ត្រូវជា {student.guardianRelationship || 'អាណាព្យាបាល'}</td>
                      <td className="p-2 border-r border-slate-200">{student.guardianOccupation || 'កសិករ'}</td>
                      <td className="p-2 font-mono">{student.guardianPhone || '—'}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Official Signatures Section */}
          <div className="mt-8 pt-6 border-t border-slate-300">
            <OfficialSignatureSection
              language={language}
              defaultLocation="រោគ"
              reportType="school"
              defaultSignatories={{
                centerTitle: 'គ្រូបន្ទុកថ្នាក់',
                rightTitle: 'នាយកសាលាបឋមសិក្សារោគ'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
