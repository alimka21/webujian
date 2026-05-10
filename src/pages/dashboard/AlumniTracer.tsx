import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Plus, Search, MapPin, Building2, GraduationCap } from "lucide-react";
import { useAuthStore } from "../../store/authStore";

const dummyAlumni = [
  { id: '1', name: 'Andi Saputra', tahunLulus: '2022', jurusan: 'MIPA', status: 'Kuliah', instansi: 'Universitas Indonesia', kontak: '08123456789' },
  { id: '2', name: 'Bunga Lestari', tahunLulus: '2021', jurusan: 'IPS', status: 'Bekerja', instansi: 'Bank BCA', kontak: '08123456444' },
];

export default function AlumniTracer() {
  const { user } = useAuthStore();
  const [alumni, setAlumni] = useState(dummyAlumni);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "", tahunLulus: "", jurusan: "", status: "Kuliah", instansi: "", kontak: ""
  });

  const filtered = alumni.filter(a => a.name.toLowerCase().includes(search.toLowerCase()) || a.tahunLulus.includes(search));

  const handleAddAlumni = (e: React.FormEvent) => {
    e.preventDefault();
    const newAlumni = {
      id: Date.now().toString(),
      ...formData
    };
    setAlumni([newAlumni, ...alumni]);
    setIsModalOpen(false);
    setFormData({ name: "", tahunLulus: "", jurusan: "", status: "Kuliah", instansi: "", kontak: "" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Tracer Alumni</h1>
          <p className="text-gray-500">Kelola dan pantau sebaran lulusan</p>
        </div>
        {user?.role === 'SUPER_ADMIN' && (
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Data Alumni
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Lulusan Terdata</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{alumni.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Melanjutkan Kuliah</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {Math.round((alumni.filter(a => a.status === 'Kuliah').length / (alumni.length || 1)) * 100)}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Bekerja/Wirausaha</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {Math.round((alumni.filter(a => a.status === 'Bekerja' || a.status === 'Wirausaha').length / (alumni.length || 1)) * 100)}%
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Data Lulusan</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input 
              placeholder="Cari nama atau tahun..." 
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3">Nama & Kontak</th>
                  <th className="px-6 py-3">Lulusan</th>
                  <th className="px-6 py-3">Status Saat Ini</th>
                  {user?.role === 'SUPER_ADMIN' && <th className="px-6 py-3 text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{a.name}</div>
                      <div className="text-gray-500">{a.kontak}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 font-medium">
                        <GraduationCap className="h-4 w-4 text-gray-400" />
                        {a.tahunLulus}
                      </div>
                      <div className="text-gray-500">{a.jurusan}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 font-medium">
                        {a.status === 'Kuliah' ? <Building2 className="h-4 w-4 text-blue-500" /> : <MapPin className="h-4 w-4 text-green-500" />}
                        {a.status}
                      </div>
                      <div className="text-gray-500">{a.instansi}</div>
                    </td>
                    {user?.role === 'SUPER_ADMIN' && (
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="sm" className="text-blue-600" onClick={() => alert('Mode edit akan segera hadir.')}>Edit</Button>
                      </td>
                    )}
                  </tr>
                ))}
                {filtered.length === 0 && (
                   <tr>
                     <td colSpan={4} className="px-6 py-12 text-center text-gray-500">Data alumni tidak ditemukan.</td>
                   </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Basic Modal for Admin */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <Card className="w-full max-w-md shadow-xl">
            <CardHeader>
              <CardTitle>Tambah Data Alumni</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddAlumni} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Nama Lengkap</label>
                  <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Tahun Lulus</label>
                    <Input required placeholder="2023" value={formData.tahunLulus} onChange={e => setFormData({...formData, tahunLulus: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Jurusan</label>
                    <Input required placeholder="IPA/IPS" value={formData.jurusan} onChange={e => setFormData({...formData, jurusan: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="text-sm font-medium text-gray-700">Status</label>
                     <select 
                        required 
                        className="flex h-9 w-full rounded-md border border-gray-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
                        value={formData.status}
                        onChange={e => setFormData({...formData, status: e.target.value})}
                      >
                       <option value="Kuliah">Kuliah</option>
                       <option value="Bekerja">Bekerja</option>
                       <option value="Wirausaha">Wirausaha</option>
                     </select>
                   </div>
                   <div>
                    <label className="text-sm font-medium text-gray-700">No. Kontak</label>
                    <Input required value={formData.kontak} onChange={e => setFormData({...formData, kontak: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Instansi / Kampus</label>
                  <Input required value={formData.instansi} onChange={e => setFormData({...formData, instansi: e.target.value})} />
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
                  <Button type="submit">Simpan</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
