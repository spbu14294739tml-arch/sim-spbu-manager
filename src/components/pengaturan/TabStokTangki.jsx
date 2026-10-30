// src/components/pengaturan/TabStokTangki.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Loader2, Edit, RefreshCw, Plus, Trash2, Droplet } from 'lucide-react';

const JENIS_BBM = ['PERTALITE', 'PERTAMAX', 'PERTAMAX TURBO', 'BIOSOLAR', 'DEXLITE'];

export default function TabStokTangki() {
  const [daftarTangki, setDaftarTangki] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // State Form Edit Tangki (Inline)
  const [editingTangkiId, setEditingTangkiId] = useState(null);
  const [stokBaru, setStokBaru] = useState('');
  const [kapasitasBaru, setKapasitasBaru] = useState('');
  const [jenisBBMBaru, setJenisBBMBaru] = useState('');

  // State Form Tambah Tangki Baru
  const [formTambah, setFormTambah] = useState({
    nomor_tangki: '',
    jenis_bbm: 'PERTALITE',
    kapasitas_maksimal: '',
    stok_saat_ini: ''
  });

  const fetchData = async () => {
    setIsLoading(true);
    const { data } = await supabase.from('stok_tangki').select('*').order('nomor_tangki');
    if (data) setDaftarTangki(data);
    setIsLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // === UPDATE (EDIT) ===
  const handleUpdateTangki = async (id) => {
    if (!stokBaru && stokBaru !== 0) return alert('Masukkan jumlah stok baru!');
    if (!kapasitasBaru) return alert('Masukkan kapasitas maksimal!');
    if (isSaving) return;
    setIsSaving(true);

    const { error } = await supabase.from('stok_tangki').update({ 
      stok_saat_ini: parseFloat(stokBaru), 
      kapasitas_maksimal: parseFloat(kapasitasBaru),
      jenis_bbm: jenisBBMBaru,
      updated_at: new Date() 
    }).eq('id', id);
    
    if (error) alert('Gagal update tangki: ' + error.message);
    else { 
      setEditingTangkiId(null); setStokBaru(''); setKapasitasBaru(''); setJenisBBMBaru('');
      fetchData(); 
    }
    setIsSaving(false);
  };

  // === CREATE (TAMBAH) ===
  const handleTambahTangki = async (e) => {
    e.preventDefault();
    if (!formTambah.nomor_tangki || !formTambah.kapasitas_maksimal) {
      return alert('Lengkapi Nomor Tangki dan Kapasitas Maksimal!');
    }
    if (isSaving) return;
    setIsSaving(true);

    const { error } = await supabase.from('stok_tangki').insert([{
      nomor_tangki: formTambah.nomor_tangki.toUpperCase(),
      jenis_bbm: formTambah.jenis_bbm,
      kapasitas_maksimal: parseFloat(formTambah.kapasitas_maksimal),
      stok_saat_ini: parseFloat(formTambah.stok_saat_ini) || 0
    }]);

    if (error) alert('Gagal tambah tangki: ' + error.message);
    else {
      setFormTambah({ nomor_tangki: '', jenis_bbm: 'PERTALITE', kapasitas_maksimal: '', stok_saat_ini: '' });
      fetchData();
    }
    setIsSaving(false);
  };

  // === DELETE (HAPUS) ===
  const handleHapusTangki = async (id, nomor) => {
    if (!window.confirm(`Yakin ingin menghapus Tangki ${nomor}? Data stok akan hilang permanen.`)) return;
    const { error } = await supabase.from('stok_tangki').delete().eq('id', id);
    if (error) alert('Gagal hapus tangki: ' + error.message);
    else fetchData();
  };

  if (isLoading) return <div className="p-12 text-center"><Loader2 className="animate-spin text-blue-500" size={32} /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* FORM TAMBAH TANGKI BARU */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Plus size={20} className="text-blue-600"/> Tambah Tangki Baru</h2>
        <form onSubmit={handleTambahTangki} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Nomor Tangki</label>
            <input type="text" value={formTambah.nomor_tangki} onChange={(e) => setFormTambah({...formTambah, nomor_tangki: e.target.value.toUpperCase()})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Cth: TANGKI 06" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Jenis BBM</label>
            <select value={formTambah.jenis_bbm} onChange={(e) => setFormTambah({...formTambah, jenis_bbm: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
              {JENIS_BBM.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Kapasitas (L)</label>
            <input type="number" value={formTambah.kapasitas_maksimal} onChange={(e) => setFormTambah({...formTambah, kapasitas_maksimal: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="0" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Stok Awal (L)</label>
            <input type="number" value={formTambah.stok_saat_ini} onChange={(e) => setFormTambah({...formTambah, stok_saat_ini: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="0" />
          </div>
          <button type="submit" disabled={isSaving} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-blue-700 h-[38px]">
            {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />} Tambah
          </button>
        </form>
      </div>

      {/* DAFTAR KARTU TANGKI */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Monitor Stok Tangki Pendam</h2>
            <p className="text-sm text-slate-500 mt-1">Update stok dan kapasitas maksimal tangki.</p>
          </div>
          <button onClick={fetchData} className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center gap-2"><RefreshCw size={16} /> Refresh</button>
        </div>
        
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {daftarTangki.length === 0 ? (
            <div className="col-span-2 text-center py-8 text-slate-400 italic">Belum ada tangki yang terdaftar. Silakan tambah di atas.</div>
          ) : daftarTangki.map((tangki) => {
            const persentase = (tangki.stok_saat_ini / tangki.kapasitas_maksimal) * 100;
            const isLow = persentase < 30;
            const isMedium = persentase >= 30 && persentase < 60;

            return (
              <div key={tangki.id} className="border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-shadow relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-2 h-full ${isLow ? 'bg-red-500' : isMedium ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                
                <div className="flex justify-between items-start mb-4 ml-2">
                  <div>
                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Droplet size={18} className="text-slate-400"/> {tangki.nomor_tangki}</h3>
                    <p className="text-blue-600 font-semibold text-sm">{tangki.jenis_bbm}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Stok Saat Ini</p>
                    <p className={`font-bold text-xl ${isLow ? 'text-red-600' : isMedium ? 'text-yellow-600' : 'text-green-600'}`}>{tangki.stok_saat_ini} L</p>
                  </div>
                </div>

                <div className="ml-2 mb-4">
                  <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden relative">
                    <div className={`h-full rounded-full transition-all duration-1000 ${isLow ? 'bg-red-500' : isMedium ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${persentase}%` }}></div>
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-800">
                      {persentase.toFixed(1)}% dari {tangki.kapasitas_maksimal} L
                    </div>
                  </div>
                </div>

                <div className="ml-2 mt-4">
                  {editingTangkiId === tangki.id ? (
                    <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Jenis BBM</label>
                          <select value={jenisBBMBaru} onChange={(e) => setJenisBBMBaru(e.target.value)} className="w-full px-2 py-1.5 border rounded-lg text-sm bg-white">
                            {JENIS_BBM.map(b => <option key={b} value={b}>{b}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Kapasitas (L)</label>
                          <input type="number" value={kapasitasBaru} onChange={(e) => setKapasitasBaru(e.target.value)} className="w-full px-2 py-1.5 border rounded-lg text-sm" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Stok Saat Ini (L)</label>
                        <input type="number" value={stokBaru} onChange={(e) => setStokBaru(e.target.value)} className="w-full px-2 py-1.5 border rounded-lg text-sm" />
                      </div>
                      <div className="flex gap-2 justify-end mt-2">
                        <button onClick={() => setEditingTangkiId(null)} className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border rounded-lg">Batal</button>
                        <button onClick={() => handleUpdateTangki(tangki.id)} disabled={isSaving} className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                          {isSaving ? <Loader2 className="animate-spin" size={14} /> : 'Simpan'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => { 
                          setEditingTangkiId(tangki.id); 
                          setStokBaru(tangki.stok_saat_ini); 
                          setKapasitasBaru(tangki.kapasitas_maksimal);
                          setJenisBBMBaru(tangki.jenis_bbm);
                        }} 
                        className="flex-1 flex items-center justify-center gap-2 bg-slate-50 border border-slate-200 text-slate-700 py-2 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors"
                      >
                        <Edit size={16} /> Edit Tangki
                      </button>
                      <button 
                        onClick={() => handleHapusTangki(tangki.id, tangki.nomor_tangki)}
                        className="px-3 bg-red-50 border border-red-200 text-red-600 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                        title="Hapus Tangki"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}