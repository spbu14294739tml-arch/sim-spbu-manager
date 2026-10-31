import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FileText, Barcode, AlertTriangle } from 'lucide-react';
import InputVoucher from './InputVoucher';
import ScanVoucher from './ScanVoucher';
import LaporanVoucherMacet from './LaporanVoucherMacet';

export default function VoucherBBM() {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') || 'input';
  const [activeTab, setActiveTab] = useState(tabParam);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-1">Manajemen Voucher BBM</h1>
        <p className="text-slate-500 text-sm">Kelola input, scan fisik, dan pantau voucher hangus di sini.</p>
      </div>

      <div className="flex flex-wrap gap-2 p-2 bg-slate-100 rounded-2xl w-fit mb-6 shadow-sm">
        <button onClick={() => setActiveTab('input')} className={`py-2 px-5 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${activeTab === 'input' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>
          <FileText size={16}/> Input Voucher
        </button>
        <button onClick={() => setActiveTab('scan')} className={`py-2 px-5 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${activeTab === 'scan' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}>
          <Barcode size={16}/> Scan Voucher
        </button>
        <button onClick={() => setActiveTab('macet')} className={`py-2 px-5 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${activeTab === 'macet' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500'}`}>
          <AlertTriangle size={16}/> Daftar Merah
        </button>
      </div>

      <div>
        {activeTab === 'input' && <InputVoucher />}
        {activeTab === 'scan' && <ScanVoucher />}
        {activeTab === 'macet' && <LaporanVoucherMacet />}
      </div>
    </div>
  );
}