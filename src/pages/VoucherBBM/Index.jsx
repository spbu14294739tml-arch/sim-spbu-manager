// src/pages/VoucherBBM/index.jsx
import React, { useState } from 'react';
import { FileText, Barcode, AlertTriangle } from 'lucide-react';
import InputVoucher from './InputVoucher';
import ScanVoucher from './ScanVoucher';
import LaporanVoucherMacet from './LaporanVoucherMacet';

export default function VoucherBBM() {
  const [activeTab, setActiveTab] = useState('input'); // 'input', 'scan', 'macet'

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      
      {/* HEADER & TAB NAVIGATION */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-4">Manajemen Voucher BBM</h1>
        
        <div className="flex flex-wrap gap-2 p-2 bg-slate-100 rounded-2xl w-fit">
          <button 
            onClick={() => setActiveTab('input')} 
            className={`py-2 px-5 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${activeTab === 'input' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'}`}
          >
            <FileText size={16}/> Input Voucher
          </button>
          
          <button 
            onClick={() => setActiveTab('scan')} 
            className={`py-2 px-5 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${activeTab === 'scan' ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'}`}
          >
            <Barcode size={16}/> Scan Voucher
          </button>
          
          <button 
            onClick={() => setActiveTab('macet')} 
            className={`py-2 px-5 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${activeTab === 'macet' ? 'bg-white text-red-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'}`}
          >
            <AlertTriangle size={16}/> Daftar Merah (Expired)
          </button>
        </div>
      </div>

      {/* KONTEN TAB */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
        {activeTab === 'input' && <InputVoucher />}
        {activeTab === 'scan' && <ScanVoucher />}
        {activeTab === 'macet' && <LaporanVoucherMacet />}
      </div>

    </div>
  );
}