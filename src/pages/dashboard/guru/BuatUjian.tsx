import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input, Label } from '../../../components/ui/input';
import { ArrowLeft, CheckCircle2, Save, AlertTriangle } from 'lucide-react';
import api from '../../../lib/api';

export default function BuatUjian() {
  const navigate = useNavigate();
  const [kelasList, setKelasList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [judul, setJudul] = useState('');
  const [mataPelajaran, setMataPelajaran] = useState('');
  const [tipeUjian, setTipeUjian] = useState('LATIHAN');
  const [durasi, setDurasi] = useState('60');
  const [tanggalMulai, setTanggalMulai] = useState('');
  const [tanggalSelesai, setTanggalSelesai] = useState('');
  const [acak, setAcak] = useState(true);
  const [selectedKelas, setSelectedKelas] = useState<string[]>([]);

  useEffect(() => {
    // Set default datetime to today at 08:00
    const now = new Date();
    now.setHours(8, 0, 0, 0);
    const tzOffset = now.getTimezoneOffset() * 60000;
    const localNow = new Date(now.getTime() - tzOffset);
    
    const end = new Date(now.getTime() + 2 * 60 * 60 * 1000 - tzOffset); // + 2 hrs
    
    setTanggalMulai(localNow.toISOString().slice(0, 16));
    setTanggalSelesai(end.toISOString().slice(0, 16));

    const fetchKelas = async () => {
      try {
        const res = await api.get('/api/guru/kelas');
        setKelasList(res);
      } catch (err) {
        console.error(err);
      }
    };
    fetchKelas();
  }, []);

  const toggleKelas = (id: string) => {
    setSelectedKelas(prev => 
      prev.includes(id) ? prev.filter(k => k !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!judul || !mataPelajaran || !durasi || !tanggalMulai || !tanggalSelesai) {
      setErrorMsg('Semua field yang bertanda * wajib diisi');
      return;
    }

    if (new Date(tanggalSelesai) <= new Date(tanggalMulai)) {
      setErrorMsg('Tanggal/Jam Selesai harus lebih besar dari Tanggal/Jam Mulai');
      return;
    }

    if (selectedKelas.length === 0) {
      setErrorMsg('Pilih minimal satu kelas peserta ujian');
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.post('/api/guru/ujian', {
        judul,
        mataPelajaran,
        tipeUjian,
        durasi: parseInt(durasi),
        tanggalMulai,
        tanggalSelesai,
        acak,
        kelasIds: selectedKelas
      });
      
      navigate(`/dashboard/guru/ujian/${res.id}/soal`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan ujian');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/guru/ujian')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <div className="text-sm text-slate-500 font-medium breadcrumbs flex items-center gap-1.5">
            <span className="hover:text-slate-900 cursor-pointer" onClick={() => navigate('/dashboard/guru')}>Dashboard</span>
            <span>/</span>
            <span className="hover:text-slate-900 cursor-pointer" onClick={() => navigate('/dashboard/guru/ujian')}>Ujian</span>
            <span>/</span>
            <span className="text-blue-600">Buat Baru</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">Buat Ujian Baru</h1>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 text-red-600 border border-red-100 p-4 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="font-medium">{errorMsg}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Dasar</CardTitle>
              <CardDescription>Berikan judul dan mata pelajaran untuk ujian ini.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="judul">Judul Ujian <span className="text-red-500">*</span></Label>
                <Input
                  id="judul"
                  placeholder="Contoh: Penilaian Tengah Semester 1"
                  value={judul}
                  onChange={e => setJudul(e.target.value)}
                  className="font-medium text-lg h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mataPelajaran">Mata Pelajaran <span className="text-red-500">*</span></Label>
                <Input
                  id="mataPelajaran"
                  placeholder="Contoh: Matematika Peminatan"
                  value={mataPelajaran}
                  onChange={e => setMataPelajaran(e.target.value)}
                />
              </div>

              <div className="space-y-3 pt-2">
                <Label>Tipe Ujian <span className="text-red-500">*</span></Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['LATIHAN', 'ULANGAN_HARIAN', 'UTS', 'UAS'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setTipeUjian(type)}
                      className={`py-3 px-2 rounded-xl text-sm font-medium border text-center transition-all ${
                        tipeUjian === type 
                          ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm' 
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {type.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Waktu</CardTitle>
              <CardDescription>Batas waktu dan durasi pengerjaan siswa.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="tanggalMulai">Waktu Dibuka <span className="text-red-500">*</span></Label>
                  <Input
                    id="tanggalMulai"
                    type="datetime-local"
                    value={tanggalMulai}
                    onChange={e => setTanggalMulai(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tanggalSelesai">Waktu Ditutup <span className="text-red-500">*</span></Label>
                  <Input
                    id="tanggalSelesai"
                    type="datetime-local"
                    value={tanggalSelesai}
                    onChange={e => setTanggalSelesai(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2 max-w-sm">
                <Label htmlFor="durasi">Durasi Pengerjaan (Menit) <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <Input
                    id="durasi"
                    type="number"
                    min="5"
                    max="300"
                    value={durasi}
                    onChange={e => setDurasi(e.target.value)}
                    className="pr-16"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-500 font-medium">Menit</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Peserta & Opsi Lanjutan</CardTitle>
              <CardDescription>Pilih kelas yang wajib mengikuti ujian ini.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Pilih Kelas Peserta <span className="text-red-500">*</span></Label>
                {kelasList.length === 0 ? (
                  <div className="p-4 border border-dashed border-slate-300 rounded-xl text-center text-slate-500 text-sm">
                    Anda belum memiliki kelas. Silakan buat kelas terlebih dahulu di menu Siswa & Kelas.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {kelasList.map(kelas => {
                      const isSelected = selectedKelas.includes(kelas.id);
                      return (
                        <button
                          key={kelas.id}
                          type="button"
                          onClick={() => toggleKelas(kelas.id)}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm font-medium transition-all ${
                            isSelected 
                              ? 'bg-blue-600 border-blue-600 text-white shadow-sm' 
                              : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-100" />}
                          {kelas.nama}
                          <span className={`text-xs ml-1 px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                            {kelas._count?.siswa || 0}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 pt-5 flex items-center justify-between">
                <div>
                  <Label htmlFor="acak" className="text-base font-semibold text-slate-900 cursor-pointer">Acak Urutan Soal</Label>
                  <p className="text-sm text-slate-500">Urutan soal akan diacak untuk setiap siswa mencegah kecurangan.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" id="acak" className="sr-only peer" checked={acak} onChange={e => setAcak(e.target.checked)} />
                  <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </CardContent>
            <CardFooter className="bg-slate-50 border-t border-slate-100 p-6 flex justify-end gap-3 rounded-b-xl">
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>Batal</Button>
              <Button type="submit" disabled={isLoading} className="gap-2 px-6">
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Simpan & Lanjut Buat Soal
              </Button>
            </CardFooter>
          </Card>
        </div>
      </form>
    </div>
  );
}
