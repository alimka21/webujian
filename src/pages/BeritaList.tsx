import { toast } from 'sonner';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, ArrowLeft, Calendar, AlertTriangle, FileText, Search } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Pagination } from '../components/ui/pagination';
import api from '../lib/api';

const PAGE_SIZE = 9;

interface BeritaItem {
  id: string;
  slug: string;
  judul: string;
  ringkasan: string | null;
  imageUrl: string | null;
  publishedAt: string | null;
  createdAt: string;
}

const formatDate = (iso: string | null) => {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
};

export default function BeritaList() {
  const [items, setItems] = useState<BeritaItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchBerita = async () => {
      try {
        setIsLoading(true);
        setErrorMsg(null);
        const res = await api.get(`/api/berita?page=${page}&limit=${PAGE_SIZE}`);
        setItems(res.data || []);
        setTotal(res.total || 0);
      } catch (err: any) {
        setErrorMsg(err.message || 'Gagal memuat berita');
        toast.error(err.message || 'Gagal memuat berita');
      } finally {
        setIsLoading(false);
      }
    };
    fetchBerita();
    window.scrollTo(0, 0);
  }, [page]);

  const q = search.toLowerCase().trim();
  const filtered = q
    ? items.filter(b => b.judul.toLowerCase().includes(q) || (b.ringkasan ?? '').toLowerCase().includes(q))
    : items;

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      {/* Navbar */}
      <nav className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 z-50 sticky top-0">
        <div className="max-w-6xl mx-auto px-4 h-full flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900 hidden sm:block">Sekolah Hebat</span>
          </Link>
          <Link to="/">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Beranda
            </Button>
          </Link>
        </div>
      </nav>

      {/* Header */}
      <header className="bg-gradient-to-br from-blue-600 to-blue-700 text-white py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4">
          <p className="text-blue-100 text-sm font-semibold tracking-widest uppercase mb-2">Informasi Terkini</p>
          <h1 className="text-3xl md:text-5xl font-extrabold mb-3">Berita & Pengumuman</h1>
          <p className="text-blue-100 max-w-2xl">Kabar terbaru seputar prestasi siswa, kegiatan sekolah, dan informasi penting untuk seluruh warga sekolah.</p>
        </div>
      </header>

      {/* Search */}
      <div className="max-w-6xl mx-auto px-4 -mt-6 mb-8 w-full">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari berita berdasarkan judul atau ringkasan..."
              className="pl-10 h-11 border-0 bg-slate-50 focus-visible:bg-white"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 max-w-6xl mx-auto px-4 pb-16 w-full">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center text-center">
            <div className="w-8 h-8 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mb-3" />
            <p className="text-slate-500">Memuat berita...</p>
          </div>
        ) : errorMsg ? (
          <div className="py-20 flex flex-col items-center text-center">
            <AlertTriangle className="w-12 h-12 text-red-400 mb-3" />
            <p className="text-red-600 font-medium mb-1">Gagal memuat berita</p>
            <p className="text-sm text-slate-500 mb-4">{errorMsg}</p>
            <Button onClick={() => setPage(p => p)}>Muat Ulang</Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 flex flex-col items-center text-center">
            <FileText className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-slate-500">
              {q ? 'Tidak ada berita yang cocok dengan pencarian.' : 'Belum ada berita yang dipublikasikan.'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(b => (
                <Link
                  to={`/berita/${b.slug}`}
                  key={b.id}
                  className="group flex flex-col h-full bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all"
                >
                  <div className="h-48 bg-slate-100 overflow-hidden">
                    {b.imageUrl ? (
                      <img
                        src={b.imageUrl}
                        alt={b.judul}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <FileText className="w-12 h-12" />
                      </div>
                    )}
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(b.publishedAt ?? b.createdAt)}
                    </div>
                    <h2 className="font-bold text-slate-900 text-lg leading-tight mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {b.judul}
                    </h2>
                    {b.ringkasan && (
                      <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">{b.ringkasan}</p>
                    )}
                    <p className="mt-4 text-sm font-semibold text-blue-600 group-hover:text-blue-700">Baca selengkapnya →</p>
                  </div>
                </Link>
              ))}
            </div>

            {!q && total > PAGE_SIZE && (
              <div className="mt-10 bg-white rounded-2xl border border-slate-100">
                <Pagination
                  currentPage={page}
                  totalItems={total}
                  itemsPerPage={PAGE_SIZE}
                  onPageChange={setPage}
                  itemLabel="berita"
                />
              </div>
            )}
          </>
        )}
      </main>

      <footer className="bg-slate-900 py-6 text-center text-sm text-slate-400">
        &copy; {new Date().getFullYear()} Sekolah Hebat.
      </footer>
    </div>
  );
}
