import React from 'react';
import { 
  X, 
  User, 
  Calendar, 
  Building2, 
  Briefcase, 
  HeartHandshake, 
  Users, 
  Edit3, 
  Trash2,
  Phone,
  Shield
} from 'lucide-react';
import { Citizen, Household, Language } from '../types/census';
import { translations, translateGender, translateOccupation, translateRole } from '../utils/translations';

interface CitizenModalProps {
  citizen: Citizen | null;
  household: Household | null;
  language: Language;
  onClose: () => void;
  onEdit: (citizen: Citizen) => void;
  onDelete: (id: number) => void;
  onSelectRelative: (relative: Citizen) => void;
}

export const CitizenModal: React.FC<CitizenModalProps> = ({
  citizen,
  household,
  language,
  onClose,
  onEdit,
  onDelete,
  onSelectRelative
}) => {
  if (!citizen) return null;

  const t = translations[language];
  const isMale = citizen.gender === 'ប្រុស';

  // Relatives in the same household
  const relatives = household ? household.members.filter(m => m.id !== citizen.id) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-blue-700 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center text-white border border-white/20">
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">{citizen.name}</h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-white/20">
                  #{citizen.originalId || citizen.id}
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-0.5">
                {language === 'km' ? 'ខ្នងផ្ទះលេខ ' : 'Household #'}{citizen.householdId}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Key Attributes Grid */}
          <div className="grid grid-cols-2 gap-3.5 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 font-medium block">{t.gender}</span>
              <div className="mt-1 flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isMale ? 'bg-blue-600' : 'bg-pink-500'}`} />
                <span className="font-bold text-slate-900">{translateGender(citizen.gender, language)}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 font-medium block">{t.age}</span>
              <span className="font-bold text-slate-900 mt-1 block">
                {citizen.age} {t.yearsOld}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 font-medium block">{t.dob}</span>
              <div className="mt-1 flex items-center gap-1 font-mono text-slate-900">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold">{citizen.dob || '—'}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 font-medium block">{t.relationship}</span>
              <div className="mt-1 flex items-center gap-1 font-semibold text-slate-900">
                <HeartHandshake className="w-3.5 h-3.5 text-pink-500" />
                <span>{translateRole(citizen.relationship, language)}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 col-span-2">
              <span className="text-slate-500 font-medium block">{t.occupation}</span>
              <div className="mt-1 flex items-center gap-1.5 text-slate-900 font-semibold">
                <Briefcase className="w-4 h-4 text-emerald-600" />
                <span>{translateOccupation(citizen.occupation, language)}</span>
              </div>
            </div>
          </div>

          {/* Household Family Members */}
          {relatives.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-600" />
                {language === 'km' ? 'សមាជិកគ្រួសារដទៃទៀត ក្នុងផ្ទះ #' : 'Other Members in Household #'}{citizen.householdId} ({relatives.length})
              </h4>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {relatives.map(rel => (
                  <div
                    key={rel.id}
                    onClick={() => onSelectRelative(rel)}
                    className="p-2.5 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 transition cursor-pointer flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-900 flex items-center gap-2">
                        <span>{rel.name}</span>
                        <span className={`text-[10px] px-1.5 rounded ${
                          rel.gender === 'ប្រុស' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                        }`}>
                          {translateGender(rel.gender, language)}
                        </span>
                      </div>
                      <div className="text-slate-500 text-[11px] mt-0.5">
                        {translateRole(rel.relationship, language)} • {rel.age} {t.yearsOld} • {translateOccupation(rel.occupation, language)}
                      </div>
                    </div>
                    <span className="text-[11px] text-blue-600 font-semibold">{t.details}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={() => {
              if (window.confirm(t.confirmDelete)) {
                onDelete(citizen.id);
                onClose();
              }
            }}
            className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t.deleteCitizen}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200/60 rounded-lg transition"
            >
              {t.cancel}
            </button>
            <button
              onClick={() => {
                onClose();
                onEdit(citizen);
              }}
              className="inline-flex items-center gap-1 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow-xs"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{t.editCitizen}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
