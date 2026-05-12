import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, KeyRound, Users, GraduationCap, BookOpen, AlertTriangle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input, Label } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Pagination } from '../../components/ui/pagination';
import { useModalA11y } from '../../hooks/useModalA11y';
import { toast } from 'sonner';
import api from '../../lib/api';

const ITEMS_PER_PAGE = 20;

interface SiswaUser {
  id: string;
  email: string;
  isActive: boolean;
  siswa: { id: string; nama: string; nis: string; kelasId: string; kelas: { id: string; nama: string; tingkat: string } };
}

interface GuruUser {
  id: string;
  email: string;
  isActive: boolean;
  guru: { id: string; nama: string; nip: string; mataPelajaran: string };
}

interface KelasItem {
  id: string;
  nama: string;
  tingkat: string;
  tahunAjaran: string;
  guruId: string;
  guru: { id: string; nama: string };
  _count: { siswa: number };
}

interface DeleteConfirm { id: string; nama: string; type: 'SISWA' | 'GURU' | 'KELAS' }
interface ResetConfirm { userId: string; nama: string; resetTo: string }

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-xs text-red-500 mt-1">{msg}</p>;
}

function Spinner() {
  return <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin mr-2" />;
}

export default function ManageUsers() {
  const [activeTab, setActiveTab] = useState<'SISWA' | 'GURU' | 'KELAS'>('SISWA');

  // ── Data ──
  const [siswaList, setSiswaList] = useState<SiswaUser[]>([]);
  const [guruList, setGuruList] = useState<GuruUser[]>([]);
  const [kelasList, setKelasList] = useState<KelasItem[]>([]);
  const [isLoadingSiswa, setIsLoadingSiswa] = useState(true);
  const [isLoadingGuru, setIsLoadingGuru] = useState(true);
  const [isLoadingKelas, setIsLoadingKelas] = useState(true);

  // ── Search / Filter ──
  const [siswaSearch, setSiswaSearch] = useState('');
  const [siswaFilterKelas, setSiswaFilterKelas] = useState('ALL');
  const [guruSearch, setGuruSearch] = useState('');
  const [kelasSearch, setKelasSearch] = useState('');

  // ── Siswa Modal ──
  const [showSiswaModal, setShowSiswaModal] = useState(false);
  const [editingSiswaId, setEditingSiswaId] = useState<string | null>(null);
  const [siswaForm, setSiswaForm] = useState({ nis: '', nama: '', kelasId: '' });
  const [siswaErrors, setSiswaErrors] = useState<Record<string, string>>({});
  const [isSubmittingSiswa, setIsSubmittingSiswa] = useState(false);

  // ── Guru Modal ──
  const [showGuruModal, setShowGuruModal] = useState(false);
  const [editingGuruId, setEditingGuruId] = useState<string | null>(null);
  const [guruForm, setGuruForm] = useState({ nip: '', nama: '', email: '', mataPelajaran: '', password: '' });
  const [guruErrors, setGuruErrors] = useState<Record<string, string>>({});
  const [isSubmittingGuru, setIsSubmittingGuru] = useState(false);

  // ── Kelas Modal ──
  const [showKelasModal, setShowKelasModal] = useState(false);
  const [editingKelasId, setEditingKelasId] = useState<string | null>(null);
  const [kelasForm, setKelasForm] = useState({ nama: '', tingkat: 'X', tahunAjaran: '2025/2026', guruId: '' });
  const [kelasErrors, setKelasErrors] = useState<Record<string, string>>({});
  const [isSubmittingKelas, setIsSubmittingKelas] = useState(false);

  // ── Shared Modals ──
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirm | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [resetConfirm, setResetConfirm] = useState<ResetConfirm | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  // ── Pagination ──
  const [siswaPage, setSiswaPage] = useState(1);
  const [guruPage, setGuruPage] = useState(1);
  const [kelasPage, setKelasPage] = useState(1);

  // Reset page on search/filter change
  useEffect(() => { setSiswaPage(1); }, [siswaSearch, siswaFilterKelas]);
  useEffect(() => { setGuruPage(1); }, [guruSearch]);
  useEffect(() => { setKelasPage(1); }, [kelasSearch]);

  // ── Modal a11y refs ──
  const siswaModalRef = useModalA11y<HTMLDivElement>(showSiswaModal, () => setShowSiswaModal(false));
  const guruModalRef = useModalA11y<HTMLDivElement>(showGuruModal, () => setShowGuruModal(false));
  const kelasModalRef = useModalA11y<HTMLDivElement>(showKelasModal, () => setShowKelasModal(false));
  const deleteModalRef = useModalA11y<HTMLDivElement>(deleteConfirm !== null, () => setDeleteConfirm(null));
  const resetModalRef = useModalA11y<HTMLDivElement>(resetConfirm !== null, () => setResetConfirm(null));

  // ── Fetch ──
  const fetchSiswa = async () => {
    try {
      setIsLoadingSiswa(true);
      const res = await api.get('/api/admin/users?role=SISWA');
      setSiswaList(res);
    } catch (e: any) { toast.error(e.message || 'Gagal memuat data siswa'); }
    finally { setIsLoadingSiswa(false); }
  };

  const fetchGuru = async () => {
    try {
      setIsLoadingGuru(true);
      const res = await api.get('/api/admin/users?role=GURU');
      setGuruList(res);
    } catch (e: any) { toast.error(e.message || 'Gagal memuat data guru'); }
    finally { setIsLoadingGuru(false); }
  };

  const fetchKelas = async () => {
    try {
      setIsLoadingKelas(true);
      const res = await api.get('/api/admin/kelas');
      setKelasList(res);
    } catch (e: any) { toast.error(e.message || 'Gagal memuat data kelas'); }
    finally { setIsLoadingKelas(false); }
  };

  useEffect(() => {
    fetchSiswa();
    fetchGuru();
    fetchKelas();
  }, []);

  // ── Filtered Lists ──
  const filteredSiswa = siswaList.filter(u => {
    const q = siswaSearch.toLowerCase();
    const match = u.siswa?.nama?.toLowerCase().includes(q) || u.siswa?.nis?.toLowerCase().includes(q);
    const matchKelas = siswaFilterKelas === 'ALL' || u.siswa?.kelasId === siswaFilterKelas;
    return match && matchKelas;
  });

  const filteredGuru = guruList.filter(u => {
    const q = guruSearch.toLowerCase();
    return u.guru?.nama?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });

  const filteredKelas = kelasList.filter(k => k.nama.toLowerCase().includes(kelasSearch.toLowerCase()));

  // Paginated slices
  const paginatedSiswa = filteredSiswa.slice((siswaPage - 1) * ITEMS_PER_PAGE, siswaPage * ITEMS_PER_PAGE);
  const paginatedGuru = filteredGuru.slice((guruPage - 1) * ITEMS_PER_PAGE, guruPage * ITEMS_PER_PAGE);
  const paginatedKelas = filteredKelas.slice((kelasPage - 1) * ITEMS_PER_PAGE, kelasPage * ITEMS_PER_PAGE);

  // ── Siswa Handlers ──
  const openSiswaModal = (u?: SiswaUser) => {
    setSiswaErrors({});
    if (u) {
      setEditingSiswaId(u.id);
      setSiswaForm({ nis: u.siswa.nis, nama: u.siswa.nama, kelasId: u.siswa.kelasId });
    } else {
      setEditingSiswaId(null);
      setSiswaForm({ nis: '', nama: '', kelasId: kelasList[0]?.id || '' });
    }
    setShowSiswaModal(true);
  };

  const handleSaveSiswa = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!siswaForm.nis.trim()) errs.nis = 'NIS wajib diisi';
    if (!siswaForm.nama.trim()) errs.nama = 'Nama wajib diisi';
    if (!siswaForm.kelasId) errs.kelasId = 'Pilih kelas';
    if (Object.keys(errs).length) { setSiswaErrors(errs); return; }

    try {
      setIsSubmittingSiswa(true);
      if (editingSiswaId) {
        await api.patch(`/api/admin/users/${editingSiswaId}`, {
          nama: siswaForm.nama, nis: siswaForm.nis, kelasId: siswaForm.kelasId
        });
        toast.success('Data siswa berhasil diperbarui');
      } else {
        await api.post('/api/admin/users', {
          role: 'SISWA',
          email: `${siswaForm.nis}@siswa.sch.id`,
          password: siswaForm.nis,
          nama: siswaForm.nama,
          nis: siswaForm.nis,
          kelasId: siswaForm.kelasId
        });
        toast.success('Siswa berhasil ditambahkan');
      }
      setShowSiswaModal(false);
      fetchSiswa();
    } catch (e: any) { toast.error(e.message || 'Gagal menyimpan data siswa'); }
    finally { setIsSubmittingSiswa(false); }
  };

  // ── Guru Handlers ──
  const openGuruModal = (u?: GuruUser) => {
    setGuruErrors({});
    if (u) {
      setEditingGuruId(u.id);
      setGuruForm({ nip: u.guru.nip || '', nama: u.guru.nama, email: u.email, mataPelajaran: u.guru.mataPelajaran, password: '' });
    } else {
      setEditingGuruId(null);
      setGuruForm({ nip: '', nama: '', email: '', mataPelajaran: '', password: '' });
    }
    setShowGuruModal(true);
  };

  const handleSaveGuru = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!guruForm.nama.trim()) errs.nama = 'Nama wajib diisi';
    if (!guruForm.email.trim()) errs.email = 'Email wajib diisi';
    if (!guruForm.mataPelajaran.trim()) errs.mataPelajaran = 'Mata pelajaran wajib diisi';
    if (!editingGuruId && !guruForm.password.trim()) errs.password = 'Password wajib diisi';
    if (Object.keys(errs).length) { setGuruErrors(errs); return; }

    try {
      setIsSubmittingGuru(true);
      if (editingGuruId) {
        await api.patch(`/api/admin/users/${editingGuruId}`, {
          email: guruForm.email, nama: guruForm.nama, nip: guruForm.nip, mataPelajaran: guruForm.mataPelajaran
        });
        toast.success('Data guru berhasil diperbarui');
      } else {
        await api.post('/api/admin/users', {
          role: 'GURU',
          email: guruForm.email,
          password: guruForm.password,
          nama: guruForm.nama,
          nip: guruForm.nip || crypto.randomUUID(),
          mataPelajaran: guruForm.mataPelajaran
        });
        toast.success('Guru berhasil ditambahkan');
      }
      setShowGuruModal(false);
      fetchGuru();
    } catch (e: any) { toast.error(e.message || 'Gagal menyimpan data guru'); }
    finally { setIsSubmittingGuru(false); }
  };

  // ── Kelas Handlers ──
  const openKelasModal = (k?: KelasItem) => {
    setKelasErrors({});
    if (k) {
      setEditingKelasId(k.id);
      setKelasForm({ nama: k.nama, tingkat: k.tingkat, tahunAjaran: k.tahunAjaran, guruId: k.guruId });
    } else {
      setEditingKelasId(null);
      setKelasForm({ nama: '', tingkat: 'X', tahunAjaran: '2025/2026', guruId: guruList[0]?.guru?.id || '' });
    }
    setShowKelasModal(true);
  };

  const handleSaveKelas = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!kelasForm.nama.trim()) errs.nama = 'Nama kelas wajib diisi';
    if (!kelasForm.tahunAjaran.trim()) errs.tahunAjaran = 'Tahun ajaran wajib diisi';
    if (!kelasForm.guruId) errs.guruId = 'Pilih wali kelas';
    if (Object.keys(errs).length) { setKelasErrors(errs); return; }

    try {
      setIsSubmittingKelas(true);
      if (editingKelasId) {
        await api.patch(`/api/admin/kelas/${editingKelasId}`, kelasForm);
        toast.success('Kelas berhasil diperbarui');
      } else {
        await api.post('/api/admin/kelas', kelasForm);
        toast.success('Kelas berhasil ditambahkan');
      }
      setShowKelasModal(false);
      fetchKelas();
    } catch (e: any) { toast.error(e.message || 'Gagal menyimpan kelas'); }
    finally { setIsSubmittingKelas(false); }
  };

  // ── Delete ──
  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      setIsDeletingId(deleteConfirm.id);
      if (deleteConfirm.type === 'KELAS') {
        await api.delete(`/api/admin/kelas/${deleteConfirm.id}`);
      } else {
        await api.delete(`/api/admin/users/${deleteConfirm.id}`);
      }
      const label = deleteConfirm.type === 'KELAS' ? 'Kelas' : deleteConfirm.type === 'GURU' ? 'Guru' : 'Siswa';
      toast.success(`${label} berhasil dihapus`);
      setDeleteConfirm(null);
      if (deleteConfirm.type === 'SISWA') fetchSiswa();
      else if (deleteConfirm.type === 'GURU') { fetchGuru(); fetchKelas(); }
      else fetchKelas();
    } catch (e: any) { toast.error(e.message || 'Gagal menghapus data'); }
    finally { setIsDeletingId(null); }
  };

  // ── Reset Password ──
  const handleResetPassword = async () => {
    if (!resetConfirm) return;
    try {
      setIsResetting(true);
      await api.post(`/api/admin/users/${resetConfirm.userId}/reset-password`);
      toast.success(`Password "${resetConfirm.nama}" direset ke: ${resetConfirm.resetTo}`);
      setResetConfirm(null);
    } catch (e: any) { toast.error(e.message || 'Gagal mereset password'); }
    finally { setIsResetting(false); }
  };

  const tabs = [
    { id: 'SISWA' as const, label: 'Siswa', Icon: Users, count: siswaList.length },
    { id: 'GURU' as const, label: 'Guru', Icon: GraduationCap, count: guruList.length },
    { id: 'KELAS' as const, label: 'Kelas', Icon: BookOpen, count: kelasList.length },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Manajemen Pengguna</h1>
        <p className="text-slate-500 mt-1">Kelola data siswa, guru, dan kelas sekolah.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        {tabs.map(({ id, label, Icon, count }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <Icon className="w-4 h-4" />
            {label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${activeTab === id ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>{count}</span>
          </button>
        ))}
      </div>

      {/* ════ TAB SISWA ════ */}
      {activeTab === 'SISWA' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-3">
            <div className="flex flex-1 gap-3 min-w-0">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input value={siswaSearch} onChange={e => setSiswaSearch(e.target.value)} placeholder="Cari nama atau NIS..." className="pl-9" />
              </div>
              <Select value={siswaFilterKelas} onChange={e => setSiswaFilterKelas(e.target.value)} className="w-52 shrink-0">
                <option value="ALL">Semua Kelas</option>
                {kelasList.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
              </Select>
            </div>
            <Button onClick={() => openSiswaModal()} className="gap-2 bg-blue-600 hover:bg-blue-700 shrink-0">
              <Plus className="w-4 h-4" /> Tambah Siswa
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              {isLoadingSiswa ? (
                <div className="py-12 text-center text-slate-500">Memuat data siswa...</div>
              ) : filteredSiswa.length === 0 ? (
                <div className="py-12 text-center text-slate-500">Tidak ada siswa ditemukan.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs">
                      <tr>
                        <th className="px-4 py-3 font-semibold">NIS</th>
                        <th className="px-4 py-3 font-semibold">Nama Siswa</th>
                        <th className="px-4 py-3 font-semibold">Kelas</th>
                        <th className="px-4 py-3 font-semibold">Email Login</th>
                        <th className="px-4 py-3 font-semibold text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedSiswa.map(u => (
                        <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3 font-mono font-medium text-slate-700">{u.siswa?.nis}</td>
                          <td className="px-4 py-3 font-medium text-slate-900">{u.siswa?.nama}</td>
                          <td className="px-4 py-3 text-slate-600">{u.siswa?.kelas?.nama || '-'}</td>
                          <td className="px-4 py-3 text-xs text-slate-400">{u.email}</td>
                          <td className="px-4 py-3">
                            <div className="flex justify-center gap-1">
                              <Button variant="ghost" size="sm" onClick={() => openSiswaModal(u)} className="h-8 px-2 text-blue-600 hover:bg-blue-50" aria-label={`Edit ${u.siswa?.nama}`}><Pencil className="w-4 h-4" /></Button>
                              <Button variant="ghost" size="sm" onClick={() => setResetConfirm({ userId: u.id, nama: u.siswa?.nama, resetTo: u.siswa?.nis })} className="h-8 px-2 text-amber-600 hover:bg-amber-50" aria-label={`Reset password ${u.siswa?.nama}`}><KeyRound className="w-4 h-4" /></Button>
                              <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm({ id: u.id, nama: u.siswa?.nama, type: 'SISWA' })} className="h-8 px-2 text-red-500 hover:bg-red-50" aria-label={`Hapus ${u.siswa?.nama}`}><Trash2 className="w-4 h-4" /></Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <Pagination
                    currentPage={siswaPage}
                    totalItems={filteredSiswa.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                    onPageChange={setSiswaPage}
                    itemLabel="siswa"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ════ TAB GURU ════ */}
      {activeTab === 'GURU' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input value={guruSearch} onChange={e => setGuruSearch(e.target.value)} placeholder="Cari nama atau email..." className="pl-9" />
            </div>
            <Button onClick={() => openGuruModal()} className="gap-2 bg-blue-600 hover:bg-blue-700 shrink-0">
              <Plus className="w-4 h-4" /> Tambah Guru
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              {isLoadingGuru ? (
                <div className="py-12 text-center text-slate-500">Memuat data guru...</div>
              ) : filteredGuru.length === 0 ? (
                <div className="py-12 text-center text-slate-500">Tidak ada guru ditemukan.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs">
                      <tr>
                        <th className="px-4 py-3 font-semibold">NIP</th>
                        <th className="px-4 py-3 font-semibold">Nama Guru</th>
                        <th className="px-4 py-3 font-semibold">Email</th>
                        <th className="px-4 py-3 font-semibold">Mata Pelajaran</th>
                        <th className="px-4 py-3 font-semibold text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedGuru.map(u => (
                        <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3 font-mono text-xs text-slate-500">{u.guru?.nip || '-'}</td>
                          <td className="px-4 py-3 font-medium text-slate-900">{u.guru?.nama}</td>
                          <td className="px-4 py-3 text-slate-600">{u.email}</td>
                          <td className="px-4 py-3 text-slate-600">{u.guru?.mataPelajaran}</td>
                          <td className="px-4 py-3">
                            <div className="flex justify-center gap-1">
                              <Button variant="ghost" size="sm" onClick={() => openGuruModal(u)} className="h-8 px-2 text-blue-600 hover:bg-blue-50" aria-label={`Edit ${u.guru?.nama}`}><Pencil className="w-4 h-4" /></Button>
                              <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm({ id: u.id, nama: u.guru?.nama, type: 'GURU' })} className="h-8 px-2 text-red-500 hover:bg-red-50" aria-label={`Hapus ${u.guru?.nama}`}><Trash2 className="w-4 h-4" /></Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <Pagination
                    currentPage={guruPage}
                    totalItems={filteredGuru.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                    onPageChange={setGuruPage}
                    itemLabel="guru"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ════ TAB KELAS ════ */}
      {activeTab === 'KELAS' && (
        <div className="space-y-4">
          {guruList.length === 0 && !isLoadingGuru && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              Tambahkan guru terlebih dahulu sebelum membuat kelas.
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input value={kelasSearch} onChange={e => setKelasSearch(e.target.value)} placeholder="Cari nama kelas..." className="pl-9" />
            </div>
            <Button
              onClick={() => openKelasModal()}
              disabled={guruList.length === 0}
              title={guruList.length === 0 ? 'Tambahkan guru terlebih dahulu sebelum membuat kelas' : undefined}
              className="gap-2 bg-blue-600 hover:bg-blue-700 shrink-0"
            >
              <Plus className="w-4 h-4" /> Tambah Kelas
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              {isLoadingKelas ? (
                <div className="py-12 text-center text-slate-500">Memuat data kelas...</div>
              ) : filteredKelas.length === 0 ? (
                <div className="py-12 text-center text-slate-500">Belum ada kelas. Klik "Tambah Kelas" untuk membuat.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Nama Kelas</th>
                        <th className="px-4 py-3 font-semibold">Tingkat</th>
                        <th className="px-4 py-3 font-semibold">Tahun Ajaran</th>
                        <th className="px-4 py-3 font-semibold">Wali Kelas</th>
                        <th className="px-4 py-3 font-semibold text-center">Siswa</th>
                        <th className="px-4 py-3 font-semibold text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedKelas.map(k => (
                        <tr key={k.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3 font-semibold text-slate-900">{k.nama}</td>
                          <td className="px-4 py-3"><Badge variant="outline">{k.tingkat}</Badge></td>
                          <td className="px-4 py-3 text-slate-600">{k.tahunAjaran}</td>
                          <td className="px-4 py-3 text-slate-600">{k.guru?.nama || '-'}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 font-semibold text-slate-700 text-sm">{k._count.siswa}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-center gap-1">
                              <Button variant="ghost" size="sm" onClick={() => openKelasModal(k)} className="h-8 px-2 text-blue-600 hover:bg-blue-50" aria-label={`Edit kelas ${k.nama}`}><Pencil className="w-4 h-4" /></Button>
                              <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm({ id: k.id, nama: k.nama, type: 'KELAS' })} className="h-8 px-2 text-red-500 hover:bg-red-50" aria-label={`Hapus kelas ${k.nama}`}><Trash2 className="w-4 h-4" /></Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <Pagination
                    currentPage={kelasPage}
                    totalItems={filteredKelas.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                    onPageChange={setKelasPage}
                    itemLabel="kelas"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ════ MODAL SISWA ════ */}
      {showSiswaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div
            ref={siswaModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="siswa-modal-title"
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="px-6 pt-6 pb-4 border-b border-slate-100">
              <h2 id="siswa-modal-title" className="text-lg font-bold text-slate-900">{editingSiswaId ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}</h2>
            </div>
            <form onSubmit={handleSaveSiswa}>
              <div className="px-6 py-5 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="s-nis">NIS <span className="text-red-500">*</span></Label>
                  <Input id="s-nis" value={siswaForm.nis} onChange={e => setSiswaForm(f => ({ ...f, nis: e.target.value }))} placeholder="Contoh: 12345" />
                  <FieldError msg={siswaErrors.nis} />
                  {!editingSiswaId && <p className="text-xs text-slate-400">Email & password default dibuat otomatis dari NIS.</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="s-nama">Nama Lengkap <span className="text-red-500">*</span></Label>
                  <Input id="s-nama" value={siswaForm.nama} onChange={e => setSiswaForm(f => ({ ...f, nama: e.target.value }))} placeholder="Nama Lengkap Siswa" />
                  <FieldError msg={siswaErrors.nama} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="s-kelas">Kelas <span className="text-red-500">*</span></Label>
                  <Select id="s-kelas" value={siswaForm.kelasId} onChange={e => setSiswaForm(f => ({ ...f, kelasId: e.target.value }))}>
                    <option value="">-- Pilih Kelas --</option>
                    {kelasList.map(k => <option key={k.id} value={k.id}>{k.nama} ({k.tingkat}) — {k.tahunAjaran}</option>)}
                  </Select>
                  <FieldError msg={siswaErrors.kelasId} />
                </div>
                {!editingSiswaId && siswaForm.nis && (
                  <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-600 border border-slate-200 space-y-1">
                    <p>Email login: <span className="font-mono font-semibold">{siswaForm.nis}@siswa.sch.id</span></p>
                    <p>Password default: <span className="font-mono font-semibold">{siswaForm.nis}</span></p>
                  </div>
                )}
              </div>
              <div className="px-6 pb-6 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setShowSiswaModal(false)} disabled={isSubmittingSiswa}>Batal</Button>
                <Button type="submit" disabled={isSubmittingSiswa} className="bg-blue-600 hover:bg-blue-700">
                  {isSubmittingSiswa ? <><Spinner />Menyimpan...</> : 'Simpan'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════ MODAL GURU ════ */}
      {showGuruModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div
            ref={guruModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="guru-modal-title"
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="px-6 pt-6 pb-4 border-b border-slate-100">
              <h2 id="guru-modal-title" className="text-lg font-bold text-slate-900">{editingGuruId ? 'Edit Data Guru' : 'Tambah Guru Baru'}</h2>
            </div>
            <form onSubmit={handleSaveGuru}>
              <div className="px-6 py-5 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="g-nama">Nama Lengkap <span className="text-red-500">*</span></Label>
                  <Input id="g-nama" value={guruForm.nama} onChange={e => setGuruForm(f => ({ ...f, nama: e.target.value }))} placeholder="Nama Lengkap Guru" />
                  <FieldError msg={guruErrors.nama} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="g-email">Email <span className="text-red-500">*</span></Label>
                  <Input id="g-email" type="email" value={guruForm.email} onChange={e => setGuruForm(f => ({ ...f, email: e.target.value }))} placeholder="guru@sekolah.sch.id" />
                  <FieldError msg={guruErrors.email} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="g-nip">NIP <span className="text-slate-400 font-normal">(opsional)</span></Label>
                    <Input id="g-nip" value={guruForm.nip} onChange={e => setGuruForm(f => ({ ...f, nip: e.target.value }))} placeholder="NIP" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="g-mapel">Mata Pelajaran <span className="text-red-500">*</span></Label>
                    <Input id="g-mapel" value={guruForm.mataPelajaran} onChange={e => setGuruForm(f => ({ ...f, mataPelajaran: e.target.value }))} placeholder="Matematika" />
                    <FieldError msg={guruErrors.mataPelajaran} />
                  </div>
                </div>
                {!editingGuruId && (
                  <div className="space-y-1.5">
                    <Label htmlFor="g-pass">Password <span className="text-red-500">*</span></Label>
                    <Input id="g-pass" type="password" value={guruForm.password} onChange={e => setGuruForm(f => ({ ...f, password: e.target.value }))} placeholder="Password awal" />
                    <FieldError msg={guruErrors.password} />
                  </div>
                )}
              </div>
              <div className="px-6 pb-6 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setShowGuruModal(false)} disabled={isSubmittingGuru}>Batal</Button>
                <Button type="submit" disabled={isSubmittingGuru} className="bg-blue-600 hover:bg-blue-700">
                  {isSubmittingGuru ? <><Spinner />Menyimpan...</> : 'Simpan'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════ MODAL KELAS ════ */}
      {showKelasModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div
            ref={kelasModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="kelas-modal-title"
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="px-6 pt-6 pb-4 border-b border-slate-100">
              <h2 id="kelas-modal-title" className="text-lg font-bold text-slate-900">{editingKelasId ? 'Edit Kelas' : 'Tambah Kelas Baru'}</h2>
            </div>
            <form onSubmit={handleSaveKelas}>
              <div className="px-6 py-5 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="k-nama">Nama Kelas <span className="text-red-500">*</span></Label>
                  <Input id="k-nama" value={kelasForm.nama} onChange={e => setKelasForm(f => ({ ...f, nama: e.target.value }))} placeholder="Contoh: XII IPA 1" />
                  <FieldError msg={kelasErrors.nama} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="k-tingkat">Tingkat <span className="text-red-500">*</span></Label>
                    <Select id="k-tingkat" value={kelasForm.tingkat} onChange={e => setKelasForm(f => ({ ...f, tingkat: e.target.value }))}>
                      <option value="X">Kelas X</option>
                      <option value="XI">Kelas XI</option>
                      <option value="XII">Kelas XII</option>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="k-tahun">Tahun Ajaran <span className="text-red-500">*</span></Label>
                    <Input id="k-tahun" value={kelasForm.tahunAjaran} onChange={e => setKelasForm(f => ({ ...f, tahunAjaran: e.target.value }))} placeholder="2025/2026" />
                    <FieldError msg={kelasErrors.tahunAjaran} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="k-guru">Wali Kelas <span className="text-red-500">*</span></Label>
                  <Select id="k-guru" value={kelasForm.guruId} onChange={e => setKelasForm(f => ({ ...f, guruId: e.target.value }))}>
                    <option value="">-- Pilih Guru --</option>
                    {guruList.map(u => <option key={u.guru.id} value={u.guru.id}>{u.guru.nama} — {u.guru.mataPelajaran}</option>)}
                  </Select>
                  <FieldError msg={kelasErrors.guruId} />
                </div>
              </div>
              <div className="px-6 pb-6 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setShowKelasModal(false)} disabled={isSubmittingKelas}>Batal</Button>
                <Button type="submit" disabled={isSubmittingKelas} className="bg-blue-600 hover:bg-blue-700">
                  {isSubmittingKelas ? <><Spinner />Menyimpan...</> : 'Simpan'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════ MODAL KONFIRMASI HAPUS ════ */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div
            ref={deleteModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
            className="w-full max-w-sm bg-white rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 p-6 text-center space-y-4"
          >
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h3 id="delete-modal-title" className="font-bold text-slate-900 text-lg">
                Hapus {deleteConfirm.type === 'KELAS' ? 'Kelas' : deleteConfirm.type === 'GURU' ? 'Guru' : 'Siswa'}?
              </h3>
              <p className="text-slate-500 text-sm mt-1.5">
                Anda akan menghapus <span className="font-semibold text-slate-700">"{deleteConfirm.nama}"</span>.
                {deleteConfirm.type === 'SISWA' && ' Semua data ujian siswa ini juga akan terhapus.'}
                {deleteConfirm.type === 'KELAS' && ' Kelas tidak dapat dihapus jika masih ada siswa di dalamnya.'}
                {' Tindakan ini tidak dapat dibatalkan.'}
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => setDeleteConfirm(null)} disabled={isDeletingId !== null}>Batal</Button>
              <Button onClick={handleDelete} disabled={isDeletingId !== null} className="bg-red-600 hover:bg-red-700 text-white">
                {isDeletingId !== null ? <><Spinner />Menghapus...</> : 'Ya, Hapus'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ════ MODAL RESET PASSWORD ════ */}
      {resetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div
            ref={resetModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-modal-title"
            className="w-full max-w-sm bg-white rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 p-6 text-center space-y-4"
          >
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
              <KeyRound className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 id="reset-modal-title" className="font-bold text-slate-900 text-lg">Reset Password?</h3>
              <p className="text-slate-500 text-sm mt-1.5">
                Password <span className="font-semibold text-slate-700">{resetConfirm.nama}</span> akan direset ke:
              </p>
              <p className="mt-2 font-mono text-base font-bold text-slate-800 bg-slate-100 px-3 py-2 rounded-lg inline-block">
                {resetConfirm.resetTo}
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => setResetConfirm(null)} disabled={isResetting}>Batal</Button>
              <Button onClick={handleResetPassword} disabled={isResetting} className="bg-amber-600 hover:bg-amber-700 text-white">
                {isResetting ? <><Spinner />Mereset...</> : 'Ya, Reset'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
