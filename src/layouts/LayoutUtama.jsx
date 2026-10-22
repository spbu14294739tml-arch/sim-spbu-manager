// src/layouts/LayoutUtama.jsx
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

export default function LayoutUtama() {
  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* Sidebar ada di kiri */}
      <Sidebar />
      
      {/* Konten Utama ada di kanan. 
          <Outlet /> adalah tempat di mana halaman (Dashboard, Pengaturan, dll) akan muncul */}
      <div className="flex-1 flex flex-col">
        <Outlet />
      </div>
    </div>
  );
}