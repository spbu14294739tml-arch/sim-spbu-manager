// src/pages/LaporanKerusakan.jsx
import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Search, Plus, X, Loader2, Printer } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import KopSurat from '../components/KopSurat'; // <-- IMPORT KOP SURAT

export default function LaporanKerusakan() {
  const [laporanList, setLaporanList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ pelapor: '', lokasi: '', kerusakan: '' });

  const fetchLaporan = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('laporan_kerusakan').select('*').order('id', { ascending: false });
    if (error) console.error('Error ambil laporan:', error);
    else setLaporanList(data || []);
    setIsLoading(false);
  };

  useEffect(() => { fetchLaporan(); }, []);

  const handleUpdateStatus = async (id, newStatus) => {
    const { error } = await supabase.from('laporan_kerusakan').update({ status: newStatus }).eq('id', id);
    if (error) alert('Gagal update status: ' + error.message);
    else fetchLaporan();
  };

  const handleSimpanLaporan = async (e) => {
    e.preventDefault();
    const now = new Date();
    const formatTanggal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const newLaporan = { pelapor: formData.pelapor, lokasi: formData.lokasi, kerusakan: formData.kerusakan, tanggal: formatTanggal, status: 'Pending' };
    const { error } = await supabase.from('laporan_kerusakan').insert([newLaporan]);

    if (error) alert('Gagal simpan laporan: ' + error.message);
    else { setFormData({ pelapor: '', lokasi: '', kerusakan: '' }); setIsModalOpen(false); fetchLaporan(); }
  };

  const filteredLaporan = laporanList.filter((laporan) =>
    laporan.lokasi.toLowerCase().includes(searchTerm.toLowerCase()) ||
    laporan.kerusakan.toLowerCase().includes(searchTerm.toLowerCase()) ||
    laporan.pelapor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status) => {
    if (status === 'Disetujui') return 'bg-green-100 text-green-700 border-green-200';
    if (status === 'Ditolak') return 'bg-red-100 text-red-700 border-red-200';
    return 'bg-yellow-100 text-yellow-700 border-yellow-200';
  };

  return (
    <div className="p-8 max-w-7xl mx-auto relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Laporan Kerusakan</h1>
          <p className="text-slate-500 mt-1">Pantau dan validasi laporan fasilitas dari lapangan.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="bg-white border border-slate-300 text-slate-700 px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm">
            <Printer size={20} /> Cetak
          </button>
          <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm">
            <Plus size={20} /> Buat Laporan
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center no-print">
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search size={18} className="text-slate-400" /></div>
          <input type="text" placeholder="Cari lokasi, kerusakan, atau pelapor..." className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="flex gap-2">
            <span className="flex items-center gap-1 text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg"><Clock size={16} className="text-yellow-600" /> Pending: {laporanList.filter(l => l.status === 'Pending').length}</span>
            <span className="flex items-center gap-1 text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg"><CheckCircle size={16} className="text-green-600" /> Disetujui: {laporanList.filter(l => l.status === 'Disetujui').length}</span>
        </div>
      </div>

      {/* KOMPONEN KOP SURAT (Hanya muncul saat dicetak) */}
      <KopSurat 
        judul="Laporan Kerusakan Fasilitas" 
        periode={new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })} 
      />

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden print-area">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm">
                <th className="py-4 px-6 font-semibold">Waktu Lapor</th>
                <th className="py-4 px-6 font-semibold">Pelapor</th>
                <th className="py-4 px-6 font-semibold">Lokasi</th>
                <th className="py-4 px-6 font-semibold">Deskripsi Kerusakan</th>
                <th className="py-4 px-6 font-semibold">Status</th>
                <th className="py-4 px-6 font-semibold text-center no-print">Tindakan Manager</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan="6" className="py-12 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" size={24} /></td></tr>
              ) : filteredLaporan.length > 0 ? (
                filteredLaporan.map((laporan) => (
                  <tr key={laporan.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 text-sm text-slate-500 whitespace-nowrap">{laporan.tanggal}</td>
                    <td className="py-4 px-6 font-medium text-slate-800">{laporan.pelapor}</td>
                    <td className="py-4 px-6 font-semibold text-blue-600">{laporan.lokasi}</td>
                    <td className="py-4 px-6 text-slate-600 text-sm max-w-xs">{laporan.kerusakan}</td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(laporan.status)}`}>{laporan.status}</span>
                    </td>
                    <td className="py-4 px-6 no-print">
                      {laporan.status === 'Pending' ? (
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleUpdateStatus(laporan.id, 'Disetujui')} className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 rounded-lg text-xs font-semibold transition-colors"><CheckCircle size={14} /> Setujui</button>
                          <button onClick={() => handleUpdateStatus(laporan.id, 'Ditolak')} className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded-lg text-xs font-semibold transition-colors"><XCircle size={14} /> Tolak</button>
                        </div>
                      ) : (
                        <div className="text-center text-sm text-slate-400 italic">Sudah divalidasi</div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="6" className="py-8 text-center text-slate-500">Tidak ada laporan kerusakan yang cocok.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">Buat Laporan Kerusakan</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleSimpanLaporan} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Pelapor & Jabatan</label>
                <input type="text" required value={formData.pelapor} onChange={(e) => setFormData({...formData, pelapor: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Contoh: Budi (Kasir)" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Lokasi Kerusakan</label>
                <input type="text" required value={formData.lokasi} onChange={(e) => setFormData({...formData, lokasi: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Contoh: Pompa 1, Toilet Wanita..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi Kerusakan</label>
                <textarea required value={formData.kerusakan} onChange={(e) => setFormData({...formData, kerusakan: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-24" placeholder="Jelaskan detail kerusakan..."></textarea>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium transition-colors">Batal</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors shadow-sm">Kirim Laporan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}