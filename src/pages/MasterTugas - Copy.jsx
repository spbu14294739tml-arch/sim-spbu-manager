// src/pages/MasterTugas.jsx
import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Plus, Users, Shield, X, Trash2, Loader2, ClipboardList } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function MasterTugas() {
  const [tugasList, setTugasList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // State untuk Modal Tambah Tugas
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tipeTugas, setTipeTugas] = useState('CS'); 
  const [teksTugasBaru, setTeksTugasBaru] = useState('');

  // State untuk memilih kategori (null = belum pilih, 'CS' atau 'Security')
  const [selectedCategory, setSelectedCategory] = useState(null);

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

  const toggleTugas = async (id, currentStatus) => {
    setTugasList(tugasList.map(t => t.id === id ? { ...t, selesai: !currentStatus } : t));

    const { error } = await supabase
      .from('master_tugas')
      .update({ selesai: !currentStatus })
      .eq('id', id);

    if (error) {
      console.error('Error update status tugas:', error);
      fetchTugas(); 
    }
  };

  const handleHapusTugas = async (id, e) => {
    e.stopPropagation(); 
    if (!window.confirm('Hapus tugas ini dari database?')) return;

    const { error } = await supabase.from('master_tugas').delete().eq('id', id);
    if (error) {
      console.error('Error hapus tugas:', error);
      alert('Gagal menghapus tugas.');
    } else {
      fetchTugas();
    }
  };

  const bukaModal = (tipe) => {
    setTipeTugas(tipe);
    setTeksTugasBaru('');
    setIsModalOpen(true);
  };

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

  // Komponen Card Menu Kategori
  const CategoryCard = ({ title, icon, category, colorTheme, count }) => (
    <button 
      onClick={() => setSelectedCategory(category)}
      className="group relative bg-white border-2 border-slate-200 rounded-3xl p-6 text-left hover:border-blue-500 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col items-center text-center w-full"
    >
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-bl-full -z-10 opacity-20 group-hover:scale-110 transition-transform ${colorTheme.bg}`}></div>
      <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-4 transition-colors ${colorTheme.iconBg} ${colorTheme.iconColor} group-hover:bg-blue-600 group-hover:text-white`}>
        {icon}
      </div>
      <h3 className="font-bold text-xl text-slate-800 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 mb-4">{count} Tugas Terdaftar</p>
      <div className="mt-auto flex items-center text-blue-600 font-medium text-sm bg-blue-50 px-4 py-2 rounded-lg group-hover:bg-blue-100 transition-colors">
        Lihat & Kelola Tugas <ArrowRightIcon />
      </div>
    </button>
  );

  const ArrowRightIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
  );

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={32} /></div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Master Tugas</h1>
        <p className="text-slate-500 mt-1">Kelola Job Description harian untuk operasional SPBU.</p>
      </div>

      {!selectedCategory ? (
        // TAMPILAN MENU KARTU (Seperti Halaman Login)
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CategoryCard 
            title="Customer Service"
            icon={<Users size={40} />}
            category="CS"
            colorTheme={{ bg: 'bg-blue-100', iconBg: 'bg-blue-50', iconColor: 'text-blue-600' }}
            count={tugasList.filter(t => t.kategori === 'CS').length}
          />
          <CategoryCard 
            title="Security"
            icon={<Shield size={40} />}
            category="Security"
            colorTheme={{ bg: 'bg-orange-100', iconBg: 'bg-orange-50', iconColor: 'text-orange-600' }}
            count={tugasList.filter(t => t.kategori === 'Security').length}
          />
        </div>
      ) : (
        // TAMPILAN DAFTAR TUGAS (Setelah Kategori Dipilih)
        <div className="animate-in fade-in zoom-in-95 duration-300">
          <button 
            onClick={() => setSelectedCategory(null)} 
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-6 font-medium transition-colors bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 w-fit"
          >
            <ArrowLeftIcon /> Kembali ke Pilihan Kategori
          </button>

          <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden">
            <div className={`p-6 border-b border-slate-100 flex justify-between items-center ${selectedCategory === 'CS' ? 'bg-blue-50/50' : 'bg-orange-50/50'}`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${selectedCategory === 'CS' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                  {selectedCategory === 'CS' ? <Users size={24} /> : <Shield size={24} />}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Daftar Tugas {selectedCategory === 'CS' ? 'Customer Service' : 'Security'}</h2>
                  <p className="text-sm text-slate-500">Total: {tugasList.filter(t => t.kategori === selectedCategory).length} Tugas</p>
                </div>
              </div>
              <button 
                onClick={() => bukaModal(selectedCategory)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 shadow-sm transition-colors"
              >
                <Plus size={18} /> Tambah Tugas
              </button>
            </div>

            <div className="p-6">
              {tugasList.filter(t => t.kategori === selectedCategory).length > 0 ? (
                <ul className="space-y-3">
                  {tugasList.filter(t => t.kategori === selectedCategory).map((tugas) => (
                    <li 
                      key={tugas.id} 
                      onClick={() => toggleTugas(tugas.id, tugas.selesai)}
                      className={`group flex items-start gap-4 p-4 rounded-2xl cursor-pointer transition-all border ${
                        tugas.selesai 
                          ? 'bg-slate-50 border-slate-200' 
                          : 'bg-white border-slate-100 hover:border-blue-200 hover:shadow-md'
                      }`}
                    >
                      <div className="mt-0.5 flex-shrink-0">
                        {tugas.selesai ? (
                          <CheckCircle2 className="text-green-500" size={24} />
                        ) : (
                          <Circle className="text-slate-300 group-hover:text-blue-400 transition-colors" size={24} />
                        )}
                      </div>
                      <span className={`text-base flex-1 ${tugas.selesai ? 'text-slate-400 line-through' : 'text-slate-700 font-medium'}`}>
                        {tugas.teks}
                      </span>
                      <button 
                        onClick={(e) => handleHapusTugas(tugas.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Hapus Tugas"
                      >
                        <Trash2 size={18} />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <ClipboardList size={48} className="mx-auto mb-3 opacity-20" />
                  <p>Belum ada tugas untuk kategori ini.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH TUGAS */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">
                Tambah Tugas {tipeTugas === 'CS' ? 'Customer Service' : 'Security'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSimpanTugas} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Deskripsi Tugas</label>
                <textarea
                  required
                  value={teksTugasBaru}
                  onChange={(e) => setTeksTugasBaru(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-32"
                  placeholder="Ketik detail tugas di sini..."
                ></textarea>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors shadow-sm"
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

// Komponen Ikon Panah Kiri (Untuk Tombol Kembali)
const ArrowLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
);