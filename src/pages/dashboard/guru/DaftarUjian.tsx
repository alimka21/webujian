import { toast } from 'sonner';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Plus, Edit, Eye, Trash2, Calendar, Clock, FileText } from 'lucide-react';
import api from '../../../lib/api';
import { formatDate } from '../../../lib/utils';
import { Select } from '../../../components/ui/select';

export default function DaftarUjian() {
  const [ujianList, setUjianList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/api/guru/ujian');
      setUjianList(res);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getStatus = (ujian: any) => {
    if (!ujian._count?.soal || ujian._count?.soal === 0) return 'DRAFT';
    const now = new Date();
    const mulai = new Date(ujian.tanggalMulai);
    const selesai = new Date(ujian.tanggalSelesai);

    if (now < mulai) return 'AKAN_DATANG';
    if (now > selesai) return 'SELESAI';
    return 'BERLANGSUNG';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT': return <Badge variant="secondary">Draft</Badge>;
      case 'AKAN_DATANG': return <Badge variant="warning">Akan Datang</Badge>;
      case 'BERLANGSUNG': return <Badge variant="success">Berlangsung</Badge>;
      case 'SELESAI': return <Badge variant="default">Selesai</Badge>;
      default: return null;
    }
  };

  const filteredList = ujianList.filter(u => {
    if (filterStatus === 'ALL') return true;
    return getStatus(u) === filterStatus;
  });

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus ujian ini? Data nilai dan soal juga akan terhapus.')) return;
    try {
      await api.delete(`/api/guru/ujian/${id}`);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Gagal menghapus ujian');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Manajemen Ujian</h1>
          <p className="text-slate-500 mt-1">Daftar semua ujian yang telah Anda buat.</p>
        </div>
        <Button onClick={() => navigate('/dashboard/guru/ujian/baru')} className="gap-2">
          <Plus className="w-4 h-4" /> Buat Ujian Baru
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Daftar Ujian</CardTitle>
              <CardDescription>Menampilkan {filteredList.length} ujian.</CardDescription>
            </div>
            <div className="w-full md:w-64">
              <Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="ALL">Semua Status</option>
                <option value="DRAFT">Draft</option>
                <option value="AKAN_DATANG">Akan Datang</option>
                <option value="BERLANGSUNG">Berlangsung</option>
                <option value="SELESAI">Selesai</option>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center text-slate-500">Memuat data ujian...</div>
          ) : filteredList.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-100 rounded-xl">
              <FileText className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-lg font-medium text-slate-700">Tidak ada ujian</p>
              <p className="text-sm">Belum ada ujian yang sesuai dengan filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3 font-semibold rounded-tl-lg">Informasi Ujian</th>
                    <th className="px-4 py-3 font-semibold">Waktu Pelaksanaan</th>
                    <th className="px-4 py-3 font-semibold text-center">Soal</th>
                    <th className="px-4 py-3 font-semibold text-center">Status</th>
                    <th className="px-4 py-3 font-semibold text-center rounded-tr-lg">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredList.map((ujian) => {
                    const status = getStatus(ujian);
                    return (
                      <tr key={ujian.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-4">
                          <div className="font-semibold text-slate-900 mb-1">{ujian.judul}</div>
                          <div className="text-slate-500 mb-1 flex items-center gap-1">
                            <Badge variant="outline" className="text-[10px] uppercase font-medium">{ujian.tipeUjian}</Badge>
                            <span className="text-xs">&bull; {ujian.mataPelajaran}</span>
                          </div>
                          <div className="text-xs text-slate-500 flex flex-wrap gap-1">
                            Kelas: {ujian.kelas.map((k: any) => k.kelas.nama).join(', ') || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="flex flex-col gap-1.5 text-xs text-slate-600">
                            <span className="flex items-center gap-1.5 font-medium">
                              <Calendar className="w-3.5 h-3.5 text-blue-500" />
                              {formatDate(ujian.tanggalMulai, 'datetime')}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              {formatDate(ujian.tanggalSelesai, 'datetime')}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              {ujian.durasi} Menit
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center align-top">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-semibold text-sm border border-slate-200">
                            {ujian._count?.soal || 0}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center align-top">
                          {getStatusBadge(status)}
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="flex justify-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => navigate(`/dashboard/guru/ujian/${ujian.id}/soal`)} className="bg-white" title="Kelola Soal">
                              <Edit className="w-4 h-4 text-blue-600" />
                            </Button>
                            {status === 'SELESAI' || status === 'BERLANGSUNG' ? (
                              <Button variant="outline" size="sm" onClick={() => navigate(`/dashboard/guru/ujian/${ujian.id}/hasil`)} className="bg-white" title="Lihat Hasil">
                                <Eye className="w-4 h-4 text-emerald-600" />
                              </Button>
                            ) : null}
                            <Button variant="outline" size="sm" onClick={() => handleDelete(ujian.id)} className="bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-200" title="Hapus">
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
