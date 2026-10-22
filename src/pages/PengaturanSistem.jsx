// src/pages/PengaturanSistem.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Loader2, Save, Plus, Trash2 } from 'lucide-react';

export default function PengaturanSistem() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notif, setNotif] = useState('');

  // State Profil
  const [profil, setProfil] = useState({
    nama_spbu: '',
    nomor_izin: '',
    alamat: '',
    telepon: '',
    email: ''
  });

  // State Shift
  const [daftarShift, setDaftarShift] = useState([]);
  const [shiftBaru, setShiftBaru] = useState({ nama_shift: '', jam_kerja: '' });

  // 1. Ambil Data dari Supabase saat halaman dimuat
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      // Ambil Profil (hanya 1 baris data)
      const { data: dataProfil, error: errProfil } = await supabase
        .from('profil_spbu')
        .select('*')
        .eq('id', 1)
        .single();
      
      if (dataProfil) setProfil(dataProfil);

      // Ambil Shift
      const { data: dataShift, error: errShift } = await supabase
        .from('pengaturan_shift')
        .select('*')
        .order('id', { ascending: true });

      if (dataShift) setDaftarShift(dataShift);

      setIsLoading(false);
    };

    fetchData();
  }, []);

  // 2. Simpan Profil ke Supabase
  const handleSimpanProfil = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setNotif('');

    const { error } = await supabase
      .from('profil_spbu')
      .update({
        nama_spbu: profil.nama_spbu,
        nomor_izin: profil.nomor_izin,
        alamat: profil.alamat,
        telepon: profil.telepon,
        email: profil.email
      })
      .eq('id', 1);

    setIsSaving(false);

    if (error) {
      alert('Gagal menyimpan profil: ' + error.message);
    } else {
      setNotif('Profil SPBU berhasil disimpan ke Cloud!');
      setTimeout(() => setNotif(''), 3000);
    }
  };

  // 3. Tambah Shift ke Supabase
  const handleTambahShift = async () => {
    if (!shiftBaru.nama_shift || !shiftBaru.jam_kerja) {
      alert('Nama Shift dan Jam Kerja harus diisi!');
      return;
    }

    const { error } = await supabase
      .from('pengaturan_shift')
      .insert([shiftBaru]);

    if (error) {
      alert('Gagal menambah shift: ' + error.message);
    } else {
      // Ambil ulang data shift terbaru
      const { data } = await supabase.from('pengaturan_shift').select('*').order('id', { ascending: true });
      setDaftarShift(data);
      setShiftBaru({ nama_shift: '', jam_kerja: '' }); // Reset form
    }
  };

  // 4. Hapus Shift dari Supabase
  const handleHapusShift = async (id) => {
    if (!window.confirm('Hapus shift ini dari database?')) return;

    const { error } = await supabase
      .from('pengaturan_shift')
      .delete()
      .eq('id', id);

    if (error) {
      alert('Gagal menghapus shift: ' + error.message);
    } else {
      setDaftarShift(daftarShift.filter(s => s.id !== id));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Pengaturan Sistem</h1>
        <p className="text-slate-500 mt-1">Kelola profil SPBU dan preferensi sistem aplikasi.</p>
      </div>

      {notif && (
        <div className="mb-6 p-4 bg-green-100 border-l-4 border-green-500 text-green-700 rounded shadow-sm">
          {notif}
        </div>
      )}

      <div className="space-y-8">
        {/* KARTU 1: PROFIL SPBU */}
        <form onSubmit={handleSimpanProfil} className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-700">Profil SPBU</h2>
            <button 
              type="submit" 
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              Simpan Profil
            </button>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nama SPBU</label>
              <input type="text" value={profil.nama_spbu} onChange={(e) => setProfil({ ...profil, nama_spbu: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Badan Hukum / Izin</label>
              <input type="text" value={profil.nomor_izin} onChange={(e) => setProfil({ ...profil, nomor_izin: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Alamat Lengkap</label>
              <textarea value={profil.alamat} onChange={(e) => setProfil({ ...profil, alamat: e.target.value })} rows="3" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"></textarea>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nomor Telepon</label>
              <input type="text" value={profil.telepon} onChange={(e) => setProfil({ ...profil, telepon: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input type="email" value={profil.email} onChange={(e) => setProfil({ ...profil, email: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
        </form>

        {/* KARTU 2: PENGATURAN SHIFT */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-700">Pengaturan Shift Operasional</h2>
          </div>
          <div className="p-6">
            {/* List Shift */}
            <div className="space-y-3 mb-6">
              {daftarShift.map((shift) => (
                <div key={shift.id} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div className="flex-1">
                    <span className="font-semibold text-gray-700">{shift.nama_shift}:</span>{' '}
                    <span className="text-gray-600">{shift.jam_kerja}</span>
                  </div>
                  <button onClick={() => handleHapusShift(shift.id)} className="px-3 py-1 bg-red-100 text-red-600 text-sm font-medium rounded hover:bg-red-200 transition">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            {/* Form Tambah Shift */}
            <div className="flex flex-col sm:flex-row gap-3 items-end bg-blue-50 p-4 rounded-lg border border-blue-100">
              <div className="flex-1 w-full">
                <label className="block text-xs font-medium text-gray-600 mb-1">Nama Shift</label>
                <input type="text" value={shiftBaru.nama_shift} onChange={(e) => setShiftBaru({ ...shiftBaru, nama_shift: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded outline-none focus:border-blue-500" placeholder="Misal: Shift 4" />
              </div>
              <div className="flex-1 w-full">
                <label className="block text-xs font-medium text-gray-600 mb-1">Jam Kerja</label>
                <input type="text" value={shiftBaru.jam_kerja} onChange={(e) => setShiftBaru({ ...shiftBaru, jam_kerja: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded outline-none focus:border-blue-500" placeholder="Misal: 00:00 - 06:00" />
              </div>
              <button onClick={handleTambahShift} className="px-4 py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 transition w-full sm:w-auto flex items-center justify-center gap-2">
                <Plus size={18} /> Tambah
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}