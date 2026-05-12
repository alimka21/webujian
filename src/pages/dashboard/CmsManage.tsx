import { toast } from 'sonner';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input, Label } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Plus, Edit, Trash2, Eye, ExternalLink, Search, Globe, FileEdit, X } from 'lucide-react';
import api from '../../lib/api';
import { useModalA11y } from '../../hooks/useModalA11y';

const EMPTY_FORM = { judul: '', ringkasan: '', konten: '', imageUrl: '', status: 'DRAFT', slug: '' };

export default function CmsManage() {
  const [beritaList, setBeritaList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [search, setSearch] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ ...EMPTY_FORM });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const modalRef = useModalA11y<HTMLDivElement>(showModal, () => setShowModal(false));

  const fetchBerita = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/api/admin/berita');
      setBeritaList(res);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchBerita(); }, []);

  const generateSlug = (title: string) =>
    title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setFormData(prev => ({ ...prev, judul: title, slug: editingId ? prev.slug : generateSlug(title) }));
  };

  const handleOpenModal = (b?: any) => {
    if (b) {
      setEditingId(b.id);
      setFormData({ judul: b.judul, ringkasan: b.ringkasan || '', konten: b.konten, imageUrl: b.imageUrl || '', status: b.status, slug: b.slug });
    } else {
      setEditingId(null);
      setFormData({ ...EMPTY_FORM });
    }
    setShowModal(true);
  };

  const handleSave = async (overrideStatus?: string) => {
    const payload = overrideStatus ? { ...formData, status: overrideStatus } : formData;
    if (!payload.judul || !payload.konten || !payload.slug) {
      toast.error('Judul, Slug, dan Konten wajib diisi!');
      return;
    }
    try {
      setIsSubmitting(true);
      if (editingId) {
        await api.patch(`/api/admin/berita/${editingId}`, payload);
      } else {
        await api.post('/api/admin/berita', payload);
      }
      toast.success(overrideStatus === 'PUBLISHED' ? 'Berita berhasil diterbitkan!' : 'Draft berhasil disimpan!');
      setShowModal(false);
      fetchBerita();
    } catch (error: any) {
      toast.error(error.message || 'Gagal menyimpan berita');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePublish = async (b: any) => {
    const next = b.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    try {
      setTogglingId(b.id);
      await api.patch(`/api/admin/berita/${b.id}`, { status: next });
      toast.success(next === 'PUBLISHED' ? 'Berita diterbitkan!' : 'Berita dijadikan draft.');
      fetchBerita();
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengubah status');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/admin/berita/${id}`);
      setDeleteConfirmId(null);
      toast.success('Berita dihapus.');
      fetchBerita();
    } catch (error: any) {
      toast.error(error.message || 'Gagal menghapus berita');
    }
  };

  const displayList = beritaList
    .filter(b => filterStatus === 'ALL' || b.status === filterStatus)
    .filter(b => !search || b.judul.toLowerCase().includes(search.toLowerCase()));

  const statusBadge = (status: string) => {
    if (status === 'PUBLISHED') return <Badge className="bg-green-100 text-green-700 border-0 hover:bg-green-100">Published</Badge>;
    if (status === 'DRAFT') return <Badge variant="outline" className="text-slate-600">Draft</Badge>;
    return <Badge variant="outline" className="text-slate-400">Archived</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Konten Berita</h1>
          <p className="text-slate-500 mt-1">Kelola berita, pengumuman, dan artikel di website sekolah.</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="gap-2 bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Tambah Berita
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <CardTitle>Daftar Artikel</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <Input
                  placeholder="Cari judul..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
              <Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-full sm:w-52">
                <option value="ALL">Semua Status</option>
                <option value="PUBLISHED">Published</option>
                <option value="DRAFT">Draft</option>
                <option value="ARCHIVED">Archived</option>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-12 text-center text-slate-500">Memuat konten...</div>
          ) : displayList.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-200 rounded-xl m-6">
              <p className="text-lg font-medium text-slate-700">Tidak ada berita</p>
              <p className="text-sm">{search ? 'Coba kata kunci lain.' : 'Klik "Tambah Berita" untuk mulai menulis.'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3 font-semibold w-20">Gambar</th>
                    <th className="px-4 py-3 font-semibold">Judul & Detail</th>
                    <th className="px-4 py-3 font-semibold text-center">Status</th>
                    <th className="px-4 py-3 font-semibold text-center whitespace-nowrap">Dibuat</th>
                    <th className="px-4 py-3 font-semibold text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayList.map(b => (
                    <React.Fragment key={b.id}>
                      <tr className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-4">
                          <div className="w-16 h-12 bg-slate-100 rounded border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                            {b.imageUrl
                              ? <img src={b.imageUrl} alt={b.judul} className="w-full h-full object-cover" />
                              : <span className="text-[10px] text-slate-400">No Img</span>
                            }
                          </div>
                        </td>
                        <td className="px-4 py-4 max-w-xs">
                          <p className="font-semibold text-slate-900 line-clamp-1">{b.judul}</p>
                          <p className="text-xs text-slate-400 font-mono mt-0.5 truncate">/{b.slug}</p>
                          {b.ringkasan && <p className="text-xs text-slate-500 mt-1 line-clamp-1">{b.ringkasan}</p>}
                        </td>
                        <td className="px-4 py-4 text-center">{statusBadge(b.status)}</td>
                        <td className="px-4 py-4 text-center text-xs text-slate-500 whitespace-nowrap">
                          <div>{new Date(b.createdAt).toLocaleDateString('id-ID')}</div>
                          {b.publishedAt && b.status === 'PUBLISHED' && (
                            <div className="text-green-600 mt-0.5">
                              Publish: {new Date(b.publishedAt).toLocaleDateString('id-ID')}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex justify-center items-center gap-1.5 flex-wrap">
                            <Button
                              variant="ghost" size="sm"
                              onClick={() => handleTogglePublish(b)}
                              disabled={togglingId === b.id || b.status === 'ARCHIVED'}
                              title={b.status === 'PUBLISHED' ? 'Jadikan Draft' : 'Terbitkan'}
                              className={`h-8 px-2 ${b.status === 'PUBLISHED' ? 'text-amber-600 hover:bg-amber-50' : 'text-green-600 hover:bg-green-50'}`}
                            >
                              {b.status === 'PUBLISHED' ? <FileEdit className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleOpenModal(b)} className="text-blue-600 hover:bg-blue-50 h-8 px-2" title="Edit">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setDeleteConfirmId(b.id)} className="text-red-500 hover:bg-red-50 h-8 px-2" title="Hapus">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                            {b.status === 'PUBLISHED' && (
                              <Button variant="ghost" size="sm" onClick={() => window.open(`/berita/${b.slug}`, '_blank')} className="text-slate-500 hover:bg-slate-100 h-8 px-2" title="Lihat Publik">
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {deleteConfirmId === b.id && (
                        <tr className="bg-red-50">
                          <td colSpan={5} className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-red-700 font-medium flex-1">
                                Hapus "<span className="font-semibold">{b.judul}</span>"? Tindakan ini tidak dapat dibatalkan.
                              </span>
                              <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white h-7 px-3 text-xs" onClick={() => handleDelete(b.id)}>
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="berita-modal-title"
            className="bg-white w-full max-w-4xl rounded-2xl shadow-xl my-auto flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <h2 id="berita-modal-title" className="text-lg font-bold text-slate-900">{editingId ? 'Edit Berita' : 'Tulis Berita Baru'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400" aria-label="Tutup modal">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="judul">Judul Artikel <span className="text-red-500">*</span></Label>
                <Input id="judul" value={formData.judul} onChange={handleTitleChange} placeholder="Tuliskan judul menarik..." className="text-base font-medium h-11" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug (URL) <span className="text-red-500">*</span></Label>
                  <Input id="slug" value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value })} placeholder="contoh-judul-berita" className="font-mono text-sm" />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="ARCHIVED">Archived</option>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="imageUrl">URL Gambar Header</Label>
                <Input id="imageUrl" value={formData.imageUrl} onChange={e => setFormData({ ...formData, imageUrl: e.target.value })} placeholder="https://..." />
                {formData.imageUrl && (
                  <div className="mt-2 h-36 w-64 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                    <img src={formData.imageUrl} alt="preview" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ringkasan">Ringkasan</Label>
                <textarea
                  id="ringkasan"
                  value={formData.ringkasan}
                  onChange={e => setFormData({ ...formData, ringkasan: e.target.value })}
                  rows={2}
                  className="w-full p-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Ringkasan singkat 1-2 kalimat yang tampil di halaman depan..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="konten">Isi Konten Lengkap <span className="text-red-500">*</span></Label>
                <textarea
                  id="konten"
                  value={formData.konten}
                  onChange={e => setFormData({ ...formData, konten: e.target.value })}
                  rows={12}
                  className="w-full p-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y font-mono"
                  placeholder="Tuliskan konten lengkap di sini. Mendukung Markdown..."
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center gap-3 shrink-0 bg-slate-50 rounded-b-2xl">
              <div className="flex gap-2">
                {formData.status === 'PUBLISHED' && (
                  <Button type="button" variant="outline" size="sm" onClick={() => window.open(`/berita/${formData.slug}`, '_blank')} className="gap-1.5">
                    <Eye className="w-3.5 h-3.5" /> Preview
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)} disabled={isSubmitting}>Batal</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleSave('DRAFT')}
                  disabled={isSubmitting}
                  className="gap-2"
                >
                  {isSubmitting ? <div className="w-3.5 h-3.5 border-2 border-slate-400/40 border-t-slate-400 rounded-full animate-spin" /> : null}
                  Simpan Draft
                </Button>
                <Button
                  type="button"
                  onClick={() => handleSave('PUBLISHED')}
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 gap-2"
                >
                  {isSubmitting ? <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
                  Publish Sekarang
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
