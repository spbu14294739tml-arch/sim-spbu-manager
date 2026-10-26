// src/components/KopSurat.jsx
import React from 'react';

export default function KopSurat({ judul, periode }) {
  return (
    <div className="hidden print:block w-full mb-6">
      {/* Garis Atas Tipis */}
      <div className="border-t-2 border-black mb-3"></div>
      
      {/* Konten Kop Surat */}
      <div className="flex items-center justify-between gap-6 px-2">
        {/* Kiri: Logo & Teks */}
        <div className="flex items-center gap-4">
          {/* Logo TML (Ukuran disesuaikan) */}
          <img 
            src="/logo-tml.png" 
            alt="Logo TML" 
            className="w-20 h-20 object-contain" 
          />
          <div>
            <h1 className="text-xl font-bold text-blue-900 uppercase leading-tight">
              SPBU 14.294.739 – PT. TATA MURDAYA LAKSANA
            </h1>
            <p className="text-[11px] text-black mt-1 leading-snug">
              Jalan Raja Haji Fisabilillah (Bundaran Tuah Madani) Batam Center<br />
              Kelurahan Teluk Tering Kecamatan Batam Kota - Kota Batam<br />
              Telp. +62 81372252825 - +62 81270800843<br />
              E-mail: <span className="text-blue-700 underline">spbu_ocarina@gmail.com</span>
            </p>
          </div>
        </div>

        {/* Kanan: Info Dokumen */}
        <div className="text-right">
          <p className="text-[10px] font-bold text-slate-800 uppercase">Dokumen Internal</p>
          <p className="text-[10px] text-slate-600 mt-1">No. Ref: DOC/{judul.substring(0,3).toUpperCase()}/{new Date().getFullYear()}</p>
        </div>
      </div>

      {/* Garis Bawah Kop (Ganda) */}
      <div className="border-b-2 border-blue-900 mt-3 mb-1"></div>
      <div className="border-b border-blue-900 mb-4"></div>

      {/* Judul Laporan */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-blue-900 uppercase">{judul}</h2>
        {periode && (
          <p className="text-xs text-slate-600 italic mt-1">Periode: {periode} - SIM SPBU 14.294.739</p>
        )}
      </div>
    </div>
  );
}