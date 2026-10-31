import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Plus, Trash2, Loader2 } from 'lucide-react';

export default function TabShift() {
  const [daftarShift, setDaftarShift] = useState([]);
  const [shiftBaru, setShiftBaru] = useState({ nama_shift: '', jam_kerja: '' });
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => {
    const { data } = await supabase.from('pengaturan_shift').select('*').order('id');
    if (data) setDaftarShift(data);
  };
  useEffect(() => { fetchData(); }, []);

  const handleTambahShift = async () => {
    if (!shiftBaru.nama_shift || !shiftBaru.jam_kerja) return alert('Lengkapi data shift!');
    if (isSaving) return;
    setIsSaving(true);
    await supabase.from('pengaturan_shift').insert([shiftBaru]);
    setShiftBaru({ nama_shift: '', jam_kerja: '' });
    fetchData();
    setIsSaving(false);
  };

  const handleHapusShift = async (id) => {
    if (!window.confirm('Hapus shift ini?')) return;
    await supabase.from('pengaturan_shift').delete().eq('id', id);
    fetchData();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 animate-in fade-in duration-300">
      <div className="space-y-3 mb-6">
        {daftarShift.map((shift) => (
          <div key={shift.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div><span className="font-semibold text-slate-700">{shift.nama_shift}:</span> <span className="text-slate-600">{shift.jam_kerja}</span></div>
            <button onClick={() => handleHapusShift(shift.id)} className="text-red-500 hover:bg-red-100 p-2 rounded-lg"><Trash2 size={18} /></button>
          </div>
        ))}
      </div>
      <div className="flex gap-3 items-end bg-blue-50 p-4 rounded-lg border border-blue-100">
        <div className="flex-1">
          <label className="block text-xs font-medium text-slate-600 mb-1">Nama Shift</label>
          <input type="text" value={shiftBaru.nama_shift} onChange={(e) => setShiftBaru({...shiftBaru, nama_shift: e.target.value})} className="w-full px-3 py-2 border rounded-lg" placeholder="Cth: Shift 1" />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-slate-600 mb-1">Jam Kerja</label>
          <input type="text" value={shiftBaru.jam_kerja} onChange={(e) => setShiftBaru({...shiftBaru, jam_kerja: e.target.value})} className="w-full px-3 py-2 border rounded-lg" placeholder="Cth: 08:00 - 16:00" />
        </div>
        <button onClick={handleTambahShift} disabled={isSaving} className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 hover:bg-blue-700">
          {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />} Tambah
        </button>
      </div>
    </div>
  );
}