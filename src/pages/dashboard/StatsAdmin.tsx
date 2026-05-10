import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Users, GraduationCap, FileText, Newspaper, CalendarCheck } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/api';

interface Stats {
  totalSiswa: number;
  totalGuru: number;
  totalAlumni: number;
  totalUjian: number;
  totalBerita: number;
  presensiHariIni: number;
}

export default function StatsAdmin() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/api/admin/stats');
      setStats(res);
    } catch (error: any) {
      toast.error(error.message || 'Gagal memuat statistik');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !stats) {
    return <div className="p-8 text-center text-slate-500">Memuat statistik...</div>;
  }

  const statCards = [
    { title: 'Total Siswa', value: stats.totalSiswa, icon: <Users className="w-5 h-5" />, color: 'bg-blue-500' },
    { title: 'Total Guru', value: stats.totalGuru, icon: <Users className="w-5 h-5" />, color: 'bg-green-500' },
    { title: 'Total Alumni', value: stats.totalAlumni, icon: <GraduationCap className="w-5 h-5" />, color: 'bg-purple-500' },
    { title: 'Total Ujian CBT', value: stats.totalUjian, icon: <FileText className="w-5 h-5" />, color: 'bg-orange-500' },
    { title: 'Total Berita', value: stats.totalBerita, icon: <Newspaper className="w-5 h-5" />, color: 'bg-pink-500' },
    { title: 'Presensi Hari Ini', value: stats.presensiHariIni, icon: <CalendarCheck className="w-5 h-5" />, color: 'bg-teal-500' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Statistik Global</h1>
        <p className="text-slate-500">Ringkasan data seluruh entitas di sistem ini</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">{stat.title}</p>
                <h3 className="text-3xl font-bold text-slate-800">{stat.value}</h3>
              </div>
              <div className={`p-4 rounded-full text-white ${stat.color}`}>
                {stat.icon}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 p-6 bg-slate-50 rounded-xl border">
        <h3 className="text-lg font-semibold text-slate-800 border-b pb-2 mb-4">Informasi Sistem</h3>
        <ul className="space-y-2 text-slate-600">
          <li><strong>Versi Aplikasi:</strong> 1.0.0</li>
          <li><strong>Versi Database:</strong> SQLite / Prisma</li>
          <li><strong>Zona Waktu Server:</strong> {Intl.DateTimeFormat().resolvedOptions().timeZone}</li>
        </ul>
      </div>
    </div>
  );
}
