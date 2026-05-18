import React, { useState, useEffect, useMemo } from 'react';
import { Search, Trash2, FileText, AlertTriangle, Eye, ClipboardList } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Pagination } from '../../components/ui/pagination';
import { useModalA11y } from '../../hooks/useModalA11y';
import { toast } from 'sonner';
import api from '../../lib/api';

const ITEMS_PER_PAGE = 15;

interface UjianRow {
  id: string;
  judul: string;
  mataPelajaran: string;
  tipeUjian: string | null;
  durasi: number;
  tanggalMulai: string | null;
  tanggalSelesai: string | null;
  createdAt: string;
  guru: { id: string; nama: string; nip: string; mataPelajaran: string } | null;
  kelas: { kelas: { id: string; nama: string; tingkat: string } }[];
  _count: { soal: number; sesiUjian: number };
}

const Spinner = () => (
  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block mr-2" />
);

const formatDateRange = (start: string | null, end: string | null) => {
  if (!start || !end) return '-';
  const s = new Date(start);
  const e = new Date(end);
  const fmt = (d: Date) => d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  return `${fmt(s)} → ${fmt(e)}`;
};

const getStatus = (start: string | null, end: string | null): { label: string; color: string } => {
  if (!start || !end) return { label: 'Draft', color: 'bg-slate-100 text-slate-600' };
  const now = Date.now();
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (now < s) return { label: 'Belum mulai', color: 'bg-amber-50 text-amber-700 border-amber-200' };
  if (now > e) return { label: 'Selesai', color: 'bg-slate-100 text-slate-600' };
  return { label: 'Aktif', color: 'bg-green-50 text-green-700 border-green-200' };
};

