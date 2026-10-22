import { useState } from 'react';

export default function PengaturanSistem() {
  // State untuk profil SPBU (Sesuai data Bapak)
  const [profil, setProfil] = useState({
    namaSpbu: 'SPBU 14.294739',
    nomorIzin: 'PT. TATA MURDAYA LAKSANA',
    alamat: 'Jalan Raja Haji Fiusabilillah (Bundaran Tuah Madani) Batam Center, Kelurahan Teluk Tering, Kecamatan Batam Kota, Kota Batam, Kepulauan Riau',
    telepon: '081372252825',
    email: 'spbuokarina@gmail.com',
  });

  // State untuk pengaturan sistem (Sesuai data Bapak)
  const [sistem, setSistem] = useState({
    mataUang: 'IDR',
    shiftPagi: '08:00 - 16:00',
    shiftSiang: '16:00 - 23:00',
    rollingShift: '1 Bulan Sekali',
  });

  // State untuk notifikasi (simulasi)
  const [notif, setNotif] = useState('');

  // Fungsi handle simpan (sementara hanya memunculkan notif)
  const handleSimpan = (e) => {
    e.preventDefault();
    setNotif('Pengaturan berhasil disimpan (Mode Simulasi)');
    setTimeout(() => setNotif(''), 3000);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header Halaman */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Pengaturan Sistem</h1>
        <p className="text-gray-500 mt-1">Kelola profil SPBU dan preferensi sistem aplikasi.</p>
      </div>

      {/* Notifikasi */}
      {notif && (
        <div className="mb-6 p-4 bg-green-100 border-l-4 border-green-500 text-green-700 rounded shadow-sm">
          {notif}
        </div>
      )}

      <form onSubmit={handleSimpan} className="space-y-8">
        
        {/* KARTU 1: PROFIL SPBU */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-700">Profil SPBU</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama SPBU</label>
              <input
                type="text"
                value={profil.namaSpbu}
                onChange={(e) => setProfil({ ...profil, namaSpbu: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                placeholder="Masukkan nama SPBU"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Badan Hukum / Izin</label>
              <input
                type="text"
                value={profil.nomorIzin}
                onChange={(e) => setProfil({ ...profil, nomorIzin: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                placeholder="Masukkan nomor izin"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Lengkap</label>
              <textarea
                value={profil.alamat}
                onChange={(e) => setProfil({ ...profil, alamat: e.target.value })}
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-none"
                placeholder="Masukkan alamat lengkap"
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Telepon</label>
              <input
                type="text"
                value={profil.telepon}
                onChange={(e) => setProfil({ ...profil, telepon: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                placeholder="Masukkan nomor telepon"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={profil.email}
                onChange={(e) => setProfil({ ...profil, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                placeholder="Masukkan email"
              />
            </div>

          </div>
        </div>

        {/* KARTU 2: PREFERENSI SISTEM & SHIFT */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-700">Preferensi Sistem & Shift</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mata Uang</label>
              <select
                value={sistem.mataUang}
                onChange={(e) => setSistem({ ...sistem, mataUang: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
              >
                <option value="IDR">IDR (Rupiah)</option>
                <option value="USD">USD (Dollar)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rolling Shift</label>
              <select
                value={sistem.rollingShift}
                onChange={(e) => setSistem({ ...sistem, rollingShift: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
              >
                <option value="1 Bulan Sekali">1 Bulan Sekali</option>
                <option value="2 Minggu Sekali">2 Minggu Sekali</option>
                <option value="1 Minggu Sekali">1 Minggu Sekali</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shift Pagi</label>
              <input
                type="text"
                value={sistem.shiftPagi}
                onChange={(e) => setSistem({ ...sistem, shiftPagi: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-gray-50"
                readOnly
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shift Siang</label>
              <input
                type="text"
                value={sistem.shiftSiang}
                onChange={(e) => setSistem({ ...sistem, shiftSiang: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-gray-50"
                readOnly
              />
            </div>

          </div>
        </div>

        {/* KARTU 3: MANAJEMEN AKSES (KHUSUS MANAGER) */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-700">Manajemen Akses</h2>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-lg">
              <div>
                <p className="font-medium text-blue-900">Hak Akses Manager Operasional</p>
                <p className="text-sm text-blue-700 mt-1">Bapak Dadang MA (MGR.SPBU-001)</p>
              </div>
              <span className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
                Super Admin
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              *Manajemen akses terintegrasi dengan Database Karyawan. Hanya Manager Operasional yang dapat mengubah pengaturan ini.
            </p>
          </div>
        </div>

        {/* TOMBOL AKSI */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => {
              // Reset ke nilai awal (simulasi)
              setProfil({
                namaSpbu: 'SPBU 14.294739',
                nomorIzin: 'PT. TATA MURDAYA LAKSANA',
                alamat: 'Jalan Raja Haji Fiusabilillah (Bundaran Tuah Madani) Batam Center, Kelurahan Teluk Tering, Kecamatan Batam Kota, Kota Batam, Kepulauan Riau',
                telepon: '081372252825',
                email: 'spbuokarina@gmail.com',
              });
              setSistem({
                mataUang: 'IDR',
                shiftPagi: '08:00 - 16:00',
                shiftSiang: '16:00 - 23:00',
                rollingShift: '1 Bulan Sekali',
              });
              setNotif('');
            }}
            className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition"
          >
            Reset
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 rounded-lg text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition shadow-sm"
          >
            Simpan Pengaturan
          </button>
        </div>

      </form>
    </div>
  );
}