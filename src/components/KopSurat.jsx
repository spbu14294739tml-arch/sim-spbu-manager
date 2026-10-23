// src/components/KopSurat.jsx
import React from 'react';

export default function KopSurat({ judul, periode }) {
  return (
    <div className="hidden print:block w-full mb-6">
      {/* Garis Atas */}
      <div className="border-t-4 border-black mb-4"></div>
      
      {/* Konten Kop Surat */}
      <div className="flex items-center justify-between">
        {/* Kiri: Logo & Teks */}
        <div className="flex items-center gap-4">
          {/* GANTI '/logo-tml.png' jika nama file Bapak berbeda */}
          <img 
            src="/logo-tml.png" 
            alt="Logo TML" 
            className="w-24 h-24 object-contain" 
          />
          <div>
            <h1 className="text-2xl font-bold text-blue-900 uppercase leading-tight">
              SPBU 14.294.739 – PT. Tata Murdaya Laksana
            </h1>
            <p className="text-sm text-black mt-1">
              Jalan Raja Haji Fisabilillah (Bundaran Tuah Madani) Batam Center<br />
              Kelurahan Teluk Tering Kecamatan Batam Kota - Kota Batam<br />
              Telp. +62 81372252825 - +62 81270800843<br />
              E-mail: <span className="text-blue-700 underline">spbu_ocarina@gmail.com</span>
            </p>
          </div>
        </div>

        {/* Kanan: Info Dokumen */}
        <div className="text-right">
          <p className="text-xs font-semibold text-slate-800 uppercase">Dokumen Internal</p>
          <p className="text-xs text-slate-600 mt-1">No. Ref: DOC/{judul.substring(0,3).toUpperCase()}/{new Date().getFullYear()}</p>
        </div>
      </div>

      {/* Garis Bawah Kop */}
      <div className="border-b-4 border-blue-900 mt-4 mb-6"></div>

      {/* Judul Laporan */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-blue-900 uppercase">{judul}</h2>
        {periode && (
          <p className="text-sm text-slate-600 italic mt-1">Periode: {periode} - SIM SPBU 14.294.739</p>
        )}
      </div>
    </div>
  );
}