import React, { useState } from 'react';
import TabProfil from './TabProfil';
import TabShift from './TabShift';
import TabJabatan from './TabJabatan';
import TabKodeAkun from './TabKodeAkun';
import TabProdukNFR from './TabProdukNFR';
import TabHargaBBM from './TabHargaBBM';
import TabStokTangki from './TabStokTangki';
import { Briefcase, Hash, ShoppingBag, Fuel, Droplet } from 'lucide-react';

export default function PengaturanSistem() {
  const [activeTab, setActiveTab] = useState('profil');

  return (
    <div className="p-8 max-w-5xl mx-auto print:hidden">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Pengaturan Sistem</h1>
        <p className="text-slate-500 mt-1">Kelola profil SPBU, shift, jabatan, kode akun, produk, dan stok tangki.</p>
      </div>

      {/* TAB NAVIGATION */}
      <div className="flex flex-wrap gap-2 mb-6 p-2 bg-slate-100 rounded-2xl w-fit">
        <button type="button" onClick={() => setActiveTab('profil')} className={`py-2 px-4 rounded-xl font-medium text-sm transition-all ${activeTab === 'profil' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}>Profil SPBU</button>
        <button type="button" onClick={() => setActiveTab('shift')} className={`py-2 px-4 rounded-xl font-medium text-sm transition-all ${activeTab === 'shift' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}>Shift</button>
        <button type="button" onClick={() => setActiveTab('jabatan')} className={`py-2 px-4 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${activeTab === 'jabatan' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}><Briefcase size={16}/> Jabatan</button>
        <button type="button" onClick={() => setActiveTab('kode_akun')} className={`py-2 px-4 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${activeTab === 'kode_akun' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}><Hash size={16}/> Kode Akun</button>
        <button type="button" onClick={() => setActiveTab('produk')} className={`py-2 px-4 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${activeTab === 'produk' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}><ShoppingBag size={16}/> Produk NFR</button>
        <button type="button" onClick={() => setActiveTab('harga_bbm')} className={`py-2 px-4 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${activeTab === 'harga_bbm' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}><Fuel size={16}/> Harga BBM</button>
        <button type="button" onClick={() => setActiveTab('stok_tangki')} className={`py-2 px-4 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${activeTab === 'stok_tangki' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}><Droplet size={16}/> Stok Tangki</button>
      </div>

      {/* KONTEN TAB */}
      <div className="animate-in fade-in duration-300">
        {activeTab === 'profil' && <TabProfil />}
        {activeTab === 'shift' && <TabShift />}
        {activeTab === 'jabatan' && <TabJabatan />}
        {activeTab === 'kode_akun' && <TabKodeAkun />}
        {activeTab === 'produk' && <TabProdukNFR />}
        {activeTab === 'harga_bbm' && <TabHargaBBM />}
        {activeTab === 'stok_tangki' && <TabStokTangki />}
      </div>
    </div>
  );
}