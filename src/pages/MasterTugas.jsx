// src/pages/MasterTugas.jsx
import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Plus, Users, Shield, X, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function MasterTugas() {
  const [tugasList, setTugasList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // State untuk Modal Tambah Tugas
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tipeTugas, setTipeTugas] = useState('CS'); 
  const [teksTugasBaru, setTeksTugasBaru] = useState('');

  // FUNGSI 1: Ambil data dari Supabase
  const fetchTugas = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('master_tugas')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('Error mengambil data tugas:', error);
      alert('Gagal mengambil data tugas dari Cloud.');
    } else {
      setTugasList(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTugas();
  }, []);

  // FUNGSI 2: Toggle Centang (Update ke Supabase)
  const toggleTugas = async (id, currentStatus) => {
    // Optimistic Update: Ubah tampilan dulu agar terasa cepat
    setTugasList(tugasList.map(t => t.id === id ? { ...t, selesai: !currentStatus } : t));

    const { error } = await supabase
      .from('master_tugas')
      .update({ selesai: !currentStatus })
      .eq('id', id);

    if (error) {
      console.error('Error update status tugas:', error);
      fetchTugas(); // Kembalikan ke keadaan semula jika gagal
    }
  };

  // FUNGSI 3: Hapus Tugas dari Supabase
  const handleHapusTugas = async (id, e) => {
    e.stopPropagation(); // Mencegah modal/centang ikut terklik
    if (!window.confirm('Hapus tugas ini dari database?')) return;

    const { error } = await supabase.from('master_tugas').delete().eq('id', id);
    if (error) {
      console.error('Error hapus tugas:', error);
      alert('Gagal menghapus tugas.');
    } else {
      fetchTugas();
    }
  };

  // Fungsi Buka Modal Tambah
  const bukaModal = (tipe) => {
    setTipeTugas(tipe);
    setTeksTugasBaru('');
    setIsModalOpen(true);
  };

  // FUNGSI 4: Simpan Tugas Baru ke Supabase
  const handleSimpanTugas = async (e) => {
    e.preventDefault();
    if (!teksTugasBaru.trim()) return;

    const newTugas = {
      kategori: tipeTugas,
      teks: teksTugasBaru,
      selesai: false
    };

    const { error } = await supabase.from('master_tugas').insert([newTugas]);

    if (error) {
      console.error('Error simpan tugas:', error);
      alert('Gagal menyimpan tugas ke Cloud.');
    } else {
      setIsModalOpen(false);
      fetchTugas();
    }
  };

  // Komponen Card Tugas (Reusable)
  const CardTugas = ({ title, icon, kategori, colorTheme }) => {
    const filteredTugas = tugasList.filter(t => t.kategori === kategori);

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full">
        <div className={`p-5 border-b border-slate-100 flex items-center justify-between ${colorTheme.bg}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${colorTheme.iconBg} ${colorTheme.iconColor}`}>
              {icon}
            </div>
            <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          </div>
          <button 
            onClick={() => bukaModal(kategori)}
            className="p-2 bg-white rounded-lg text-slate-500 hover:text-blue-600 shadow-sm transition-colors border border-slate-200" 
            title="Tambah Tugas"
          >
            <Plus size={18} />
          </button>
        </div>
        
        <div className="p-5 flex-1 overflow-y-auto max-h-[400px]">
          {isLoading ? (
            <div className="text-center text-slate-400 py-6 text-sm flex flex-col items-center">
              <Loader2 className="animate-spin mb-2" size={20} /> Memuat...
            </div>
          ) : filteredTugas.length > 0 ? (
            <ul className="space-y-3">
              {filteredTugas.map((tugas) => (
                <li 
                  key={tugas.id} 
                  onClick={() => toggleTugas(tugas.id, tugas.selesai)}
                  className={`group flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                    tugas.selesai 
                      ? 'bg-slate-50 border-slate-200' 
                      : 'bg-white border-slate-100 hover:border-blue-200 hover:shadow-sm'
                  }`}
                >
                  <div className="mt-0.5 flex-shrink-0">
                    {tugas.selesai ? (
                      <CheckCircle2 className="text-green-500" size={20} />
                    ) : (
                      <Circle className="text-slate-300" size={20} />
                    )}
                  </div>
                  <span className={`text-sm flex-1 ${tugas.selesai ? 'text-slate-400 line-through' : 'text-slate-700 font-medium'}`}>
                    {tugas.teks}
                  </span>
                  <button 
                    onClick={(e) => handleHapusTugas(tugas.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                    title="Hapus Tugas"
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center text-slate-400 py-6 text-sm">
              Belum ada tugas untuk kategori ini.
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Master Tugas</h1>
        <p className="text-slate-500 mt-1">Kelola Job Description harian untuk operasional SPBU.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CardTugas 
          title="Tugas Customer Service (CS)" 
          icon={<Users size={20} />} 
          kategori="CS"
          colorTheme={{ bg: 'bg-blue-50/50', iconBg: 'bg-blue-100', iconColor: 'text-blue-600' }}
        />
        
        <CardTugas 
          title="Tugas Security" 
          icon={<Shield size={20} />} 
          kategori="Security"
          colorTheme={{ bg: 'bg-orange-50/50', iconBg: 'bg-orange-100', iconColor: 'text-orange-600' }}
        />
      </div>

      {/* MODAL TAMBAH TUGAS */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">
                Tambah Tugas {tipeTugas === 'CS' ? 'Customer Service' : 'Security'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSimpanTugas} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi Tugas</label>
                <textarea
                  required
                  value={teksTugasBaru}
                  onChange={(e) => setTeksTugasBaru(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-24"
                  placeholder="Ketik detail tugas di sini..."
                ></textarea>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors shadow-sm"
                >
                  Simpan Tugas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}