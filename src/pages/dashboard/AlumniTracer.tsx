import { toast } from 'sonner';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input, Label } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Plus, Download, Edit, Trash2, Building, GraduationCap, Briefcase, Users, HelpCircle, Search, X } from 'lucide-react';
import api from '../../lib/api';
import { useModalA11y } from '../../hooks/useModalA11y';
import { Pagination } from '../../components/ui/pagination';

const ITEMS_PER_PAGE = 20;
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, Legend } from 'recharts';

const EMPTY_FORM = {
  nama: '', nis: '', tahunLulus: new Date().getFullYear(),
  status: 'KULIAH', instansi: '', jurusan: '', posisi: '', kontak: '', fotoUrl: ''
};

const STATUS_OPTIONS = [
  { value: 'BEKERJA', label: 'Bekerja' },
  { value: 'KULIAH', label: 'Melanjutkan Kuliah' },
  { value: 'WIRAUSAHA', label: 'Wirausaha' },
  { value: 'TIDAK_DIKETAHUI', label: 'Tidak Diketahui' },
];

const STATUS_COLOR: Record<string, string> = {
  BEKERJA: '#3b82f6',
  KULIAH: '#22c55e',
  WIRAUSAHA: '#f59e0b',
  TIDAK_DIKETAHUI: '#94a3b8',
};

