// src/pages/Gaji/index.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { formatRupiah } from '../../lib/formatHelper';
import { Loader2, Printer, Wallet, Calendar, Plus, Save, X } from 'lucide-react';
import KopSurat from '../../components/KopSurat';

export default function GajiKaryawan() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [daftarGaji, setDaftarGaji] = useState([]);
  const [daftarKaryawan, setDaftarKaryawan] = useState([]);
  
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // State Modal Form Input
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    karyawan_id: '',
    gaji_pokok: 0,
    tunjangan_komunikasi: 0,
    tunjangan_transportasi: 0,
    masuk_shift_malam: 0,
    reward_pasti_pas: 0,
    potongan_ketidakhadiran: 0,
    bpjs_kes: 0,
    bpjstk_jht: 0,
    bpjstk_jp: 0,
    pph_21: 0,
  });

  const fetchData = async () => {
    setIsLoading(true);
    // Ambil data gaji
    const { data: dataGaji } = await supabase
      .from('gaji_karyawan')
      .select(`*, karyawan (nama, posisi)`)
      .eq('bulan', selectedMonth)
      .eq('tahun', selectedYear)
      .order('created_at', { ascending: true });

    if (dataGaji) setDaftarGaji(dataGaji);

    // Ambil data karyawan untuk dropdown
    const { data: dataKaryawan } = await supabase.from('karyawan').select('id, nama, posisi').eq('status', 'Aktif');
    if (dataKaryawan) setDaftarKaryawan(dataKaryawan);

    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

  const formatTanggalIndo = (bulan, tahun) => {
    const date = new Date(tahun, bulan - 1, 1);
    return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  };

  // Kalkulasi Otomatis saat form diisi
  const hitungTotal = (data) => {
    const totalTunjangan = 
      (parseFloat(data.tunjangan_komunikasi) || 0) + 
      (parseFloat(data.tunjangan_transportasi) || 0) + 
      (parseFloat(data.masuk_shift_malam) || 0) + 
      (parseFloat(data.reward_pasti_pas) || 0);
      
    const totalPotongan = 
      (parseFloat(data.potongan_ketidakhadiran) || 0) + 
      (parseFloat(data.bpjs_kes) || 0) + 
      (parseFloat(data.bpjstk_jht) || 0) + 
      (parseFloat(data.bpjstk_jp) || 0) + 
      (parseFloat(data.pph_21) || 0);

    const gajiPokok = parseFloat(data.gaji_pokok) || 0;
    const totalBersih = gajiPokok + totalTunjangan - totalPotongan;

    return { totalTunjangan, totalPotongan, totalBersih };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSimpanGaji = async (e) => {
    e.preventDefault();
    if (!formData.karyawan_id) return alert('Pilih Karyawan terlebih dahulu!');
    setIsSaving(true);

    const { totalTunjangan, totalPotongan, totalBersih } = hitungTotal(formData);

    const { error } = await supabase.from('gaji_karyawan').insert([{
      karyawan_id: formData.karyawan_id,
      bulan: selectedMonth,
      tahun: selectedYear,
      gaji_pokok: parseFloat(formData.gaji_pokok),
      tunjangan_komunikasi: parseFloat(formData.tunjangan_komunikasi) || 0,
      tunjangan_transportasi: parseFloat(formData.tunjangan_transportasi) || 0,
      masuk_shift_malam: parseFloat(formData.masuk_shift_malam) || 0,
      reward_pasti_pas: parseFloat(formData.reward_pasti_pas) || 0,
      potongan_ketidakhadiran: parseFloat(formData.potongan_ketidakhadiran) || 0,
      bpjs_kes: parseFloat(formData.bpjs_kes) || 0,
      bpjstk_jht: parseFloat(formData.bpjstk_jht) || 0,
      bpjstk_jp: parseFloat(formData.bpjstk_jp) || 0,
      pph_21: parseFloat(formData.pph_21) || 0,
      tunjangan: totalTunjangan,
      potongan: totalPotongan,
      total_bersih: totalBersih,
      status: 'DRAFT'
    }]);

    if (error) {
      alert('Gagal simpan gaji: ' + error.message);
    } else {
      alert('✅ Data Gaji berhasil disimpan!');
      setShowForm(false);
      setFormData({
        karyawan_id: '', gaji_pokok: 0, tunjangan_komunikasi: 0, tunjangan_transportasi: 0,
        masuk_shift_malam: 0, reward_pasti_pas: 0, potongan_ketidakhadiran: 0,
        bpjs_kes: 0, bpjstk_jht: 0, bpjstk_jp: 0, pph_21: 0,
      });
      fetchData();
    }
    setIsSaving(false);
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manajemen Gaji Karyawan</h1>
          <p className="text-slate-500 mt-1">Kelola dan cetak slip gaji bulanan.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-sm transition-all">
            <Plus size={18} /> Input Gaji Baru
          </button>
          <button onClick={() => window.print()} className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-sm transition-all">
            <Printer size={18} /> Cetak
          </button>
        </div>
      </div>

      {/* FILTER BULAN & TAHUN */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 flex flex-col md:flex-row gap-4 items-center no-print">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Calendar size={18} className="text-slate-500" />
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white font-medium text-slate-700">
            {['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'].map((m, i) => (
              <option key={i+1} value={i+1}>{m}</option>
            ))}
          </select>
          <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white font-medium text-slate-700">
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
            <option value={2027}>2027</option>
          </select>
        </div>
      </div>

      <KopSurat 
        judul="LAPORAN GAJI KARYAWAN" 
        periode={`Bulan: ${formatTanggalIndo(selectedMonth, selectedYear)}`} 
      />

      {isLoading ? (
        <div className="bg-white p-12 text-center rounded-2xl shadow-sm border border-slate-100"><Loader2 className="animate-spin mx-auto text-blue-500" size={32} /></div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden print-area">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800 text-white">
                <th className="py-3 px-4 text-left">Nama Karyawan</th>
                <th className="py-3 px-4 text-left">Jabatan</th>
                <th className="py-3 px-4 text-right">Gaji Pokok</th>
                <th className="py-3 px-4 text-right">Total Tunjangan</th>
                <th className="py-3 px-4 text-right">Total Potongan</th>
                <th className="py-3 px-4 text-right bg-slate-900">Total Bersih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {daftarGaji.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-slate-500 italic">Belum ada data gaji untuk bulan ini.</td></tr>
              ) : daftarGaji.map((gaji, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-semibold text-slate-800">{gaji.karyawan?.nama || '-'}</td>
                  <td className="py-3 px-4 text-slate-600">{gaji.karyawan?.posisi || '-'}</td>
                  <td className="py-3 px-4 text-right font-mono">{formatRupiah(gaji.gaji_pokok)}</td>
                  <td className="py-3 px-4 text-right font-mono text-green-600">+{formatRupiah(gaji.tunjangan)}</td>
                  <td className="py-3 px-4 text-right font-mono text-red-600">-{formatRupiah(gaji.potongan)}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-blue-700">{formatRupiah(gaji.total_bersih)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL FORM INPUT GAJI */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-8">
            <div className="flex justify-between items-center p-5 border-b bg-slate-50 rounded-t-2xl">
              <h2 className="text-xl font-bold text-slate-800">Input Gaji Karyawan</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-200 rounded-full"><X size={24} className="text-slate-500" /></button>
            </div>

            <form onSubmit={handleSimpanGaji} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Kolom Kiri: Karyawan & Gaji Pokok */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Pilih Karyawan</label>
                    <select name="karyawan_id" value={formData.karyawan_id} onChange={handleChange} className="w-full px-4 py-2 border rounded-xl" required>
                      <option value="">-- Pilih Karyawan --</option>
                      {daftarKaryawan.map(k => (
                        <option key={k.id} value={k.id}>{k.nama} ({k.posisi})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Gaji Pokok</label>
                    <input type="number" name="gaji_pokok" value={formData.gaji_pokok} onChange={handleChange} className="w-full px-4 py-2 border rounded-xl font-bold" required />
                  </div>
                </div>

                {/* Kolom Kanan: Tunjangan & Potongan */}
                <div className="space-y-4 bg-green-50 p-4 rounded-xl border border-green-100">
                  <h3 className="font-bold text-green-800 mb-2">Tunjangan</h3>
                  <input type="number" name="tunjangan_komunikasi" placeholder="Tunjangan Komunikasi" value={formData.tunjangan_komunikasi} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg mb-2" />
                  <input type="number" name="tunjangan_transportasi" placeholder="Tunjangan Transportasi" value={formData.tunjangan_transportasi} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg mb-2" />
                  <input type="number" name="masuk_shift_malam" placeholder="Masuk Shift Malam" value={formData.masuk_shift_malam} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg mb-2" />
                  <input type="number" name="reward_pasti_pas" placeholder="Reward Pasti Pas" value={formData.reward_pasti_pas} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" />
                </div>

                <div className="space-y-4 bg-red-50 p-4 rounded-xl border border-red-100 md:col-start-2">
                  <h3 className="font-bold text-red-800 mb-2">Potongan</h3>
                  <input type="number" name="potongan_ketidakhadiran" placeholder="Potongan Ketidakhadiran" value={formData.potongan_ketidakhadiran} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg mb-2" />
                  <input type="number" name="bpjs_kes" placeholder="BPJS Kesehatan" value={formData.bpjs_kes} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg mb-2" />
                  <input type="number" name="bpjstk_jht" placeholder="BPJSTK JHT" value={formData.bpjstk_jht} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg mb-2" />
                  <input type="number" name="bpjstk_jp" placeholder="BPJSTK JP" value={formData.bpjstk_jp} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg mb-2" />
                  <input type="number" name="pph_21" placeholder="PPh 21" value={formData.pph_21} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" />
                </div>

                {/* Tampilan Total (Otomatis) */}
                <div className="md:col-span-2 bg-slate-100 p-4 rounded-xl border border-slate-200 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-bold text-slate-600">Total Bersih (Gaji + Tunjangan - Potongan):</p>
                    <p className="text-2xl font-black text-blue-700">{formatRupiah(hitungTotal(formData).totalBersih)}</p>
                  </div>
                  <button type="submit" disabled={isSaving} className="bg-slate-800 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-900">
                    {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Simpan Data Gaji
                  </button>
                </div>

              </div>
            </form>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { background: white; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .no-print { display: none !important; }
          .print-area { display: block !important; }
          table { border-collapse: collapse !important; width: 100% !important; }
          th, td { border: 1px solid black !important; padding: 6px 8px !important; color: black !important; }
          .bg-slate-800, .bg-slate-900 { background-color: #1e293b !important; color: white !important; -webkit-print-color-adjust: exact !important; }
        }
      `}} />
    </div>
  );
}