import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  Save, ImageIcon, Building2, Home, BookOpen, Phone, Share2,
  AlertTriangle, Upload, X, ImagePlus,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Input, Label } from '../../components/ui/input';
import api from '../../lib/api';
import { fileToResizedBase64, dataUrlSizeKB } from '../../lib/imageUtils';

type Config = Record<string, string | null>;

const Spinner = () => (
  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block mr-2" />
);

const Section = ({
  icon: Icon, title, description, children,
}: { icon: any; title: string; description: string; children: React.ReactNode }) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-start gap-3 mb-5">
        <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </CardContent>
  </Card>
);

const TextField = ({
  label, value, onChange, placeholder, type = 'text',
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) => (
  <div className="space-y-1.5">
    <Label>{label}</Label>
    <Input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
  </div>
);

const TextAreaField = ({
  label, value, onChange, placeholder, rows = 3,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) => (
  <div className="space-y-1.5">
    <Label>{label}</Label>
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="flex w-full rounded-md border border-gray-200 bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
    />
  </div>
);

interface ImageFieldProps {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  /** Maksimum px untuk resize. Default 800 (untuk foto). Pakai 256 untuk logo, 64 untuk favicon. */
  maxWidth?: number;
  /** Preview aspect: 'wide' untuk hero, 'square' untuk logo/favicon, 'photo' default */
  preview?: 'wide' | 'square' | 'photo';
}

const ImageField: React.FC<ImageFieldProps> = ({ label, hint, value, onChange, maxWidth = 800, preview = 'photo' }) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File terlalu besar (maks 10MB sebelum resize)');
      return;
    }
    setUploading(true);
    try {
      const dataUrl = await fileToResizedBase64(file, { maxWidth, maxHeight: maxWidth });
      const sizeKb = dataUrlSizeKB(dataUrl);
      onChange(dataUrl);
      toast.success(`Gambar siap (${sizeKb} KB setelah resize)`);
    } catch (err: any) {
      toast.error(err?.message || 'Gagal memproses gambar');
    } finally {
      setUploading(false);
    }
  };

  const aspectClass = preview === 'wide' ? 'aspect-[16/9]' : preview === 'square' ? 'aspect-square max-w-[128px]' : 'aspect-[4/3]';

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <p className="text-xs text-slate-400">{hint}</p>
      {value ? (
        <div className="relative inline-block">
          <img src={value} alt={label} className={`rounded-lg border border-slate-200 object-cover ${aspectClass} bg-slate-50`} />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center shadow-md hover:bg-red-700"
            aria-label="Hapus gambar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={`flex flex-col items-center justify-center w-full rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 transition-colors ${aspectClass}`}
        >
          {uploading ? (
            <div className="w-6 h-6 border-2 border-slate-400/40 border-t-slate-600 rounded-full animate-spin" />
          ) : (
            <>
              <ImagePlus className="w-6 h-6 text-slate-400 mb-1.5" />
              <span className="text-xs text-slate-500">Klik untuk upload</span>
            </>
          )}
        </button>
      )}
      <div className="flex gap-2 mt-2">
        <Button
          type="button" variant="outline" size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="gap-2"
        >
          <Upload className="w-3.5 h-3.5" />
          {value ? 'Ganti' : 'Pilih file'}
        </Button>
        {value && (
          <Button type="button" variant="outline" size="sm" onClick={() => onChange('')} className="text-red-600 border-red-200 hover:bg-red-50">
            Hapus
          </Button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
};

export default function SiteSettings() {
  const [config, setConfig] = useState<Config | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        setIsLoading(true);
        const res = await api.get('/api/site-config');
        setConfig(res);
      } catch (e: any) {
        setErrorMsg(e.message || 'Gagal memuat konfigurasi');
        toast.error(e.message || 'Gagal memuat konfigurasi');
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, []);

  const set = (key: string, value: string) => setConfig(c => ({ ...c, [key]: value }));
  const get = (key: string) => (config?.[key] ?? '') as string;

  const handleSave = async () => {
    if (!config) return;
    try {
      setIsSaving(true);
      // Strip server-managed fields
      const payload = { ...config };
      delete payload.id;
      delete payload.updatedAt;
      const res = await api.patch('/api/admin/site-config', payload);
      setConfig(res);
      toast.success('Konfigurasi berhasil disimpan');
    } catch (e: any) {
      toast.error(e.message || 'Gagal menyimpan konfigurasi');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-12 flex flex-col items-center">
        <div className="w-6 h-6 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mb-2" />
        <span className="text-sm text-slate-500">Memuat...</span>
      </div>
    );
  }
  if (errorMsg) {
    return (
      <div className="py-12 flex flex-col items-center text-center">
        <AlertTriangle className="w-10 h-10 text-red-400 mb-2" />
        <p className="text-red-600 font-medium mb-1">Gagal memuat konfigurasi</p>
        <p className="text-sm text-slate-500 mb-4">{errorMsg}</p>
        <Button onClick={() => window.location.reload()}>Muat Ulang</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pengaturan Situs</h1>
          <p className="text-slate-500 mt-1">Atur konten landing page yang dilihat publik.</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 gap-2">
          {isSaving ? <><Spinner />Menyimpan...</> : <><Save className="w-4 h-4" /> Simpan</>}
        </Button>
      </div>

      <Section icon={Building2} title="Identitas Sekolah" description="Nama, tagline, dan deskripsi singkat sekolah.">
        <TextField label="Nama Sekolah" value={get('namaSekolah')} onChange={v => set('namaSekolah', v)} placeholder="Contoh: SMA Negeri 1 Demo" />
        <TextField label="Tagline" value={get('tagline')} onChange={v => set('tagline', v)} placeholder="Slogan singkat sekolah" />
        <TextAreaField label="Deskripsi Singkat" value={get('deskripsi')} onChange={v => set('deskripsi', v)} placeholder="Penjelasan ringkas, tampil di hero subtitle dan footer" rows={3} />
      </Section>

      <Section icon={ImageIcon} title="Logo & Favicon" description="Branding ditampilkan di navbar dan tab browser.">
        <div className="grid sm:grid-cols-2 gap-6">
          <ImageField
            label="Logo" hint="Tampil di navbar & footer. Disarankan PNG transparan."
            value={get('logoUrl')} onChange={v => set('logoUrl', v)}
            maxWidth={256} preview="square"
          />
          <ImageField
            label="Favicon" hint="Icon kecil di tab browser. PNG square (32x32 atau 64x64)."
            value={get('faviconUrl')} onChange={v => set('faviconUrl', v)}
            maxWidth={128} preview="square"
          />
        </div>
      </Section>

      <Section icon={Home} title="Hero (Section Atas Landing)" description="Bagian paling pertama dilihat pengunjung.">
        <TextField label="Badge / Label Kecil" value={get('heroBadge')} onChange={v => set('heroBadge', v)} placeholder="Contoh: Penerimaan Siswa Baru 2026/2027" />
        <TextAreaField label="Judul Utama" value={get('heroTitle')} onChange={v => set('heroTitle', v)} placeholder="Membangun Generasi Pemimpin Masa Depan" rows={2} />
        <TextAreaField label="Subtitle" value={get('heroSubtitle')} onChange={v => set('heroSubtitle', v)} placeholder="Deskripsi singkat tentang sekolah" rows={3} />
        <ImageField
          label="Gambar Hero" hint="Tampil di sebelah kanan judul. Rasio landscape (4:3 atau 16:9)."
          value={get('heroImageUrl')} onChange={v => set('heroImageUrl', v)}
          maxWidth={800} preview="wide"
        />
      </Section>

      <Section icon={BookOpen} title="Profil Sekolah" description="Sejarah, visi, misi, tujuan, dan foto fasilitas.">
        <TextAreaField label="Sejarah Singkat" value={get('sejarah')} onChange={v => set('sejarah', v)} placeholder="Cerita pendirian dan perkembangan sekolah" rows={5} />
        <ImageField
          label="Foto Profil / Fasilitas" hint="Tampil di section Profil & Identitas."
          value={get('profilImageUrl')} onChange={v => set('profilImageUrl', v)}
          maxWidth={800} preview="photo"
        />
        <TextAreaField label="Visi" value={get('visi')} onChange={v => set('visi', v)} placeholder="Pandangan jangka panjang sekolah" rows={3} />
        <TextAreaField label="Misi" value={get('misi')} onChange={v => set('misi', v)} placeholder="Pisahkan tiap misi dengan baris baru (Enter)" rows={5} />
        <TextAreaField label="Tujuan" value={get('tujuan')} onChange={v => set('tujuan', v)} placeholder="Tujuan strategis sekolah" rows={3} />
      </Section>

      <Section icon={Phone} title="Hubungi Kami" description="Info kontak untuk footer landing.">
        <TextAreaField label="Alamat" value={get('alamat')} onChange={v => set('alamat', v)} placeholder="Jl. Pendidikan No. 123, Kota..." rows={2} />
        <div className="grid sm:grid-cols-2 gap-4">
          <TextField label="Telepon" value={get('telepon')} onChange={v => set('telepon', v)} placeholder="(021) 555-0123" />
          <TextField label="WhatsApp" value={get('whatsapp')} onChange={v => set('whatsapp', v)} placeholder="628123456789" />
          <TextField label="Email" type="email" value={get('email')} onChange={v => set('email', v)} placeholder="info@sekolah.sch.id" />
        </div>
      </Section>

      <Section icon={Share2} title="Sosial Media" description="Link akun resmi sekolah. Kosongkan kalau tidak punya.">
        <div className="grid sm:grid-cols-2 gap-4">
          <TextField label="Facebook" value={get('facebook')} onChange={v => set('facebook', v)} placeholder="https://facebook.com/sekolahanda" />
          <TextField label="Instagram" value={get('instagram')} onChange={v => set('instagram', v)} placeholder="https://instagram.com/sekolahanda" />
          <TextField label="Twitter / X" value={get('twitter')} onChange={v => set('twitter', v)} placeholder="https://twitter.com/sekolahanda" />
          <TextField label="YouTube" value={get('youtube')} onChange={v => set('youtube', v)} placeholder="https://youtube.com/@sekolahanda" />
          <TextField label="TikTok" value={get('tiktok')} onChange={v => set('tiktok', v)} placeholder="https://tiktok.com/@sekolahanda" />
        </div>
      </Section>

      {/* Sticky save bar di bawah */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white border-t border-slate-200 px-4 py-3 shadow-lg z-30">
        <div className="max-w-7xl mx-auto flex justify-end">
          <Button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 gap-2">
            {isSaving ? <><Spinner />Menyimpan...</> : <><Save className="w-4 h-4" /> Simpan Semua Perubahan</>}
          </Button>
        </div>
      </div>
    </div>
  );
}
