// src/pages/Kasir.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { formatRupiah } from '../lib/formatHelper';
import { Loader2, Plus, Trash2, DollarSign, Fuel } from 'lucide-react';

export default function Kasir() {
  const [isLoading, setIsLoading] = useState(true);
  const [listShift, setListShift] = useState([]);
  const [transaksiHariIni, setTransaksiHariIni] = useState([]);
  
  // State Form
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    shift: '',
    jenis_bbm: 'PERTALITE',
    jumlah_liter: '',
    total_harga: '',
    operator: ''
  });

  const [displayHarga, setDisplayHarga] = useState('');

  const getTodayDate = () => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localToday = new Date(today.getTime() - (offset * 60 * 1000));
    return localToday.toISOString().split('T')[0];
  };
  const hariIni = getTodayDate();

  // 1. Ambil Data Shift & Transaksi Hari Ini
  const fetchData = async () => {
    setIsLoading(true);
    
    // Ambil Shift
    const { data: shiftData } = await supabase.from('pengaturan_shift').select('nama_shift').order('id');
    if (shiftData && shiftData.length > 0) {
      setListShift(shiftData.map(s => s.nama_shift));
      if (!formData.shift) setFormData(prev => ({ ...prev, shift: shiftData[0].nama_shift }));
    }

    // Ambil Transaksi Hari Ini
    const { data: transaksiData } = await supabase
      .from('penjualan')
      .select('*')
      .eq('tanggal', hariIni)
      .order('id', { ascending: false });
    
    if (transaksiData) setTransaksiHariIni(transaksiData);
    
    setIsLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // Format Harga (Rupiah)
  const handleHargaChange = (e) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    setFormData({ ...formData, total_harga: rawValue });
    setDisplayHarga(rawValue ? formatRupiah(rawValue) : '');
  };

  // Simpan Transaksi
  const handleSimpan = async (e) => {
    e.preventDefault();
    if (!formData.jumlah_liter || !formData.total_harga || !formData.operator) {
      alert('Mohon lengkapi semua data!');
      return;
    }

    const dataToInsert = {
      ...formData,
      jumlah_liter: parseFloat(formData.jumlah_liter),
      total_harga: parseFloat(formData.total_harga)
    };

    const { error } = await supabase.from('penjualan').insert([dataToInsert]);

    if (error) {
      alert('Gagal menyimpan transaksi: ' + error.message);
    } else {
      // Reset form (kecuali tanggal dan shift)
      setFormData({
        ...formData,
        jumlah_liter: '',
        total_harga: '',
        operator: ''
      });
      setDisplayHarga('');
      fetchData();
    }
  };

  const handleHapus = async (id) => {
    if (!window.confirm('Hapus transaksi ini?')) return;
    await supabase.from('penjualan').delete().eq('id', id);
    fetchData();
  };

  // Hitung Total Pendapatan Hari Ini
  const totalPendapatan = transaksiHariIni.reduce((acc, curr) => acc + curr.total_harga, 0);
  const totalLiter = transaksiHariIni.reduce((acc, curr) => acc + curr.jumlah_liter, 0);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Kasir & Penjualan BBM</h1>
        <p className="text-slate-500 mt-1">Catat transaksi penjualan bensin harian.</p>
      </div>

      {/* Statistik Hari Ini */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="p-2 bg-green-100 text-green-600 rounded-lg"><DollarSign size={24} /></div>
          <div><p className="text-xs text-slate-500 font-medium">Pendapatan Hari Ini</p><p className="text-xl font-bold text-slate-800">{formatRupiah(totalPendapatan)}</p></div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Fuel size={24} /></div>
          <div><p className="text-xs text-slate-500 font-medium">Total Liter Terjual</p><p className="text-xl font-bold text-slate-800">{totalLiter.toFixed(2)} Liter</p></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FORM INPUT KASIR */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-fit">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Input Transaksi Baru</h2>
          <form onSubmit={handleSimpan} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal</label>
              <input type="date" value={formData.tanggal} onChange={(e) => setFormData({...formData, tanggal: e.target.value})} className="w-full px-4 py-2 border rounded-xl bg-slate-50" readOnly />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Shift</label>
              <select value={formData.shift} onChange={(e) => setFormData({...formData, shift: e.target.value})} className="w-full px-4 py-2 border rounded-xl bg-white">
                {listShift.map((s, i) => <option key={i} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Jenis BBM</label>
              <select value={formData.jenis_bbm} onChange={(e) => setFormData({...formData, jenis_bbm: e.target.value})} className="w-full px-4 py-2 border rounded-xl bg-white">
                <option value="PERTALITE">PERTALITE</option>
                <option value="PERTAMAX">PERTAMAX</option>
                <option value="PERTAMAX TURBO">PERTAMAX TURBO</option>
                <option value="BIOSOLAR">BIOSOLAR</option>
                <option value="DEXLITE">DEXLITE</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Jumlah Liter</label>
              <input type="number" step="0.01" required value={formData.jumlah_liter} onChange={(e) => setFormData({...formData, jumlah_liter: e.target.value})} className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500" placeholder="Cth: 10.5" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Total Harga (Rp)</label>
              <input type="text" required value={displayHarga} onChange={handleHargaChange} className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500" placeholder="Rp 0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nama Operator / Kasir</label>
              <input type="text" required value={formData.operator} onChange={(e) => setFormData({...formData, operator: e.target.value.toUpperCase()})} className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500" placeholder="Nama Operator" />
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-sm mt-2">
              Simpan Transaksi
            </button>
          </form>
        </div>

        {/* TABEL TRANSAKSI HARI INI */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h2 className="text-lg font-bold text-slate-800">Transaksi Hari Ini ({hariIni})</h2>
          </div>
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" size={32} /></div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white border-b border-slate-100 text-slate-500 text-sm">
                    <th className="py-4 px-6 font-semibold">Shift</th>
                    <th className="py-4 px-6 font-semibold">BBM</th>
                    <th className="py-4 px-6 font-semibold">Liter</th>
                    <th className="py-4 px-6 font-semibold">Total Harga</th>
                    <th className="py-4 px-6 font-semibold">Operator</th>
                    <th className="py-4 px-6 font-semibold text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transaksiHariIni.length > 0 ? (
                    transaksiHariIni.map((trx) => (
                      <tr key={trx.id} className="hover:bg-slate-50/50">
                        <td className="py-4 px-6 text-slate-600 font-medium">{trx.shift}</td>
                        <td className="py-4 px-6 font-semibold text-blue-600">{trx.jenis_bbm}</td>
                        <td className="py-4 px-6 text-slate-600">{trx.jumlah_liter} L</td>
                        <td className="py-4 px-6 font-medium text-slate-800">{formatRupiah(trx.total_harga)}</td>
                        <td className="py-4 px-6 text-slate-600 uppercase">{trx.operator}</td>
                        <td className="py-4 px-6 text-center">
                          <button onClick={() => handleHapus(trx.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="6" className="py-8 text-center text-slate-500">Belum ada transaksi hari ini.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}