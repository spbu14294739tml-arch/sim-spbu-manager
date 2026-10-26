// src/lib/formatHelper.js

// 1. Fungsi untuk memformat angka menjadi Rupiah
export const formatRupiah = (angka) => {
  if (!angka) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(angka);
};

// 2. Fungsi untuk memformat tanggal
export const formatTanggal = (tanggal) => {
  if (!tanggal) return '-';
  const date = new Date(tanggal);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date);
};

// 3. Fungsi untuk mengekspor data JSON ke file CSV (Excel)
export const exportToCSV = (data, filename) => {
  if (!data || data.length === 0) {
    alert('Tidak ada data untuk diekspor!');
    return;
  }

  const headers = Object.keys(data[0]);
  const csvRows = [];
  csvRows.push(headers.join(','));

  for (const row of data) {
    const values = headers.map(header => {
      const escaped = ('' + (row[header] || '')).replace(/"/g, '\\"');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};