function Inisial({ nama, fotoUrl }: { nama: string; fotoUrl?: string }) {
  const initials = nama.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  if (fotoUrl) {
    return <img src={fotoUrl} alt={nama} className="w-9 h-9 rounded-full object-cover border border-slate-200" onError={e => { e.currentTarget.style.display = 'none'; }} />;
  }
  const colors = ['bg-blue-100 text-blue-700', 'bg-green-100 text-green-700', 'bg-amber-100 text-amber-700', 'bg-purple-100 text-purple-700'];
  const idx = nama.charCodeAt(0) % colors.length;
  return (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${colors[idx]}`}>
      {initials}
    </div>
  );
}

export default function AlumniTracer() {
  const [alumniList, setAlumniList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterTahun, setFilterTahun] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterJurusan, setFilterJurusan] = useState('ALL');
  const [search, setSearch] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ ...EMPTY_FORM });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const modalRef = useModalA11y<HTMLDivElement>(showModal, () => setShowModal(false));

  // Reset ke halaman 1 saat search/filter berubah
  useEffect(() => { setCurrentPage(1); }, [search, filterTahun, filterStatus, filterJurusan]);

  const fetchAlumni = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/api/admin/alumni');
      setAlumniList(res);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAlumni(); }, []);

  const handleOpenModal = (alumni?: any) => {
    if (alumni) {
      setEditingId(alumni.id);
      setFormData({
        nama: alumni.nama, nis: alumni.nis || '',
        tahunLulus: alumni.tahunLulus, status: alumni.status,
        instansi: alumni.instansi || '', jurusan: alumni.jurusan || '',
        posisi: alumni.posisi || '', kontak: alumni.kontak || '',
        fotoUrl: alumni.fotoUrl || ''
      });
    } else {
      setEditingId(null);
      setFormData({ ...EMPTY_FORM });
    }
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama || !formData.tahunLulus || !formData.status) {
      toast.error('Nama, Tahun Lulus, dan Status wajib diisi!');
      return;
    }
    try {
      setIsSubmitting(true);
      const payload = { ...formData, tahunLulus: Number(formData.tahunLulus) };
      if (editingId) {
        await api.patch(`/api/admin/alumni/${editingId}`, payload);
      } else {
        await api.post('/api/admin/alumni', payload);
      }
      toast.success(editingId ? 'Data alumni diperbarui.' : 'Alumni berhasil ditambahkan.');
      setShowModal(false);
      fetchAlumni();
    } catch (error: any) {
      toast.error(error.message || 'Gagal menyimpan data alumni');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/admin/alumni/${id}`);
      setDeleteConfirmId(null);
      toast.success('Data alumni dihapus.');
      fetchAlumni();
    } catch (error: any) {
      toast.error(error.message || 'Gagal menghapus alumni');
    }
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      let token = localStorage.getItem('token');
      if (!token) {
        try { const raw = localStorage.getItem('auth-storage'); if (raw) token = JSON.parse(raw)?.state?.token; } catch { /* ignore */ }
      }
      const resp = await fetch('/api/admin/alumni/export', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!resp.ok) throw new Error('Gagal mengunduh file');
      const blob = await resp.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href;
      a.download = 'data-alumni.xlsx';
      a.click();
      URL.revokeObjectURL(href);
      toast.success('File Excel berhasil diunduh');
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengunduh');
    } finally {
      setIsExporting(false);
    }
  };

  // Stats
  const stats = alumniList.reduce((acc: Record<string, number>, al) => {
    acc[al.status] = (acc[al.status] || 0) + 1;
    return acc;
  }, {});
  const total = alumniList.length;

  // Chart data
  const pieData = STATUS_OPTIONS
    .map(s => ({ name: s.label, value: stats[s.value] || 0, color: STATUS_COLOR[s.value] }))
    .filter(d => d.value > 0);

  const yearsMap = alumniList.reduce((acc: Record<string, number>, al) => {
    acc[al.tahunLulus] = (acc[al.tahunLulus] || 0) + 1;
    return acc;
  }, {});
  const barData = Object.keys(yearsMap)
    .map(y => ({ tahun: y, jumlah: yearsMap[y] }))
    .sort((a, b) => Number(a.tahun) - Number(b.tahun));

  // Filter options
  const existingYears = [...new Set(alumniList.map(a => a.tahunLulus))].sort((a: any, b: any) => b - a);
  const existingJurusan = [...new Set(alumniList.map(a => a.jurusan).filter(Boolean))].sort();

  // Filtered list
  const displayAlumni = alumniList.filter(al => {
    if (filterTahun !== 'ALL' && String(al.tahunLulus) !== filterTahun) return false;
    if (filterStatus !== 'ALL' && al.status !== filterStatus) return false;
    if (filterJurusan !== 'ALL' && al.jurusan !== filterJurusan) return false;
    if (search && !al.nama.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Paginated slice
  const paginatedAlumni = displayAlumni.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const statCards = [
    { label: 'Total Terdata', value: total, icon: Users, bg: 'bg-slate-50 border-slate-100', iconBg: 'bg-slate-200 text-slate-700', text: 'text-slate-900' },
    { label: 'Bekerja', value: stats.BEKERJA || 0, icon: Briefcase, bg: 'bg-blue-50 border-blue-100', iconBg: 'bg-blue-200 text-blue-700', text: 'text-blue-900' },
    { label: 'Kuliah', value: stats.KULIAH || 0, icon: GraduationCap, bg: 'bg-green-50 border-green-100', iconBg: 'bg-green-200 text-green-700', text: 'text-green-900' },
    { label: 'Wirausaha', value: stats.WIRAUSAHA || 0, icon: Building, bg: 'bg-amber-50 border-amber-100', iconBg: 'bg-amber-200 text-amber-700', text: 'text-amber-900' },
    { label: 'Tidak Diketahui', value: stats.TIDAK_DIKETAHUI || 0, icon: HelpCircle, bg: 'bg-slate-50 border-slate-200', iconBg: 'bg-slate-200 text-slate-500', text: 'text-slate-700' },
  ];

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      BEKERJA: 'bg-blue-100 text-blue-700',
      KULIAH: 'bg-green-100 text-green-700',
      WIRAUSAHA: 'bg-amber-100 text-amber-700',
      TIDAK_DIKETAHUI: 'bg-slate-100 text-slate-600',
    };
    const label = STATUS_OPTIONS.find(s => s.value === status)?.label ?? status;
    return <Badge className={`${map[status] || 'bg-slate-100 text-slate-600'} border-0 hover:opacity-100`}>{label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Tracer Study Alumni</h1>
          <p className="text-slate-500 mt-1">Pantau jejak karir dan pendidikan lanjutan lulusan.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={handleExport} disabled={isExporting}>
            {isExporting ? <div className="w-4 h-4 border-2 border-slate-400/40 border-t-slate-600 rounded-full animate-spin" /> : <Download className="w-4 h-4" />}
            Export Excel
          </Button>
          <Button onClick={() => handleOpenModal()} className="gap-2 bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4" /> Tambah Alumni
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {statCards.map(card => (
          <div key={card.label} className={`border p-4 rounded-xl flex items-center gap-3 ${card.bg}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${card.iconBg}`}>
              <card.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium leading-tight">{card.label}</p>
              <p className={`text-xl font-bold ${card.text}`}>{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      {total > 0 && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Persentase Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-56">
                <ResponsiveContainer width="60%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={46} outerRadius={74} paddingAngle={2} dataKey="value">
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-2">
                  {pieData.map(d => (
                    <div key={d.name} className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="text-slate-600">{d.name}</span>
                      <span className="font-bold text-slate-800 ml-auto pl-3">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Lulusan per Tahun</CardTitle>
            </CardHeader>
            <CardContent className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="tahun" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none' }} />
                  <Bar dataKey="jumlah" name="Jumlah" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabel */}
      <Card>
        <CardHeader className="pb-4 border-b border-slate-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <CardTitle>Data Lulusan</CardTitle>
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <Input placeholder="Cari nama..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 w-44" />
              </div>
              <Select value={filterTahun} onChange={e => setFilterTahun(e.target.value)} className="h-9 w-36">
                <option value="ALL">Semua Tahun</option>
                {existingYears.map(y => <option key={y} value={y}>Lulusan {y}</option>)}
              </Select>
              <Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="h-9 w-40">
                <option value="ALL">Semua Status</option>
                {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </Select>
              {existingJurusan.length > 0 && (
                <Select value={filterJurusan} onChange={e => setFilterJurusan(e.target.value)} className="h-9 w-40">
                  <option value="ALL">Semua Jurusan</option>
                  {existingJurusan.map(j => <option key={j} value={j}>{j}</option>)}
                </Select>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-12 text-center text-slate-500">Memuat data alumni...</div>
          ) : displayAlumni.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-200 rounded-xl m-6">
              <p className="text-lg font-medium text-slate-700">Belum ada data</p>
              <p className="text-sm">{search ? 'Coba kata kunci lain.' : 'Data alumni kosong untuk filter ini.'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3 font-semibold w-10"></th>
                    <th className="px-4 py-3 font-semibold">Nama Alumni</th>
                    <th className="px-4 py-3 font-semibold text-center">Lulus</th>
                    <th className="px-4 py-3 font-semibold">Jurusan</th>
                    <th className="px-4 py-3 font-semibold">Status & Tempat</th>
                    <th className="px-4 py-3 font-semibold text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedAlumni.map(al => (
                    <React.Fragment key={al.id}>
                      <tr className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3">
                          <Inisial nama={al.nama} fotoUrl={al.fotoUrl} />
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-900">{al.nama}</p>
                          <p className="text-xs text-slate-500">NIS: {al.nis || '—'}</p>
                          {al.kontak && <p className="text-xs text-blue-600 mt-0.5 truncate max-w-[180px]">{al.kontak}</p>}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-slate-700">{al.tahunLulus}</td>
                        <td className="px-4 py-3 text-slate-600 text-xs">{al.jurusan || '—'}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            {statusBadge(al.status)}
                            {al.instansi && <span className="text-xs font-medium text-slate-700">{al.instansi}</span>}
                            {al.posisi && <span className="text-xs text-slate-500">{al.posisi}</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-center gap-1.5">
                            <Button variant="ghost" size="sm" onClick={() => handleOpenModal(al)} className="text-blue-600 hover:bg-blue-50 h-8 px-2" title="Edit">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setDeleteConfirmId(al.id)} className="text-red-500 hover:bg-red-50 h-8 px-2" title="Hapus">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                      {deleteConfirmId === al.id && (
                        <tr className="bg-red-50">
                          <td colSpan={6} className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-red-700 font-medium flex-1">
                                Hapus data alumni "<span className="font-semibold">{al.nama}</span>"?
                              </span>
                              <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white h-7 px-3 text-xs" onClick={() => handleDelete(al.id)}>
                                Ya, Hapus
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 px-3 text-xs" onClick={() => setDeleteConfirmId(null)}>
                                Batal
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
              <Pagination
                currentPage={currentPage}
                totalItems={displayAlumni.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setCurrentPage}
                itemLabel="alumni"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="alumni-modal-title"
            className="bg-white w-full max-w-lg rounded-2xl shadow-xl my-auto flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <h2 id="alumni-modal-title" className="text-lg font-bold text-slate-900">{editingId ? 'Edit Data Alumni' : 'Tambah Alumni'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400" aria-label="Tutup modal">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
              <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
                <div className="space-y-2">
                  <Label>URL Foto (Opsional)</Label>
                  <Input value={formData.fotoUrl} onChange={e => setFormData({ ...formData, fotoUrl: e.target.value })} placeholder="https://..." />
                  {formData.fotoUrl && (
                    <img src={formData.fotoUrl} alt="preview" className="w-14 h-14 rounded-full object-cover border border-slate-200 mt-1" onError={e => (e.currentTarget.style.display = 'none')} />
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Nama Lengkap <span className="text-red-500">*</span></Label>
                  <Input required value={formData.nama} onChange={e => setFormData({ ...formData, nama: e.target.value })} placeholder="Nama Alumni" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>NIS (Opsional)</Label>
                    <Input value={formData.nis} onChange={e => setFormData({ ...formData, nis: e.target.value })} placeholder="NIS" />
                  </div>
                  <div className="space-y-2">
                    <Label>Tahun Lulus <span className="text-red-500">*</span></Label>
                    <Input type="number" required value={formData.tahunLulus} onChange={e => setFormData({ ...formData, tahunLulus: parseInt(e.target.value) || new Date().getFullYear() })} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Jurusan (Saat SMA)</Label>
                  <Input value={formData.jurusan} onChange={e => setFormData({ ...formData, jurusan: e.target.value })} placeholder="Contoh: IPA, IPS, Teknik Komputer..." />
                </div>

                <div className="space-y-2">
                  <Label>Status Saat Ini <span className="text-red-500">*</span></Label>
                  <Select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                    {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Nama Instansi / Kampus / Usaha</Label>
                  <Input value={formData.instansi} onChange={e => setFormData({ ...formData, instansi: e.target.value })} placeholder="PT Maju Jaya / Universitas Indonesia..." />
                </div>

                <div className="space-y-2">
                  <Label>Posisi / Program Studi</Label>
                  <Input value={formData.posisi} onChange={e => setFormData({ ...formData, posisi: e.target.value })} placeholder="Software Engineer / Teknik Informatika..." />
                </div>

                <div className="space-y-2">
                  <Label>Kontak</Label>
                  <Input value={formData.kontak} onChange={e => setFormData({ ...formData, kontak: e.target.value })} placeholder="Email / LinkedIn / No. HP" />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2 shrink-0 bg-slate-50 rounded-b-2xl">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)} disabled={isSubmitting}>Batal</Button>
                <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 gap-2">
                  {isSubmitting && <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
