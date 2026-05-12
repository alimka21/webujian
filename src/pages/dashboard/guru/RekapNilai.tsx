import { toast } from 'sonner';
import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Select } from '../../../components/ui/select';
import { Badge } from '../../../components/ui/badge';
import { Search, Download, AlertTriangle, X, ChevronUp, ChevronDown, CheckCircle2, XCircle, MinusCircle } from 'lucide-react';
import api from '../../../lib/api';
import { useModalA11y } from '../../../hooks/useModalA11y';

export default function RekapNilai() {
  const [searchParams] = useSearchParams();
  const preselectedId = searchParams.get('ujianId');

  const [ujianList, setUjianList] = useState<any[]>([]);
  const [selectedUjian, setSelectedUjian] = useState<string>('');
  const [rekapData, setRekapData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState<'xlsx' | 'pdf' | null>(null);

  // Sort
  const [sortField, setSortField] = useState<string>('nilaiAkhir');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Detail modal
  const [detailSesiId, setDetailSesiId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<any | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const detailModalRef = useModalA11y<HTMLDivElement>(detailSesiId !== null, () => setDetailSesiId(null));

  useEffect(() => { fetchUjian(); }, []);

  const fetchUjian = async () => {
    try {
      const res = await api.get('/api/guru/ujian');
      const filtered = res.filter((u: any) => new Date() >= new Date(u.tanggalMulai));
      setUjianList(filtered);
      if (filtered.length > 0) {
        const targetId = preselectedId && filtered.some((u: any) => u.id === preselectedId)
          ? preselectedId
          : filtered[0].id;
        setSelectedUjian(targetId);
      }
    } catch (error: any) {
      toast.error(error?.message || 'Gagal memuat daftar ujian');
    }
  };

  useEffect(() => {
    if (selectedUjian) fetchRekap();
  }, [selectedUjian]);

  const fetchRekap = async () => {
    try {
      setIsLoading(true);
      setRekapData(null);
      const res = await api.get(`/api/guru/ujian/${selectedUjian}/hasil`);
      setRekapData(res);
    } catch (error: any) {
      toast.error(error?.message || 'Gagal memuat rekap nilai');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir(field === 'nilaiAkhir' ? 'desc' : 'asc');
    }
  };

  const sortedData = Array.isArray(rekapData) ? [...rekapData].sort((a, b) => {
    const mul = sortDir === 'asc' ? 1 : -1;
    if (sortField === 'nama') return (a.siswa.nama as string).localeCompare(b.siswa.nama) * mul;
    if (sortField === 'kelas') return ((a.siswa.kelas?.nama ?? '') as string).localeCompare(b.siswa.kelas?.nama ?? '') * mul;
    if (sortField === 'status') return (a.status as string).localeCompare(b.status) * mul;
    // nilaiAkhir: null goes last
    const va = a.nilaiAkhir ?? (sortDir === 'asc' ? Infinity : -Infinity);
    const vb = b.nilaiAkhir ?? (sortDir === 'asc' ? Infinity : -Infinity);
    return (va - vb) * mul;
  }) : [];

  const getToken = () => {
    let token = localStorage.getItem('token');
    if (!token) {
      try {
        const raw = localStorage.getItem('auth-storage');
        if (raw) token = JSON.parse(raw)?.state?.token;
      } catch { /* ignore */ }
    }
    return token;
  };

  const handleExport = async (format: 'xlsx' | 'pdf') => {
    if (!selectedUjian) return;
    try {
      setIsExporting(format);
      const token = getToken();
      const resp = await fetch(`/api/guru/ujian/${selectedUjian}/export?format=${format}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!resp.ok) throw new Error('Gagal mengunduh file');
      const blob = await resp.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href;
      a.download = `nilai-ujian.${format === 'xlsx' ? 'xlsx' : 'pdf'}`;
      a.click();
      URL.revokeObjectURL(href);
      toast.success(`File ${format.toUpperCase()} berhasil diunduh`);
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengunduh file');
    } finally {
      setIsExporting(null);
    }
  };

  const handleOpenDetail = async (sesiId: string) => {
    if (!sesiId) {
      toast.error('Siswa belum mulai mengerjakan ujian');
      return;
    }
    setDetailSesiId(sesiId);
    setDetailData(null);
    setIsLoadingDetail(true);
    try {
      const res = await api.get(`/api/guru/ujian/${selectedUjian}/sesi/${sesiId}`);
      setDetailData(res);
    } catch (err: any) {
      toast.error('Gagal memuat detail jawaban');
      setDetailSesiId(null);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-slate-400 bg-slate-100';
    if (score >= 75) return 'text-green-700 bg-green-50';
    if (score >= 60) return 'text-yellow-700 bg-yellow-50';
    return 'text-red-700 bg-red-50';
  };

  const statusBadge = (status: string, reason: string | null) => {
    if (status === 'AUTO_SUBMIT') {
      return (
        <span title={`Alasan: ${reason || 'pelanggaran'}`}>
          <Badge variant="destructive" className="cursor-help">Auto-Submit</Badge>
        </span>
      );
    }
    if (status === 'SELESAI') {
      if (reason === 'timeout') return <Badge variant="warning">Waktu Habis</Badge>;
      return <Badge variant="success">Selesai</Badge>;
    }
    if (status === 'SEDANG_BERLANGSUNG') return <Badge className="bg-blue-500 text-white border-0">Berlangsung</Badge>;
    return <Badge variant="outline" className="text-slate-500">Belum Mulai</Badge>;
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <ChevronUp className="w-3.5 h-3.5 opacity-20" />;
    return sortDir === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />;
  };

  // Stats
  const stats = useMemo(() => {
    const result = { peserta: 0, rataRata: 0, tertinggi: 0, terendah: 0 };
    if (!Array.isArray(rekapData) || rekapData.length === 0) return result;
    const selesai = rekapData.filter((s: any) => (s.status === 'SELESAI' || s.status === 'AUTO_SUBMIT') && s.nilaiAkhir !== null);
    result.peserta = selesai.length;
    if (selesai.length > 0) {
      const sum = selesai.reduce((a: number, b: any) => a + b.nilaiAkhir, 0);
      result.rataRata = Math.round(sum / selesai.length);
      result.tertinggi = Math.max(...selesai.map((s: any) => s.nilaiAkhir));
      result.terendah = Math.min(...selesai.map((s: any) => s.nilaiAkhir));
    }
    return result;
  }, [rekapData]);

  return (
    <div className="space-y-6">
      {/* Modal Detail Jawaban */}
      {detailSesiId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setDetailSesiId(null)}>
          <div
            ref={detailModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="detail-jawaban-title"
            className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 id="detail-jawaban-title" className="text-lg font-bold text-slate-900">Detail Jawaban</h2>
                {detailData && (
                  <p className="text-sm text-slate-500 mt-0.5">
                    {detailData.siswa.nama} — NIS {detailData.siswa.nis}
                    {detailData.sesi.nilaiAkhir !== null && (
                      <span className={`ml-2 font-bold px-2 py-0.5 rounded ${getScoreColor(detailData.sesi.nilaiAkhir)}`}>
                        Nilai: {detailData.sesi.nilaiAkhir}
                      </span>
                    )}
                  </p>
                )}
              </div>
              <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-500" onClick={() => setDetailSesiId(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6">
              {isLoadingDetail ? (
                <div className="py-12 text-center text-slate-500">Memuat jawaban...</div>
              ) : detailData ? (
                <div className="space-y-3">
                  {detailData.detail.map((item: any) => (
                    <div key={item.nomor} className={`rounded-xl border p-4 ${item.tidakDijawab ? 'border-slate-200 bg-slate-50' : item.isBenar ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'}`}>
                      <div className="flex items-start gap-3">
                        <span className="shrink-0 w-7 h-7 rounded-full bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center">{item.nomor}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 leading-snug">{item.teks}</p>
                          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-500 shrink-0">Jawaban siswa:</span>
                              {item.tidakDijawab ? (
                                <span className="text-slate-400 italic">Tidak dijawab</span>
                              ) : (
                                <span className={`font-medium ${item.isBenar ? 'text-green-700' : 'text-red-700'}`}>
                                  {item.opsiDipilih?.teks ?? '-'}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-500 shrink-0">Jawaban benar:</span>
                              <span className="font-medium text-green-700">{item.opsiBenar?.teks ?? '-'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="shrink-0">
                          {item.tidakDijawab ? (
                            <MinusCircle className="w-5 h-5 text-slate-400" />
                          ) : item.isBenar ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center text-sm text-slate-500">
              {detailData && (
                <>
                  <span>
                    {detailData.detail.filter((d: any) => d.isBenar).length} benar /&nbsp;
                    {detailData.detail.filter((d: any) => !d.isBenar && !d.tidakDijawab).length} salah /&nbsp;
                    {detailData.detail.filter((d: any) => d.tidakDijawab).length} tidak dijawab
                  </span>
                  <span>{detailData.detail.length} soal total</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Rekapitulasi Nilai</h1>
          <p className="text-slate-500 mt-1">Pantau hasil ujian dan analisis performa siswa.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleExport('xlsx')}
            disabled={isExporting !== null || !selectedUjian}
            className="gap-2 bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800"
          >
            {isExporting === 'xlsx' ? <div className="w-4 h-4 border-2 border-green-700/40 border-t-green-700 rounded-full animate-spin" /> : <Download className="w-4 h-4" />}
            Export Excel
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('pdf')}
            disabled={isExporting !== null || !selectedUjian}
            className="gap-2 bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:text-red-800"
          >
            {isExporting === 'pdf' ? <div className="w-4 h-4 border-2 border-red-700/40 border-t-red-700 rounded-full animate-spin" /> : <Download className="w-4 h-4" />}
            Export PDF
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Filter Ujian</CardTitle>
            <div className="w-full sm:w-96">
              <Select value={selectedUjian} onChange={e => setSelectedUjian(e.target.value)} disabled={ujianList.length === 0}>
                {ujianList.length === 0 && <option value="">Belum ada ujian terlaksana</option>}
                {ujianList.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.judul} — {u.mataPelajaran} ({new Date(u.tanggalMulai).toLocaleDateString('id-ID')})
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {isLoading ? (
            <div className="py-12 text-center text-slate-500">Memuat analisis data...</div>
          ) : !Array.isArray(rekapData) ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-100 rounded-xl">
              <p className="text-lg font-medium text-slate-700">Silakan pilih ujian</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                  <p className="text-sm text-slate-500 font-medium mb-1">Total Selesai</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.peserta} <span className="text-sm font-normal text-slate-500">siswa</span></p>
                </div>
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                  <p className="text-sm text-blue-600 font-medium mb-1">Rata-rata Kelas</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.rataRata}</p>
                </div>
                <div className="bg-green-50 border border-green-100 p-4 rounded-xl">
                  <p className="text-sm text-green-600 font-medium mb-1">Nilai Tertinggi</p>
                  <p className="text-2xl font-bold text-green-900">{stats.tertinggi}</p>
                </div>
                <div className="bg-red-50 border border-red-100 p-4 rounded-xl">
                  <p className="text-sm text-red-600 font-medium mb-1">Nilai Terendah</p>
                  <p className="text-2xl font-bold text-red-900">{stats.terendah}</p>
                </div>
              </div>

              {/* Tabel */}
              <div className="overflow-x-auto border rounded-xl">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 font-semibold w-12 text-center">No</th>
                      {[
                        { field: 'nama', label: 'Identitas Siswa' },
                        { field: 'kelas', label: 'Kelas' },
                        { field: 'nilaiAkhir', label: 'Nilai Akhir' },
                        { field: 'status', label: 'Status' },
                      ].map(col => (
                        <th
                          key={col.field}
                          className={`px-4 py-3 font-semibold cursor-pointer select-none hover:bg-slate-100 transition-colors ${col.field === 'nilaiAkhir' || col.field === 'status' ? 'text-center' : ''}`}
                          onClick={() => handleSort(col.field)}
                        >
                          <span className="inline-flex items-center gap-1">
                            {col.label}
                            <SortIcon field={col.field} />
                          </span>
                        </th>
                      ))}
                      <th className="px-4 py-3 font-semibold text-center">Pelanggaran</th>
                      <th className="px-4 py-3 font-semibold text-center w-24">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sortedData.map((sesi: any, index: number) => (
                      <tr key={sesi.sesiId ?? sesi.siswa.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-4 text-center text-slate-400 font-medium">{index + 1}</td>
                        <td className="px-4 py-4">
                          <p className="font-semibold text-slate-900">{sesi.siswa.nama}</p>
                          <p className="text-xs text-slate-500 mt-0.5">NIS: {sesi.siswa.nis}</p>
                        </td>
                        <td className="px-4 py-4 text-slate-600">{sesi.siswa.kelas?.nama || '-'}</td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col items-center gap-1.5">
                            <span className={`inline-flex items-center justify-center min-w-[2.5rem] px-2 py-1 rounded-md font-bold text-sm ${getScoreColor(sesi.nilaiAkhir)}`}>
                              {sesi.nilaiAkhir !== null ? sesi.nilaiAkhir : '—'}
                            </span>
                            {sesi.nilaiAkhir !== null && (
                              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden max-w-[72px]">
                                <div
                                  className={`h-full rounded-full ${sesi.nilaiAkhir >= 75 ? 'bg-green-500' : sesi.nilaiAkhir >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                  style={{ width: `${sesi.nilaiAkhir}%` }}
                                />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                            {statusBadge(sesi.status, sesi.submitReason)}
                            {sesi.selesaiAt && (
                              <p className="text-[10px] text-slate-400 uppercase">
                                {new Date(sesi.selesaiAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          {sesi.pelanggaran?.length > 0 ? (
                            <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
                              <AlertTriangle className="w-3 h-3 mr-1" /> {sesi.pelanggaran.length}x
                            </Badge>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-600 bg-blue-50 hover:bg-blue-100 h-8"
                            onClick={() => handleOpenDetail(sesi.sesiId)}
                            disabled={!sesi.sesiId}
                          >
                            <Search className="w-4 h-4 mr-1.5" /> Detail
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {rekapData.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                          Belum ada peserta yang mengikuti ujian ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
