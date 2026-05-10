import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Users, GraduationCap, FileText, Newspaper, CalendarCheck, Shield } from 'lucide-react';
import api from '../../lib/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/api/admin/stats');
        setStats(res);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard Admin</h1>
        <p className="text-slate-500 mt-1">Ikhtisar statistik dan operasional sistem edukasi.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Row 1 */}
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Siswa Aktif</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-1">{stats?.totalSiswa || 0}</h3>
            </div>
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Guru</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-1">{stats?.totalGuru || 0}</h3>
            </div>
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Alumni</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-1">{stats?.totalAlumni || 0}</h3>
            </div>
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
        
        {/* Row 2 */}
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Bank Ujian</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-1">{stats?.totalUjian || 0}</h3>
            </div>
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Artikel Berita</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-1">{stats?.totalBerita || 0}</h3>
            </div>
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center shrink-0">
              <Newspaper className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Presensi Hari Ini</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-1">{stats?.presensiHariIni || 0}</h3>
            </div>
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center shrink-0">
              <CalendarCheck className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Basic content to fill empty space */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Panel Manajemen Cepat
          </CardTitle>
          <CardDescription>Akses cepat ke berbagai fitur manajemen administrasi.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            <QuickLinkCard title="Kelola Pengguna" desc="Atur akun Siswa, Guru, dan Admin" href="/dashboard/admin/users" />
            <QuickLinkCard title="Tracer Alumni" desc="Data alumni dan pekerjaannya" href="/dashboard/admin/alumni" />
            <QuickLinkCard title="Portal Berita" desc="Tulis pengumuman dan berita" href="/dashboard/admin/cms" />
            <QuickLinkCard title="Pengaturan Sistem" desc="Konfigurasi website sekolah" href="#" />
          </div>
        </CardContent>
      </Card>
      
    </div>
  );
}

function QuickLinkCard({ title, desc, href }: { title: string, desc: string, href: string }) {
  return (
    <a href={href} className="block p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5 transition-all bg-white group">
      <h4 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{title}</h4>
      <p className="text-sm text-slate-500 mt-1">{desc}</p>
    </a>
  )
}