export default function AdminUjianList() {
  const [ujianList, setUjianList] = useState<UjianRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [filterGuru, setFilterGuru] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'Aktif' | 'Belum mulai' | 'Selesai' | 'Draft'>('ALL');
  const [page, setPage] = useState(1);

  const [deleteConfirm, setDeleteConfirm] = useState<UjianRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteModalRef = useModalA11y<HTMLDivElement>(deleteConfirm !== null, () => setDeleteConfirm(null));

  const fetchUjian = async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const res = await api.get('/api/admin/ujian');
      setUjianList(res);
    } catch (e: any) {
      setErrorMsg(e.message || 'Gagal memuat data ujian');
      toast.error(e.message || 'Gagal memuat data ujian');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchUjian(); }, []);
  useEffect(() => { setPage(1); }, [search, filterGuru, filterStatus]);

  const guruOptions = useMemo(() => {
    const map = new Map<string, string>();
    ujianList.forEach(u => { if (u.guru) map.set(u.guru.id, u.guru.nama); });
    return Array.from(map.entries()).map(([id, nama]) => ({ id, nama }));
  }, [ujianList]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return ujianList.filter(u => {
      const matchSearch = !q || u.judul.toLowerCase().includes(q) || u.mataPelajaran.toLowerCase().includes(q);
      const matchGuru = filterGuru === 'ALL' || u.guru?.id === filterGuru;
      const status = getStatus(u.tanggalMulai, u.tanggalSelesai).label;
      const matchStatus = filterStatus === 'ALL' || status === filterStatus;
      return matchSearch && matchGuru && matchStatus;
    });
  }, [ujianList, search, filterGuru, filterStatus]);

  const paged = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      setIsDeleting(true);
      await api.delete(`/api/admin/ujian/${deleteConfirm.id}`);
      toast.success(`Ujian "${deleteConfirm.judul}" berhasil dihapus`);
      setDeleteConfirm(null);
      fetchUjian();
    } catch (e: any) {
      toast.error(e.message || 'Gagal menghapus ujian');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Kelola Ujian</h1>
        <p className="text-slate-500 mt-1">Pantau & kelola semua ujian yang dibuat guru.</p>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari judul ujian atau mata pelajaran..."
            className="pl-9"
          />
        </div>
        <Select value={filterGuru} onChange={e => setFilterGuru(e.target.value)} className="w-full sm:w-52">
          <option value="ALL">Semua Guru</option>
          {guruOptions.map(g => <option key={g.id} value={g.id}>{g.nama}</option>)}
        </Select>
        <Select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} className="w-full sm:w-44">
          <option value="ALL">Semua Status</option>
          <option value="Aktif">Aktif</option>
          <option value="Belum mulai">Belum mulai</option>
          <option value="Selesai">Selesai</option>
          <option value="Draft">Draft</option>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center">
              <div className="w-6 h-6 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mb-2" />
              <span className="text-sm text-slate-500">Memuat...</span>
            </div>
          ) : errorMsg ? (
            <div className="py-12 flex flex-col items-center text-center">
              <AlertTriangle className="w-10 h-10 text-red-400 mb-2" />
              <p className="text-red-600 font-medium mb-1">Gagal memuat data</p>
              <p className="text-sm text-slate-500 mb-4">{errorMsg}</p>
              <Button onClick={fetchUjian}>Muat Ulang</Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 flex flex-col items-center text-center">
              <FileText className="w-10 h-10 text-slate-300 mb-2" />
              <p className="text-slate-500">
                {ujianList.length === 0 ? 'Belum ada ujian yang dibuat guru.' : 'Tidak ada ujian yang cocok dengan filter.'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3 font-medium">Judul Ujian</th>
                      <th className="px-4 py-3 font-medium">Mata Pelajaran</th>
                      <th className="px-4 py-3 font-medium">Guru</th>
                      <th className="px-4 py-3 font-medium">Kelas</th>
                      <th className="px-4 py-3 font-medium text-center">Soal</th>
                      <th className="px-4 py-3 font-medium text-center">Sesi</th>
                      <th className="px-4 py-3 font-medium">Jadwal</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map(u => {
                      const status = getStatus(u.tanggalMulai, u.tanggalSelesai);
                      return (
                        <tr key={u.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-900">{u.judul}</td>
                          <td className="px-4 py-3 text-slate-600">{u.mataPelajaran}</td>
                          <td className="px-4 py-3 text-slate-600">
                            {u.guru ? (
                              <div>
                                <p className="font-medium text-slate-700">{u.guru.nama}</p>
                                <p className="text-xs text-slate-400 font-mono">{u.guru.nip}</p>
                              </div>
                            ) : '-'}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            <div className="flex flex-wrap gap-1">
                              {u.kelas.length === 0 ? (
                                <span className="text-slate-400 text-xs">—</span>
                              ) : (
                                u.kelas.map(uk => (
                                  <Badge key={uk.kelas.id} variant="secondary" className="text-xs">
                                    {uk.kelas.nama}
                                  </Badge>
                                ))
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center text-slate-600">
                            <span className="inline-flex items-center gap-1">
                              <ClipboardList className="w-3.5 h-3.5 text-slate-400" />
                              {u._count.soal}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {u._count.sesiUjian > 0 ? (
                              <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                                {u._count.sesiUjian}
                              </Badge>
                            ) : (
                              <span className="text-slate-400 text-xs">0</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-600 text-xs whitespace-nowrap">
                            {formatDateRange(u.tanggalMulai, u.tanggalSelesai)}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="secondary" className={status.color}>
                              {status.label}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteConfirm(u)}
                              className="text-red-500 hover:bg-red-50 h-8 px-2"
                              aria-label={`Hapus ujian ${u.judul}`}
                              disabled={u._count.sesiUjian > 0}
                              title={u._count.sesiUjian > 0 ? 'Tidak bisa hapus: sudah ada sesi siswa' : 'Hapus ujian'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Pagination
                currentPage={page}
                totalItems={filtered.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setPage}
                itemLabel="ujian"
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* ══ Modal Konfirmasi Hapus ══ */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div
            ref={deleteModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-ujian-title"
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="px-6 pt-6 pb-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h2 id="delete-ujian-title" className="text-lg font-bold text-slate-900 text-center">
                Hapus ujian ini?
              </h2>
              <p className="text-sm text-slate-500 text-center mt-1">
                <strong className="text-slate-700">{deleteConfirm.judul}</strong>
              </p>
              <p className="text-xs text-slate-400 text-center mt-2">
                Aksi ini tidak bisa dibatalkan. Seluruh soal & relasi kelas akan ikut terhapus.
              </p>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteConfirm(null)}
                disabled={isDeleting}
                className="flex-1"
              >
                Batal
              </Button>
              <Button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? <><Spinner />Menghapus...</> : 'Ya, Hapus'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
