import { useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Plus, Edit, Trash2, FileText } from "lucide-react";

export default function CmsManage() {
  const { user } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: "", content: "", author: "Admin" });
  
  const [news, setNews] = useState([
    { id: '1', title: 'Pelepasan Siswa Prakerin Angkatan 2024 ke PT. Astra', author: 'Admin', date: '2 Jam yang lalu' },
    { id: '2', title: 'Juara 1 LKS Tingkat Provinsi Bidang Web Tech', author: 'Admin', date: 'Kemarin' },
  ]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const newArticle = {
      id: Date.now().toString(),
      title: formData.title,
      author: user?.name || "Admin",
      date: 'Baru saja'
    };
    setNews([newArticle, ...news]);
    setIsModalOpen(false);
    setFormData({ title: "", content: "", author: "" });
  };

  const handleDelete = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus berita ini?')) {
      setNews(news.filter(n => n.id !== id));
    }
  };

  if (user?.role !== 'SUPER_ADMIN') {
    return <div className="p-12 text-center text-slate-500">Anda tidak memiliki akses ke halaman ini.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">CMS Berita Sekolah</h1>
          <p className="text-slate-500">Kelola artikel dan berita pada website utama</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Tulis Berita Baru
        </Button>
      </div>

      <Card className="border-slate-200">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3">Berita</th>
                  <th className="px-6 py-3">Penulis</th>
                  <th className="px-6 py-3">Waktu Publish</th>
                  <th className="px-6 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {news.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 rounded bg-slate-100 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-slate-400"/>
                      </div>
                      <span className="line-clamp-2 max-w-sm">{item.title}</span>
                    </td>
                    <td className="px-6 py-4">{item.author}</td>
                    <td className="px-6 py-4">
                      {item.date}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => alert('Mode edit akan segera hadir.')}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {news.length === 0 && (
                   <tr>
                     <td colSpan={4} className="px-6 py-12 text-center text-slate-500">Belum ada berita.</td>
                   </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal Buat Berita */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <Card className="w-full max-w-2xl shadow-xl">
            <CardHeader>
              <CardTitle>Tulis Berita Baru</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Judul Berita</label>
                  <Input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Masukkan judul..." />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Konten Berita</label>
                  <textarea 
                    required 
                    className="flex min-h-[150px] w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Isi konten berita di sini..."
                    value={formData.content}
                    onChange={e => setFormData({...formData, content: e.target.value})}
                  />
                </div>
                <div>
                   <label className="text-sm font-medium text-slate-700">Gambar Cover (Opsional)</label>
                   <Input type="file" accept="image/*" />
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                   <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
                   <Button type="submit">Publish Berita</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
