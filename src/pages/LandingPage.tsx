import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import {
  GraduationCap, ArrowRight, FileText, CalendarCheck, ClipboardList,
  Newspaper, ShieldCheck, Users, Briefcase, BookOpen,
  Facebook, Instagram, Twitter, Youtube, Music2, MapPin, Mail, Phone,
} from 'lucide-react';
import api from '../lib/api';

// Fallback config — dipakai kalau admin belum atur SiteSettings
const DEFAULT_CONFIG = {
  namaSekolah: 'Portal Sekolah',
  tagline: 'Pusat pendidikan terdepan yang mendidik generasi berprestasi.',
  deskripsi: 'Sistem manajemen sekolah terpadu — ujian online, presensi digital, tracer alumni, dan portal informasi dalam satu platform.',
  logoUrl: '',
  faviconUrl: '',
  alamat: '',
  telepon: '',
  email: '',
  whatsapp: '',
  facebook: '', instagram: '', twitter: '', youtube: '', tiktok: '',
};

type SiteConfig = typeof DEFAULT_CONFIG;

// Placeholder stat — bisa di-edit di code kalau sekolah punya angka real.
// Alumni di-fetch real-time dari /api/alumni/stats.
const STATS_HARDCODED = {
  siswa: '1,250+',
  guru: '85+',
  tahunBerdiri: '2005',
};

// Hero icon grid (3x2)
const HERO_FEATURES: { Icon: React.ElementType; label: string }[] = [
  { Icon: FileText,       label: 'Ujian Online' },
  { Icon: CalendarCheck,  label: 'Presensi Digital' },
  { Icon: GraduationCap,  label: 'Tracer Alumni' },
  { Icon: ClipboardList,  label: 'Rekap Nilai' },
  { Icon: Newspaper,      label: 'Berita Sekolah' },
  { Icon: ShieldCheck,    label: 'Anti-Curang' },
];

