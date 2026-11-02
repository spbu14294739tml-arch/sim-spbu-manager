import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Loader2, Save, Plus, Trash2, Edit2, Hash } from 'lucide-react';

export default function TabKodeAkun() {
  const [daftarKodeAkun, setDaftarKodeAkun] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [kodeAkunBaru, setKodeAkunBaru] = useState({ kode_reff: '', nama_transaksi: '', kelompok: '', uraian_kelompok: '', mutasi: 'DEBET' });
  const [editingKodeAkunId, setEditingKodeAkunId] = useState(null);

  const fetchData = async () => {
    const { data } = await supabase.from('master_kode_akun').select('*').order('kelompok').order('kode_reff');
    if (data) setDaftarKodeAkun(data);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSimpan = async () => {
    if (!kodeAkunBaru.kode_reff || !kodeAkunBaru.nama_transaksi) return alert('Lengkapi Kode Reff dan Nama Transaksi!');
    if (isSaving) return;
    setIsSaving(true);

    const payload = {
      kode_reff: kodeAkunBaru.kode_reff.toUpperCase(),
      nama_transaksi: kodeAkunBaru.nama_transaksi.toUpperCase(),
      kelompok: kodeAkunBaru.kelompok.toUpperCase(),
      uraian_kelompok: kodeAkunBaru.uraian_kelompok,
      mutasi: kodeAkunBaru.mutasi
    };

    if (editingKodeAkunId) {
      await supabase.from('master_kode_akun').update(payload).eq('id', editingKodeAkunId);
    } else {
      await supabase.from('master_kode_akun').insert([payload]);
    }

    setKodeAkunBaru({ kode_reff: '', nama_transaksi: '', kelompok: '', uraian_kelompok: '', mutasi: 'DEBET' });
    setEditingKodeAkunId(null);
    fetchData();
    setIsSaving(false);
  };

  const handleEdit = (kode) => {
    setEditingKodeAkunId(kode.id);
    setKodeAkunBaru({ kode_reff: kode.kode_reff, nama_transaksi: kode.nama_transaksi, kelompok: kode.kelompok || '', uraian_kelompok: kode.uraian_kelompok || '', mutasi: kode.mutasi || 'DEBET' });
  };

  const handleHapus = async (id) => {
    if (!window.confirm('Hapus Kode Akun ini?')) return;
    await supabase.from('master_kode_akun').delete().eq('id', id);
    fetchData();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 animate-in fade-in duration-300">
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* TABEL */}
        <div className="flex-1 overflow-hidden rounded-xl border border-slate-200">
          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b sticky top-0 z-10">
                <tr className="text-slate-500">
                  <th className="py-3 px-3 font-semibold">Kode Reff</th>
                  <th className="py-3 px-3 font-semibold">Nama Transaksi</th>
                  <th className="py-3 px-3 font-semibold">Kelompok</th>
                  <th className="py-3 px-3 font-semibold text-center">Mutasi</th>
                  <th className="py-3 px-3 font-semibold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {daftarKodeAkun.map((kode) => (
                  <tr key={kode.id} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-mono font-bold text-blue-600">{kode.kode_reff}</td>
                    <td className="py-3 px-3 font-medium text-slate-700">{kode.nama_transaksi}</td>
                    <td className="py-3 px-3"><span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-semibold">{kode.kelompok}</span></td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${kode.mutasi === 'DEBET' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{kode.mutasi}</span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex justify-center gap-1">
                        <button onClick={() => handleEdit(kode)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={16} /></button>
                        <button onClick={() => handleHapus(kode.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FORM INPUT */}
        <div className="w-full lg:w-80 shrink-0">
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
            <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
              {editingKodeAkunId ? <><Edit2 size={16}/> Edit Kode Akun</> : <><Plus size={16}/> Tambah Kode Akun</>}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Kode Reff</label>
                <input type="text" value={kodeAkunBaru.kode_reff} onChange={(e) => setKodeAkunBaru({...kodeAkunBaru, kode_reff: e.target.value.toUpperCase()})} className="w-full px-3 py-2 border rounded-lg text-sm font-bold" placeholder="Cth: SP 4121" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Nama Transaksi</label>
                <input type="text" value={kodeAkunBaru.nama_transaksi} onChange={(e) => setKodeAkunBaru({...kodeAkunBaru, nama_transaksi: e.target.value.toUpperCase()})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Cth: Penjualan LPG" />
              </div>
              <hr className="border-blue-200 my-2" />
              <div>
                <label className="block text-xs font-bold text-blue-700 mb-1">Pengelompokan Akun (Manual)</label>
                <input type="text" value={kodeAkunBaru.kelompok} onChange={(e) => setKodeAkunBaru({...kodeAkunBaru, kelompok: e.target.value.toUpperCase()})} className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm" placeholder="Cth: PENDAPATAN" />
              </div>
              <div>
                <label className="block text-xs font-bold text-blue-700 mb-1">Uraian Kelompok</label>
                <input type="text" value={kodeAkunBaru.uraian_kelompok} onChange={(e) => setKodeAkunBaru({...kodeAkunBaru, uraian_kelompok: e.target.value})} className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm" placeholder="Cth: Pendapatan BBM" />
              </div>
              <div>
                <label className="block text-xs font-bold text-blue-700 mb-1">Mutasi Normal</label>
                <div className="flex gap-4 mt-1">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <input type="radio" value="DEBET" checked={kodeAkunBaru.mutasi === 'DEBET'} onChange={(e) => setKodeAkunBaru({...kodeAkunBaru, mutasi: e.target.value})} className="w-4 h-4 text-green-600" /> Debet
                  </label>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <input type="radio" value="KREDIT" checked={kodeAkunBaru.mutasi === 'KREDIT'} onChange={(e) => setKodeAkunBaru({...kodeAkunBaru, mutasi: e.target.value})} className="w-4 h-4 text-red-600" /> Kredit
                  </label>
                </div>
              </div>
              <div className="pt-3 flex gap-2">
                {editingKodeAkunId && (
                  <button onClick={() => { setEditingKodeAkunId(null); setKodeAkunBaru({ kode_reff: '', nama_transaksi: '', kelompok: '', uraian_kelompok: '', mutasi: 'DEBET' }); }} className="flex-1 bg-white border text-slate-600 py-2 rounded-lg text-sm font-medium">Batal</button>
                )}
                <button onClick={handleSimpan} disabled={isSaving} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex justify-center items-center gap-2">
                  {isSaving ? <><Loader2 className="animate-spin" size={16} /> Menyimpan...</> : <><Save size={16} /> Simpan</>}
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}