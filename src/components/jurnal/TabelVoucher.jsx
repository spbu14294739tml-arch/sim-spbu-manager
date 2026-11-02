// src/components/jurnal/TabelVoucher.jsx
import React from 'react';
import { Ticket, AlertTriangle } from 'lucide-react';
import { formatRupiah } from '../../lib/formatHelper';
import { generateNomorLembar } from '../../lib/jurnalHelpers';

/**
 * Tabel daftar bundel voucher + checklist per lembar.
 * Murni presentational — state checklist & proses tetap di parent.
 *
 * @param {object}   props
 * @param {Array}    props.daftarVoucherHariIni  - daftar bundel voucher
 * @param {object}   props.checklistSementara    - map { voucherId: [noLembar, ...] }
 * @param {function} props.onToggleChecklist     - callback centang (voucherId, noLembar)
 * @param {function} props.onSimpanChecklist     - callback proses checklist (bundel)
 * @param {boolean}  props.isSaving              - disable tombol saat proses
 */
export default function TabelVoucher({
  daftarVoucherHariIni,
  checklistSementara,
  onToggleChecklist,
  onSimpanChecklist,
  isSaving,
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in">
      <div className="p-4 border-b border-slate-100 bg-purple-50 flex justify-between items-center">
        <h2 className="text-sm font-bold text-purple-900 flex items-center gap-2">
          <Ticket size={16} className="text-purple-600" /> Daftar Bundel Voucher
        </h2>
        <p className="text-xs text-purple-600 font-medium">Centang nomor lembar, lalu klik Aksi</p>
      </div>

      <div className="overflow-x-auto max-h-[300px]">
        <table className="w-full text-xs">
          <thead className="bg-white text-slate-500 sticky top-0 z-10 border-b">
            <tr>
              <th className="px-3 py-3 text-left">No Voucher</th>
              <th className="px-3 py-3 text-left">Customer</th>
              <th className="px-3 py-3 text-right">Nominal/Lembar</th>
              <th className="px-3 py-3 text-center">Checklist Masuk</th>
              <th className="px-3 py-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {daftarVoucherHariIni.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-slate-400">
                  Belum ada input voucher hari ini.
                </td>
              </tr>
            ) : daftarVoucherHariIni.map((v) => {
              const lembaran = generateNomorLembar(v);
              const isExpired = v.tanggal_kedaluwarsa && new Date(v.tanggal_kedaluwarsa) < new Date();
              const checkedList = checklistSementara[v.id] || [];

              return (
                <tr key={v.id} className="hover:bg-slate-50">
                  <td className="px-3 py-3 font-bold text-slate-700">
                    {v.no_voucher}
                    {isExpired && (
                      <span className="block text-[9px] text-red-500 mt-1">
                        <AlertTriangle size={10} className="inline" /> HANGUS
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-slate-600">{v.nama_customer}</td>
                  <td className="px-3 py-3 text-right font-mono font-semibold text-purple-700">
                    {formatRupiah(v.nominal)}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1 justify-center">
                      {lembaran.map((l, i) => {
                        const isChecked = checkedList.includes(l.no);
                        return (
                          <label
                            key={i}
                            className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
                              l.sudahMasuk
                                ? 'bg-green-100 text-green-700 border-green-300 cursor-not-allowed'
                                : isExpired
                                  ? 'bg-red-50 text-red-400 border-red-200 cursor-not-allowed'
                                  : isChecked
                                    ? 'bg-blue-100 text-blue-700 border-blue-300'
                                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="hidden"
                              disabled={l.sudahMasuk || isExpired}
                              checked={l.sudahMasuk || isChecked}
                              onChange={() => onToggleChecklist(v.id, l.no)}
                            />
                            {l.no} {l.sudahMasuk && '✓'}
                          </label>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <button
                      onClick={() => onSimpanChecklist(v)}
                      disabled={checkedList.length === 0 || isSaving}
                      className={`px-3 py-1.5 rounded-lg font-semibold text-[10px] shadow-sm transition-colors ${
                        checkedList.length > 0
                          ? 'bg-purple-600 text-white hover:bg-purple-700'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      Proses Checklist ({checkedList.length})
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}