// Fitur unggulan utama (3 cards)
const FITUR_UTAMA: { Icon: React.ElementType; title: string; desc: string }[] = [
  {
    Icon: FileText,
    title: 'Ujian Online',
    desc: 'Bank soal lengkap dengan timer otomatis, anti-cheat, dan koreksi instan. Hasil & rekap nilai langsung tersedia.',
  },
  {
    Icon: CalendarCheck,
    title: 'Presensi Digital',
    desc: 'Catat kehadiran siswa per sesi pelajaran. Setiap guru punya rekap presensi sendiri, export Excel.',
  },
  {
    Icon: GraduationCap,
    title: 'Tracer Alumni',
    desc: 'Lulusan bisa daftar mandiri. Lihat sebaran karir & pendidikan alumni lewat statistik publik.',
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [berita, setBerita] = useState<any[]>([]);
  const [alumniStats, setAlumniStats] = useState<Record<string, number>>({});
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(DEFAULT_CONFIG);

  const cfg = useMemo<SiteConfig>(() => {
    const merged: any = { ...DEFAULT_CONFIG };
    for (const key of Object.keys(DEFAULT_CONFIG) as (keyof SiteConfig)[]) {
      const v = (siteConfig as any)[key];
      if (v != null && String(v).trim() !== '') merged[key] = v;
    }
    return merged;
  }, [siteConfig]);

  useEffect(() => {
    Promise.all([
      api.get('/api/berita?limit=3').catch(() => ({ data: [] })),
      api.get('/api/alumni/stats').catch(() => ({ perStatus: {} })),
      api.get('/api/site-config').catch(() => null),
    ]).then(([resBerita, resAlumni, resConfig]) => {
      setBerita(resBerita.data || []);
      setAlumniStats(resAlumni.perStatus || {});
      if (resConfig) setSiteConfig(resConfig);
    });
  }, []);

  // Document title + favicon
  useEffect(() => {
    document.title = cfg.namaSekolah;
    if (cfg.faviconUrl) {
      let link = document.querySelector("link[rel='icon']") as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = cfg.faviconUrl;
    }
  }, [cfg.namaSekolah, cfg.faviconUrl]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const totalAlumni = Object.values(alumniStats).reduce((sum, n) => sum + (n || 0), 0);
  const alumniBekerja = alumniStats.BEKERJA || 0;
  const alumniKuliah = alumniStats.KULIAH || 0;
  const alumniWirausaha = alumniStats.WIRAUSAHA || 0;

  // Active social links
  const socials = [
    { url: (cfg as any).facebook,  label: 'Facebook',  Icon: Facebook },
    { url: (cfg as any).instagram, label: 'Instagram', Icon: Instagram },
    { url: (cfg as any).twitter,   label: 'Twitter / X', Icon: Twitter },
    { url: (cfg as any).youtube,   label: 'YouTube',   Icon: Youtube },
    { url: (cfg as any).tiktok,    label: 'TikTok',    Icon: Music2 },
  ].filter(s => s.url && s.url.trim() !== '');

  return (
    <div className="min-h-screen bg-background text-on-background">
      {/* ═════════════════ 1. NAVBAR ═════════════════ */}
      <nav className="sticky top-0 z-40 h-16 bg-surface/95 backdrop-blur-md border-b border-outline-variant">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
            {cfg.logoUrl ? (
              <img src={cfg.logoUrl} alt={cfg.namaSekolah} className="w-9 h-9 rounded-lg object-contain shrink-0" />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-primary text-on-primary flex items-center justify-center shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
            )}
            <span className="font-bold text-lg tracking-tight text-primary hidden sm:block">{cfg.namaSekolah}</span>
          </div>

          <div className="hidden md:flex items-center gap-7 text-label-md font-medium text-on-surface-variant">
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-primary transition-colors">Beranda</button>
            <button onClick={() => scrollTo('fitur')} className="hover:text-primary transition-colors">Fitur</button>
            <button onClick={() => scrollTo('berita')} className="hover:text-primary transition-colors">Berita</button>
            <button onClick={() => scrollTo('alumni')} className="hover:text-primary transition-colors">Alumni</button>
            <button onClick={() => scrollTo('kontak')} className="hover:text-primary transition-colors">Kontak</button>
          </div>

          <Button onClick={() => navigate('/login')} size="sm">
            Login Portal
          </Button>
        </div>
      </nav>

      {/* ═════════════════ 2. HERO ═════════════════ */}
      <section className="bg-primary text-on-primary px-4 sm:px-6 py-20 sm:py-28">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-7">
            <span className="inline-flex items-center rounded-full bg-on-primary/10 px-3 py-1 text-label-sm font-bold uppercase tracking-wider">
              {cfg.namaSekolah}
            </span>
            <h1 className="text-headline-lg leading-tight">
              Portal Akademik <br className="hidden sm:block" />
              <span className="text-secondary-container">Digital</span>
            </h1>
            <p className="text-lg text-on-primary/85 max-w-lg leading-relaxed">
              {cfg.deskripsi}
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-2 rounded-full bg-on-primary text-primary px-7 py-3 font-bold uppercase tracking-wider text-label-md hover:bg-on-primary/90 active:translate-y-px transition-all shadow-sm"
              >
                Login Portal <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => scrollTo('fitur')}
                className="inline-flex items-center gap-2 rounded-full border border-on-primary/30 text-on-primary px-7 py-3 font-bold uppercase tracking-wider text-label-md hover:bg-on-primary/10 transition-all"
              >
                Lihat Fitur
              </button>
            </div>
          </div>

          {/* Icon grid 3x2 — gantikan stock photo */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-md md:ml-auto">
            {HERO_FEATURES.map(({ Icon, label }, i) => (
              <div
                key={i}
                className="aspect-square bg-on-primary/10 border border-on-primary/15 rounded-xl flex flex-col items-center justify-center gap-2 p-3 hover:bg-on-primary/15 transition-colors"
              >
                <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-on-primary" />
                <span className="text-label-sm text-on-primary/85 text-center font-medium leading-tight">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═════════════════ 3. STATISTIK ═════════════════ */}
      <section id="statistik" className="bg-surface-container-low border-y border-outline-variant px-4 sm:px-6 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-label-sm text-on-surface-variant uppercase tracking-wider font-bold mb-2">Sekilas Tentang Kami</p>
            <h2 className="text-headline-md text-on-surface">Statistik Sekolah</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: BookOpen,      label: 'Siswa Aktif',       value: STATS_HARDCODED.siswa },
              { icon: Users,         label: 'Tenaga Pendidik',   value: STATS_HARDCODED.guru },
              { icon: GraduationCap, label: 'Alumni Terdata',    value: totalAlumni > 0 ? `${totalAlumni}+` : '—' },
              { icon: Briefcase,     label: 'Berdiri Sejak',     value: STATS_HARDCODED.tahunBerdiri },
            ].map(({ icon: Icon, label, value }, i) => (
              <div key={i} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 text-center">
                <div className="mx-auto w-12 h-12 bg-primary-container/20 text-primary rounded-lg flex items-center justify-center mb-3">
                  <Icon className="w-6 h-6" />
                </div>
                <div className="text-5xl font-bold text-primary tracking-tight">{value}</div>
                <div className="text-sm text-on-surface-variant mt-2 font-medium">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═════════════════ 4. FITUR UNGGULAN ═════════════════ */}
      <section id="fitur" className="bg-surface px-4 sm:px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 max-w-2xl mx-auto space-y-3">
            <p className="text-label-sm text-on-surface-variant uppercase tracking-wider font-bold">Yang Kami Tawarkan</p>
            <h2 className="text-headline-md text-on-surface">Fitur Unggulan</h2>
            <p className="text-on-surface-variant">Solusi digital terintegrasi untuk seluruh aktivitas akademik sekolah.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {FITUR_UTAMA.map(({ Icon, title, desc }, i) => (
              <div key={i} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 hover:shadow-sm transition-shadow">
                <div className="w-12 h-12 bg-secondary-container text-on-secondary-container rounded-lg flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-on-surface text-lg mb-2">{title}</h3>
                <p className="text-on-surface-variant text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═════════════════ 5. BERITA TERBARU ═════════════════ */}
      <section id="berita" className="bg-surface-container-low border-y border-outline-variant px-4 sm:px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-label-sm text-on-surface-variant uppercase tracking-wider font-bold mb-2">Informasi Terkini</p>
              <h2 className="text-headline-md text-on-surface">Berita Sekolah</h2>
            </div>
            <Link to="/berita" className="text-primary font-bold inline-flex items-center gap-1.5 hover:underline text-label-md uppercase tracking-wider">
              Lihat Semua <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {berita.length === 0 ? (
              <div className="md:col-span-3 py-16 text-center text-on-surface-variant border-2 border-dashed border-outline-variant rounded-xl bg-surface-container-lowest">
                <Newspaper className="w-10 h-10 mx-auto text-outline-variant mb-2" />
                Belum ada berita yang dipublikasikan.
              </div>
            ) : berita.map((b: any) => (
              <Link
                to={`/berita/${b.slug}`}
                key={b.id}
                className="group flex flex-col bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div className="aspect-video bg-surface-container overflow-hidden">
                  {b.imageUrl ? (
                    <img
                      src={b.imageUrl}
                      alt={b.judul}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-outline-variant">
                      <Newspaper className="w-12 h-12" />
                    </div>
                  )}
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-2">
                    {new Date(b.publishedAt ?? b.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                  <h3 className="font-bold text-on-surface text-lg leading-tight mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {b.judul}
                  </h3>
                  {b.ringkasan && (
                    <p className="text-sm text-on-surface-variant line-clamp-2">{b.ringkasan}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═════════════════ 6. TRACER ALUMNI TEASER ═════════════════ */}
      <section id="alumni" className="bg-primary text-on-primary px-4 sm:px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-5">
              <p className="text-label-sm text-on-primary/70 uppercase tracking-wider font-bold">Tracer Alumni</p>
              <h2 className="text-headline-lg leading-tight">
                Lulusan Kami <span className="text-secondary-container">Tersebar</span> Di Mana-mana
              </h2>
              <p className="text-on-primary/85 leading-relaxed">
                Pantau jejak karir & pendidikan ribuan alumni. Sudah lulus? Daftar mandiri dan jadi bagian dari komunitas.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={() => navigate('/alumni/daftar')}
                  className="inline-flex items-center gap-2 rounded-full bg-on-primary text-primary px-6 py-2.5 font-bold uppercase tracking-wider text-label-md hover:bg-on-primary/90 active:translate-y-px transition-all"
                >
                  Daftar Alumni <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => scrollTo('statistik')}
                  className="inline-flex items-center gap-2 rounded-full border border-on-primary/30 text-on-primary px-6 py-2.5 font-bold uppercase tracking-wider text-label-md hover:bg-on-primary/10 transition-all"
                >
                  Lihat Statistik
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              {[
                { label: 'Bekerja',   value: alumniBekerja,   accent: 'text-secondary-container' },
                { label: 'Kuliah',    value: alumniKuliah,    accent: 'text-tertiary-container' },
                { label: 'Wirausaha', value: alumniWirausaha, accent: 'text-secondary-container' },
              ].map(({ label, value, accent }, i) => (
                <div key={i} className="bg-on-primary/10 border border-on-primary/15 rounded-xl p-5 text-center">
                  <div className={`text-4xl sm:text-5xl font-bold ${accent} tracking-tight`}>{value}</div>
                  <div className="text-label-sm text-on-primary/85 uppercase tracking-wider font-medium mt-2">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═════════════════ 7. FOOTER ═════════════════ */}
      <footer id="kontak" className="bg-inverse-surface text-inverse-on-surface px-4 sm:px-6 py-14">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {cfg.logoUrl ? (
                <img src={cfg.logoUrl} alt={cfg.namaSekolah} className="w-9 h-9 rounded-lg object-contain bg-inverse-on-surface p-1" />
              ) : (
                <div className="w-9 h-9 rounded-lg bg-inverse-primary text-primary flex items-center justify-center">
                  <GraduationCap className="w-5 h-5" />
                </div>
              )}
              <span className="font-bold text-lg">{cfg.namaSekolah}</span>
            </div>
            <p className="text-sm text-inverse-on-surface/75 leading-relaxed">{cfg.tagline}</p>
          </div>

          {/* Tautan cepat */}
          <div>
            <h4 className="text-label-sm uppercase tracking-wider font-bold mb-4">Tautan Cepat</h4>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => scrollTo('fitur')} className="hover:text-inverse-primary transition-colors">Fitur Unggulan</button></li>
              <li><button onClick={() => scrollTo('berita')} className="hover:text-inverse-primary transition-colors">Berita</button></li>
              <li><button onClick={() => scrollTo('alumni')} className="hover:text-inverse-primary transition-colors">Tracer Alumni</button></li>
              <li><Link to="/alumni/daftar" className="hover:text-inverse-primary transition-colors">Daftar Alumni</Link></li>
              <li><Link to="/login" className="hover:text-inverse-primary transition-colors">Login Portal</Link></li>
            </ul>
          </div>

          {/* Kontak */}
          <div className="md:col-span-2">
            <h4 className="text-label-sm uppercase tracking-wider font-bold mb-4">Hubungi Kami</h4>
            <ul className="space-y-2.5 text-sm text-inverse-on-surface/85">
              {cfg.alamat && (
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                  <span className="whitespace-pre-wrap">{cfg.alamat}</span>
                </li>
              )}
              {cfg.email && (
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 shrink-0" />
                  <a href={`mailto:${cfg.email}`} className="hover:text-inverse-primary transition-colors">{cfg.email}</a>
                </li>
              )}
              {cfg.telepon && (
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 shrink-0" />
                  <a href={`tel:${cfg.telepon.replace(/[^\d+]/g, '')}`} className="hover:text-inverse-primary transition-colors">{cfg.telepon}</a>
                </li>
              )}
              {cfg.whatsapp && (
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 shrink-0" />
                  <a
                    href={`https://wa.me/${cfg.whatsapp.replace(/[^\d]/g, '')}`}
                    target="_blank" rel="noopener noreferrer"
                    className="hover:text-inverse-primary transition-colors"
                  >
                    WhatsApp: {cfg.whatsapp}
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-inverse-on-surface/10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-inverse-on-surface/70">
            &copy; {new Date().getFullYear()} {cfg.namaSekolah}. Semua hak dilindungi.
          </p>
          {socials.length > 0 && (
            <div className="flex gap-3">
              {socials.map(({ url, label, Icon }) => (
                <a
                  key={label}
                  href={url ?? '#'}
                  target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-inverse-on-surface/10 hover:bg-inverse-primary hover:text-primary text-inverse-on-surface flex items-center justify-center transition-colors"
                  aria-label={label}
                  title={label}
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}
