import { toast } from 'sonner';
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Clock, BookOpen, AlertCircle, FileText, CheckCircle2, History } from "lucide-react";
import api from "../../lib/api";
import { formatDate } from "../../lib/utils";

export default function ExamList() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'AKTIF' | 'RIWAYAT'>('AKTIF');
  const [ujianAktif, setUjianAktif] = useState<any[]>([]);
  const [riwayat, setRiwayat] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [startingUjianId, setStartingUjianId] = useState<string | null>(null);

  // Modal konfirmasi mulai
  const [confirmModal, setConfirmModal] = useState<any | null>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      if (activeTab === 'AKTIF') {
        const res = await api.get('/api/siswa/ujian/aktif');
        setUjianAktif(res);
      } else {
        const res = await api.get('/api/siswa/ujian/riwayat');
        setRiwayat(res);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMulaiUjian = async (ujianId: string) => {
    try {
      setStartingUjianId(ujianId);
      const res = await api.post(`/api/siswa/ujian/${ujianId}/mulai`);
      setConfirmModal(null);
      navigate(`/exam/${res.sessionId}`);
    } catch (err: any) {
      toast.error(err.message || 'Gagal memulai ujian');
    } finally {
      setStartingUjianId(null);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-600 font-bold bg-green-50';
    if (score >= 60) return 'text-yellow-600 font-bold bg-yellow-50';
    return 'text-red-600 font-bold bg-red-50';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Ujian Online</h1>
          <p className="text-slate-500 mt-1">Selesaikan ujian Anda tepat waktu.</p>
        </div>
      </div>

      <div className="flex border-b border-slate-200 gap-6">
        <button
          className={`pb-3 font-medium transition-colors border-b-2 ${activeTab === 'AKTIF' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          onClick={() => setActiveTab('AKTIF')}
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> Ujian Aktif
          </div>
        </button>
        <button
          className={`pb-3 font-medium transition-colors border-b-2 ${activeTab === 'RIWAYAT' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          onClick={() => setActiveTab('RIWAYAT')}
        >
          <div className="flex items-center gap-2">
            <History className="w-4 h-4" /> Riwayat Nilai
          </div>
        </button>
      </div>

      {isLoading ? (
         <div className="py-12 text-center text-slate-500">Memuat data...</div>
      ) : activeTab === 'AKTIF' ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {ujianAktif.length === 0 ? (
            <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-200 rounded-xl">
               <CheckCircle2 className="w-12 h-12 text-slate-300 mb-3" />
               <p className="text-lg font-medium text-slate-700">Tidak ada ujian aktif</p>
               <p className="text-sm">Selamat bersantai! Belum ada ujian yang harus dikerjakan.</p>
            </div>
          ) : (
            ujianAktif.map(ujian => (
              <Card key={ujian.id} className="hover:border-slate-300 transition-all flex flex-col">
                <CardContent className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <Badge variant="outline" className="text-[10px] uppercase font-medium">{ujian.tipeUjian.replace('_', ' ')}</Badge>
                    <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-full">
                      Tutup: {formatDate(ujian.tanggalSelesai, 'datetime')}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 mb-2 leading-tight">
                    {ujian.judul}
                  </h3>
                  <div className="space-y-2 mt-auto pt-4 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-slate-400" />
                      {ujian.mataPelajaran}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      Durasi: {ujian.durasi} menit
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-400" />
                      {ujian._count?.soal || 0} Soal
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-100">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => setConfirmModal(ujian)}>
                      Mulai Ujian
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            {riwayat.length === 0 ? (
               <div className="py-12 flex flex-col items-center justify-center text-slate-500 rounded-xl">
                 <History className="w-12 h-12 text-slate-300 mb-3" />
                 <p className="text-lg font-medium text-slate-700">Belum ada riwayat</p>
                 <p className="text-sm">Anda belum mengerjakan ujian apapun.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase text-xs">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Tanggal</th>
                      <th className="px-6 py-4 font-semibold">Ujian</th>
                      <th className="px-6 py-4 font-semibold">Mata Pelajaran</th>
                      <th className="px-6 py-4 font-semibold text-center">Status</th>
                      <th className="px-6 py-4 font-semibold text-center">Nilai</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {riwayat.map(sesi => (
                      <tr key={sesi.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                          {formatDate(sesi.waktuSelesai || sesi.waktuMulai, 'date')}
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-900">
                          {sesi.ujian.judul}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {sesi.ujian.mataPelajaran}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Badge variant="outline" className={sesi.status === 'SELESAI' ? 'border-green-200 text-green-700 bg-green-50' : ''}>
                            {sesi.status === 'SELESAI' ? 'Selesai' : sesi.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {sesi.nilai !== null ? (
                            <span className={`inline-flex items-center justify-center min-w-[3rem] px-2 py-1 rounded-md ${getScoreColor(sesi.nilai)}`}>
                              {sesi.nilai}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modal Konfirmasi Mulai Ujian */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <Card className="w-full max-w-md shadow-xl border-0 animate-in fade-in zoom-in-95 duration-200">
            <CardHeader className="bg-blue-50/50 border-b border-blue-100 pb-4">
              <CardTitle className="text-xl">Mulai Ujian?</CardTitle>
              <CardDescription>Perhatikan peraturan sebelum memulai ujian.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="font-semibold text-slate-900 text-lg">{confirmModal.judul}</div>
              <ul className="text-sm text-slate-600 space-y-2 list-disc pl-5">
                <li>Durasi ujian adalah <b>{confirmModal.durasi} menit</b>. Waktu tidak akan berhenti meskipun Anda keluar dari browser.</li>
                <li>Sistem dilengkapi dengan <b>Anti-Cheat</b>. Keluar dari fullscreen atau pindah tab akan tercatat sebagai pelanggaran.</li>
                <li>Setelah 3x pelanggaran, ujian akan <b>otomatis diakhiri</b>.</li>
                <li>Pastikan koneksi internet Anda stabil sebelum memulai.</li>
              </ul>
              <div className="bg-yellow-50 text-yellow-800 p-3 rounded-lg text-sm border border-yellow-200 mt-4 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Ujian yang sudah dimulai tidak bisa dibatalkan atau diulangi.</span>
              </div>
            </CardContent>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 rounded-b-xl">
              <Button type="button" variant="outline" onClick={() => setConfirmModal(null)} disabled={startingUjianId !== null}>Batal</Button>
              <Button onClick={() => handleMulaiUjian(confirmModal.id)} disabled={startingUjianId === confirmModal.id} className="gap-2">
                {startingUjianId === confirmModal.id ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Menyiapkan...
                  </>
                ) : (
                  'Mulai Sekarang'
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
