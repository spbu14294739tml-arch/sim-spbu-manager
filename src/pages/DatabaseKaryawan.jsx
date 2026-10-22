// src/pages/DatabaseKaryawan.jsx
import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Filter, X, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

// KOMPONEN INPUT DIPINDAH KE LUAR AGAR TIDAK FOKUS HILANG SAAT MENGETIK
const InputField = ({ label, name, type = "text", placeholder = "", formData, setFormData }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
    <input
      type={type}
      value={formData[name] || ''}
      onChange={(e) => setFormData({...formData, [name]: e.target.value})}
      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
      placeholder={placeholder}
    />
  </div>
);

export default function DatabaseKaryawan() {
  const [karyawanList, setKaryawanList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Semua'); 
  
  // State untuk Modal & Tab
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(1);

  // State Form Lengkap (Sesuai Excel)
  const [formData, setFormData] = useState({
    nama: '', nomor_karyawan: '', posisi: '', shift: 'Pagi', status: 'Aktif',
    no_hp: '', email: '', tanggal_lahir: '', jenis_kelamin: '', 
    tanggal_masuk: '', tanggal_keluar: '', status_pernikahan: '', alamat: '',
    gaji_pokok: '', nama_rekening: '', nomor_rekening: '', npwp: '',
    no_ktp: '', no_kk: '', no_bpjs_kesehatan: '', no_bpjs_ketenagakerjaan: '',
    link_pas_foto: '', link_e_ktp: '', link_kk: '', link_kontrak: '', link_catatan: ''
  });

  // FUNGSI 1: Ambil Data
  const fetchKaryawan = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('karyawan').select('*').order('id', { ascending: true });
    if (error) {
      console.error(error);
      alert('Gagal mengambil data.');
    } else {
      setKaryawanList(data);
    }
    setIsLoading(false);
  };

  useEffect(() => { fetchKaryawan(); }, []);

  // FUNGSI 2: Simpan Karyawan (Insert ke Supabase)
  const handleSimpan = async (e) => {
    e.preventDefault();
    
    // Konversi tipe data yang kosong menjadi null agar tidak error di Supabase
    const dataToInsert = {
      ...formData,
      tanggal_lahir: formData.tanggal_lahir || null,
      tanggal_masuk: formData.tanggal_masuk || null,
      tanggal_keluar: formData.tanggal_keluar || null,
      gaji_pokok: formData.gaji_pokok ? parseFloat(formData.gaji_pokok) : null
    };

    const { error } = await supabase.from('karyawan').insert([dataToInsert]);

    if (error) {
      console.error(error);
      alert('Gagal menyimpan data: ' + error.message);
    } else {
      // Reset Form & Tutup Modal
      setFormData({
        nama: '', nomor_karyawan: '', posisi: '', shift: 'Pagi', status: 'Aktif',
        no_hp: '', email: '', tanggal_lahir: '', jenis_kelamin: '', 
        tanggal_masuk: '', tanggal_keluar: '', status_pernikahan: '', alamat: '',
        gaji_pokok: '', nama_rekening: '', nomor_rekening: '', npwp: '',
        no_ktp: '', no_kk: '', no_bpjs_kesehatan: '', no_bpjs_ketenagakerjaan: '',
        link_pas_foto: '', link_e_ktp: '', link_kk: '', link_kontrak: '', link_catatan: ''
      });
      setActiveTab(1);
      setIsModalOpen(false);
      fetchKaryawan();
    }
  };

  // FUNGSI 3: Hapus Karyawan
  const handleHapus = async (id) => {
    if (!window.confirm('Yakin ingin menghapus karyawan ini?')) return;
    const { error } = await supabase.from('karyawan').delete().eq('id', id);
    if (error) alert('Gagal menghapus.');
    else fetchKaryawan();
  };

  // Filter Pencarian
  const filteredKaryawan = karyawanList.filter((k) => {
    const matchSearch = k.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        (k.posisi && k.posisi.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchStatus = filterStatus === 'Semua' || k.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const getStatusBadge = (status) => {
    if (status === 'Aktif') return 'bg-green-100 text-green-700 border-green-200';
    if (status === 'Cuti') return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-red-100 text-red-700 border-red-200'; 
  };

  return (
    <div className="p-8 max-w-7xl mx-auto relative">
      {/* Header & Tombol Tambah */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Database Karyawan</h1>
          <p className="text-slate-500 mt-1">Kelola data seluruh staf SPBU 14.294.739</p>
        </div>
        <button onClick={() => { setIsModalOpen(true); setActiveTab(1); }} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm">
          <Plus size={20} /> Tambah Karyawan
        </button>
      </div>

      {/* Panel Pencarian & Filter */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search size={18} className="text-slate-400" /></div>
          <input type="text" placeholder="Cari nama atau posisi..." className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter size={18} className="text-slate-500" />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full md:w-auto px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium text-slate-600">
            <option value="Semua">Semua Status</option>
            <option value="Aktif">Aktif</option>
            <option value="Tidak Aktif">Tidak Aktif</option>
            <option value="Cuti">Cuti</option>
          </select>
        </div>
      </div>

      {/* Tabel Data (Tampilan Ringkas) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm">
                <th className="py-4 px-6 font-semibold">No</th>
                <th className="py-4 px-6 font-semibold">Nama & No. Karyawan</th>
                <th className="py-4 px-6 font-semibold">Posisi</th>
                <th className="py-4 px-6 font-semibold">Shift</th>
                <th className="py-4 px-6 font-semibold">Status</th>
                <th className="py-4 px-6 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan="6" className="py-12 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" size={24} /></td></tr>
              ) : filteredKaryawan.length > 0 ? (
                filteredKaryawan.map((karyawan, index) => (
                  <tr key={karyawan.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 text-slate-500">{index + 1}</td>
                    <td className="py-4 px-6">
                      <div className="font-medium text-slate-800">{karyawan.nama}</div>
                      <div className="text-xs text-slate-500">{karyawan.nomor_karyawan || '-'}</div>
                    </td>
                    <td className="py-4 px-6 text-slate-600">{karyawan.posisi}</td>
                    <td className="py-4 px-6"><span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-xs font-medium">{karyawan.shift}</span></td>
                    <td className="py-4 px-6"><span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(karyawan.status)}`}>{karyawan.status}</span></td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit size={18} /></button>
                        <button onClick={() => handleHapus(karyawan.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="6" className="py-8 text-center text-slate-500">Tidak ada data.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL TAMBAH KARYAWAN (3 TAB) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header Modal */}
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">Tambah Karyawan Baru</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500"><X size={20} /></button>
            </div>

            {/* TABS NAVIGATION */}
            <div className="flex border-b border-slate-200 px-5 bg-white">
              <button type="button" onClick={() => setActiveTab(1)} className={`py-3 px-4 font-medium text-sm border-b-2 transition-colors ${activeTab === 1 ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>Data Pribadi</button>
              <button type="button" onClick={() => setActiveTab(2)} className={`py-3 px-4 font-medium text-sm border-b-2 transition-colors ${activeTab === 2 ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>Kepegawaian</button>
              <button type="button" onClick={() => setActiveTab(3)} className={`py-3 px-4 font-medium text-sm border-b-2 transition-colors ${activeTab === 3 ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>Berkas & Jaminan</button>
            </div>

            {/* Form Content (Bisa discroll) */}
            <form onSubmit={handleSimpan} className="flex-1 overflow-y-auto p-6 space-y-4">
              
              {/* TAB 1: DATA PRIBADI */}
              {activeTab === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField label="Nama Lengkap *" name="nama" placeholder="Sesuai KTP" formData={formData} setFormData={setFormData} />
                  <InputField label="Nomor Karyawan" name="nomor_karyawan" placeholder="Cth: MGR.SPBU-001" formData={formData} setFormData={setFormData} />
                  <InputField label="No. Handphone" name="no_hp" placeholder="0812..." formData={formData} setFormData={setFormData} />
                  <InputField label="Email" name="email" type="email" placeholder="nama@email.com" formData={formData} setFormData={setFormData} />
                  <InputField label="Tanggal Lahir" name="tanggal_lahir" type="date" formData={formData} setFormData={setFormData} />
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Jenis Kelamin</label>
                    <select value={formData.jenis_kelamin} onChange={(e) => setFormData({...formData, jenis_kelamin: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white">
                      <option value="">Pilih...</option>
                      <option value="Laki-Laki">Laki-Laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                  </div>
<div>
  <label className="block text-sm font-medium text-slate-700 mb-1">Status Pernikahan (PTKP)</label>
  <select 
    value={formData.status_pernikahan} 
    onChange={(e) => setFormData({...formData, status_pernikahan: e.target.value})} 
    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
  >
    <option value="">Pilih Status...</option>
    <option value="TK/0">TK/0 (Belum Menikah)</option>
    <option value="K/0">K/0 (Menikah, 0 Tanggungan)</option>
    <option value="K/1">K/1 (Menikah, 1 Tanggungan)</option>
    <option value="K/2">K/2 (Menikah, 2 Tanggungan)</option>
    <option value="K/3">K/3 (Menikah, 3 Tanggungan)</option>
  </select>
</div>                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Alamat Lengkap</label>
                    <textarea value={formData.alamat} onChange={(e) => setFormData({...formData, alamat: e.target.value})} rows="2" className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 resize-none"></textarea>
                  </div>
                </div>
              )}

              {/* TAB 2: KEPEGAWAIAN & GAJI */}
              {activeTab === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField label="Posisi / Jabatan *" name="posisi" placeholder="Cth: Kasir, Operator" formData={formData} setFormData={setFormData} />
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Shift</label>
                    <select value={formData.shift} onChange={(e) => setFormData({...formData, shift: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white">
                      <option value="Pagi">Pagi</option>
                      <option value="Siang">Siang</option>
                      <option value="Malam">Malam</option>
                      <option value="-">-</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                    <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white">
                      <option value="Aktif">Aktif</option>
                      <option value="Cuti">Cuti</option>
                      <option value="Tidak Aktif">Tidak Aktif</option>
                    </select>
                  </div>
                  <InputField label="Tanggal Masuk" name="tanggal_masuk" type="date" formData={formData} setFormData={setFormData} />
                  <InputField label="Tanggal Keluar" name="tanggal_keluar" type="date" formData={formData} setFormData={setFormData} />
                  <InputField label="Gaji Pokok (Angka saja)" name="gaji_pokok" type="number" placeholder="Cth: 5000000" formData={formData} setFormData={setFormData} />
                  <InputField label="NPWP" name="npwp" placeholder="Nomor NPWP" formData={formData} setFormData={setFormData} />
                  <InputField label="Nama Rekening Bank" name="nama_rekening" placeholder="Cth: BCA / Mandiri" formData={formData} setFormData={setFormData} />
                  <InputField label="Nomor Rekening" name="nomor_rekening" placeholder="Angka Rekening" formData={formData} setFormData={setFormData} />
                </div>
              )}

              {/* TAB 3: BERKAS & JAMINAN */}
              {activeTab === 3 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField label="Nomor e-KTP" name="no_ktp" placeholder="16 Digit NIK" formData={formData} setFormData={setFormData} />
                  <InputField label="Nomor Kartu Keluarga (KK)" name="no_kk" placeholder="16 Digit No KK" formData={formData} setFormData={setFormData} />
                  <InputField label="BPJS Kesehatan" name="no_bpjs_kesehatan" placeholder="Nomor BPJS Kes" formData={formData} setFormData={setFormData} />
                  <InputField label="BPJS Ketenagakerjaan" name="no_bpjs_ketenagakerjaan" placeholder="Nomor BPJS TK" formData={formData} setFormData={setFormData} />
                  <div className="md:col-span-2 border-t pt-4 mt-2"><p className="text-sm font-semibold text-slate-700 mb-3">Tautan Dokumen (Google Drive / Link)</p></div>
                  <InputField label="Link Pas Foto" name="link_pas_foto" placeholder="https://..." formData={formData} setFormData={setFormData} />
                  <InputField label="Link e-KTP" name="link_e_ktp" placeholder="https://..." formData={formData} setFormData={setFormData} />
                  <InputField label="Link Kartu Keluarga" name="link_kk" placeholder="https://..." formData={formData} setFormData={setFormData} />
                  <InputField label="Link Kontrak Kerja" name="link_kontrak" placeholder="https://..." formData={formData} setFormData={setFormData} />
                  <InputField label="Link Catatan Lain" name="link_catatan" placeholder="https://..." formData={formData} setFormData={setFormData} />
                </div>
              )}
            </form>

            {/* Footer Tombol Aksi */}
            <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 border border-slate-300 text-slate-600 rounded-xl hover:bg-slate-100 font-medium">Batal</button>
              <button type="button" onClick={handleSimpan} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium shadow-sm">Simpan Data</button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}