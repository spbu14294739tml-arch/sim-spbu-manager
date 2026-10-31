import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { formatRupiah } from '../../lib/formatHelper';
import { BookOpen, Trash2, Loader2 } from 'lucide-react';

export default function TabelJurnal({ isSaving, setIsSaving }) {
  const [jurnalHariIni, setJurnalHariIni] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchJurnal = async () => {
    setIsLoading(true);
    const { data } = await supabase.from('jurnal_kasir').select('*').order('created_at', { ascending: true });
    if (data) setJurnalHariIni(data);
    setIsLoading(false);
  };

  useEffect(() => { fetchJurnal(); }, []);

  const handleHapus = async (id, uraian) => {
    if (!window.confirm(`Hapus transaksi "${uraian}"?`)) return;
    setIsSaving(true);
    await supabase.from('jurnal_kasir').delete().eq('id', id);
    fetchJurnal();
    setIsSaving(false);
  };

  if (isLoading) return <div className="text-center p-8"><Loader2 className="animate-spin mx-auto text-blue-500" /></div>;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-4 border-b bg-slate-50 flex justify-between">
        <h2 className="font-bold flex items-center gap-2"><BookOpen size={16} /> Buku Jurnal</h2>
        <span className="text-xs text-slate-500">{jurnalHariIni.length} transaksi</span>
      </div>
      <table className="w-full text-xs">
        <thead className="bg-slate-100">
          <tr>
            <th className="px-3 py-2 text-left">Uraian</th>
            <th className="px-3 py-2 text-right">Debet</th>
            <th className="px-3 py-2 text-right">Kredit</th>
            <th className="px-3 py-2 text-center">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {jurnalHariIni.map((item) => (
            <tr key={item.id} className="hover:bg-slate-50">
              <td className="px-3 py-2">{item.uraian_kegiatan}</td>
              <td className="px-3 py-2 text-right text-green-600">{item.debet > 0 ? formatRupiah(item.debet) : '-'}</td>
              <td className="px-3 py-2 text-right text-red-600">{item.kredit > 0 ? formatRupiah(item.kredit) : '-'}</td>
              <td className="px-3 py-2 text-center">
                <button onClick={() => handleHapus(item.id, item.uraian_kegiatan)} className="text-red-500 hover:text-red-700">
                  <Trash2 size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}