import { toast } from 'sonner';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input, Label } from '../../../components/ui/input';
import { Select } from '../../../components/ui/select';
import { Badge } from '../../../components/ui/badge';
import {
  Plus, Edit, Eye, Trash2, Calendar, Clock, FileText,
  Copy, Search, Users, AlertTriangle, BookOpen, CheckCircle2
} from 'lucide-react';
import api from '../../../lib/api';
import { formatDate } from '../../../lib/utils';
import { ErrorState } from '../../../components/ui/ErrorState';
import { useModalA11y } from '../../../hooks/useModalA11y';

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-xs text-red-500 mt-1">{msg}</p>;
}

interface EditForm {
  judul: string;
  mataPelajaran: string;
  tipeUjian: string;
  durasi: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  kelasIds: string[];
}

export default function DaftarUjian() {
  const [ujianList, setUjianList] = useState<any[]>([]);
  const [kelasList, setKelasList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  // Edit modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUjian, setEditingUjian] = useState<any>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    judul: '', mataPelajaran: '', tipeUjian: 'ULANGAN_HARIAN',
    durasi: '60', tanggalMulai: '', tanggalSelesai: '', kelasIds: []
  });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingUjian, setDeletingUjian] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Duplicate
  const [isDuplicating, setIsDuplicating] = useState<string | null>(null);

  // Modal a11y
  const editModalRef = useModalA11y<HTMLDivElement>(editModalOpen, () => setEditModalOpen(false));
  const deleteModalRef = useModalA11y<HTMLDivElement>(deleteModalOpen, () => { setDeleteModalOpen(false); setDeletingUjian(null); });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const res = await api.get('/api/guru/ujian');
      setUjianList(res);
    } catch (error: any) {
      const msg = error?.message || 'Gagal memuat daftar ujian. Periksa koneksi Anda.';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchKelas = async () => {
    try {
      const res = await api.get('/api/guru/kelas');
      setKelasList(res);
    } catch (error: any) {
      toast.error(error?.message || 'Gagal memuat daftar kelas');
    }
  };

  useEffect(() => {
    fetchData();
    fetchKelas();
  }, []);

  const getStatus = (ujian: any) => {
    if (!ujian._count?.soal || ujian._count.soal === 0) return 'DRAFT';
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

  const filteredList = ujianList
    .filter(u => filterStatus === 'ALL' || getStatus(u) === filterStatus)
    .filter(u => !search.trim() || u.judul.toLowerCase().includes(search.toLowerCase()));

  const hasParticipants = (ujian: any) => (ujian._count?.sesiUjian || 0) > 0;

  // ── Edit modal ──────────────────────────────────────────────
  const toLocalISO = (d: string) => {
    const date = new Date(d);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };

  const handleOpenEdit = (ujian: any) => {
    setEditingUjian(ujian);
    setEditErrors({});
    setEditForm({
      judul: ujian.judul,
      mataPelajaran: ujian.mataPelajaran,
      tipeUjian: ujian.tipeUjian || 'ULANGAN_HARIAN',
      durasi: String(ujian.durasi),
      tanggalMulai: ujian.tanggalMulai ? toLocalISO(ujian.tanggalMulai) : '',
      tanggalSelesai: ujian.tanggalSelesai ? toLocalISO(ujian.tanggalSelesai) : '',
      kelasIds: ujian.kelas.map((uk: any) => uk.kelasId)
    });
    setEditModalOpen(true);
  };

  const toggleEditKelas = (kelasId: string) => {
    setEditForm(prev => ({
      ...prev,
      kelasIds: prev.kelasIds.includes(kelasId)
        ? prev.kelasIds.filter(id => id !== kelasId)
        : [...prev.kelasIds, kelasId]
    }));
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!editForm.judul.trim()) errs.judul = 'Judul wajib diisi';
    if (!editForm.mataPelajaran.trim()) errs.mataPelajaran = 'Mata pelajaran wajib diisi';
    if (!editForm.durasi || parseInt(editForm.durasi) < 5) errs.durasi = 'Durasi minimal 5 menit';
    if (!editForm.tanggalMulai) errs.tanggalMulai = 'Waktu dibuka wajib diisi';
    if (!editForm.tanggalSelesai) errs.tanggalSelesai = 'Waktu ditutup wajib diisi';
    if (editForm.tanggalMulai && editForm.tanggalSelesai &&
        new Date(editForm.tanggalSelesai) <= new Date(editForm.tanggalMulai)) {
      errs.tanggalSelesai = 'Waktu ditutup harus lebih besar dari waktu dibuka';
    }
    if (editForm.kelasIds.length === 0) errs.kelasIds = 'Pilih minimal satu kelas peserta';
    if (Object.keys(errs).length > 0) {
      setEditErrors(errs);
      return;
    }
    setEditErrors({});
    try {
      setIsSubmitting(true);
      await api.patch(`/api/guru/ujian/${editingUjian.id}`, {
        judul: editForm.judul,
        mataPelajaran: editForm.mataPelajaran,
        tipeUjian: editForm.tipeUjian,
        durasi: parseInt(editForm.durasi),
        tanggalMulai: editForm.tanggalMulai,
        tanggalSelesai: editForm.tanggalSelesai,
        kelasIds: editForm.kelasIds
      });
      toast.success('Informasi ujian berhasil diperbarui');
      setEditModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Gagal menyimpan perubahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Delete modal ─────────────────────────────────────────────
  const handleOpenDelete = (ujian: any) => {
    setDeletingUjian(ujian);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingUjian) return;
    try {
      setIsDeleting(true);
      await api.delete(`/api/guru/ujian/${deletingUjian.id}`);
      toast.success('Ujian berhasil dihapus');
      setDeleteModalOpen(false);
      setDeletingUjian(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Gagal menghapus ujian');
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Duplicate ─────────────────────────────────────────────────
  const handleDuplikat = async (ujianId: string) => {
    try {
      setIsDuplicating(ujianId);
      await api.post(`/api/guru/ujian/${ujianId}/duplikat`);
      toast.success('Ujian berhasil diduplikat');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Gagal menduplikat ujian');
    } finally {
      setIsDuplicating(null);
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
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Cari judul ujian..."
                  className="pl-9 w-full sm:w-52"
                />
              </div>
              <div className="w-full sm:w-48">
                <Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <option value="ALL">Semua Status</option>
                  <option value="DRAFT">Draft</option>
                  <option value="AKAN_DATANG">Akan Datang</option>
                  <option value="BERLANGSUNG">Berlangsung</option>
                  <option value="SELESAI">Selesai</option>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <div className="w-6 h-6 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
              <p className="text-sm text-slate-500">Memuat data ujian...</p>
            </div>
          ) : errorMsg ? (
            <ErrorState message={errorMsg} onRetry={fetchData} />
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
                    <th className="px-4 py-3 font-semibold">Informasi Ujian</th>
                    <th className="px-4 py-3 font-semibold">Waktu Pelaksanaan</th>
                    <th className="px-4 py-3 font-semibold text-center">Soal</th>
                    <th className="px-4 py-3 font-semibold text-center">Status</th>
                    <th className="px-4 py-3 font-semibold text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredList.map((ujian) => {
                    const status = getStatus(ujian);
                    return (
                      <tr key={ujian.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-4">
                          <div className="font-semibold text-slate-900 mb-1">{ujian.judul}</div>
                          <div className="flex items-center gap-1 mb-1">
                            <Badge variant="outline" className="text-[10px] uppercase font-medium">{ujian.tipeUjian}</Badge>
                            <span className="text-xs text-slate-500">&bull; {ujian.mataPelajaran}</span>
                          </div>
                          <div className="text-xs text-slate-500">
                            Kelas: {ujian.kelas.map((k: any) => k.kelas.nama).join(', ') || '-'}
                          </div>
                          {hasParticipants(ujian) && (
                            <div className="flex items-center gap-1 mt-1.5 text-xs text-slate-400">
                              <Users className="w-3 h-3" />
                              {ujian._count.sesiUjian} peserta
                            </div>
                          )}
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
                        <td className="px-4 py-4 align-middle">
                          <div className="flex flex-col gap-1.5 items-center">
                            <div className="flex gap-1.5">
                              <Button
                                variant="outline" size="sm"
                                onClick={() => navigate(`/dashboard/guru/ujian/${ujian.id}/soal`)}
                                className="bg-white h-8 px-2.5 gap-1 text-xs"
                                title="Kelola Soal"
                              >
                                <BookOpen className="w-3.5 h-3.5 text-blue-600" /> Soal
                              </Button>
                              <Button
                                variant="outline" size="sm"
                                onClick={() => handleOpenEdit(ujian)}
                                className="bg-white h-8 px-2.5 gap-1 text-xs"
                                title="Edit Info Ujian"
                              >
                                <Edit className="w-3.5 h-3.5 text-slate-600" /> Edit
                              </Button>
                            </div>
                            <div className="flex gap-1.5">
                              {(status === 'SELESAI' || status === 'BERLANGSUNG') && (
                                <Button
                                  variant="outline" size="sm"
                                  onClick={() => navigate(`/dashboard/guru/rekap?ujianId=${ujian.id}`)}
                                  className="bg-white h-8 px-2.5 gap-1 text-xs"
                                  title="Lihat Hasil"
                                >
                                  <Eye className="w-3.5 h-3.5 text-emerald-600" /> Hasil
                                </Button>
                              )}
                              <Button
                                variant="outline" size="sm"
                                onClick={() => handleDuplikat(ujian.id)}
                                disabled={isDuplicating === ujian.id}
                                className="bg-white h-8 px-2 text-xs"
                                title="Duplikat Ujian"
                              >
                                {isDuplicating === ujian.id
                                  ? <div className="w-3.5 h-3.5 border-2 border-slate-400/40 border-t-slate-500 rounded-full animate-spin" />
                                  : <Copy className="w-3.5 h-3.5 text-slate-500" />
                                }
                              </Button>
                              <Button
                                variant="outline" size="sm"
                                onClick={() => handleOpenDelete(ujian)}
                                className="bg-white hover:bg-red-50 hover:border-red-200 h-8 px-2"
                                title="Hapus Ujian"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                              </Button>
                            </div>
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

      {/* ── Modal Edit Info Ujian ─────────────────────────────── */}
      {editModalOpen && editingUjian && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <Card
            ref={editModalRef as React.RefObject<HTMLDivElement>}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-ujian-title"
            className="w-full max-w-2xl border-0 shadow-xl my-auto"
          >
            <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
              <div className="flex justify-between items-center">
                <CardTitle id="edit-ujian-title">Edit Info Ujian</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setEditModalOpen(false)} aria-label="Tutup modal">Tutup</Button>
              </div>
            </CardHeader>
            <form onSubmit={handleSaveEdit}>
              <CardContent className="pt-6 space-y-5 max-h-[65vh] overflow-y-auto">
                <div className="space-y-2">
                  <Label htmlFor="edit-judul">Judul Ujian <span className="text-red-500">*</span></Label>
                  <Input
                    id="edit-judul"
                    value={editForm.judul}
                    onChange={e => setEditForm({ ...editForm, judul: e.target.value })}
                    className={editErrors.judul ? 'border-red-500' : ''}
                  />
                  <FieldError msg={editErrors.judul} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-mapel">Mata Pelajaran <span className="text-red-500">*</span></Label>
                    <Input
                      id="edit-mapel"
                      value={editForm.mataPelajaran}
                      onChange={e => setEditForm({ ...editForm, mataPelajaran: e.target.value })}
                      className={editErrors.mataPelajaran ? 'border-red-500' : ''}
                    />
                    <FieldError msg={editErrors.mataPelajaran} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-durasi">Durasi (Menit) <span className="text-red-500">*</span></Label>
                    <Input
                      id="edit-durasi"
                      type="number"
                      min="5"
                      value={editForm.durasi}
                      onChange={e => setEditForm({ ...editForm, durasi: e.target.value })}
                      className={editErrors.durasi ? 'border-red-500' : ''}
                    />
                    <FieldError msg={editErrors.durasi} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Tipe Ujian</Label>
                  <div className="flex flex-wrap gap-2">
                    {['LATIHAN', 'ULANGAN_HARIAN', 'UTS', 'UAS'].map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setEditForm({ ...editForm, tipeUjian: t })}
                        className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                          editForm.tipeUjian === t
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {t.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-mulai">Waktu Dibuka <span className="text-red-500">*</span></Label>
                    <Input
                      id="edit-mulai"
                      type="datetime-local"
                      value={editForm.tanggalMulai}
                      onChange={e => setEditForm({ ...editForm, tanggalMulai: e.target.value })}
                      className={editErrors.tanggalMulai ? 'border-red-500' : ''}
                    />
                    <FieldError msg={editErrors.tanggalMulai} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-selesai">Waktu Ditutup <span className="text-red-500">*</span></Label>
                    <Input
                      id="edit-selesai"
                      type="datetime-local"
                      value={editForm.tanggalSelesai}
                      onChange={e => setEditForm({ ...editForm, tanggalSelesai: e.target.value })}
                      className={editErrors.tanggalSelesai ? 'border-red-500' : ''}
                    />
                    <FieldError msg={editErrors.tanggalSelesai} />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label>Kelas Peserta <span className="text-red-500">*</span></Label>
                  {kelasList.length === 0 ? (
                    <p className="text-sm text-slate-500 border border-dashed border-slate-200 rounded-lg p-3 text-center">
                      Tidak ada kelas tersedia.
                    </p>
                  ) : (
                    <div className={`flex flex-wrap gap-2 ${editErrors.kelasIds ? 'p-2 border border-red-300 rounded-lg bg-red-50/30' : ''}`}>
                      {kelasList.map(k => {
                        const selected = editForm.kelasIds.includes(k.id);
                        return (
                          <button
                            key={k.id}
                            type="button"
                            onClick={() => toggleEditKelas(k.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                              selected
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            {selected && <CheckCircle2 className="w-3.5 h-3.5" />}
                            {k.nama}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <FieldError msg={editErrors.kelasIds} />
                </div>
              </CardContent>
              <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)} disabled={isSubmitting}>
                  Batal
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ── Modal Konfirmasi Hapus ────────────────────────────── */}
      {deleteModalOpen && deletingUjian && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <Card
            ref={deleteModalRef as React.RefObject<HTMLDivElement>}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-ujian-title"
            className="w-full max-w-md border-0 shadow-xl"
          >
            <CardHeader className="pb-3">
              <CardTitle id="delete-ujian-title" className="text-xl">Hapus Ujian?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-600">Anda akan menghapus ujian:</p>
              <p className="font-semibold text-slate-900 bg-slate-50 p-3 rounded-lg border border-slate-200">
                {deletingUjian.judul}
              </p>

              {hasParticipants(deletingUjian) ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Ujian ini sudah dikerjakan oleh <strong>{deletingUjian._count.sesiUjian} siswa</strong> dan tidak dapat dihapus. Hubungi Administrator jika perlu menghapus paksa.
                  </span>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 flex gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Semua soal ({deletingUjian._count?.soal || 0} soal) akan ikut terhapus. Tindakan ini tidak dapat dibatalkan.
                  </span>
                </div>
              )}
            </CardContent>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 rounded-b-xl">
              <Button
                variant="outline"
                onClick={() => { setDeleteModalOpen(false); setDeletingUjian(null); }}
                disabled={isDeleting}
              >
                Batal
              </Button>
              <Button
                onClick={handleConfirmDelete}
                disabled={isDeleting || hasParticipants(deletingUjian)}
                className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
              >
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus Ujian'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
