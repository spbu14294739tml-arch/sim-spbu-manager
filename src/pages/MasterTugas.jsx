// src/pages/MasterTugas.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Calculator, ShoppingCart, ArrowRight } from 'lucide-react';

export default function MasterTugas() {
  const navigate = useNavigate();

  const kartuTugas = [
    {
      role: 'Manager Operasional',
      deskripsi: 'Pantau kinerja SPBU, kelola database karyawan, absensi, dan lihat laporan penjualan secara menyeluruh.',
      icon: Briefcase,
      warnaBg: 'bg-gradient-to-br from-blue-50 to-blue-100',
      warnaIcon: 'text-blue-600',
      warnaBorder: 'border-blue-200',
      warnaHover: 'hover:border-blue-400',
      link: '/', // Sesuaikan dengan route Manager
    },
    {
      role: 'Accounting',
      deskripsi: 'Verifikasi laporan kasir, cek setoran harian, dan pastikan tidak ada selisih antara uang fisik dan sistem.',
      icon: Calculator,
      warnaBg: 'bg-gradient-to-br from-emerald-50 to-emerald-100',
      warnaIcon: 'text-emerald-600',
      warnaBorder: 'border-emerald-200',
      warnaHover: 'hover:border-emerald-400',
      link: '/laporan-kasir',
    },
    {
      role: 'Kasir',
      deskripsi: 'Input penjualan BBM, NFR, Voucher, dan lakukan tutup kasir setiap akhir shift.',
      icon: ShoppingCart,
      warnaBg: 'bg-gradient-to-br from-orange-50 to-orange-100',
      warnaIcon: 'text-orange-600',
      warnaBorder: 'border-orange-200',
      warnaHover: 'hover:border-orange-400',
      link: '/kasir',
    },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto min-h-screen">
      
      {/* HEADER */}
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-extrabold text-slate-800">Master Tugas</h1>
        <p className="text-slate-500 mt-2 text-lg">Pilih peran Anda untuk mengakses menu yang sesuai.</p>
      </div>

      {/* GRID KARTU */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {kartuTugas.map((kartu, index) => {
          const Icon = kartu.icon;
          return (
            <div 
              key={index}
              onClick={() => navigate(kartu.link)}
              className={`cursor-pointer group relative bg-white p-8 rounded-3xl border-2 ${kartu.warnaBorder} ${kartu.warnaHover} shadow-sm hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden flex flex-col h-full`}
            >
              {/* Ornamen Latar Belakang */}
              <div className={`absolute top-0 right-0 w-32 h-32 ${kartu.warnaBg} rounded-bl-full -z-10 opacity-50 transition-transform duration-500 group-hover:scale-125`}></div>

              {/* Icon */}
              <div className={`w-16 h-16 ${kartu.warnaBg} ${kartu.warnaIcon} rounded-2xl flex items-center justify-center mb-6 shadow-inner`}>
                <Icon size={32} />
              </div>

              {/* Teks */}
              <h2 className="text-2xl font-bold text-slate-800 mb-3">{kartu.role}</h2>
              <p className="text-slate-500 text-sm leading-relaxed mb-8 flex-1">{kartu.deskripsi}</p>

              {/* Tombol Bawah */}
              <div className={`flex items-center justify-between text-sm font-bold ${kartu.warnaIcon} mt-auto`}>
                <span>Masuk ke Modul</span>
                <ArrowRight size={20} className="transform transition-transform duration-300 group-hover:translate-x-2" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}