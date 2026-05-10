import { toast } from 'sonner';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Select } from '../../components/ui/select';
import { Input, Label } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Calendar as CalendarIcon, CheckSquare, Save, Download, BarChart2 } from 'lucide-react';
import api from '../../lib/api';
import { formatDate } from '../../lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function Attendance() {
  const [activeTab, setActiveTab] = useState<'INPUT' | 'REKAP'>('INPUT');
  const [kelasList, setKelasList] = useState<any[]>([]);
  const [selectedKelas, setSelectedKelas] = useState<string>('');
  
  // Tab Input State
  const [tanggalPilih, setTanggalPilih] = useState(new Date().toISOString().slice(0,10));
  const [presensiSiswa, setPresensiSiswa] = useState<any[]>([]); // id, nama, status, keterangan
  const [isLoadingSiswa, setIsLoadingSiswa] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasExistingPresensi, setHasExistingPresensi] = useState(false);

  // Tab Rekap State
  const [rekapBulan, setRekapBulan] = useState(new Date().getMonth() + 1);
  const [rekapTahun, setRekapTahun] = useState(new Date().getFullYear());
  const [rekapData, setRekapData] = useState<any[]>([]);
  const [isLoadingRekap, setIsLoadingRekap] = useState(false);

  useEffect(() => {
    fetchKelas();
  }, []);

  const fetchKelas = async () => {
    try {
      const res = await api.get('/api/guru/kelas');
      setKelasList(res);
      if (res.length > 0) {
        setSelectedKelas(res[0].id);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (activeTab === 'INPUT' && selectedKelas && tanggalPilih) {
      fetchSiswaUntukPresensi();
    } else if (activeTab === 'REKAP' && selectedKelas) {
      fetchRekap();
    }
  }, [selectedKelas, tanggalPilih, activeTab, rekapBulan, rekapTahun]);

  const fetchSiswaUntukPresensi = async () => {
    try {
      setIsLoadingSiswa(true);
      // 1. Ambil daftar siswa
      const kelasData = await api.get(`/api/guru/kelas/${selectedKelas}`);
      const listSiswa = kelasData.siswa || [];
      
      // 2. Cek apakah di tanggal tersebut sudah ada presensi?
      const existingPresensi = await api.get(`/api/guru/presensi?kelasId=${selectedKelas}&tanggal=${tanggalPilih}`);
      
      if (existingPresensi.length > 0) {
        setHasExistingPresensi(true);
        // Map data yang sudah ada
        const mapped = listSiswa.map((s: any) => {
          const found = existingPresensi.find((p: any) => p.siswaId === s.id);
          return {
            id: s.id,
            nis: s.nis,
            nama: s.nama,
            status: found ? found.status : 'HADIR',
            keterangan: found ? found.keterangan || '' : ''
          };
        });
        setPresensiSiswa(mapped);
      } else {
        setHasExistingPresensi(false);
        setPresensiSiswa(listSiswa.map((s: any) => ({
          id: s.id,
          nis: s.nis,
          nama: s.nama,
          status: 'HADIR', // Default
          keterangan: ''
        })));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingSiswa(false);
    }
  };

  const fetchRekap = async () => {
    try {
      setIsLoadingRekap(true);
      const res = await api.get(`/api/guru/presensi/rekap?kelasId=${selectedKelas}&bulan=${rekapBulan}&tahun=${rekapTahun}`);
      setRekapData(res);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingRekap(false);
    }
  };

  const handleChangeStatus = (id: string, status: string) => {
    setPresensiSiswa(prev => prev.map(s => s.id === id ? { ...s, status } : s));
  };
  
  const handleChangeKet = (id: string, val: string) => {
    setPresensiSiswa(prev => prev.map(s => s.id === id ? { ...s, keterangan: val } : s));
  };

  const handleMarkAllHadir = () => {
    setPresensiSiswa(prev => prev.map(s => ({ ...s, status: 'HADIR' })));
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const data = presensiSiswa.map(s => ({
        siswaId: s.id,
        status: s.status,
        keterangan: s.keterangan || undefined
      }));

      await api.post('/api/guru/presensi', {
        kelasId: selectedKelas,
        tanggal: new Date(tanggalPilih).toISOString(),
        presensi: data
      });
      
      setHasExistingPresensi(true);
      toast.success('Presensi berhasil disimpan!');
    } catch (error: any) {
      toast.error(error.message || 'Gagal menyimpan presensi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPercentageColor = (pct: number) => {
    if (pct >= 90) return '#22c55e'; // green-500
    if (pct >= 75) return '#eab308'; // yellow-500
    return '#ef4444'; // red-500
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Manajemen Presensi</h1>
          <p className="text-slate-500 mt-1">Catat dan pantau kehadiran siswa Anda.</p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'INPUT' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab('INPUT')}
          >
            Input Presensi
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'REKAP' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab('REKAP')}
          >
            Rekap Bulanan
          </button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle>{activeTab === 'INPUT' ? 'Input Kehadiran' : 'Rekap Kehadiran'}</CardTitle>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Select value={selectedKelas} onChange={e => setSelectedKelas(e.target.value)} disabled={kelasList.length === 0} className="w-full sm:w-56">
                {kelasList.length === 0 && <option value="">Pilih Kelas</option>}
                {kelasList.map(k => (
                  <option key={k.id} value={k.id}>{k.nama} (Tingkat {k.tingkat})</option>
                ))}
              </Select>
              
              {activeTab === 'INPUT' ? (
                <Input 
                  type="date" 
                  className="w-full sm:w-48"
                  value={tanggalPilih}
                  onChange={e => setTanggalPilih(e.target.value)}
                />
              ) : (
                <div className="flex gap-2">
                  <Select value={rekapBulan} onChange={e => setRekapBulan(Number(e.target.value))} className="w-full sm:w-32">
                    {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                      <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('id-ID', {month: 'long'})}</option>
                    ))}
                  </Select>
                  <Select value={rekapTahun} onChange={e => setRekapTahun(Number(e.target.value))} className="w-full sm:w-28">
                    {[new Date().getFullYear(), new Date().getFullYear() - 1].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </Select>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {kelasList.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-100 rounded-xl">
              <p className="text-lg font-medium text-slate-700">Tidak ada kelas</p>
              <p className="text-sm">Buat kelas terlebih dahulu di menu Siswa & Kelas.</p>
            </div>
          ) : activeTab === 'INPUT' ? (
            <div className="space-y-4">
              {isLoadingSiswa ? (
                <div className="py-12 text-center text-slate-500">Memuat data siswa...</div>
              ) : presensiSiswa.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-100 rounded-xl">
                   <p className="text-lg font-medium text-slate-700">Belum ada siswa di kelas ini</p>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-2 text-sm">
                      <CalendarIcon className="w-4 h-4 text-blue-500" />
                      <span className="font-medium text-slate-700">{formatDate(tanggalPilih, 'date')}</span>
                      {hasExistingPresensi && (
                         <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">Sudah Disimpan</Badge>
                      )}
                    </div>
                    <Button variant="outline" size="sm" onClick={handleMarkAllHadir} className="text-blue-600 bg-white">
                      <CheckSquare className="w-4 h-4 mr-1.5" /> Tandai Semua Hadir
                    </Button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase text-xs">
                        <tr>
                          <th className="px-4 py-3 font-semibold w-16">No</th>
                          <th className="px-4 py-3 font-semibold">Nama Siswa</th>
                          <th className="px-4 py-3 font-semibold min-w-[280px]">Status Kehadiran</th>
                          <th className="px-4 py-3 font-semibold">Keterangan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {presensiSiswa.map((siswa, idx) => (
                          <tr key={siswa.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-4 text-slate-500">{idx + 1}</td>
                            <td className="px-4 py-4 font-medium text-slate-900">
                              {siswa.nama}
                              <div className="text-xs text-slate-400 font-normal mt-0.5">{siswa.nis}</div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex flex-wrap gap-3">
                                {[
                                  {val: 'HADIR', label: 'Hadir', col: 'text-green-700 bg-green-50 border-green-200'}, 
                                  {val: 'IZIN', label: 'Izin', col: 'text-yellow-700 bg-yellow-50 border-yellow-200'}, 
                                  {val: 'SAKIT', label: 'Sakit', col: 'text-orange-700 bg-orange-50 border-orange-200'}, 
                                  {val: 'ALPHA', label: 'Alpha', col: 'text-red-700 bg-red-50 border-red-200'}
                                ].map(st => (
                                  <label key={st.val} className={`flex items-center gap-1.5 px-2 py-1 rounded-md border cursor-pointer transition-colors ${siswa.status === st.val ? st.col : 'text-slate-600 border-transparent hover:bg-slate-100'}`}>
                                    <input 
                                      type="radio" 
                                      name={`status-${siswa.id}`} 
                                      value={st.val}
                                      checked={siswa.status === st.val}
                                      onChange={() => handleChangeStatus(siswa.id, st.val)}
                                      className="sr-only"
                                    />
                                    <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${siswa.status === st.val ? 'border-current bg-current' : 'border-slate-300 bg-white'}`}>
                                       {siswa.status === st.val && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                    </div>
                                    <span className="text-xs font-medium">{st.label}</span>
                                  </label>
                                ))}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <Input 
                                placeholder="catatan opsional" 
                                className="h-8 text-xs max-w-[200px]"
                                value={siswa.keterangan}
                                onChange={(e) => handleChangeKet(siswa.id, e.target.value)}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end pt-4 mt-2 border-t border-slate-100">
                    <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 gap-2 px-8">
                      {isSubmitting ? (
                        <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      ) : <Save className="w-4 h-4" />}
                      Simpan Presensi
                    </Button>
                  </div>
                </>
              )}
            </div>
          ) : (
            // TAB REKAP
            <div className="space-y-6">
              {isLoadingRekap ? (
                <div className="py-12 text-center text-slate-500">Memuat rekapitulasi...</div>
              ) : rekapData.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-100 rounded-xl">
                   <p className="text-lg font-medium text-slate-700">Belum ada data</p>
                   <p className="text-sm">Tidak ada data presensi pada bulan ini.</p>
                </div>
              ) : (
                <>
                  <div className="h-64 mt-4 mb-8">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={rekapData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <XAxis dataKey="nama" tick={{fontSize: 10}} interval={0} angle={-45} textAnchor="end" height={60} />
                        <YAxis tick={{fontSize: 12}} />
                        <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                        <Bar dataKey="persentase" name="Kehadiran (%)" radius={[4, 4, 0, 0]}>
                          {rekapData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={getPercentageColor(entry.persentase)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="flex justify-end mb-3">
                     <Button variant="outline" size="sm" className="gap-2" onClick={() => toast('Fitur export ke Excel sedang dalam pengembangan')}>
                       <Download className="w-4 h-4" /> Export Excel
                     </Button>
                  </div>

                  <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Nama Siswa</th>
                          <th className="px-4 py-3 font-semibold text-center text-green-700">Hadir</th>
                          <th className="px-4 py-3 font-semibold text-center text-yellow-700">Izin</th>
                          <th className="px-4 py-3 font-semibold text-center text-orange-700">Sakit</th>
                          <th className="px-4 py-3 font-semibold text-center text-red-700">Alpha</th>
                          <th className="px-4 py-3 font-semibold text-center">% Kehadiran</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {rekapData.map((siswa, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3 font-medium text-slate-900">{siswa.nama}</td>
                            <td className="px-4 py-3 text-center font-medium bg-green-50/30">{siswa.hadir}</td>
                            <td className="px-4 py-3 text-center bg-yellow-50/30">{siswa.izin}</td>
                            <td className="px-4 py-3 text-center bg-orange-50/30">{siswa.sakit}</td>
                            <td className="px-4 py-3 text-center bg-red-50/30 text-red-600 font-medium">{siswa.alpha}</td>
                            <td className="px-4 py-3 text-center font-bold" style={{ color: getPercentageColor(siswa.persentase) }}>
                              {siswa.persentase}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
