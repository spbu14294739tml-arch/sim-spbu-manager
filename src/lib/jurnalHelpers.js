// src/lib/jurnalHelpers.js
// Kumpulan fungsi bantu untuk halaman Jurnal Transaksi Kasir.
// Dipisah dari komponen agar reusable & mudah di-test.

/**
 * Hitung total lembar voucher dari range nomor awal - akhir.
 * @param {string|number} noAwal
 * @param {string|number} noAkhir
 * @returns {number} jumlah lembar (0 jika invalid)
 */
export function hitungTotalLembar(noAwal, noAkhir) {
  const awal = parseInt(noAwal);
  const akhir = parseInt(noAkhir);
  if (!isNaN(awal) && !isNaN(akhir) && akhir >= awal) return (akhir - awal) + 1;
  return 0;
}

/**
 * Generate daftar nomor lembar voucher dari sebuah bundel.
 * @param {object} bundel - objek penjualan_voucher (punya no_voucher & voucher_masuk)
 * @returns {Array<{no: string, sudahMasuk: boolean}>}
 */
export function generateNomorLembar(bundel) {
  if (!bundel || !bundel.no_voucher) return [];
  const [awal, akhir] = bundel.no_voucher.split('-').map(s => parseInt(s.trim()));
  const nomorLembar = [];
  if (!isNaN(awal) && !isNaN(akhir)) {
    for (let i = awal; i <= akhir; i++) {
      const noStr = i.toString().padStart(4, '0');
      const sudahMasuk = bundel.voucher_masuk?.some(v => v.no_voucher_lembar === noStr);
      nomorLembar.push({ no: noStr, sudahMasuk });
    }
  }
  return nomorLembar;
}

/**
 * Filter kode akun sesuai tab aktif (BBM / LPG / OLI).
 * @param {Array} masterKodeAkun
 * @param {string} activeTab
 * @returns {Array}
 */
export function getFilteredKodeAkun(masterKodeAkun, activeTab) {
  if (!Array.isArray(masterKodeAkun)) return [];
  if (activeTab === 'LPG') return masterKodeAkun.filter(k => k.nama_transaksi.toLowerCase().includes('lpg'));
  if (activeTab === 'OLI') return masterKodeAkun.filter(k => k.nama_transaksi.toLowerCase().includes('oli'));
  if (activeTab === 'BBM') return masterKodeAkun.filter(k => k.nama_transaksi.toLowerCase().includes('bbm'));
  return masterKodeAkun;
}

/**
 * Hitung ringkasan total debet per kategori dari daftar jurnal.
 * @param {Array} jurnalHariIni
 * @returns {{totalDebetBBM:number, totalDebetNFR:number, totalDebetVoucher:number, totalKeseluruhan:number}}
 */
export function hitungTotalKategori(jurnalHariIni) {
  const list = Array.isArray(jurnalHariIni) ? jurnalHariIni : [];
  const totalDebetBBM = list.filter(j => j.dari_ke.includes('SPBU') && j.uraian_kegiatan.includes('BBM')).reduce((a, b) => a + b.debet, 0);
  const totalDebetNFR = list.filter(j => j.dari_ke.includes('LPG') || j.dari_ke.includes('OLI')).reduce((a, b) => a + b.debet, 0);
  const totalDebetVoucher = list.filter(j => j.dari_ke.includes('VOUCHER')).reduce((a, b) => a + b.debet, 0);
  const totalKeseluruhan = totalDebetBBM + totalDebetNFR + totalDebetVoucher;
  return { totalDebetBBM, totalDebetNFR, totalDebetVoucher, totalKeseluruhan };
}

/**
 * Hitung saldo berjalan baru berdasarkan saldo terakhir + debet - kredit.
 * @param {Array} jurnalHariIni
 * @param {number} debet
 * @param {number} kredit
 * @returns {number}
 */
export function hitungSaldoBaru(jurnalHariIni, debet, kredit) {
  const saldoSebelumnya = jurnalHariIni.length > 0 ? jurnalHariIni[jurnalHariIni.length - 1].saldo : 0;
  return saldoSebelumnya + (debet || 0) - (kredit || 0);
}

/**
 * Cek apakah sebuah baris jurnal merupakan baris KOREKSI (tidak boleh dihapus).
 * @param {object} jurnal
 * @returns {boolean}
 */
export function isBarisKoreksi(jurnal) {
  return jurnal?.uraian_kegiatan?.startsWith('[KOREKSI]') || false;
}