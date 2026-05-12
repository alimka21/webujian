import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { FileText, ClipboardList, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../../lib/api';
import { ErrorState } from '../../components/ui/ErrorState';

export default function SiswaDashboard() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const res = await api.get('/api/siswa/dashboard');
      setData(res);
    } catch (error: any) {
      const msg = error?.message || 'Gagal memuat data dashboard. Periksa koneksi Anda.';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
      <div className="w-8 h-8 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
      <p className="text-sm text-slate-500">Memuat dashboard...</p>
    </div>
  );

  if (errorMsg) return <ErrorState message={errorMsg} onRetry={fetchDashboard} className="h-[60vh]" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard Siswa</h1>
        <p className="text-slate-500">Selamat datang kembali! Ini ringkasan akademis Anda.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Ujian Aktif</p>
              <h3 className="text-3xl font-bold text-slate-800">{data?.ujianAktif?.length || 0}</h3>
            </div>
            <div className="p-4 bg-orange-100 text-orange-600 rounded-full">
              <FileText className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Ujian Selesai</p>
              <h3 className="text-3xl font-bold text-slate-800">{data?.ujianSelesai?.length || 0}</h3>
            </div>
            <div className="p-4 bg-blue-100 text-blue-600 rounded-full">
              <ClipboardList className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Rata-Rata Nilai</p>
              <h3 className="text-3xl font-bold text-slate-800">{data?.rataRataNilai || 0}</h3>
            </div>
            <div className="p-4 bg-emerald-100 text-emerald-600 rounded-full">
              <TrendingUp className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Akses Cepat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link to="/dashboard/siswa/ujian" className="block p-4 bg-white border hover:border-blue-300 rounded-lg group transition-all">
              <h4 className="font-semibold text-slate-800 group-hover:text-blue-600">Daftar Ujian Aktif</h4>
              <p className="text-sm text-slate-500">Lihat ujian yang sedang berjalan dan siap dikerjakan.</p>
            </Link>
            <Link to="/dashboard/siswa/riwayat" className="block p-4 bg-white border hover:border-indigo-300 rounded-lg group transition-all">
              <h4 className="font-semibold text-slate-800 group-hover:text-indigo-600">Riwayat Nilai</h4>
              <p className="text-sm text-slate-500">Lihat histori nilai dari ujian yang sudah diselesaikan.</p>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aktivitas Terakhir</CardTitle>
            <CardDescription>Ujian yang baru saja Anda selesaikan</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.ujianSelesai && data.ujianSelesai.length > 0 ? (
              <div className="space-y-1">
                {data.ujianSelesai.slice(0, 3).map((sesi: any) => (
                  <Link
                    key={sesi.id}
                    to={`/dashboard/siswa/hasil/${sesi.id}`}
                    className="flex justify-between items-center p-3 -mx-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-100 last:border-0"
                  >
                    <div>
                      <p className="font-medium text-slate-800">{sesi.ujian.judul}</p>
                      <p className="text-xs text-slate-500">{new Date(sesi.selesaiAt).toLocaleDateString('id-ID')}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-emerald-600 text-lg">{sesi.nilaiAkhir}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-6 flex flex-col items-center justify-center text-center">
                <ClipboardList className="w-10 h-10 text-slate-300 mb-2" />
                <p className="text-sm text-slate-500">Belum ada ujian yang diselesaikan.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
