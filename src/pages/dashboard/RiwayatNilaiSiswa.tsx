import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { formatDate } from '../../lib/format';
import api from '../../lib/api';

export default function RiwayatNilaiSiswa() {
  const [riwayat, setRiwayat] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRiwayat();
  }, []);

  const fetchRiwayat = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/api/siswa/hasil');
      setRiwayat(res);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Riwayat Nilai</h1>
        <p className="text-slate-500">Histori nilai ujian CBT yang sudah Anda selesaikan.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Nilai</CardTitle>
          <CardDescription>Menampilkan ujian terbaru di urutan teratas</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-slate-500">Memuat riwayat...</div>
          ) : riwayat.length === 0 ? (
            <div className="text-center py-8 text-slate-500">Belum ada ujian yang diselesaikan.</div>
          ) : (
             <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse space-y-2">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="p-3 text-sm font-semibold text-slate-600">Judul Ujian</th>
                    <th className="p-3 text-sm font-semibold text-slate-600">Mata Pelajaran</th>
                    <th className="p-3 text-sm font-semibold text-slate-600">Selesai Pada</th>
                    <th className="p-3 text-sm font-semibold text-slate-600">Status</th>
                    <th className="p-3 text-right text-sm font-semibold text-slate-600">Nilai Akhir</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm">
                  {riwayat.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="p-3 font-medium text-slate-800">{item.ujian.judul}</td>
                      <td className="p-3 text-slate-600">{item.ujian.mataPelajaran || '-'}</td>
                      <td className="p-3 text-slate-600">{formatDate(item.selesaiAt)}</td>
                      <td className="p-3">
                        <Badge variant={item.status === 'SELESAI' ? 'default' : 'secondary'}>
                          {item.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        <span className="font-bold text-lg text-slate-800">
                          {item.nilaiAkhir}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
