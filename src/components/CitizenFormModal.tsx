import React, { useState, useEffect } from 'react';
import { X, Save, UserPlus, Edit3 } from 'lucide-react';
import { Citizen, Language } from '../types/census';
import { translations, translateOccupation, translateRole, translateGender } from '../utils/translations';

interface CitizenFormModalProps {
  isOpen: boolean;
  citizenToEdit: Citizen | null;
  language: Language;
  onClose: () => void;
  onSave: (citizenData: Omit<Citizen, 'id'> & { id?: number }) => void;
}

export const CitizenFormModal: React.FC<CitizenFormModalProps> = ({
  isOpen,
  citizenToEdit,
  language,
  onClose,
  onSave
}) => {
  if (!isOpen) return null;

  const t = translations[language];

  const [name, setName] = useState('');
  const [gender, setGender] = useState('ប្រុស');
  const [dob, setDob] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [relationship, setRelationship] = useState('កូន');
  const [occupation, setOccupation] = useState('កសិករ');
  const [householdId, setHouseholdId] = useState<number | ''>(1);
  const [originalId, setOriginalId] = useState('');

  useEffect(() => {
    if (citizenToEdit) {
      setName(citizenToEdit.name);
      setGender(citizenToEdit.gender);
      setDob(citizenToEdit.dob || '');
      setAge(citizenToEdit.age);
      setRelationship(citizenToEdit.relationship);
      setOccupation(citizenToEdit.occupation);
      setHouseholdId(citizenToEdit.householdId);
      setOriginalId(String(citizenToEdit.originalId || ''));
    } else {
      setName('');
      setGender('ប្រុស');
      setDob('');
      setAge('');
      setRelationship('កូន');
      setOccupation('កសិករ');
      setHouseholdId(1);
      setOriginalId('');
    }
  }, [citizenToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      id: citizenToEdit?.id,
      name: name.trim(),
      gender,
      dob: dob.trim(),
      age: typeof age === 'number' ? age : parseInt(String(age), 10) || 0,
      relationship,
      occupation,
      householdId: typeof householdId === 'number' ? householdId : parseInt(String(householdId), 10) || 1,
      originalId: originalId.trim() || undefined as unknown as string
    });
    onClose();
  };

  const relationshipOptions = ['ប្តី', 'ប្រពន្ធ', 'កូន', 'ម្តាយ', 'ឪពុក', 'ចៅ', 'កូនប្រសារ', 'ម្ដាយក្មេក', 'ផ្សេងៗ'];
  const occupationOptions = ['កសិករ', 'សិស្ស', 'គ្រូបង្រៀន', 'គ្រូពេទ្យ', 'ជរា', 'ក្នុងបន្ទុក', 'មេភូមិ', 'ប៉ូលិស', 'បុគ្គលិកធនាគារ', 'ជំនួយការឃុំ', 'វិស្វករ', 'ផ្សេងៗ'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-700 to-indigo-700 text-white flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
            {citizenToEdit ? <Edit3 className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            {citizenToEdit ? t.editCitizen : t.addCitizen}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t.fullName} *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={language === 'km' ? 'ឧទាហរណ៍៖ សុខ សាន' : 'e.g. Sok San'}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Gender */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.gender}
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
              >
                <option value="ប្រុស">{translateGender('ប្រុស', language)}</option>
                <option value="ស្រី">{translateGender('ស្រី', language)}</option>
              </select>
            </div>

            {/* Age */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.age} ({t.yearsOld}) *
              </label>
              <input
                type="number"
                min="0"
                max="120"
                required
                value={age}
                onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="25"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* DOB */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.dob}
              </label>
              <input
                type="text"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                placeholder="DD/Mon/YYYY"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
              />
            </div>

            {/* Household # */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.householdId} *
              </label>
              <input
                type="number"
                min="1"
                required
                value={householdId}
                onChange={(e) => setHouseholdId(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="1"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Relationship */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.relationship}
              </label>
              <select
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
              >
                {relationshipOptions.map(r => (
                  <option key={r} value={r}>
                    {translateRole(r, language)}
                  </option>
                ))}
              </select>
            </div>

            {/* Occupation */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.occupation}
              </label>
              <select
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
              >
                {occupationOptions.map(occ => (
                  <option key={occ} value={occ}>
                    {translateOccupation(occ, language)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{t.save}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
