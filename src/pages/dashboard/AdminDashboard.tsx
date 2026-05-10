import { useAuthStore } from "../../store/authStore";
import { Link } from "react-router-dom";
import { 
  Users, 
  FileText, 
  CheckCircle2, 
  Clock 
} from "lucide-react";

export default function AdminDashboard() {
  const { user } = useAuthStore();
  
  if (user?.role !== 'SUPER_ADMIN') {
    return <div className="p-8 text-center text-gray-500">Akses ditolak. Fitur ini hanya untuk Super Admin.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Dashboard Utama</h1>
          <p className="text-gray-500">Selamat datang kembali, {user?.name}</p>
        </div>
        <button 
          onClick={() => alert("Laporan sedang di-generate. Silakan tunggu...")}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors shadow-sm"
        >
          Generate Report
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Siswa</p>
          <div className="flex items-end gap-2">
            <h2 className="text-3xl font-bold text-slate-800">1,248</h2>
            <span className="text-xs text-green-600 font-medium mb-1">+12% bln ini</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Ujian Aktif</p>
          <div className="flex items-end gap-2">
            <h2 className="text-3xl font-bold text-slate-800">4</h2>
            <span className="text-xs text-blue-600 font-medium mb-1">CAT Mode On</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Presensi Hari Ini</p>
          <div className="flex items-end gap-2">
            <h2 className="text-3xl font-bold text-slate-800">98.2%</h2>
            <span className="text-xs text-slate-400 font-medium mb-1">Tepat Waktu</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Tracer Alumni</p>
          <div className="flex items-end gap-2">
            <h2 className="text-3xl font-bold text-slate-800">84%</h2>
            <span className="text-xs text-amber-600 font-medium mb-1">Terserap Kerja</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* CAT EXAM MONITOR */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-slate-800">Monitoring Ujian CAT Terkini</h3>
            <span className="text-[10px] bg-red-100 text-red-600 px-2 py-1 rounded font-bold uppercase">Live Monitoring</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3">Nama Ujian</th>
                  <th className="px-6 py-3">Kelas</th>
                  <th className="px-6 py-3">Peserta</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                <tr className="hover:bg-blue-50/50">
                  <td className="px-6 py-4 font-medium text-slate-800">Matematika Dasar - Final</td>
                  <td className="px-6 py-4">XII RPL 1</td>
                  <td className="px-6 py-4">32 / 32</td>
                  <td className="px-6 py-4"><span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs">Selesai</span></td>
                  <td className="px-6 py-4"><button className="text-blue-600 hover:underline" onClick={() => alert('Menampilkan hasil ujian...')}>Hasil</button></td>
                </tr>
                <tr className="hover:bg-blue-50/50">
                  <td className="px-6 py-4 font-medium text-slate-800">Pemrograman Web - Mid</td>
                  <td className="px-6 py-4">XI TKJ 2</td>
                  <td className="px-6 py-4">14 / 28</td>
                  <td className="px-6 py-4"><span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">Berjalan</span></td>
                  <td className="px-6 py-4"><button className="text-blue-600 hover:underline" onClick={() => alert('Menautkan ke kamera/layar peserta...')}>Pantau</button></td>
                </tr>
                <tr className="hover:bg-blue-50/50">
                  <td className="px-6 py-4 font-medium text-slate-800">Bahasa Inggris Speaking</td>
                  <td className="px-6 py-4">X MM 1</td>
                  <td className="px-6 py-4">0 / 30</td>
                  <td className="px-6 py-4"><span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs">Terjadwal</span></td>
                  <td className="px-6 py-4"><Link to="/dashboard/exams" className="text-slate-500 hover:text-blue-600">Edit Soal</Link></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* RECENT NEWS & ALUMNI STATS */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          {/* TRACER VISUAL */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-800 mb-4">Sebaran Alumni 2023</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 italic">Bekerja</span>
                  <span className="font-bold">62%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: '62%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 italic">Kuliah</span>
                  <span className="font-bold">28%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: '28%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 italic">Wirausaha</span>
                  <span className="font-bold">10%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '10%' }}></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* CMS NEWS PREVIEW */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex-1">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800">Update Berita</h3>
              <Link to="/dashboard/cms" className="text-xs text-blue-600 font-medium hover:underline">Manage CMS</Link>
            </div>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-12 h-12 bg-slate-200 rounded shrink-0 bg-[url('https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=100')] bg-cover"></div>
                <div>
                  <p className="text-xs font-bold leading-tight text-slate-800 line-clamp-2">Pelepasan Siswa Prakerin Angkatan 2024 ke PT. Astra</p>
                  <p className="text-[10px] text-slate-400 mt-1">2 Jam yang lalu • Admin</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-12 h-12 bg-slate-200 rounded shrink-0 bg-[url('https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=100')] bg-cover"></div>
                <div>
                  <p className="text-xs font-bold leading-tight text-slate-800 line-clamp-2">Juara 1 LKS Tingkat Provinsi Bidang Web Tech</p>
                  <p className="text-[10px] text-slate-400 mt-1">Kemarin • Admin</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
