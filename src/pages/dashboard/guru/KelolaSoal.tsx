import { toast } from 'sonner';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input, Label } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import { ArrowLeft, Plus, Save, Trash2, Edit, AlertTriangle, CheckCircle2 } from 'lucide-react';
import api from '../../../lib/api';

interface OpsiInput {
  teks: string;
  imageUrl?: string;
  benar: boolean;
}

interface SoalForm {
  teks: string;
  imageUrl: string;
  tipe: 'PILIHAN_GANDA' | 'PG_KOMPLEKS' | 'BENAR_SALAH';
  poin: number;
  opsi: OpsiInput[];
}

export default function KelolaSoal() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [ujian, setUjian] = useState<any>(null);
  const [soalList, setSoalList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<SoalForm>({
    teks: '',
    imageUrl: '',
    tipe: 'PILIHAN_GANDA',
    poin: 1,
    opsi: [
      { teks: '', benar: false },
      { teks: '', benar: false },
      { teks: '', benar: false },
      { teks: '', benar: false },
    ]
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/api/guru/ujian/${id}`);
      setUjian(res);
      setSoalList(res.soal || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memuat ujian');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleAddNew = () => {
    setEditingId(null);
    setFormData({
      teks: '',
      imageUrl: '',
      tipe: 'PILIHAN_GANDA',
      poin: 1,
      opsi: [
        { teks: '', benar: false },
        { teks: '', benar: false },
        { teks: '', benar: false },
        { teks: '', benar: false },
      ]
    });
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEdit = (soal: any) => {
    setEditingId(soal.id);
    setFormData({
      teks: soal.teks,
      imageUrl: soal.imageUrl || '',
      tipe: soal.tipe,
      poin: soal.poin,
      opsi: soal.opsi.map((o: any) => ({ teks: o.teks, imageUrl: o.imageUrl || '', benar: o.benar }))
    });
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (soalId: string) => {
    if (!confirm('Hapus soal ini?')) return;
    try {
      await api.delete(`/api/guru/soal/${soalId}`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus soal');
    }
  };

  const handleTypeChange = (newTipe: SoalForm['tipe']) => {
    setFormData(prev => {
      let newOpsi = [...prev.opsi];
      if (newTipe === 'BENAR_SALAH') {
        newOpsi = [
          { teks: 'Benar', benar: true },
          { teks: 'Salah', benar: false }
        ];
      } else if (prev.tipe === 'BENAR_SALAH') {
        newOpsi = [
          { teks: '', benar: false },
          { teks: '', benar: false },
          { teks: '', benar: false },
          { teks: '', benar: false },
        ];
      } else if (newTipe === 'PILIHAN_GANDA') {
        // Hanya 1 yang bisa benar kalau pindah ke PG
        let foundTrue = false;
        newOpsi = newOpsi.map(o => {
          if (o.benar && !foundTrue) {
            foundTrue = true;
            return { ...o, benar: true };
          }
          return { ...o, benar: false };
        });
      }
      return { ...prev, tipe: newTipe, opsi: newOpsi };
    });
  };

  const handleOpsiTeksChange = (index: number, text: string) => {
    setFormData(prev => {
      const newOpsi = [...prev.opsi];
      newOpsi[index].teks = text;
      return { ...prev, opsi: newOpsi };
    });
  };

  const handleOpsiBenarChange = (index: number, checked: boolean) => {
    setFormData(prev => {
      const newOpsi = [...prev.opsi];
      if (prev.tipe === 'PILIHAN_GANDA' || prev.tipe === 'BENAR_SALAH') {
        newOpsi.forEach((o, i) => o.benar = (i === index));
      } else {
        newOpsi[index].benar = checked;
      }
      return { ...prev, opsi: newOpsi };
    });
  };

  const addOpsi = () => {
    if (formData.opsi.length >= 6) return;
    setFormData(prev => ({ ...prev, opsi: [...prev.opsi, { teks: '', benar: false }] }));
  };

  const removeOpsi = (index: number) => {
    if (formData.opsi.length <= 2) return;
    setFormData(prev => ({ ...prev, opsi: prev.opsi.filter((_, i) => i !== index) }));
  };

  const handleSaveSoal = async () => {
    if (!formData.teks.trim()) {
      toast("Teks soal tidak boleh kosong");
      return;
    }
    if (formData.opsi.length < 2) {
      toast("Minimal harus ada 2 opsi jawaban");
      return;
    }
    const hasCorrect = formData.opsi.some(o => o.benar);
    if (!hasCorrect) {
      toast("Harus ada minimal satu jawaban yang benar");
      return;
    }

    try {
      if (editingId) {
        await api.patch(`/api/guru/soal/${editingId}`, formData);
      } else {
        await api.post(`/api/guru/ujian/${id}/soal`, formData);
      }
      setIsEditing(false);
      setEditingId(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan soal');
    }
  };

  if (isLoading && !ujian) {
    return <div className="p-8 text-center text-slate-500">Memuat...</div>;
  }

  if (errorMsg) {
    return <div className="p-8 text-red-500">{errorMsg}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/guru/ujian')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <div className="text-sm text-slate-500 font-medium breadcrumbs">
            <span className="hover:text-slate-900 cursor-pointer" onClick={() => navigate('/dashboard/guru/ujian')}>Ujian</span>
            <span className="mx-1.5">/</span>
            <span className="text-slate-900">{ujian?.judul || 'Loading...'}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1 truncate max-w-lg">
            Bank Soal
          </h1>
        </div>
      </div>

      {isEditing ? (
        <Card className="border-blue-200 shadow-md shadow-blue-500/5">
          <CardHeader className="bg-blue-50/50 border-b border-blue-100 pb-4">
            <CardTitle>{editingId ? 'Edit Soal' : 'Soal Baru'}</CardTitle>
            <CardDescription>Pilih tipe soal dan lengkapi pertanyaan serta opsi jawaban.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-2">
              <Label>Tipe Pertanyaan</Label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'PILIHAN_GANDA', label: 'Pilihan Ganda' },
                  { value: 'PG_KOMPLEKS', label: 'PG Kompleks (Multi Jawaban)' },
                  { value: 'BENAR_SALAH', label: 'Benar / Salah' },
                ].map((t) => (
                  <Button
                    key={t.value}
                    type="button"
                    variant={formData.tipe === t.value ? 'default' : 'outline'}
                    onClick={() => handleTypeChange(t.value as any)}
                    className={formData.tipe === t.value ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-white'}
                  >
                    {t.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="teks">Pertanyaan</Label>
              <textarea
                id="teks"
                value={formData.teks}
                onChange={e => setFormData({ ...formData, teks: e.target.value })}
                className="w-full min-h-[120px] p-3 rounded-md border border-gray-200 bg-transparent text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600 resize-y"
                placeholder="Tuliskan pertanyaan di sini..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="imageUrl">URL Gambar (Opsional)</Label>
                <Input
                  id="imageUrl"
                  value={formData.imageUrl}
                  onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="poin">Bobot Poin</Label>
                <Input
                  id="poin"
                  type="number"
                  min="1"
                  value={formData.poin}
                  onChange={e => setFormData({ ...formData, poin: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <Label>Opsi Jawaban</Label>
                {formData.tipe !== 'BENAR_SALAH' && formData.opsi.length < 6 && (
                  <Button type="button" variant="ghost" size="sm" onClick={addOpsi} className="text-blue-600 h-8">
                    + Tambah Opsi
                  </Button>
                )}
              </div>
              
              <div className="space-y-3">
                {formData.opsi.map((opsi, idx) => {
                  const id = `opsi-${idx}`;
                  const isBenarSalah = formData.tipe === 'BENAR_SALAH';
                  
                  return (
                    <div key={idx} className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${opsi.benar ? 'border-green-300 bg-green-50' : 'border-slate-200 bg-white'}`}>
                      <div className="flex bg-white items-center h-10 w-10 shrink-0 justify-center">
                        {formData.tipe === 'PG_KOMPLEKS' ? (
                          <input
                            type="checkbox"
                            className="w-5 h-5 text-green-600 rounded border-gray-300 focus:ring-green-600"
                            checked={opsi.benar}
                            onChange={(e) => handleOpsiBenarChange(idx, e.target.checked)}
                          />
                        ) : (
                          <input
                            type="radio"
                            name="radio-opsi"
                            className="w-5 h-5 text-green-600 border-gray-300 focus:ring-green-600"
                            checked={opsi.benar}
                            onChange={(e) => handleOpsiBenarChange(idx, e.target.checked)}
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <Input
                          value={opsi.teks}
                          onChange={(e) => handleOpsiTeksChange(idx, e.target.value)}
                          placeholder={`Opsi ${idx + 1}`}
                          disabled={isBenarSalah}
                          className={`bg-white ${opsi.benar ? 'font-medium' : ''}`}
                        />
                      </div>
                      {!isBenarSalah && formData.opsi.length > 2 && (
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeOpsi(idx)} className="text-slate-400 hover:text-red-500 shrink-0">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Pilih Checkbox/Radio di sebelah kiri untuk menentukan opsi mana yang merupakan jawaban benar.
              </p>
            </div>
          </CardContent>
          <CardFooter className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end gap-3 rounded-b-xl">
             <Button variant="outline" onClick={() => setIsEditing(false)}>Batal</Button>
             <Button onClick={handleSaveSoal} className="gap-2">
               <Save className="w-4 h-4" /> Simpan Soal
             </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle>Daftar Soal</CardTitle>
              <CardDescription>Total {soalList.length} soal pada ujian ini.</CardDescription>
            </div>
            <Button onClick={handleAddNew} className="gap-2 shrink-0">
              <Plus className="w-4 h-4" /> Tambah Soal
            </Button>
          </CardHeader>
          <CardContent>
            {soalList.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-100 rounded-xl">
                <p className="text-lg font-medium text-slate-700">Belum ada soal</p>
                <p className="text-sm">Klik "Tambah Soal" untuk mulai membuat bank soal.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {soalList.map((soal) => (
                  <div key={soal.id} className="p-5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors shadow-sm">
                    <div className="flex justify-between items-start gap-4 mb-4">
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold shrink-0">
                          {soal.nomor}
                        </div>
                        <div>
                          <div className="flex flex-wrap gap-2 mb-2">
                            <Badge variant="secondary" className="text-[10px]">{soal.tipe.replace('_', ' ')}</Badge>
                            <Badge variant="outline" className="text-[10px]">{soal.poin} Poin</Badge>
                          </div>
                          <p className="text-slate-900 font-medium leading-relaxed whitespace-pre-wrap">{soal.teks}</p>
                          {soal.imageUrl && (
                            <img src={soal.imageUrl} alt="Lampiran soal" className="mt-3 max-h-48 rounded border border-slate-200" />
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(soal)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(soal.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="pl-11 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {soal.opsi.map((opsi: any, i: number) => (
                        <div key={opsi.id} className={`flex items-start gap-2 p-2 rounded-lg text-sm border ${opsi.benar ? 'bg-green-50/50 border-green-200 text-green-800' : 'bg-slate-50 border-transparent text-slate-600'}`}>
                          <div className="mt-0.5 shrink-0">
                            {opsi.benar ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <div className="w-4 h-4 rounded-full border border-slate-300" />}
                          </div>
                          <span>{opsi.teks}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
