// src/pages/ScanVoucher.jsx
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { formatRupiah } from '../lib/formatHelper';
import { Barcode, CheckCircle2, XCircle, Search, Loader2 } from 'lucide-react';

export default function ScanVoucher() {
  const [scanValue, setScanValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null); // { type: 'success'|'error', message: '', detail: {} }
  const inputRef = useRef(null);

  // Fokus otomatis ke kotak input
  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const handleScan = async (e) => {
    e.preventDefault();
    if (!scanValue.trim() || isProcessing) return;

    setIsProcessing(true);
    setResult(null);
    
    const cleanNo = scanValue.split('-')[0].trim(); 

    try {
      const { data: vouchers, error } = await supabase
        .from('penjualan_voucher')
        .select('*')
        .ilike('no_voucher', `${cleanNo}%`); 

      if (error) throw error;
      if (!vouchers || vouchers.length === 0) {
        throw new Error(`Nomor Voucher ${cleanNo} tidak ditemukan di sistem!`);
      }

      const voucher = vouchers[0]; 

      if (voucher.status_voucher === 'MASUK') {
        throw new Error(`Voucher ${voucher.no_voucher} SUDAH PERNAH DI-SCAN / MASUK!`);
      }

      const today = new Date();
      if (voucher.tanggal_kedaluwarsa && new Date(voucher.tanggal_kedaluwarsa) < today) {
        throw new Error(`Voucher ${voucher.no_voucher} sudah HANGUS (Kedaluwarsa).`);
      }

      const { data: jurnalHariIni } = await supabase
        .from('jurnal_kasir')
        .select('saldo')
        .eq('tanggal', today.toISOString().split('T')[0])
        .order('created_at', { ascending: false })
        .limit(1);

      const saldoTerakhir = jurnalHariIni && jurnalHariIni.length > 0 ? jurnalHariIni[0].saldo : 0;
      const nominalMasuk = voucher.nominal; 
      const saldoBaru = saldoTerakhir + nominalMasuk;

      const { error: updateError } = await supabase
        .from('penjualan_voucher')
        .update({ status_voucher: 'MASUK' })
        .eq('id', voucher.id);

      if (updateError) throw updateError;

      await supabase.from('jurnal_kasir').insert([{
        tanggal: today.toISOString().split('T')[0],
        shift: 'SCAN', 
        dari_ke: `VOUCHER - ${voucher.nama_customer}`,
        uraian_kegiatan: `Scan Voucher BBM (No. ${voucher.no_voucher})`,
        reff: 'SP-2100',
        debet: nominalMasuk,
        kredit: 0,
        saldo: saldoBaru,
        created_by: 'Scanner UV'
      }]);

      setResult({
        type: 'success',
        message: 'VOUCHER BERHASIL DICATAT!',
        detail: {
          no_voucher: voucher.no_voucher,
          customer: voucher.nama_customer,
          nominal: formatRupiah(nominalMasuk)
        }
      });

    } catch (err) {
      setResult({
        type: 'error',
        message: err.message || 'Terjadi kesalahan sistem.'
      });
    } finally {
      setIsProcessing(false);
      setScanValue(''); 
      if (inputRef.current) inputRef.current.focus(); 
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto min-h-screen flex flex-col justify-center">
      <div className="text-center mb-8">
        <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Barcode size={40} className="text-blue-600" />
        </div>
        <h1 className="text-3xl font-black text-slate-800">Scan Voucher Masuk</h1>
        <p className="text-slate-500 mt-2">Arahkan scanner ke barcode/stiker pada fisik voucher.</p>
      </div>

      <form onSubmit={handleScan} className="mb-8 relative">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={scanValue}
            onChange={(e) => setScanValue(e.target.value)}
            disabled={isProcessing}
            placeholder="Menunggu Scan Barcode..."
            className="w-full text-center text-2xl font-bold tracking-widest px-6 py-6 border-4 border-blue-400 rounded-3xl focus:outline-none focus:ring-8 focus:ring-blue-100 transition-all bg-white shadow-lg placeholder:text-slate-300"
          />
          <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400">
            {isProcessing ? <Loader2 className="animate-spin" size={28} /> : <Search size={28} />}
          </div>
        </div>
        <button type="submit" className="hidden">Scan</button>
      </form>

      {result && (
        <div className={`p-6 rounded-3xl border-4 animate-in fade-in zoom-in duration-300 ${
          result.type === 'success' 
            ? 'bg-green-50 border-green-500 text-green-800' 
            : 'bg-red-50 border-red-500 text-red-800'
        }`}>
          <div className="flex flex-col items-center text-center gap-3">
            {result.type === 'success' 
              ? <CheckCircle2 size={64} className="text-green-500" /> 
              : <XCircle size={64} className="text-red-500" />
            }
            <h2 className="text-2xl font-black uppercase">{result.message}</h2>
            
            {result.type === 'success' && (
              <div className="mt-2 bg-white px-6 py-4 rounded-2xl shadow-sm w-full">
                <div className="flex justify-between text-sm mb-2 border-b pb-2">
                  <span className="text-slate-500 font-semibold">No. Voucher:</span>
                  <span className="font-bold text-slate-800 text-lg">{result.detail.no_voucher}</span>
                </div>
                <div className="flex justify-between text-sm mb-2 border-b pb-2">
                  <span className="text-slate-500 font-semibold">Customer:</span>
                  <span className="font-bold text-slate-800">{result.detail.customer}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-semibold">Nominal Masuk:</span>
                  <span className="font-bold text-green-600 text-lg">{result.detail.nominal}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      <p className="text-center text-slate-400 text-sm mt-8">
        *Jangan tutup halaman ini saat proses scan berlangsung.
      </p>
    </div>
  );
}