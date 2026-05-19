import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { GraduationCap, ArrowLeft, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input, Label } from '../components/ui/input';
import { Select } from '../components/ui/select';
import api from '../lib/api';

const STATUS_OPTIONS = [
  { value: 'KULIAH', label: 'Sedang Kuliah' },
  { value: 'BEKERJA', label: 'Sedang Bekerja' },
  { value: 'WIRAUSAHA', label: 'Wirausaha' },
  { value: 'TIDAK_DIKETAHUI', label: 'Belum mau menyebutkan' },
];

const CURRENT_YEAR = new Date().getFullYear();

export default function AlumniRegister() {
  const navigate = useNavigate();

  const [nama, setNama] = useState('');
  const [nis, setNis] = useState('');
  const [tahunLulus, setTahunLulus] = useState<string>(String(CURRENT_YEAR));
  const [jurusan, setJurusan] = useState('');
  const [status, setStatus] = useState<string>('KULIAH');
  const [instansi, setInstansi] = useState('');
  const [posisi, setPosisi] = useState('');
  const [kontak, setKontak] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!nama.trim() || nama.trim().length < 3) errs.nama = 'Nama wajib diisi (min 3 karakter)';
    const tahun = Number(tahunLulus);
    if (!Number.isFinite(tahun) || tahun < 1950 || tahun > CURRENT_YEAR + 1) {
      errs.tahunLulus = `Tahun lulus harus antara 1950 dan ${CURRENT_YEAR + 1}`;
    }
    if (!status) errs.status = 'Pilih status saat ini';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});

    try {
      setIsSubmitting(true);
      await api.post('/api/alumni/register', {
        nama: nama.trim(),
        nis: nis.trim() || null,
        tahunLulus: tahun,
        jurusan: jurusan.trim() || null,
        status,
        instansi: instansi.trim() || null,
        posisi: posisi.trim() || null,
        kontak: kontak.trim() || null,
      });
      setIsSuccess(true);
      toast.success('Pendaftaran berhasil dikirim');
    } catch (err: any) {
      toast.error(err?.message || 'Gagal mengirim pendaftaran');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardContent className="p-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Terima Kasih!</h1>
            <p className="text-sm text-slate-500">
              Data alumni Anda berhasil dikirim. Tim sekolah akan mereview dan menampilkan data
              Anda di tracer alumni publik.
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <Link to="/">
                <Button className="w-full">Kembali ke Beranda</Button>
              </Link>
              <Button
                variant="outline"
                onClick={() => {
                  // Reset form supaya bisa daftar lagi (untuk testing/alumni kedua)
                  setNama(''); setNis(''); setTahunLulus(String(CURRENT_YEAR));
                  setJurusan(''); setStatus('KULIAH'); setInstansi('');
                  setPosisi(''); setKontak(''); setIsSuccess(false);
                }}
              >
                Daftar Alumni Lain
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navbar */}
      <nav className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 h-full flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900 hidden sm:block">Beranda</span>
          </Link>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4" /> Kembali
          </Button>
        </div>
      </nav>

      <header className="bg-gradient-to-br from-blue-600 to-blue-700 text-white py-10 md:py-14">
        <div className="max-w-3xl mx-auto px-4">
          <p className="text-blue-100 text-sm font-semibold tracking-widest uppercase mb-2">Tracer Alumni</p>
          <h1 className="text-2xl md:text-4xl font-extrabold mb-2">Daftar Sebagai Alumni</h1>
          <p className="text-blue-100 max-w-xl text-sm md:text-base">
            Isi data Anda di bawah ini. Data akan ditampilkan di halaman statistik alumni publik
            setelah diverifikasi oleh sekolah.
          </p>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 -mt-6 pb-12">
        <Card className="shadow-lg border-0">
          <CardContent className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <Label htmlFor="nama">Nama Lengkap <span className="text-red-500">*</span></Label>
                  <Input
                    id="nama" value={nama} onChange={e => setNama(e.target.value)}
                    placeholder="Nama lengkap sesuai ijazah"
                    className={errors.nama ? 'border-red-500' : ''}
                    autoFocus
                  />
                  {errors.nama && <p className="text-xs text-red-500 mt-1">{errors.nama}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="nis">NIS (opsional)</Label>
                  <Input
                    id="nis" value={nis} onChange={e => setNis(e.target.value)}
                    placeholder="Nomor Induk Siswa saat sekolah"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="tahunLulus">Tahun Lulus <span className="text-red-500">*</span></Label>
                  <Input
                    id="tahunLulus" type="number" min={1950} max={CURRENT_YEAR + 1}
                    value={tahunLulus} onChange={e => setTahunLulus(e.target.value)}
                    placeholder={String(CURRENT_YEAR)}
                    className={errors.tahunLulus ? 'border-red-500' : ''}
                  />
                  {errors.tahunLulus && <p className="text-xs text-red-500 mt-1">{errors.tahunLulus}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="jurusan">Jurusan (opsional)</Label>
                  <Input
                    id="jurusan" value={jurusan} onChange={e => setJurusan(e.target.value)}
                    placeholder="Contoh: IPA / IPS / RPL"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="status">Status Saat Ini <span className="text-red-500">*</span></Label>
                  <Select
                    id="status" value={status} onChange={e => setStatus(e.target.value)}
                    className={errors.status ? 'border-red-500' : ''}
                  >
                    {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </Select>
                  {errors.status && <p className="text-xs text-red-500 mt-1">{errors.status}</p>}
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <Label htmlFor="instansi">Instansi / Kampus / Perusahaan</Label>
                  <Input
                    id="instansi" value={instansi} onChange={e => setInstansi(e.target.value)}
                    placeholder="Nama universitas atau perusahaan"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="posisi">Posisi / Jurusan Kuliah</Label>
                  <Input
                    id="posisi" value={posisi} onChange={e => setPosisi(e.target.value)}
                    placeholder="Contoh: Mahasiswa Teknik Informatika"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="kontak">Kontak (opsional)</Label>
                  <Input
                    id="kontak" value={kontak} onChange={e => setKontak(e.target.value)}
                    placeholder="Email atau no. HP"
                  />
                </div>
              </div>

              <div className="flex items-start gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-3">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p>
                  Pastikan data benar. Data yang sudah terkirim akan dimoderasi sekolah sebelum
                  tampil di tracer alumni publik. Kontak hanya untuk keperluan verifikasi sekolah.
                </p>
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full h-11 text-base">
                {isSubmitting ? 'Mengirim...' : 'Kirim Data Alumni'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>

      <footer className="bg-slate-900 py-5 text-center text-xs text-slate-400">
        &copy; {new Date().getFullYear()} Tracer Alumni Sekolah
      </footer>
    </div>
  );
}
