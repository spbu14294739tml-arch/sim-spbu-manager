import React, { useState } from 'react';
import { BookOpen, Printer } from 'lucide-react';
import TabelJurnal from './TabelJurnal';
import FormBBM from './FormBBM';
import FormLPG from './FormLPG';
import FormOli from './FormOli';
import FormLainnya from './FormLainnya';
import FormKoreksi from './FormKoreksi';

export default function JurnalKasir() {
  const [activeTab, setActiveTab] = useState('BBM');
  const [isSaving, setIsSaving] = useState(false);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Jurnal Transaksi Kasir</h1>
          <p className="text-slate-500 text-sm">Pilih kategori transaksi di bawah ini.</p>
        </div>
        <button onClick={() => window.print()} className="bg-slate-800 text-white px-4 py-2 rounded-xl flex items-center gap-2">
          <Printer size={18} /> Cetak
        </button>
      </div>

      {/* Navigasi Tab */}
      <div className="flex flex-wrap gap-2 mb-6 p-2 bg-slate-100 rounded-2xl w-fit">
        {['BBM', 'LPG', 'Oli', 'Lainnya', 'Koreksi', 'JURNAL'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab.toUpperCase() === 'JURNAL' ? 'JURNAL' : tab.toUpperCase())}
            className={`py-2 px-5 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${
              activeTab === tab.toUpperCase() ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'
            }`}
          >
            {tab === 'JURNAL' && <BookOpen size={16} />}
            {tab === 'JURNAL' ? 'Buku Jurnal' : tab}
          </button>
        ))}
      </div>

      {/* Render Komponen Berdasarkan Tab */}
      <div className="animate-in fade-in duration-300">
        {activeTab === 'BBM' && <FormBBM isSaving={isSaving} setIsSaving={setIsSaving} />}
        {activeTab === 'LPG' && <FormLPG isSaving={isSaving} setIsSaving={setIsSaving} />}
        {activeTab === 'OLI' && <FormOli isSaving={isSaving} setIsSaving={setIsSaving} />}
        {activeTab === 'LAINNYA' && <FormLainnya isSaving={isSaving} setIsSaving={setIsSaving} />}
        {activeTab === 'KOREKSI' && <FormKoreksi isSaving={isSaving} setIsSaving={setIsSaving} />}
        {activeTab === 'JURNAL' && <TabelJurnal isSaving={isSaving} setIsSaving={setIsSaving} />}
      </div>
    </div>
  );
}