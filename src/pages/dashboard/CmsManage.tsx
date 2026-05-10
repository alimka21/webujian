import { toast } from 'sonner';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input, Label } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Plus, Edit, Trash2, Eye, ExternalLink } from 'lucide-react';
import api from '../../lib/api';

export default function CmsManage() {
  const [beritaList, setBeritaList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    judul: '',
    ringkasan: '',
    konten: '',
    imageUrl: '',
    status: 'DRAFT',
    slug: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBerita = async () => {
    try {
      setIsLoading(true);
      const endpoint = filterStatus === 'ALL' ? '/api/berita' : `/api/berita?status=${filterStatus}`;
      const res = await api.get(endpoint);
      setBeritaList(res);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBerita();
  }, [filterStatus]);

  const generateSlug = (title: string) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setFormData(prev => ({
      ...prev,
      judul: title,
      // Only auto-generate slug if creating new
      slug: editingId ? prev.slug : generateSlug(title)
    }));
  };

  const handleOpenModal = (b?: any) => {
    if (b) {
      setEditingId(b.id);
      setFormData({
        judul: b.judul,
        ringkasan: b.ringkasan || '',
        konten: b.konten,
        imageUrl: b.imageUrl || '',
        status: b.status,
        slug: b.slug
      });
    } else {
      setEditingId(null);
      setFormData({
        judul: '',
        ringkasan: '',
        konten: '',
        imageUrl: '',
        status: 'DRAFT',
        slug: ''
      });
    }
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.judul || !formData.konten || !formData.slug) {
      toast.error("Judul, Slug, dan Konten wajib diisi!");
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingId) {
        await api.patch(`/api/berita/${editingId}`, formData);
      } else {
        await api.post('/api/berita', formData);
      }
      setShowModal(false);
      fetchBerita();
    } catch (error: any) {
      toast.error(error.message || 'Gagal menyimpan berita');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus berita ini?')) return;
    try {
      await api.delete(`/api/berita/${id}`);
      fetchBerita();
    } catch (error: any) {
      toast.error(error.message || 'Gagal menghapus berita');
    }
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
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Daftar Artikel</CardTitle>
            </div>
            <div className="w-full sm:w-64">
              <Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="ALL">Semua Status</option>
                <option value="PUBLISHED">Ditayangkan (Published)</option>
                <option value="DRAFT">Konsep (Draft)</option>
                <option value="ARCHIVED">Diarsipkan (Archived)</option>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center text-slate-500">Memuat konten...</div>
          ) : beritaList.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-200 rounded-xl">
              <p className="text-lg font-medium text-slate-700">Tidak ada berita</p>
              <p className="text-sm">Klik "Tambah Berita" untuk mulai menulis konten.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3 font-semibold w-24">Thumbnail</th>
                    <th className="px-4 py-3 font-semibold">Judul & Detail</th>
                    <th className="px-4 py-3 font-semibold text-center">Status</th>
                    <th className="px-4 py-3 font-semibold text-center w-32">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {beritaList.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="w-16 h-12 bg-slate-100 rounded border border-slate-200 overflow-hidden flex items-center justify-center">
                          {b.imageUrl ? (
                            <img src={b.imageUrl} alt={b.judul} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[10px] text-slate-400">No Img</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-slate-900 line-clamp-1">{b.judul}</p>
                        <p className="text-xs text-slate-500 truncate mt-1">/{b.slug}</p>
                        <p className="text-xs text-slate-400 mt-1">Dibuat: {new Date(b.createdAt).toLocaleDateString()}</p>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <Badge variant={b.status === 'PUBLISHED' ? 'success' : b.status === 'DRAFT' ? 'secondary' : 'outline'} className={b.status === 'PUBLISHED' ? 'bg-green-100 text-green-700 hover:bg-green-100' : ''}>
                          {b.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleOpenModal(b)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 px-2" title="Edit">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(b.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 px-2" title="Hapus">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          {b.status === 'PUBLISHED' && (
                            <Button variant="ghost" size="sm" onClick={() => window.open(`/berita/${b.slug}`, '_blank')} className="text-slate-500 hover:text-slate-700 hover:bg-slate-100 h-8 px-2" title="Lihat Publik">
                               <ExternalLink className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal / Form Edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-sm shadow-2xl overflow-y-auto">
          <Card className="w-full max-w-4xl border-0 shadow-xl my-auto flex flex-col max-h-full">
            <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4 shrink-0">
              <div className="flex justify-between items-center">
                <CardTitle>{editingId ? 'Edit Berita' : 'Tulis Berita Baru'}</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>Batal</Button>
              </div>
            </CardHeader>
            <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
              <CardContent className="pt-6 space-y-4 overflow-y-auto max-h-[60vh] scroller">
                <div className="space-y-2">
                  <Label htmlFor="judul">Judul Artikel <span className="text-red-500">*</span></Label>
                  <Input id="judul" required value={formData.judul} onChange={handleTitleChange} placeholder="Tuliskan judul menarik..." className="text-lg font-medium h-12" />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug (URL) <span className="text-red-500">*</span></Label>
                    <Input id="slug" required value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} placeholder="contoh-judul-berita" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status Publikasi</Label>
                    <Select id="status" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                      <option value="DRAFT">Simpan sebagai Draft</option>
                      <option value="PUBLISHED">Langsung Terbitkan (Published)</option>
                      <option value="ARCHIVED">Arsipkan (Archived)</option>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="imageUrl">URL Gambar Header (Thumbnail)</Label>
                  <Input id="imageUrl" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} placeholder="https://..." />
                  {formData.imageUrl && (
                    <div className="mt-2 h-32 w-48 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                      <img src={formData.imageUrl} alt="preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ringkasan">Ringkasan (Tampil di halaman depan)</Label>
                  <textarea 
                    id="ringkasan"
                    value={formData.ringkasan}
                    onChange={e => setFormData({...formData, ringkasan: e.target.value})}
                    className="w-full h-20 p-3 rounded-md border border-gray-200 bg-transparent text-sm focus-[1.5px] border-blue-500 outline-none resize-none"
                    placeholder="Ringkasan singkat 1-2 kalimat..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="konten">Isi Konten Lengkap <span className="text-red-500">*</span></Label>
                  <textarea 
                    id="konten"
                    required
                    value={formData.konten}
                    onChange={e => setFormData({...formData, konten: e.target.value})}
                    className="w-full h-64 p-3 rounded-md border border-gray-200 bg-transparent text-sm focus-[1.5px] border-blue-500 outline-none resize-y"
                    placeholder="Tuliskan berita lengkap di sini. Anda bisa menggunakan markdown jika perlu..."
                  />
                </div>
              </CardContent>
              <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end gap-3 shrink-0">
                {formData.status === 'DRAFT' && (
                  <Button type="button" variant="outline" className="mr-auto gap-2" onClick={() => window.open(`/berita/preview?t=${Date.now()}`, '_blank')}>
                    <Eye className="w-4 h-4" /> Preview
                  </Button>
                )}
                <Button type="button" variant="outline" onClick={() => setShowModal(false)} disabled={isSubmitting}>Batal</Button>
                <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Konten'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
