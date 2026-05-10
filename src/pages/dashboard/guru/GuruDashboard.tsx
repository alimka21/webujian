import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Users, FileText, CheckCircle2, Clock, PlusCircle, AlertTriangle, ListChecks } from 'lucide-react';
import api from '../../../lib/api';
import { formatDate } from '../../../lib/utils';

export default function GuruDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [ujianMendatang, setUjianMendatang] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [statsRes, ujianRes] = await Promise.all([
          api.get('/api/guru/stats'),
          api.get('/api/guru/ujian')
        ]);
        
        setStats(statsRes);

        // Filter Ujian Mendatang (tanggal mulai > sekarang)
        const now = new Date();
        const mendatang = ujianRes
          .filter((u: any) => new Date(u.tanggalMulai) > now)
          .sort((a: any, b: any) => new Date(a.tanggalMulai).getTime() - new Date(b.tanggalMulai).getTime())
          .slice(0, 3);
        
        setUjianMendatang(mendatang);
      } catch (err: any) {
        setError(err.message || 'Gagal memuat data dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Memuat Overview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-start gap-3">
        <AlertTriangle className="w-6 h-6 shrink-0" />
        <div>
          <h3 className="font-semibold text-lg">Gagal Memuat Data</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard Guru</h1>
          <p className="text-slate-500 mt-1">Ringkasan aktivitas ujian dan performa kelas Anda.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button onClick={() => navigate('/dashboard/guru/ujian/baru')} className="flex-1 sm:flex-none gap-2">
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Buat Ujian Baru</span>
            <span className="sm:hidden">Ujian</span>
          </Button>
          <Button variant="outline" onClick={() => navigate('/dashboard/guru/presensi')} className="flex-1 sm:flex-none gap-2">
            <ListChecks className="w-4 h-4" />
            <span className="hidden sm:inline">Input Presensi</span>
            <span className="sm:hidden">Presensi</span>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Ujian</p>
              <h3 className="text-2xl font-bold text-slate-900">{stats?.totalUjian || 0}</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Siswa Anda</p>
              <h3 className="text-2xl font-bold text-slate-900">{stats?.totalSiswa || 0}</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Rataan Nilai</p>
              <h3 className="text-2xl font-bold text-slate-900">{stats?.rataRataNilai || 0}</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Ujian Aktif</p>
              <h3 className="text-2xl font-bold text-slate-900">{stats?.ujianAktif || 0}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Ujian Mendatang */}
        <Card className="lg:col-span-2 flex flex-col">
          <CardHeader>
            <CardTitle>Ujian Mendatang</CardTitle>
            <CardDescription>Jadwal ujian yang akan datang dalam waktu dekat.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            {ujianMendatang.length === 0 ? (
              <div className="py-12 text-center text-slate-500 border-2 border-dashed border-slate-100 rounded-xl">
                Tidak ada ujian mendatang.
                <div className="mt-2 text-sm text-slate-400">
                  Semua ujian sedang berjalan atau sudah selesai.
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {ujianMendatang.map((ujian) => (
                  <div key={ujian.id} className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-slate-900">{ujian.judul}</h4>
                        <Badge variant="outline" className="text-xs">{ujian.tipeUjian}</Badge>
                      </div>
                      <p className="text-sm text-slate-500 mb-2">{ujian.mataPelajaran}</p>
                      <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {ujian.durasi} menit
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          {ujian._count?.siswa || 0} peserta
                        </span>
                      </div>
                    </div>
                    <div className="text-left sm:text-right flex flex-row sm:flex-col justify-between sm:justify-start items-center sm:items-end">
                      <div className="text-sm font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                        {formatDate(ujian.tanggalMulai, 'datetime')}
                      </div>
                      <Button variant="ghost" size="sm" className="mt-2 hidden sm:flex text-blue-600" onClick={() => navigate(`/dashboard/guru/ujian/${ujian.id}/soal`)}>
                        Kelola Soal →
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Aktivitas Terbaru */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Aktivitas Terbaru</CardTitle>
            <CardDescription>Pembaruan ujian & log sistem.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="py-12 text-center text-slate-500 border-2 border-dashed border-slate-100 rounded-xl h-full flex flex-col items-center justify-center">
              <ActivityIcon className="w-8 h-8 text-slate-300 mb-3" />
              <p className="font-medium text-slate-600">Fitur masih dalam pengembangan</p>
              <p className="text-sm text-slate-400 mt-1 max-w-[200px]">Aktivitas (sesi ujian selesai, pelanggaran) akan tampil di sini.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ActivityIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  )
}
