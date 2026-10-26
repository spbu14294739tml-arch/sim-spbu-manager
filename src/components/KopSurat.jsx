// src/components/KopSurat.jsx
import React from 'react';

export default function KopSurat({ judul, periode }) {
  return (
    <div className="hidden print:block w-full mb-4">
      {/* Garis Atas Tipis */}
      <div className="border-t border-black mb-2"></div>
      
      {/* Konten Kop Surat - Ukuran Lebih Kecil & Rapi */}
      <div className="flex items-center justify-start gap-3 px-1">
        
        {/* Logo (Dikecilkan) */}
        <div className="shrink-0">
          <img src="/logo-tml.png" alt="Logo TML" className="w-14 h-14 object-contain" />
        </div>

        {/* Teks (Rata Kiri, Font Lebih Kecil) */}
        <div className="flex-1 text-left">
          <h1 className="text-base font-bold text-blue-900 uppercase leading-tight">
            SPBU 14.294.739 – PT. TATA MURDAYA LAKSANA
          </h1>
          <p className="text-[9px] text-black mt-0.5 leading-snug">
            Jalan Raja Haji Fisabilillah (Bundaran Tuah Madani) Batam Center<br />
            Kelurahan Teluk Tering Kecamatan Batam Kota - Kota Batam<br />
            Telp. +62 81372252825 - +62 81270800843 | E-mail: <span className="text-blue-700">spbu_ocarina@gmail.com</span>
          </p>
        </div>
      </div>

      {/* Garis Bawah Kop (Ganda, Lebih Tipis) */}
      <div className="border-b border-blue-900 mt-2 mb-0.5"></div>
      <div className="border-b border-blue-900 mb-3"></div>

      {/* Judul Laporan (Ukuran Sedang) */}
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold text-blue-900 uppercase">{judul}</h2>
        {periode && (
          <p className="text-[10px] text-slate-600 italic mt-0.5">Periode: {periode} - SIM SPBU 14.294.739</p>
        )}
      </div>
    </div>
  );
}