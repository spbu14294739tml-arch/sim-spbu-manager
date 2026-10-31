import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Loader2, Save } from 'lucide-react';

export default function TabProfil() {
  const [isSaving, setIsSaving] = useState(false);
  const [notif, setNotif] = useState('');
  const [profil, setProfil] = useState({ nama_spbu: '', nomor_izin: '', alamat: '', telepon: '', email: '' });

  useEffect(() => {
    const fetchProfil = async () => {
      const { data } = await supabase.from('profil_spbu').select('*').eq('id', 1).single();
      if (data) setProfil(data);
    };
    fetchProfil();
  }, []);

  const handleSimpanProfil = async (e) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    await supabase.from('profil_spbu').update({
      nama_spbu: profil.nama_spbu, nomor_izin: profil.nomor_izin, alamat: profil.alamat, telepon: profil.telepon, email: profil.email
    }).eq('id', 1);
    setIsSaving(false);
    setNotif('Profil SPBU berhasil disimpan!'); setTimeout(() => setNotif(''), 3000);
  };

  return (
    <form onSubmit={handleSimpanProfil} className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 animate-in fade-in duration-300">
      {notif && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">{notif}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nama SPBU</label>
          <input type="text" value={profil.nama_spbu || ''} onChange={(e) => setProfil({...profil, nama_spbu: e.target.value})} className="w-full px-4 py-2 border rounded-xl" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Badan Hukum / Izin</label>
          <input type="text" value={profil.nomor_izin || ''} onChange={(e) => setProfil({...profil, nomor_izin: e.target.value})} className="w-full px-4 py-2 border rounded-xl" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">Alamat</label>
          <textarea value={profil.alamat || ''} onChange={(e) => setProfil({...profil, alamat: e.target.value})} rows="2" className="w-full px-4 py-2 border rounded-xl"></textarea>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Telepon</label>
          <input type="text" value={profil.telepon || ''} onChange={(e) => setProfil({...profil, telepon: e.target.value})} className="w-full px-4 py-2 border rounded-xl" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <input type="email" value={profil.email || ''} onChange={(e) => setProfil({...profil, email: e.target.value})} className="w-full px-4 py-2 border rounded-xl" />
        </div>
      </div>
      <div className="mt-6 flex justify-end">
        <button type="submit" disabled={isSaving} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:bg-blue-700">
          {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Simpan Profil
        </button>
      </div>
    </form>
  );
}