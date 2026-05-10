import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Check, X, Clock as ClockIcon, Calendar as CalendarIcon, UserX } from "lucide-react";
import { useAuthStore } from "../../store/authStore";

const dummyStudents = [
  { id: '1', name: 'Siti Siswa', nis: '1001', status: 'HADIR' },
  { id: '2', name: 'Budi Santoso', nis: '1002', status: null },
  { id: '3', name: 'Citra Kirana', nis: '1003', status: null },
];

export default function Attendance() {
  const { user } = useAuthStore();
  const [students, setStudents] = useState(dummyStudents);
  const date = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const markAttendance = (id: string, status: string) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, status } : s));
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'HADIR': return 'bg-green-100 text-green-800 border-green-200';
      case 'SAKIT': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'IZIN': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ALPHA': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Kehadiran Siswa</h1>
          <p className="text-gray-500">Kelas 10A • {date}</p>
        </div>
        <Button variant="outline" className="gap-2">
          <CalendarIcon className="w-4 h-4" />
          Lihat Riwayat
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div><p className="text-sm text-gray-500">Hadir</p><p className="text-2xl font-bold text-green-600">{students.filter(s => s.status === 'HADIR').length}</p></div>
          <Check className="w-8 h-8 text-green-200" />
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div><p className="text-sm text-gray-500">Izin</p><p className="text-2xl font-bold text-yellow-600">{students.filter(s => s.status === 'IZIN').length}</p></div>
          <ClockIcon className="w-8 h-8 text-yellow-200" />
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div><p className="text-sm text-gray-500">Sakit</p><p className="text-2xl font-bold text-blue-600">{students.filter(s => s.status === 'SAKIT').length}</p></div>
          <Plus className="w-8 h-8 text-blue-200" />
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div><p className="text-sm text-gray-500">Alpha</p><p className="text-2xl font-bold text-red-600">{students.filter(s => s.status === 'ALPHA').length}</p></div>
          <X className="w-8 h-8 text-red-200" />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 font-medium text-gray-500">NIS</th>
                <th className="px-6 py-4 font-medium text-gray-500">Nama Siswa</th>
                <th className="px-6 py-4 font-medium text-gray-500">Status Saat Ini</th>
                <th className="px-6 py-4 font-medium text-gray-500 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-500">{student.nis}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{student.name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(student.status)}`}>
                      {student.status || 'BELUM DIISI'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200" onClick={() => markAttendance(student.id, 'HADIR')}>
                        Hadir
                      </Button>
                      <Button size="sm" variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200" onClick={() => markAttendance(student.id, 'SAKIT')}>
                        Sakit
                      </Button>
                      <Button size="sm" variant="outline" className="bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-yellow-200" onClick={() => markAttendance(student.id, 'IZIN')}>
                        Izin
                      </Button>
                      <Button size="sm" variant="outline" className="bg-red-50 text-red-700 hover:bg-red-100 border-red-200" onClick={() => markAttendance(student.id, 'ALPHA')}>
                        Alpha
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

const Plus = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 5v14"/><path d="M5 12h14"/></svg>
)
