import { toast } from 'sonner';
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { GraduationCap, ArrowLeft, Calendar, Share2, Link as LinkIcon } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import api from '../lib/api';

export default function BeritaDetail() {
  const { slug } = useParams();
  const [berita, setBerita] = useState<any>(null);
  const [beritaLain, setBeritaLain] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setIsLoading(true);
        window.scrollTo(0, 0);

        // Fetch by slug + ambil 3 berita lain (publik) untuk section "Terkait"
        const [detail, listResp] = await Promise.all([
          api.get(`/api/berita/${slug}`).catch(() => null),
          api.get('/api/berita?limit=4').catch(() => ({ data: [] })),
        ]);

        if (detail) {
          setBerita(detail);
          const lain = (listResp.data || []).filter((b: any) => b.id !== detail.id).slice(0, 3);
          setBeritaLain(lain);
        } else {
          setBerita(null);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) fetchDetail();
  }, [slug]);

  // ── Share handlers ──────────────────────────────────────
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      try {
        await (navigator as any).share({
          title: berita?.judul ?? 'Berita Sekolah',
          text: berita?.ringkasan ?? berita?.judul ?? '',
          url: shareUrl,
        });
      } catch (e: any) {
        if (e?.name !== 'AbortError') toast.error('Gagal membuka menu berbagi');
      }
    } else {
      // Fallback: salin link
      handleCopyLink();
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link disalin ke clipboard');
    } catch {
      toast.error('Gagal menyalin link');
    }
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(`${berita?.judul ?? ''}\n${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
  };
  const shareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank', 'noopener,noreferrer');
  };
  const shareTwitter = () => {
    const text = encodeURIComponent(berita?.judul ?? '');
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(shareUrl)}`, '_blank', 'noopener,noreferrer');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans flex flex-col items-center justify-center">
         <div className="w-8 h-8 rounded-full border-4 border-blue-600/30 border-t-blue-600 animate-spin"></div>
      </div>
    );
  }

  if (!berita) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans flex flex-col items-center justify-center text-center p-4">
         <h1 className="text-3xl font-bold text-slate-900 mb-2">Berita Tidak Ditemukan</h1>
         <p className="text-slate-500 mb-6">Mungkin artikel sudah dihapus atau link tidak valid.</p>
         <Link to="/">
           <Button className="bg-blue-600 hover:bg-blue-700">Kembali ke Beranda</Button>
         </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-blend-multiply flex flex-col">
      {/* Navbar Minimalis */}
      <nav className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200 z-50 sticky top-0">
        <div className="max-w-4xl mx-auto px-4 h-full flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900 hidden sm:block">Sekolah Hebat</span>
          </Link>
          
          <Button variant="outline" size="sm" className="gap-2" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4" /> Kembali
          </Button>
        </div>
      </nav>

      {/* Konten Utama */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-8 md:py-12 relative z-10">
         {/* Meta & Breadcrumb */}
         <div className="flex items-center gap-2 text-sm text-slate-500 font-medium mb-6 uppercase tracking-wider">
            <Link to="/" className="hover:text-blue-600 transition-colors">Beranda</Link>
            <span>/</span>
            <span className="text-slate-400">Berita</span>
         </div>

         {/* Header Title */}
         <div className="mb-8">
            <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 leading-tight mb-4 font-serif">
              {berita.judul}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 font-medium">
               <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  {new Date(berita.createdAt).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
               </div>
               <Badge variant="secondary" className="bg-blue-50 text-blue-700">Berita Resmi</Badge>
            </div>
         </div>

         {/* Hero Image */}
         {berita.imageUrl && (
           <div className="w-full overflow-hidden rounded-2xl md:rounded-3xl shadow-xl shadow-slate-200/50 mb-10 border border-slate-100 bg-white">
             <img src={berita.imageUrl} alt={berita.judul} className="w-full object-cover max-h-[500px]" />
           </div>
         )}

         {/* Konten Artikel */}
         <div className="bg-white p-6 md:p-12 rounded-3xl shadow-sm border border-slate-100 mb-12">
            <article className="prose prose-slate md:prose-lg max-w-none text-slate-700 leading-relaxed font-serif whitespace-pre-wrap">
               {berita.ringkasan && (
                 <p className="lead text-xl text-slate-500 italic mb-8 border-l-4 border-blue-500 pl-4 py-2 bg-blue-50/50 rounded-r-lg">
                   {berita.ringkasan}
                 </p>
               )}
               {berita.konten}
            </article>

            {/* Share action */}
            <div className="mt-12 pt-8 border-t border-slate-100">
               <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <span className="text-sm font-bold text-slate-900 uppercase tracking-widest">Bagikan artikel ini:</span>
                  <div className="flex gap-2 flex-wrap">
                     <Button variant="outline" size="sm" className="gap-2" onClick={handleNativeShare} title="Bagikan">
                        <Share2 className="w-4 h-4" /> Bagikan
                     </Button>
                     <Button
                        variant="outline" size="sm"
                        className="gap-2 bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                        onClick={shareWhatsApp}
                        aria-label="Bagikan ke WhatsApp"
                     >
                        WhatsApp
                     </Button>
                     <Button
                        variant="outline" size="sm"
                        className="gap-2 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                        onClick={shareFacebook}
                        aria-label="Bagikan ke Facebook"
                     >
                        Facebook
                     </Button>
                     <Button
                        variant="outline" size="sm"
                        className="gap-2 bg-sky-50 border-sky-200 text-sky-700 hover:bg-sky-100"
                        onClick={shareTwitter}
                        aria-label="Bagikan ke X / Twitter"
                     >
                        X / Twitter
                     </Button>
                     <Button variant="outline" size="sm" className="gap-2" onClick={handleCopyLink} aria-label="Salin tautan">
                        <LinkIcon className="w-4 h-4" /> Salin Link
                     </Button>
                  </div>
               </div>
            </div>
         </div>
         
         {/* Berita Lainnya */}
         {beritaLain.length > 0 && (
           <div className="mt-20 border-t border-slate-200 pt-16">
              <h3 className="text-2xl font-bold text-slate-900 mb-8">Berita Terkait Lainnya</h3>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
                {beritaLain.map(b => (
                  <Link to={`/berita/${b.slug}`} key={b.id} className="group flex flex-col h-full bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-xl transition-all">
                     <div className="h-40 bg-slate-100 rounded-xl mb-4 overflow-hidden">
                       {b.imageUrl ? <img src={b.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform" /> : null}
                     </div>
                     <h4 className="font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">{b.judul}</h4>
                     <p className="text-xs text-slate-500 mt-auto">{new Date(b.createdAt).toLocaleDateString('id-ID')}</p>
                  </Link>
                ))}
              </div>
           </div>
         )}
      </main>

      {/* Footer minimalis */}
      <footer className="bg-slate-900 py-6 text-center text-sm text-slate-400 shrink-0">
         &copy; {new Date().getFullYear()} Sekolah Hebat.
      </footer>
    </div>
  );
}
