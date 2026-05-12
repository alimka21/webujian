import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Clock, AlertTriangle, ArrowLeft, ShieldAlert, ChevronDown, ChevronUp, MinusCircle } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import api from '../../../lib/api';

interface Pelanggaran {
  tipe: string;
  pesan: string;
  timestamp: string;
}

interface JawabanItem {
  nomor: number;
  teks: string;
  tipe: string;
  opsiDipilih: { teks: string } | null;
  opsiBenar: { teks: string } | null;
  isBenar: boolean;
  tidakDijawab: boolean;
}

interface HasilData {
  id: string;
  status: string;
  nilaiAkhir: number;
  submitReason: string;
  mulaiAt: string;
  selesaiAt: string;
  jumlahBenar: number;
  totalSoal: number;
  siswa: { nama: string };
  ujian: { judul: string; mataPelajaran: string; durasi: number };
  pelanggaran: Pelanggaran[];
  jawaban: JawabanItem[];
}

function formatDurasi(mulaiAt: string, selesaiAt: string): string {
  const diff = Math.floor((new Date(selesaiAt).getTime() - new Date(mulaiAt).getTime()) / 1000);
  const menit = Math.floor(diff / 60);
  const detik = diff % 60;
  if (menit === 0) return `${detik} detik`;
  return `${menit} menit ${detik > 0 ? `${detik} detik` : ''}`.trim();
}

