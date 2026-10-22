// src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { LogIn, Loader2, ArrowLeft, Briefcase, Calculator } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // State untuk memilih jabatan (null = belum pilih, 'manager' = form manager, 'accounting' = form accounting)
  const [selectedRole, setSelectedRole] = useState(null); 
  
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      setErrorMsg(error.message);
      setIsLoading(false);
    } else {
      navigate('/'); 
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4 font-sans">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100">
        
        {/* HEADER SPBU */}
        <div className="bg-slate-900 p-6 text-center text-white relative">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-900/50">
            <span className="text-2xl font-bold">SP</span>
          </div>
          <h1 className="text-xl font-bold tracking-wide">SPBU 14.294.739</h1>
          <p className="text-slate-400 text-sm mt-1">PT. Tata Murdaya Laksana - Batam Center</p>
        </div>

        <div className="p-8">
          {/* JIKA BELUM PILIH JABATAN (Tampilan Kartu) */}
          {!selectedRole ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-800">🔐 Silakan Pilih Jabatan Anda</h2>
                <p className="text-slate-500 mt-2">Klik kartu jabatan untuk melanjutkan login</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Kartu Manager */}
                <button 
                  onClick={() => setSelectedRole('manager')}
                  className="group relative bg-white border-2 border-slate-200 rounded-2xl p-6 text-left hover:border-blue-500 hover:shadow-lg transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
                  <div className="bg-blue-100 w-12 h-12 rounded-xl flex items-center justify-center mb-4 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Briefcase size={24} />
                  </div>
                  <h3 className="font-bold text-lg text-slate-800">Manager Operasional</h3>
                  <p className="text-sm text-slate-500 mt-1">Akses penuh semua modul (Database, Laporan, Tugas).</p>
                  <div className="mt-4 flex items-center text-blue-600 font-medium text-sm">
                    Login <ArrowLeft size={16} className="ml-1 rotate-180" />
                  </div>
                </button>

                {/* Kartu Accounting */}
                <button 
                  onClick={() => setSelectedRole('accounting')}
                  className="group relative bg-white border-2 border-slate-200 rounded-2xl p-6 text-left hover:border-green-500 hover:shadow-lg transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
                  <div className="bg-green-100 w-12 h-12 rounded-xl flex items-center justify-center mb-4 text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors">
                    <Calculator size={24} />
                  </div>
                  <h3 className="font-bold text-lg text-slate-800">Accounting</h3>
                  <p className="text-sm text-slate-500 mt-1">Akses modul keuangan, gaji, dan laporan.</p>
                  <div className="mt-4 flex items-center text-green-600 font-medium text-sm">
                    Login <ArrowLeft size={16} className="ml-1 rotate-180" />
                  </div>
                </button>
              </div>
            </div>
          ) : (
            /* JIKA SUDAH PILIH JABATAN (Tampilan Form Email/Password) */
            <div className="max-w-md mx-auto animate-in fade-in zoom-in-95 duration-300">
              <button 
                onClick={() => { setSelectedRole(null); setErrorMsg(''); }} 
                className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-6 font-medium transition-colors"
              >
                <ArrowLeft size={18} /> Kembali ke Pilihan Jabatan
              </button>

              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-800">
                  Login sebagai {selectedRole === 'manager' ? 'Manager' : 'Accounting'}
                </h2>
                <p className="text-slate-500 mt-1 text-sm">Masukkan kredensial akun Anda.</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                {errorMsg && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100 text-center">
                    {errorMsg}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="spbu14294739tml@gmail.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full text-white font-semibold py-3 rounded-xl transition-colors flex justify-center items-center gap-2 mt-2 disabled:opacity-70 ${
                    selectedRole === 'manager' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {isLoading ? <><Loader2 className="animate-spin" size={20} /> Memeriksa...</> : 'Masuk ke Sistem'}
                </button>
              </form>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}