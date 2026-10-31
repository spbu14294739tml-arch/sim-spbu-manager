import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Plus, Trash2, Loader2 } from 'lucide-react';

export default function TabJabatan() {
  const [daftarJabatan, setDaftarJabatan] = useState([]);
  const [jabatanBaru, setJabatanBaru] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => {
    const { data } = await supabase.from('master_jabatan').select('*').order('nama_jabatan');
    if (data) setDaftarJabatan(data);
  };
  useEffect(() => { fetchData(); }, []);

  const handleTambahJabatan = async () => {
    if (!jabatanBaru) return alert('Masukkan nama jabatan!');
    if (isSaving) return;
    setIsSaving(true);
    await supabase.from('master_jabatan').insert([{ nama_jabatan: jabatanBaru.toUpperCase() }]);
    setJabatanBaru('');
    fetchData();
    setIsSaving(false);
  };

  const handleHapusJabatan = async (id) => {
    if (!window.confirm('Hapus jabatan ini?')) return;
    await supabase.from('master_jabatan').delete().eq('id', id);
    fetchData();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 animate-in fade-in duration-300">
      <div className="space-y-3 mb-6">
        {daftarJabatan.map((jabatan) => (
          <div key={jabatan.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
            <span className="font-semibold text-slate-700">{jabatan.nama_jabatan}</span>
            <button onClick={() => handleHapusJabatan(jabatan.id)} className="text-red-500 hover:bg-red-100 p-2 rounded-lg"><Trash2 size={18} /></button>
          </div>
        ))}
      </div>
      <div className="flex gap-3 items-end bg-blue-50 p-4 rounded-lg border border-blue-100">
        <div className="flex-1">
          <label className="block text-xs font-medium text-slate-600 mb-1">Nama Jabatan Baru</label>
          <input type="text" value={jabatanBaru} onChange={(e) => setJabatanBaru(e.target.value)} className="w-full px-3 py-2 border rounded-lg" placeholder="Cth: SUPERVISOR" />
        </div>
        <button onClick={handleTambahJabatan} disabled={isSaving} className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 hover:bg-blue-700">
          {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />} Tambah
        </button>
      </div>
    </div>
  );
}