function formatWaktu(iso: string): string {
  return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function labelTipe(tipe: string): string {
  const map: Record<string, string> = {
    TAB_SWITCH: 'Berpindah Tab',
    FULLSCREEN_EXIT: 'Keluar Layar Penuh',
    WINDOW_BLUR: 'Aplikasi Kehilangan Fokus',
    DEVTOOLS: 'Membuka Developer Tools',
  };
  return map[tipe] ?? tipe;
}

function labelSubmit(reason: string, status: string): { teks: string; variant: 'default' | 'destructive' | 'outline' } {
  if (status === 'AUTO_SUBMIT') return { teks: 'Auto-submit (Pelanggaran)', variant: 'destructive' };
  if (reason === 'timeout') return { teks: 'Waktu Habis', variant: 'outline' };
  return { teks: 'Selesai Manual', variant: 'default' };
}

export default function HasilUjian() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<HasilData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    api.get(`/api/siswa/sesi/${sessionId}/hasil`)
      .then(setData)
      .catch((err: any) => setError(err?.message ?? 'Gagal memuat hasil ujian.'));
  }, [sessionId]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <XCircle className="w-12 h-12 text-red-500" />
        <p className="text-slate-600">{error}</p>
        <Button variant="outline" onClick={() => navigate('/dashboard/siswa')}>
          Kembali ke Dashboard
        </Button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const nilai = data.nilaiAkhir ?? 0;
  const nilaiDisplay = Math.round(nilai * 100) / 100;

  const scoreColor =
    nilai >= 75 ? 'text-emerald-600' :
    nilai >= 60 ? 'text-amber-500' :
    'text-red-500';

  const scoreBg =
    nilai >= 75 ? 'bg-emerald-50 border-emerald-200' :
    nilai >= 60 ? 'bg-amber-50 border-amber-200' :
    'bg-red-50 border-red-200';

  const scoreLabel =
    nilai >= 75 ? 'Lulus' :
    nilai >= 60 ? 'Cukup' :
    'Belum Lulus';

  const submitInfo = labelSubmit(data.submitReason, data.status);
  const tidakDijawabCount = data.jawaban?.filter(j => j.tidakDijawab).length ?? 0;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">

      {/* Header */}
      <div>
        <button
          onClick={() => navigate('/dashboard/siswa')}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Dashboard
        </button>
        <h1 className="text-2xl font-bold text-slate-800">{data.ujian.judul}</h1>
        <p className="text-slate-500 mt-0.5">{data.ujian.mataPelajaran}</p>
      </div>

      {/* Skor utama */}
      <div className={`rounded-2xl border-2 p-8 text-center ${scoreBg}`}>
        <p className="text-sm font-medium text-slate-500 uppercase tracking-widest mb-2">Nilai Anda</p>
        <p className={`text-7xl font-extrabold tabular-nums ${scoreColor}`}>{nilaiDisplay}</p>
        <span className={`inline-block mt-3 text-sm font-semibold px-3 py-1 rounded-full ${
          nilai >= 75 ? 'bg-emerald-100 text-emerald-700' :
          nilai >= 60 ? 'bg-amber-100 text-amber-700' :
          'bg-red-100 text-red-700'
        }`}>
          {scoreLabel}
        </span>
      </div>

      {/* Statistik */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 shrink-0" />
          <div>
            <p className="text-xs text-slate-500">Jawaban Benar</p>
            <p className="text-xl font-bold text-slate-800">
              {data.jumlahBenar}
              <span className="text-sm font-normal text-slate-400"> / {data.totalSoal}</span>
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
          <Clock className="w-8 h-8 text-blue-500 shrink-0" />
          <div>
            <p className="text-xs text-slate-500">Durasi Pengerjaan</p>
            <p className="text-lg font-bold text-slate-800">
              {data.mulaiAt && data.selesaiAt
                ? formatDurasi(data.mulaiAt, data.selesaiAt)
                : `${data.ujian.durasi} menit`}
            </p>
          </div>
        </div>
      </div>

      {/* Status Submit */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500 mb-1">Status Ujian</p>
          <Badge variant={submitInfo.variant}>{submitInfo.teks}</Badge>
        </div>
        {data.selesaiAt && (
          <div className="text-right">
            <p className="text-xs text-slate-500 mb-1">Waktu Selesai</p>
            <p className="text-sm font-medium text-slate-700">{formatWaktu(data.selesaiAt)}</p>
          </div>
        )}
      </div>

      {/* Pelanggaran */}
      {data.pelanggaran.length > 0 && (
        <div className="bg-white rounded-xl border border-orange-200 p-4 space-y-3">
          <div className="flex items-center gap-2 text-orange-600">
            <ShieldAlert className="w-5 h-5" />
            <p className="font-semibold text-sm">
              Catatan Pelanggaran ({data.pelanggaran.length})
            </p>
          </div>
          <ul className="space-y-2">
            {data.pelanggaran.map((p, i) => (
              <li key={i} className="flex items-start justify-between gap-2 text-sm">
                <span className="flex items-center gap-1.5 text-slate-700">
                  <AlertTriangle className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
                  {labelTipe(p.tipe)}
                </span>
                <span className="text-slate-400 shrink-0">{formatWaktu(p.timestamp)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Review Jawaban (collapsible) */}
      {data.jawaban && data.jawaban.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors"
            onClick={() => setReviewOpen(o => !o)}
          >
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800">Review Jawaban</span>
              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {data.jumlahBenar} benar · {data.totalSoal - data.jumlahBenar - tidakDijawabCount} salah · {tidakDijawabCount} kosong
              </span>
            </div>
            {reviewOpen
              ? <ChevronUp className="w-5 h-5 text-slate-400" />
              : <ChevronDown className="w-5 h-5 text-slate-400" />
            }
          </button>

          {reviewOpen && (
            <div className="border-t border-slate-100 divide-y divide-slate-100">
              {data.jawaban.map((item) => (
                <div
                  key={item.nomor}
                  className={`px-5 py-4 flex gap-4 items-start ${
                    item.tidakDijawab ? 'bg-slate-50/50' :
                    item.isBenar ? 'bg-emerald-50/40' : 'bg-red-50/40'
                  }`}
                >
                  {/* Nomor + ikon */}
                  <div className="flex flex-col items-center gap-1.5 shrink-0 pt-0.5">
                    <span className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center">
                      {item.nomor}
                    </span>
                    {item.tidakDijawab
                      ? <MinusCircle className="w-4 h-4 text-slate-400" />
                      : item.isBenar
                        ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        : <XCircle className="w-4 h-4 text-red-500" />
                    }
                  </div>

                  {/* Konten */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-800 leading-snug mb-2">{item.teks}</p>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-slate-500 shrink-0 w-28">Jawaban kamu:</span>
                        {item.tidakDijawab ? (
                          <span className="italic text-slate-400">Tidak dijawab</span>
                        ) : (
                          <span className={`font-medium ${item.isBenar ? 'text-emerald-700' : 'text-red-700'}`}>
                            {item.opsiDipilih?.teks ?? '—'}
                          </span>
                        )}
                      </div>
                      {!item.isBenar && (
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-slate-500 shrink-0 w-28">Jawaban benar:</span>
                          <span className="font-medium text-emerald-700">{item.opsiBenar?.teks ?? '—'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CTA */}
      <Button className="w-full" onClick={() => navigate('/dashboard/siswa')}>
        Kembali ke Dashboard
      </Button>
    </div>
  );
}
