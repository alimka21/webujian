import { toast } from 'sonner';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Select } from '../../../components/ui/select';
import { Badge } from '../../../components/ui/badge';
import { Search, Download, Trash2, Edit, AlertTriangle } from 'lucide-react';
import api from '../../../lib/api';
import { formatDate } from '../../../lib/utils';

export default function RekapNilai() {
  const [ujianList, setUjianList] = useState<any[]>([]);
  const [selectedUjian, setSelectedUjian] = useState<string>('');
  const [rekapData, setRekapData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchUjian();
  }, []);

  const fetchUjian = async () => {
    try {
      const res = await api.get('/api/guru/ujian');
      // Hanya tampilkan yang sudah ada peserta atau minimal BERLANGSUNG/SELESAI
      const filtered = res.filter((u: any) => {
        const now = new Date();
        const mulai = new Date(u.tanggalMulai);
        return now >= mulai; // Sudah lewat batas mulai
      });
      setUjianList(filtered);
      if (filtered.length > 0) {
        setSelectedUjian(filtered[0].id);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (selectedUjian) {
      fetchRekap();
    }
  }, [selectedUjian]);

  const fetchRekap = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/api/guru/ujian/${selectedUjian}/hasil`);
      setRekapData(res);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-slate-400 bg-slate-100';
    if (score >= 75) return 'text-green-700 bg-green-50';
    if (score >= 60) return 'text-yellow-700 bg-yellow-50';
    return 'text-red-700 bg-red-50';
  };

  const statusBadge = (status: string, reason: string | null) => {
    if (status === 'SELESAI') {
      if (reason === 'auto_cheat') return <Badge variant="destructive">Auto-Submit (Pelanggaran)</Badge>;
      if (reason === 'timeout') return <Badge variant="warning">Waktu Habis</Badge>;
      return <Badge variant="success">Selesai</Badge>;
    }
    if (status === 'BERLANGSUNG') return <Badge variant="default" className="bg-blue-500">Berlangsung</Badge>;
    return <Badge variant="outline" className="text-slate-500">Belum Mulai</Badge>;
  };

  // Safe checks for stats calculation (Sesi yang selesai)
  let stats = {
    peserta: 0,
    rataRata: 0,
    tertinggi: 0,
    terendah: 0
  };

  if (rekapData && rekapData.sesi) {
    const pSelesai = rekapData.sesi.filter((s: any) => s.status === 'SELESAI' && s.nilai !== null);
    stats.peserta = pSelesai.length;
    if (pSelesai.length > 0) {
      const sum = pSelesai.reduce((a: number, b: any) => a + b.nilai, 0);
      stats.rataRata = Math.round(sum / pSelesai.length);
      stats.tertinggi = Math.max(...pSelesai.map((s: any) => s.nilai));
      stats.terendah = Math.min(...pSelesai.map((s: any) => s.nilai));
    }
  }

  // Handle export (mocking action for now)
  const handleExport = (type: 'excel' | 'pdf') => {
    toast(`Fitur export ke ${type.toUpperCase()} akan mengunduh rekap nilai.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Rekapitulasi Nilai</h1>
          <p className="text-slate-500 mt-1">Pantau hasil ujian dan analisis performa siswa.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExport('excel')} className="gap-2 bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800">
            <Download className="w-4 h-4" /> Export Excel
          </Button>
          <Button variant="outline" onClick={() => handleExport('pdf')} className="gap-2 bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:text-red-800">
            <Download className="w-4 h-4" /> Export PDF
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Filter Ujian</CardTitle>
            </div>
            <div className="w-full sm:w-96">
              <Select value={selectedUjian} onChange={e => setSelectedUjian(e.target.value)} disabled={ujianList.length === 0}>
                {ujianList.length === 0 && <option value="">Belum ada ujian terlaksana</option>}
                {ujianList.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.judul} - {u.mataPelajaran} ({new Date(u.tanggalMulai).toLocaleDateString()})
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading ? (
             <div className="py-12 text-center text-slate-500">Memuat analisis data...</div>
          ) : !rekapData ? (
             <div className="py-12 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-100 rounded-xl">
               <p className="text-lg font-medium text-slate-700">Silakan pilih ujian</p>
             </div>
          ) : (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                  <p className="text-sm text-slate-500 font-medium mb-1">Total Selesai</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.peserta} <span className="text-sm font-normal text-slate-500">siswa</span></p>
                </div>
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                  <p className="text-sm text-blue-600 font-medium mb-1">Rata-rata Kelas</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.rataRata}</p>
                </div>
                <div className="bg-green-50 border border-green-100 p-4 rounded-xl">
                  <p className="text-sm text-green-600 font-medium mb-1">Nilai Tertinggi</p>
                  <p className="text-2xl font-bold text-green-900">{stats.tertinggi}</p>
                </div>
                <div className="bg-red-50 border border-red-100 p-4 rounded-xl">
                  <p className="text-sm text-red-600 font-medium mb-1">Nilai Terendah</p>
                  <p className="text-2xl font-bold text-red-900">{stats.terendah}</p>
                </div>
              </div>

              {/* Tabel Peserta */}
              <div className="overflow-x-auto border rounded-xl rounded-b-lg">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 font-semibold w-16 text-center">No</th>
                      <th className="px-4 py-3 font-semibold">Identitas Siswa</th>
                      <th className="px-4 py-3 font-semibold">Kelas</th>
                      <th className="px-4 py-3 font-semibold text-center min-w-[120px]">Nilai Akhir</th>
                      <th className="px-4 py-3 font-semibold text-center">Status Pengerjaan</th>
                      <th className="px-4 py-3 font-semibold text-center">Pelanggaran</th>
                      <th className="px-4 py-3 font-semibold text-center w-20">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {/* Sort based on values highest score first */}
                    {[...rekapData.sesi].sort((a,b) => (b.nilai || 0) - (a.nilai || 0)).map((sesi: any, index: number) => (
                      <tr key={sesi.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-4 text-center text-slate-500 font-medium">{index + 1}</td>
                        <td className="px-4 py-4">
                          <p className="font-semibold text-slate-900">{sesi.siswa.nama}</p>
                          <p className="text-xs text-slate-500 mt-0.5">NIS: {sesi.siswa.nis}</p>
                        </td>
                        <td className="px-4 py-4 text-slate-600">
                          {sesi.siswa.kelasId ? rekapData.kelasMap?.[sesi.siswa.kelasId] || '-' : '-'}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col items-center justify-center gap-1.5">
                            <span className={`inline-flex items-center justify-center min-w-[2.5rem] px-2 py-1 rounded-md font-bold text-sm ${getScoreColor(sesi.nilai)}`}>
                              {sesi.nilai !== null ? sesi.nilai : '-'}
                            </span>
                            {sesi.nilai !== null && (
                              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden max-w-[80px]">
                                <div 
                                  className={`h-full ${sesi.nilai >= 75 ? 'bg-green-500' : sesi.nilai >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                                  style={{ width: `${sesi.nilai}%` }}
                                />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center leading-relaxed">
                          {statusBadge(sesi.status, sesi.submitReason)}
                          {sesi.waktuSelesai && (
                            <p className="text-[10px] text-slate-400 mt-1 uppercase" title="Waktu selesai">
                               Tutup: {new Date(sesi.waktuSelesai).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-4 text-center">
                          {sesi._count?.pelanggaran > 0 ? (
                            <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
                              <AlertTriangle className="w-3 h-3 mr-1" /> {sesi._count.pelanggaran}x
                            </Badge>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <Button variant="ghost" size="sm" className="text-blue-600 bg-blue-50 hover:bg-blue-100 h-8" title="Detail Jawaban (Dalam Pengembangan)">
                            <Search className="w-4 h-4 mr-1.5" /> Detail
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {rekapData.sesi.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                          Belum ada peserta yang mengikuti ujian ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
