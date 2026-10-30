// src/components/jurnal/TabNavigator.jsx
import React from 'react';
import { Fuel, Ticket, Droplet, ShoppingBag, FileText, RotateCcw } from 'lucide-react';

/**
 * Deretan tombol tab kategori input (BBM, Voucher, LPG, Oli, Lainnya, Koreksi).
 * Murni presentational — semua state dikelola parent.
 *
 * @param {string} activeTab - tab yang sedang aktif
 * @param {function} onChange - callback saat tab dipilih (terima nama tab)
 */
export default function TabNavigator({ activeTab, onChange }) {
  const tabs = [
    { key: 'BBM',      label: 'BBM',      Icon: Fuel,        color: 'text-blue-600' },
    { key: 'VOUCHER',  label: 'Voucher',  Icon: Ticket,      color: 'text-purple-600' },
    { key: 'LPG',      label: 'LPG',      Icon: Droplet,     color: 'text-orange-600' },
    { key: 'OLI',      label: 'Oli',      Icon: ShoppingBag, color: 'text-emerald-600' },
  ];

  return (
    <div className="flex flex-wrap gap-1 mb-4 p-1 bg-slate-100 rounded-xl">
      {tabs.map(({ key, label, Icon, color }) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={`flex-1 py-1.5 px-2 text-[10px] font-bold rounded-lg transition-all ${
            activeTab === key ? `bg-white ${color} shadow-sm` : 'text-slate-500'
          }`}
        >
          <Icon size={12} className="inline mr-1" /> {label}
        </button>
      ))}

      {/* Tombol Lainnya (full width) */}
      <button
        type="button"
        onClick={() => onChange('LAINNYA')}
        className={`w-full mt-1 py-1.5 px-2 text-[10px] font-bold rounded-lg transition-all flex justify-center items-center ${
          activeTab === 'LAINNYA' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:bg-slate-200'
        }`}
      >
        <FileText size={12} className="inline mr-1" /> Lainnya
      </button>

      {/* Tombol Koreksi (full width, amber) */}
      <button
        type="button"
        onClick={() => onChange('KOREKSI')}
        className={`w-full mt-1 py-1.5 px-2 text-[10px] font-bold rounded-lg transition-all flex justify-center items-center ${
          activeTab === 'KOREKSI' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-500 hover:bg-slate-200'
        }`}
      >
        <RotateCcw size={12} className="inline mr-1" /> Koreksi (Tanggal Lampau)
      </button>
    </div>
  );
}