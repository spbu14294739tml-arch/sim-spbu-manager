// src/layouts/LayoutUtama.jsx
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

export default function LayoutUtama() {
  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col w-full overflow-hidden">
        {/* Area Konten Utama */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}