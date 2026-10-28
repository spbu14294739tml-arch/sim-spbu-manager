// src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { LogIn, Loader2, ArrowLeft, Briefcase, Calculator, ShoppingCart } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
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

  const getRoleName = (role) => {
    if (role === 'manager') return 'Manager';
    if (role === 'accounting') return 'Accounting';
    if (role === 'kasir') return 'Kasir';
    return role;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-slate-900 to-black p-4 font-sans relative overflow-hidden">
      
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-cyan-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>

      <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden border border-white/20 flex flex-col md:flex-row relative z-10">
        
        {/* KOLOM KIRI */}
        <div className="w-full md:w-5/12 bg-gradient-to-br from-blue-600 to-blue-800 p-8 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-bl-full opacity-10"></div>
          <div>
            <div className="bg-white/20 p-3 rounded-2xl inline-block mb-6 backdrop-blur-md border border-white/30">
              <span className="text-2xl font-bold">SP</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">SIM SPBU<br/>14.294.739</h1>
            <p className="text-blue-100 text-sm">PT. Tata Murdaya Laksana<br/>Batam Center</p>
          </div>
          <div className="mt-8">
            <p className="text-xs text-blue-200 italic">"Membangun cara kerja yang sehat, modern, dan terpusat."</p>
          </div>
        </div>

        {/* KOLOM KANAN */}
        <div className="w-full md:w-7/12 p-8 bg-white/95 backdrop-blur-sm flex flex-col justify-center">
          {!selectedRole ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Selamat Datang Kembali</h2>
                <p className="text-slate-500 mt-2">Silakan pilih hak akses Anda.</p>
              </div>

              {/* KARTU 1: MANAGER */}
              <button onClick={() => setSelectedRole('manager')} className="w-full group bg-white border-2 border-slate-200 rounded-2xl p-4 text-left hover:border-blue-500 hover:shadow-lg transition-all duration-300 flex items-center gap-4 relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-2 bg-blue-600 rounded-l-2xl"></div>
                <div className="bg-blue-100 w-12 h-12 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
                  <Briefcase size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Manager Operasional</h3>
                  <p className="text-xs text-slate-500 mt-1">Akses penuh semua modul (Database, Kasir, Laporan).</p>
                </div>
              </button>

              {/* KARTU 2: ACCOUNTING */}
              <button onClick={() => setSelectedRole('accounting')} className="w-full group bg-white border-2 border-slate-200 rounded-2xl p-4 text-left hover:border-green-500 hover:shadow-lg transition-all duration-300 flex items-center gap-4 relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-2 bg-green-500 rounded-l-2xl"></div>
                <div className="bg-green-100 w-12 h-12 rounded-xl flex items-center justify-center text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors shrink-0">
                  <Calculator size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Accounting</h3>
                  <p className="text-xs text-slate-500 mt-1">Akses modul keuangan, absensi, dan laporan.</p>
                </div>
              </button>

              {/* KARTU 3: KASIR (BARU) */}
              <button onClick={() => setSelectedRole('kasir')} className="w-full group bg-white border-2 border-slate-200 rounded-2xl p-4 text-left hover:border-orange-500 hover:shadow-lg transition-all duration-300 flex items-center gap-4 relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-2 bg-orange-500 rounded-l-2xl"></div>
                <div className="bg-orange-100 w-12 h-12 rounded-xl flex items-center justify-center text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors shrink-0">
                  <ShoppingCart size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Kasir / Operator</h3>
                  <p className="text-xs text-slate-500 mt-1">Akses input penjualan BBM, NFR, dan laporan setoran.</p>
                </div>
              </button>
            </div>
          ) : (
            <div className="max-w-sm mx-auto w-full animate-in fade-in zoom-in-95 duration-300">
              <button onClick={() => { setSelectedRole(null); setErrorMsg(''); }} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-6 font-medium transition-colors text-sm">
                <ArrowLeft size={16} /> Kembali ke Pilihan
              </button>

              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-800">
                  Login {getRoleName(selectedRole)}
                </h2>
                <p className="text-slate-500 mt-1 text-sm">Masukkan kredensial akun Anda.</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                {errorMsg && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100 text-center">
                    {errorMsg}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-slate-50 focus:bg-white" placeholder="spbu14294739tml@gmail.com" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-slate-50 focus:bg-white" placeholder="••••••••" />
                </div>

                <button type="submit" disabled={isLoading} 
                  className={`w-full text-white font-semibold py-3 rounded-xl transition-all flex justify-center items-center gap-2 mt-4 disabled:opacity-70 shadow-lg 
                    ${selectedRole === 'manager' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30' : 
                      selectedRole === 'accounting' ? 'bg-green-600 hover:bg-green-700 shadow-green-500/30' : 
                      'bg-orange-600 hover:bg-orange-700 shadow-orange-500/30'}`}>
                  {isLoading ? <><Loader2 className="animate-spin" size={20} /> Memeriksa...</> : <><LogIn size={20} /> Masuk ke Sistem</>}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}