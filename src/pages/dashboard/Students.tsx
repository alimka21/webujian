import { useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Plus, Search, User, UserCheck } from "lucide-react";

export default function Students() {
  const { user } = useAuthStore();
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", kelas: "10A", status: "Aktif" });

  const [students, setStudents] = useState([
    { id: '1', name: 'Siti Siswa', kelas: '10A', status: 'Aktif' },
    { id: '2', name: 'Budi Santoso', kelas: '10A', status: 'Aktif' },
    { id: '3', name: 'Alif Pratama', kelas: '11B', status: 'Aktif' },
  ]);

  const filtered = students.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.kelas.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    setStudents([{ id: Date.now().toString(), ...formData }, ...students]);
    setIsModalOpen(false);
    setFormData({ name: "", kelas: "10A", status: "Aktif" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Siswa & Kelas</h1>
          <p className="text-slate-500">Kelola data siswa dan pembagian kelas</p>
        </div>
        {(user?.role === 'SUPER_ADMIN' || user?.role === 'TEACHER') && (
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Siswa
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Siswa Aktif</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-green-500" />
              <div className="text-3xl font-bold text-slate-800">{students.length}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Jumlah Kelas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">
              {new Set(students.map(s => s.kelas)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Daftar Siswa</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <Input 
              placeholder="Cari nama atau kelas..." 
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3">Nama Siswa</th>
                  <th className="px-6 py-3">Kelas</th>
                  <th className="px-6 py-3">Status</th>
                  {(user?.role === 'SUPER_ADMIN' || user?.role === 'TEACHER') && <th className="px-6 py-3 text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center">
                        <User className="h-4 w-4 text-slate-500"/>
                      </div>
                      {s.name}
                    </td>
                    <td className="px-6 py-4">{s.kelas}</td>
                    <td className="px-6 py-4">
                      <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium">
                        {s.status}
                      </span>
                    </td>
                    {(user?.role === 'SUPER_ADMIN' || user?.role === 'TEACHER') && (
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="sm" className="text-blue-600" onClick={() => alert('Mode edit akan segera hadir.')}>Edit</Button>
                      </td>
                    )}
                  </tr>
                ))}
                {filtered.length === 0 && (
                   <tr>
                     <td colSpan={4} className="px-6 py-12 text-center text-gray-500">Data siswa tidak ditemukan.</td>
                   </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Basic Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <Card className="w-full max-w-sm shadow-xl">
            <CardHeader>
              <CardTitle>Tambah Siswa</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddStudent} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Nama Lengkap</label>
                  <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Kelas</label>
                  <Input required placeholder="10A" value={formData.kelas} onChange={e => setFormData({...formData, kelas: e.target.value})} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <select 
                    required 
                    className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Non-Aktif">Non-Aktif</option>
                    <option value="Lulus">Lulus</option>
                  </select>
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
