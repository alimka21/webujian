import { toast } from 'sonner';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input, Label } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Plus, Download, Edit, Trash2, Building, GraduationCap, Briefcase, Users } from 'lucide-react';
import api from '../../lib/api';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';

export default function AlumniTracer() {
  const [alumniList, setAlumniList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterTahun, setFilterTahun] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const [stats, setStats] = useState<any>({ BEKERJA: 0, KULIAH: 0, WIRAUSAHA: 0 });
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nama: '',
    nis: '',
    tahunLulus: new Date().getFullYear(),
    status: 'KULIAH',
    instansi: '',
    jurusan: '',
    kontak: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAlumni = async () => {
    try {
      setIsLoading(true);
      let query = [];
      if (filterTahun !== 'ALL') query.push(`tahunLulus=${filterTahun}`);
      if (filterStatus !== 'ALL') query.push(`status=${filterStatus}`);
      
      const q = query.length > 0 ? `?${query.join('&')}` : '';
      const res = await api.get(`/api/alumni${q}`);
      setAlumniList(res);

      if (query.length === 0) {
         // get stats when no filter
         const resStats = await api.get('/api/alumni/stats');
         if (resStats.stats) {
           setStats(resStats.stats);
         }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlumni();
  }, [filterTahun, filterStatus]);

  const handleOpenModal = (alumni?: any) => {
    if (alumni) {
      setEditingId(alumni.id);
      setFormData({
        nama: alumni.nama,
        nis: alumni.nis || '',
        tahunLulus: alumni.tahunLulus,
        status: alumni.status,
        instansi: alumni.instansi || '',
        jurusan: alumni.jurusan || '',
        kontak: alumni.kontak || ''
      });
    } else {
      setEditingId(null);
      setFormData({
        nama: '',
        nis: '',
        tahunLulus: new Date().getFullYear(),
        status: 'KULIAH',
        instansi: '',
        jurusan: '',
        kontak: ''
      });
    }
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama || !formData.tahunLulus || !formData.status) {
      toast.error("Nama, Tahun Lulus, dan Status wajib diisi!");
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingId) {
        await api.patch(`/api/alumni/${editingId}`, formData);
      } else {
        await api.post('/api/alumni', formData);
      }
      setShowModal(false);
      fetchAlumni();
    } catch (error: any) {
      toast.error(error.message || 'Gagal menyimpan data alumni');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus data alumni ini?')) return;
    try {
      await api.delete(`/api/alumni/${id}`);
      fetchAlumni();
    } catch (error: any) {
      toast.error(error.message || 'Gagal menghapus alumni');
    }
  };

  // Prepare chart data
  const pieData = [
    { name: 'Bekerja', value: stats.BEKERJA || 0, color: '#3b82f6' },
    { name: 'Kuliah', value: stats.KULIAH || 0, color: '#22c55e' },
    { name: 'Wirausaha', value: stats.WIRAUSAHA || 0, color: '#eab308' },
  ].filter(d => d.value > 0);

  // Group by year for bar chart (calc roughly from current list if list is unfiltered)
  const yearsMap = alumniList.reduce((acc: any, al) => {
    acc[al.tahunLulus] = (acc[al.tahunLulus] || 0) + 1;
    return acc;
  }, {});
  const barData = Object.keys(yearsMap).map(y => ({ tahun: y, jumlah: yearsMap[y] })).sort((a,b) => Number(a.tahun) - Number(b.tahun));

  // Determine unique years available
  const existingYears = [...new Set(alumniList.map(a => a.tahunLulus))].sort((a,b)=>b-a);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Tracer Study Alumni</h1>
          <p className="text-slate-500 mt-1">Pantau jejak karir dan pendidikan lanjutan lulusan.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 text-slate-700 bg-white" onClick={() => toast('Fitur Export dalam pengembangan')}>
            <Download className="w-4 h-4" /> Export Excel
          </Button>
          <Button onClick={() => handleOpenModal()} className="gap-2 bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4" /> Tambah Manual
          </Button>
        </div>
      </div>

      {filterStatus === 'ALL' && filterTahun === 'ALL' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-200 text-slate-700 rounded-full flex items-center justify-center shrink-0">
               <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Total Terdata</p>
              <p className="text-2xl font-bold text-slate-900">{(stats.BEKERJA || 0) + (stats.KULIAH || 0) + (stats.WIRAUSAHA || 0)}</p>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-200 text-blue-700 rounded-full flex items-center justify-center shrink-0">
               <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-blue-600 font-medium">Bekerja</p>
              <p className="text-2xl font-bold text-blue-900">{stats.BEKERJA || 0}</p>
            </div>
          </div>
          <div className="bg-green-50 border border-green-100 p-4 rounded-xl flex items-center gap-4">
            <div className="w-12 h-12 bg-green-200 text-green-700 rounded-full flex items-center justify-center shrink-0">
               <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-green-600 font-medium">Kuliah</p>
              <p className="text-2xl font-bold text-green-900">{stats.KULIAH || 0}</p>
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-200 text-amber-700 rounded-full flex items-center justify-center shrink-0">
               <Building className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-amber-700 font-medium">Wirausaha</p>
              <p className="text-2xl font-bold text-amber-900">{stats.WIRAUSAHA || 0}</p>
            </div>
          </div>
        </div>
      )}

      {filterStatus === 'ALL' && filterTahun === 'ALL' && alumniList.length > 0 && (
        <div className="grid md:grid-cols-2 gap-6">
           <Card>
             <CardHeader className="pb-2">
               <CardTitle className="text-lg">Persentase Status</CardTitle>
             </CardHeader>
             <CardContent className="h-64 flex items-center justify-center">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{borderRadius:'8px', border:'none', boxShadow:'0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-2 ml-4">
                  {pieData.map(d => (
                    <div key={d.name} className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-full" style={{backgroundColor: d.color}}></div>
                      <span className="text-slate-600 font-medium">{d.name}</span>
                    </div>
                  ))}
                </div>
             </CardContent>
           </Card>
           <Card>
             <CardHeader className="pb-2">
               <CardTitle className="text-lg">Lulusan Terdata per Tahun</CardTitle>
             </CardHeader>
             <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="tahun" tick={{fontSize: 12}} />
                      <YAxis tick={{fontSize: 12}} />
                      <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius:'8px', border:'none'}} />
                      <Bar dataKey="jumlah" fill="#64748b" radius={[4, 4, 0, 0]} />
                   </BarChart>
                </ResponsiveContainer>
             </CardContent>
           </Card>
        </div>
      )}

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle>Data Lulusan</CardTitle>
            <div className="flex gap-2 w-full md:w-auto">
              <Select value={filterTahun} onChange={e => setFilterTahun(e.target.value)}>
                <option value="ALL">Semua Tahun</option>
                {existingYears.map(y => (
                  <option key={y} value={y}>Lulusan {y}</option>
                ))}
              </Select>
              <Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="ALL">Semua Status</option>
                <option value="BEKERJA">Bekerja</option>
                <option value="KULIAH">Kuliah</option>
                <option value="WIRAUSAHA">Wirausaha</option>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center text-slate-500">Memuat data alumni...</div>
          ) : alumniList.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-200 rounded-xl">
              <p className="text-lg font-medium text-slate-700">Belum ada data</p>
              <p className="text-sm text-center">Data alumni pada filter ini kosong.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Nama Alumni</th>
                    <th className="px-4 py-3 font-semibold text-center">Lulus</th>
                    <th className="px-4 py-3 font-semibold">Status & Tempat</th>
                    <th className="px-4 py-3 font-semibold">Jurusan/Bagian</th>
                    <th className="px-4 py-3 font-semibold text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {alumniList.map((al) => (
                    <tr key={al.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4">
                        <p className="font-semibold text-slate-900">{al.nama}</p>
                        <p className="text-xs text-slate-500 mt-0.5">NIS: {al.nis || '-'}</p>
                        {al.kontak && <p className="text-xs text-blue-600 mt-1">{al.kontak}</p>}
                      </td>
                      <td className="px-4 py-4 text-center font-bold text-slate-700">{al.tahunLulus}</td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-1.5 items-start">
                          <Badge variant={al.status === 'BEKERJA' ? 'default' : al.status === 'KULIAH' ? 'success' : 'warning'} className={`
                            ${al.status === 'BEKERJA' ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' : ''}
                          `}>
                            {al.status}
                          </Badge>
                          <span className="text-slate-600 font-medium">{al.instansi || '-'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {al.jurusan || '-'}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleOpenModal(al)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 px-2" title="Edit">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(al.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 px-2" title="Hapus">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal / Form Edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm shadow-2xl">
          <Card className="w-full max-w-md border-0 shadow-xl my-auto flex flex-col max-h-[90vh]">
            <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4 shrink-0">
              <div className="flex justify-between items-center">
                <CardTitle>{editingId ? 'Edit Data Alumni' : 'Tambah Data Alumni'}</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>Batal</Button>
              </div>
            </CardHeader>
            <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
              <CardContent className="pt-6 space-y-4 overflow-y-auto scroller">
                
                <div className="space-y-2">
                  <Label htmlFor="nama">Nama Lengkap <span className="text-red-500">*</span></Label>
                  <Input id="nama" required value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})} placeholder="Nama Alumni" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nis">NIS (Opsional)</Label>
                    <Input id="nis" value={formData.nis} onChange={e => setFormData({...formData, nis: e.target.value})} placeholder="NIS" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tahunLulus">Tahun Lulus <span className="text-red-500">*</span></Label>
                    <Input id="tahunLulus" type="number" required value={formData.tahunLulus} onChange={e => setFormData({...formData, tahunLulus: parseInt(e.target.value) || new Date().getFullYear()})} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="statusAlumni">Status Saat Ini <span className="text-red-500">*</span></Label>
                  <Select id="statusAlumni" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                    <option value="BEKERJA">Bekerja</option>
                    <option value="KULIAH">Melanjutkan Kuliah</option>
                    <option value="WIRAUSAHA">Wirausaha</option>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instansi">Nama Instansi / Kampus / Usaha</Label>
                  <Input id="instansi" value={formData.instansi} onChange={e => setFormData({...formData, instansi: e.target.value})} placeholder="Contoh: PT Bangun Bangsa / UGM" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jurusan">Jurusan / Posisi Pekerjaan</Label>
                  <Input id="jurusan" value={formData.jurusan} onChange={e => setFormData({...formData, jurusan: e.target.value})} placeholder="Contoh: Teknik Informatika / Software Engineer" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="kontak">Kontak Email / LinkedIn / No. HP</Label>
                  <Input id="kontak" value={formData.kontak} onChange={e => setFormData({...formData, kontak: e.target.value})} placeholder="Informasi kontak" />
                </div>

              </CardContent>
              <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end gap-3 shrink-0">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)} disabled={isSubmitting}>Batal</Button>
                <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
