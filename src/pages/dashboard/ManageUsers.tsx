import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, Filter } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';
import api from '../../lib/api';

interface User {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  admin?: { nama: string };
  guru?: { nama: string; nip: string };
  siswa?: { nama: string; nis: string };
}

export default function ManageUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<string>('ALL');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/api/admin/users');
      setUsers(res);
    } catch (error: any) {
      toast.error(error.message || 'Gagal memuat pengguna');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus pengguna ini?')) return;
    try {
      await api.delete(`/api/admin/users/${id}`);
      toast.success('Pengguna berhasil dihapus');
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Gagal menghapus pengguna');
    }
  };

  const getNama = (u: User) => {
    if (u.role === 'SUPER_ADMIN') return u.admin?.nama || '-';
    if (u.role === 'GURU') return u.guru?.nama || '-';
    if (u.role === 'SISWA') return u.siswa?.nama || '-';
    return '-';
  };

  const getIdentitas = (u: User) => {
    if (u.role === 'GURU') return u.guru?.nip || '-';
    if (u.role === 'SISWA') return u.siswa?.nis || '-';
    return '-';
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = getNama(u).toLowerCase().includes(search.toLowerCase()) || 
                          u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = filterRole === 'ALL' || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manajemen Pengguna</h1>
          <p className="text-slate-500">Kelola akses admin, guru, dan siswa</p>
        </div>
        <Button className="gap-2" onClick={() => toast('Fitur tambah pengguna kompleks sedang dalam pengembangan')}>
          <Plus className="w-4 h-4" />
          Tambah Pengguna
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Cari nama atau email..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border rounded-md"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="ALL">Semua Peran</option>
                <option value="SUPER_ADMIN">Admin</option>
                <option value="GURU">Guru</option>
                <option value="SISWA">Siswa</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-slate-500">Memuat data...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-8 text-center text-slate-500">Tidak ada pengguna ditemukan.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="p-3 text-sm font-semibold text-slate-600">Nama</th>
                    <th className="p-3 text-sm font-semibold text-slate-600">Email</th>
                    <th className="p-3 text-sm font-semibold text-slate-600">Peran</th>
                    <th className="p-3 text-sm font-semibold text-slate-600">NIP/NIS</th>
                    <th className="p-3 text-sm font-semibold text-slate-600">Status</th>
                    <th className="p-3 text-sm font-semibold text-slate-600 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm">
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="p-3 font-medium text-slate-800">{getNama(u)}</td>
                      <td className="p-3 text-slate-600">{u.email}</td>
                      <td className="p-3">
                        <Badge variant={u.role === 'SUPER_ADMIN' ? 'default' : u.role === 'GURU' ? 'secondary' : 'outline'}>
                          {u.role}
                        </Badge>
                      </td>
                      <td className="p-3 text-slate-600">{getIdentitas(u)}</td>
                      <td className="p-3">
                        {u.isActive ? (
                          <span className="text-green-600 font-medium">Aktif</span>
                        ) : (
                          <span className="text-red-500 font-medium">Nonaktif</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <Button variant="ghost" size="sm" onClick={() => toast('Fitur edit sedang dikembangkan')}>
                          <Pencil className="w-4 h-4 text-slate-500" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(u.id)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
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
