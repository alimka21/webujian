import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Clock, Users, Play, Edit, Trash2 } from "lucide-react";

export default function ExamList() {
  const { user, token } = useAuthStore();
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: "", duration: 60, targetClass: "" });

  useEffect(() => {
    fetchExams();
  }, [token]);

  const fetchExams = () => {
    fetch("/api/exams", {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setExams(data);
        setLoading(false);
      })
      .catch(err => console.error(err));
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const newExam = {
      id: Date.now().toString(),
      ...formData,
      status: 'DRAFT',
      teacherId: user?.id
    };
    setExams([newExam, ...exams]);
    setIsModalOpen(false);
    setFormData({ title: "", duration: 60, targetClass: "" });
  };

  const handleDelete = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus ujian ini?')) {
      setExams(exams.filter(e => e.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Ujian Online</h1>
          <p className="text-gray-500">
            {user?.role === 'STUDENT' ? 'Daftar ujian yang harus Anda kerjakan' : 'Kelola ujian online'}
          </p>
        </div>
        {user?.role !== 'STUDENT' && (
          <Button onClick={() => setIsModalOpen(true)}>Buat Ujian Baru</Button>
        )}
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {exams.map(exam => (
            <Card key={exam.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-semibold text-lg">{exam.title}</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    exam.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {exam.status}
                  </span>
                </div>
                <div className="space-y-2 text-sm text-gray-500 mb-6">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Durasi: {exam.duration} menit
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Kelas: {exam.targetClass}
                  </div>
                </div>

                {user?.role === 'STUDENT' ? (
                  <Link to={`/exam/${exam.id}`}>
                    <Button className="w-full">
                      <Play className="w-4 h-4 mr-2" />
                      Mulai Ujian
                    </Button>
                  </Link>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => alert('Mode Edit Ujian segera hadir.')}>
                      <Edit className="w-4 h-4 mr-2" /> Edit
                    </Button>
                    <Button variant="outline" onClick={() => handleDelete(exam.id)} className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
                      <Trash2 className="w-4 h-4 mr-2" /> Hapus
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {exams.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              Belum ada ujian yang tersedia.
            </div>
          )}
        </div>
      )}

      {/* Modal Buat Ujian */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <Card className="w-full max-w-md shadow-xl">
            <CardHeader>
              <CardTitle>Buat Ujian Baru</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Judul Ujian</label>
                  <Input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Contoh: UTS Matematika" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Durasi (Menit)</label>
                    <Input type="number" required value={formData.duration} onChange={e => setFormData({...formData, duration: Number(e.target.value)})} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Kelas Target</label>
                    <Input required placeholder="Contoh: 10A" value={formData.targetClass} onChange={e => setFormData({...formData, targetClass: e.target.value})} />
                  </div>
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                   <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
                   <Button type="submit">Buat Ujian</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
