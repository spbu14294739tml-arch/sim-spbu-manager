// src/components/KopSurat.jsx
import React from 'react';

export default function KopSurat({ judul, periode }) {
  return (
    <div className="hidden print:block w-full mb-2">
      {/* Garis Atas Sangat Tipis */}
      <div className="border-t border-black mb-1"></div>
      
      {/* Konten Kop Surat Utama (Logo & Alamat) */}
      <div className="flex items-center justify-start gap-2 px-1">
        {/* Logo */}
        <div className="shrink-0">
          <img src="/logo-tml.png" alt="Logo TML" className="w-12 h-12 object-contain" />
        </div>

        {/* Teks Alamat (Tetap Kecil) */}
        <div className="flex-1 text-left">
          <h1 className="text-[10px] font-bold text-blue-900 uppercase leading-tight">
            SPBU 14.294.739 – PT. TATA MURDAYA LAKSANA
          </h1>
          <p className="text-[6px] text-black mt-0.5 leading-tight">
            Jalan Raja Haji Fisabilillah (Bundaran Tuah Madani) Batam Center<br />
            Kelurahan Teluk Tering Kecamatan Batam Kota - Kota Batam<br />
            Telp. +62 81372252825 - +62 81270800843 | E-mail: <span className="text-blue-700">spbu_ocarina@gmail.com</span>
          </p>
        </div>
      </div>

      {/* Garis Bawah Kop */}
      <div className="border-b border-blue-900 mt-1 mb-0.5"></div>
      <div className="border-b border-blue-900 mb-2"></div>

      {/* Judul Laporan & Periode (Dibesarkan 100%) */}
      <div className="text-center mb-3">
        <h2 className="text-xl font-black text-blue-900 uppercase tracking-wide">{judul}</h2>
        {periode && (
          <p className="text-xs font-semibold text-slate-700 mt-1">Periode: {periode}</p>
        )}
      </div>
    </div>
  );
}