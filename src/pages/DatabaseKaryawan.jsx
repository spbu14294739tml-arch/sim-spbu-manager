// src/pages/DatabaseKaryawan.jsx
import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Filter, X, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function DatabaseKaryawan() {
  const [karyawanList, setKaryawanList] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // State untuk animasi loading
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Semua'); 
  
  // State untuk Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    nama: '',
    posisi: '',
    shift: 'Pagi',
    status: 'Aktif'
  });

  // FUNGSI 1: Mengambil data dari Supabase
  const fetchKaryawan = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('karyawan')
      .select('*')
      .order('id', { ascending: true }); // Urutkan berdasarkan ID

    if (error) {
      console.error('Error mengambil data:', error);
      alert('Gagal mengambil data dari database.');
    } else {
      setKaryawanList(data);
    }
    setIsLoading(false);
  };

  // Panggil fungsi fetch saat halaman pertama kali dibuka
  useEffect(() => {
    fetchKaryawan();
  }, []);

  // FUNGSI 2: Simpan Karyawan Baru ke Supabase
  const handleSimpan = async (e) => {
    e.preventDefault();
    
    // Cari ID tertinggi untuk ID baru (karena di Supabase kita tidak pakai auto-increment)
    const newId = karyawanList.length > 0 ? Math.max(...karyawanList.map(k => k.id)) + 1 : 1;
    
    const newKaryawan = {
      id: newId,
      nama: formData.nama,
      posisi: formData.posisi,
      shift: formData.shift,
      status: formData.status
    };

    // Kirim ke Supabase
    const { error } = await supabase.from('karyawan').insert([newKaryawan]);

    if (error) {
      console.error('Error menyimpan data:', error);
      alert('Gagal menyimpan data ke database.');
    } else {
      // Jika sukses, tutup modal, reset form, dan ambil data terbaru
      setFormData({ nama: '', posisi: '', shift: 'Pagi', status: 'Aktif' });
      setIsModalOpen(false);
      fetchKaryawan(); // Refresh tabel
    }
  };

  // FUNGSI 3: Hapus Karyawan dari Supabase
  const handleHapus = async (id) => {
    const konfirmasi = window.confirm('Yakin ingin menghapus karyawan ini dari database?');
    if (!konfirmasi) return;

    const { error } = await supabase.from('karyawan').delete().eq('id', id);

    if (error) {
      console.error('Error menghapus data:', error);
      alert('Gagal menghapus data.');
    } else {
      fetchKaryawan(); // Refresh tabel
    }
  };

  // Fungsi Pencarian & Filter
  const filteredKaryawan = karyawanList.filter((karyawan) => {
    const matchSearch = karyawan.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        karyawan.posisi.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'Semua' || karyawan.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // Fungsi Warna Badge
  const getStatusBadge = (status) => {
    if (status === 'Aktif') return 'bg-green-100 text-green-700 border-green-200';
    if (status === 'Cuti') return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-red-100 text-red-700 border-red-200'; 
  };

  return (
    <div className="p-8 max-w-7xl mx-auto relative">
      {/* Header Halaman */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Database Karyawan</h1>
          <p className="text-slate-500 mt-1">Kelola data seluruh staf SPBU 14.294.739</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus size={20} />
          Tambah Karyawan
        </button>
      </div>

      {/* Panel Pencarian & Filter */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Cari nama atau posisi..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {/* Dropdown Filter Status */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter size={18} className="text-slate-500" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full md:w-auto px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium text-slate-600"
          >
            <option value="Semua">Semua Status</option>
            <option value="Aktif">Aktif</option>
            <option value="Tidak Aktif">Tidak Aktif</option>
            <option value="Cuti">Cuti</option>
          </select>
        </div>
      </div>

      {/* Tabel Data */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm">
                <th className="py-4 px-6 font-semibold">No</th>
                <th className="py-4 px-6 font-semibold">Nama Karyawan</th>
                <th className="py-4 px-6 font-semibold">Posisi</th>
                <th className="py-4 px-6 font-semibold">Shift</th>
                <th className="py-4 px-6 font-semibold">Status</th>
                <th className="py-4 px-6 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    <Loader2 className="animate-spin mx-auto mb-2 text-blue-500" size={24} />
                    Mengambil data dari Cloud...
                  </td>
                </tr>
              ) : filteredKaryawan.length > 0 ? (
                filteredKaryawan.map((karyawan, index) => (
                  <tr key={karyawan.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 text-slate-500">{index + 1}</td>
                    <td className="py-4 px-6">
                      <div className="font-medium text-slate-800">{karyawan.nama}</div>
                    </td>
                    <td className="py-4 px-6 text-slate-600">{karyawan.posisi}</td>
                    <td className="py-4 px-6 text-slate-600">
                      <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-xs font-medium">
                        {karyawan.shift}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(karyawan.status)}`}>
                        {karyawan.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => handleHapus(karyawan.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                          title="Hapus"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500">
                    Tidak ada data karyawan yang cocok dengan pencarian atau filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL TAMBAH KARYAWAN */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">Tambah Karyawan Baru</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSimpan} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={formData.nama}
                  onChange={(e) => setFormData({...formData, nama: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Masukkan nama..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Posisi</label>
                <input
                  type="text"
                  required
                  value={formData.posisi}
                  onChange={(e) => setFormData({...formData, posisi: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: Kasir, Security..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Shift</label>
                  <select
                    value={formData.shift}
                    onChange={(e) => setFormData({...formData, shift: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="Pagi">Pagi</option>
                    <option value="Siang">Siang</option>
                    <option value="Malam">Malam</option>
                    <option value="-">-</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Cuti">Cuti</option>
                    <option value="Tidak Aktif">Tidak Aktif</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors shadow-sm"
                >
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}