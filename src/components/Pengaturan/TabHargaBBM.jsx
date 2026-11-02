import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { formatRupiah } from '../../lib/formatHelper';
import { Loader2, Fuel, History, ArrowUp, ArrowDown, Minus, Printer, X } from 'lucide-react';
import KopSurat from '../KopSurat';

export default function TabHargaBBM() {
  const [daftarHargaBBM, setDaftarHargaBBM] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [editingHargaId, setEditingHargaId] = useState(null);
  const [hargaBaruInput, setHargaBaruInput] = useState('');
  const [tanggalEfektif, setTanggalEfektif] = useState(new Date().toISOString().split('T')[0]);
  const [statusHarga, setStatusHarga] = useState('TETAP');
  const [selisihHarga, setSelisihHarga] = useState(0);

  // State Modal
  const [showRiwayatModal, setShowRiwayatModal] = useState(false);
  const [riwayatBulan, setRiwayatBulan] = useState(new Date().getMonth() + 1);
  const [riwayatTahun, setRiwayatTahun] = useState(new Date().getFullYear());
  const [dataRiwayat, setDataRiwayat] = useState([]);
  const [isFetchingRiwayat, setIsFetchingRiwayat] = useState(false);

  const fetchData = async () => {
    const { data } = await supabase.from('master_produk_bbm').select('*').order('id');
    if (data) setDaftarHargaBBM(data);
  };

  useEffect(() => { fetchData(); }, []);

  const fetchRiwayatHarga = async () => {
    setIsFetchingRiwayat(true);
    const startDate = `${riwayatTahun}-${String(riwayatBulan).padStart(2, '0')}-01`;
    const endDate = new Date(riwayatTahun, riwayatBulan, 0).toISOString().split('T')[0];
    const { data } = await supabase.from('riwayat_harga_bbm').select('*').gte('tanggal_efektif', startDate).lte('tanggal_efektif', endDate).order('created_at', { ascending: false });
    if (data) setDataRiwayat(data);
    setIsFetchingRiwayat(false);
  };

  useEffect(() => { if (showRiwayatModal) fetchRiwayatHarga(); }, [showRiwayatModal, riwayatBulan, riwayatTahun]);

  const handleMulaiEditHarga = (bbm) => {
    setEditingHargaId(bbm.id);
    setHargaBaruInput(bbm.harga_per_liter.toString());
    setTanggalEfektif(new Date().toISOString().split('T')[0]);
    setStatusHarga('TETAP');
    setSelisihHarga(0);
  };

  const handleHargaInputChange = (e, hargaLama) => {
    const val = e.target.value;
    setHargaBaruInput(val);
    const baru = parseFloat(val);
    const lama = parseFloat(hargaLama);
    if (!isNaN(baru) && !isNaN(lama)) {
      const diff = baru - lama;
      setSelisihHarga(diff);
      if (diff > 0) setStatusHarga('NAIK');
      else if (diff < 0) setStatusHarga('TURUN');
      else setStatusHarga('TETAP');
    }
  };

  const handleSimpanHarga = async (bbm) => {
    const baru = parseFloat(hargaBaruInput);
    if (isNaN(baru) || baru <= 0) return alert('Harga baru tidak valid!');
    if (isSaving) return;
    setIsSaving(true);

    try {
      await supabase.from('master_produk_bbm').update({ harga_per_liter: baru, tanggal_efektif: tanggalEfektif, status_harga: statusHarga, selisih_harga: selisihHarga }).eq('id', bbm.id);
      if (baru !== bbm.harga_per_liter) {
        await supabase.from('riwayat_harga_bbm').insert([{ jenis_bbm: bbm.jenis_bbm, harga_lama: bbm.harga_per_liter, harga_baru: baru, tanggal_efektif: tanggalEfektif, selisih: selisihHarga, status: statusHarga, updated_by: 'Manager Operasional' }]);
      }
      setEditingHargaId(null);
      fetchData();
    } catch (error) {
      alert(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {showRiwayatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:static print:block print:p-0 print:bg-transparent print:backdrop-blur-none">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 print:max-h-none print:shadow-none print:rounded-none print:block print:w-full">
            <div className="flex justify-between items-center p-5 border-b bg-slate-50 no-print">
              <div>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><History className="text-blue-600"/> Daftar List Perubahan Harga</h2>
                <p className="text-sm text-slate-500 mt-1">Riwayat perubahan harga BBM berdasarkan bulan efektif.</p>
              </div>
              <button onClick={() => setShowRiwayatModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={24} className="text-slate-500" /></button>
            </div>
            <div className="p-4 border-b flex gap-4 items-center bg-white no-print">
              <select value={riwayatBulan} onChange={(e) => setRiwayatBulan(Number(e.target.value))} className="px-4 py-2 border border-slate-300 rounded-lg font-medium outline-none">
                {['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'].map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
              </select>
              <select value={riwayatTahun} onChange={(e) => setRiwayatTahun(Number(e.target.value))} className="px-4 py-2 border border-slate-300 rounded-lg font-medium outline-none">
                <option value={2025}>2025</option><option value={2026}>2026</option><option value={2027}>2027</option>
              </select>
              <button onClick={() => window.print()} className="ml-auto bg-slate-800 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 hover:bg-slate-700 shadow-sm"><Printer size={18}/> Cetak List</button>
            </div>
            <div className="flex-1 overflow-auto p-6 bg-white print:overflow-visible print:p-0">
              <div className="hidden print:block mb-6"><KopSurat /></div>
              <div className="hidden print:block text-center mb-6">
                <h2 className="text-lg font-bold text-black uppercase underline">LAPORAN PERUBAHAN HARGA BBM</h2>
                <p className="text-sm text-black mt-1">Periode: {['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'][riwayatBulan-1]} {riwayatTahun}</p>
              </div>
              {isFetchingRiwayat ? <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-500" size={32} /></div> : dataRiwayat.length === 0 ? <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-dashed">Belum ada perubahan harga di bulan ini.</div> : (
                <div className="overflow-x-auto print:overflow-visible">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 text-[10px] md:text-xs uppercase print:bg-gray-100 print:text-black">
                        <th className="py-3 px-3 border border-slate-200 print:border-black text-center w-10">No</th>
                        <th className="py-3 px-3 border border-slate-200 print:border-black">Tanggal Efektif</th>
                        <th className="py-3 px-3 border border-slate-200 print:border-black">Jenis BBM</th>
                        <th className="py-3 px-3 border border-slate-200 print:border-black text-right">Harga Lama</th>
                        <th className="py-3 px-3 border border-slate-200 print:border-black text-right">Harga Baru</th>
                        <th className="py-3 px-3 border border-slate-200 print:border-black text-center">Status</th>
                        <th className="py-3 px-3 border border-slate-200 print:border-black text-right">Selisih (Rp)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 print:divide-black">
                      {dataRiwayat.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-slate-50 text-xs md:text-sm print:hover:bg-transparent print:text-[11px]">
                          <td className="py-2.5 px-3 border border-slate-200 print:border-black text-center">{idx + 1}</td>
                          <td className="py-2.5 px-3 border border-slate-200 print:border-black font-medium">{new Date(item.tanggal_efektif).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                          <td className="py-2.5 px-3 border border-slate-200 print:border-black font-semibold text-slate-800 print:text-black">{item.jenis_bbm}</td>
                          <td className="py-2.5 px-3 border border-slate-200 print:border-black text-right font-mono">{formatRupiah(item.harga_lama)}</td>
                          <td className="py-2.5 px-3 border border-slate-200 print:border-black text-right font-mono font-bold text-blue-700 print:text-black">{formatRupiah(item.harga_baru)}</td>
                          <td className="py-2.5 px-3 border border-slate-200 print:border-black text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.status === 'NAIK' ? 'bg-red-100 text-red-600' : item.status === 'TURUN' ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-600'}`}>{item.status}</span>
                          </td>
                          <td className={`py-2.5 px-3 border border-slate-200 print:border-black text-right font-mono font-medium ${item.selisih > 0 ? 'text-red-600' : 'text-green-600'}`}>{item.selisih === 0 ? '-' : formatRupiah(Math.abs(item.selisih))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in duration-300">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><History size={20} className="text-blue-600"/> Harga BBM per Produk</h2>
            <p className="text-sm text-slate-500 mt-1">Update harga BBM + tanggal efektif. History otomatis tercatat.</p>
          </div>
          <button onClick={() => setShowRiwayatModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-700 shadow-sm"><History size={16}/> Lihat Riwayat</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-orange-500 text-white text-sm uppercase">
                <th className="py-4 px-4 font-semibold w-12 text-center">No</th>
                <th className="py-4 px-4 font-semibold">Produk BBM</th>
                <th className="py-4 px-4 font-semibold text-center bg-orange-600">Harga Sebelumnya</th>
                <th className="py-4 px-4 font-semibold text-center bg-blue-600">Harga Sekarang</th>
                <th className="py-4 px-4 font-semibold text-center bg-blue-700">Efektif Tanggal</th>
                <th className="py-4 px-4 font-semibold text-center bg-orange-600">Status</th>
                <th className="py-4 px-4 font-semibold text-center bg-orange-600">Selisih</th>
                <th className="py-4 px-4 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {daftarHargaBBM.map((bbm, index) => {
                const isEditing = editingHargaId === bbm.id;
                return (
                  <tr key={bbm.id} className="hover:bg-slate-50">
                    <td className="py-4 px-4 text-center text-slate-500">{index + 1}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-slate-50 flex items-center justify-center border border-slate-200 overflow-hidden">
                          {bbm.logo_url ? <img src={bbm.logo_url} alt="logo" className="w-full h-full object-contain" /> : <Fuel className="text-slate-400" size={18} />}
                        </div>
                        <span className="font-semibold text-slate-800">{bbm.jenis_bbm}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center bg-slate-50"><span className="text-slate-600 font-medium">{bbm.harga_per_liter}</span></td>
                    <td className="py-4 px-4 text-center bg-blue-50">
                      {isEditing ? <input type="number" value={hargaBaruInput} onChange={(e) => handleHargaInputChange(e, bbm.harga_per_liter)} className="w-24 px-2 py-1.5 border-2 border-blue-400 rounded-lg text-center font-bold text-blue-700" /> : <span className="text-slate-800 font-bold text-lg">{bbm.harga_per_liter}</span>}
                    </td>
                    <td className="py-4 px-4 text-center bg-blue-50">
                      {isEditing ? <input type="date" value={tanggalEfektif} onChange={(e) => setTanggalEfektif(e.target.value)} className="px-2 py-1.5 border-2 border-blue-400 rounded-lg text-sm font-medium text-blue-700" /> : <span className="text-slate-500 text-sm">{bbm.tanggal_efektif || '-'}</span>}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {isEditing ? (
                        <span className={`px-2 py-1 rounded text-xs font-bold flex items-center justify-center gap-1 w-fit mx-auto ${statusHarga === 'NAIK' ? 'bg-red-100 text-red-600' : statusHarga === 'TURUN' ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-600'}`}>
                          {statusHarga === 'NAIK' && <ArrowUp size={14} />}{statusHarga === 'TURUN' && <ArrowDown size={14} />}{statusHarga === 'TETAP' && <Minus size={14} />}{statusHarga}
                        </span>
                      ) : bbm.status_harga ? (
                        <span className={`px-2 py-1 rounded text-xs font-bold flex items-center justify-center gap-1 w-fit mx-auto ${bbm.status_harga === 'NAIK' ? 'bg-red-100 text-red-600' : bbm.status_harga === 'TURUN' ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-600'}`}>
                          {bbm.status_harga === 'NAIK' && <ArrowUp size={14} />}{bbm.status_harga === 'TURUN' && <ArrowDown size={14} />}{bbm.status_harga === 'TETAP' && <Minus size={14} />}{bbm.status_harga}
                        </span>
                      ) : <span className="text-slate-400 text-xs italic">Belum ada</span>}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {isEditing ? <span className={`font-medium ${selisihHarga > 0 ? 'text-red-600' : selisihHarga < 0 ? 'text-green-600' : 'text-slate-600'}`}>{selisihHarga === 0 ? '-' : formatRupiah(Math.abs(selisihHarga))}</span> : bbm.selisih_harga ? <span className={`font-medium ${bbm.selisih_harga > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatRupiah(Math.abs(bbm.selisih_harga))}</span> : <span className="text-slate-400 text-xs italic">-</span>}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {isEditing ? (
                        <div className="flex justify-center gap-2">
                          <button onClick={() => setEditingHargaId(null)} className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border rounded-lg">Batal</button>
                          <button onClick={() => handleSimpanHarga(bbm)} disabled={isSaving} className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">{isSaving ? <Loader2 className="animate-spin" size={14} /> : 'Simpan'}</button>
                        </div>
                      ) : <button onClick={() => handleMulaiEditHarga(bbm)} className="px-4 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100">Edit Harga</button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}