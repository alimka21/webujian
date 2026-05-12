import { toast } from 'sonner';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input, Label } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import { ArrowLeft, Plus, Save, Trash2, Edit, CheckCircle2, Copy, XCircle, RefreshCw, FileText } from 'lucide-react';
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

const DEFAULT_OPSI: OpsiInput[] = [
  { teks: '', benar: false },
  { teks: '', benar: false },
  { teks: '', benar: false },
  { teks: '', benar: false },
];

export default function KelolaSoal() {
  const { id: ujianId } = useParams();
  const navigate = useNavigate();

  const [ujian, setUjian] = useState<any>(null);
  const [soalList, setSoalList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Form state
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<SoalForm>({
    teks: '',
    imageUrl: '',
    tipe: 'PILIHAN_GANDA',
    poin: 1,
    opsi: DEFAULT_OPSI.map(o => ({ ...o }))
  });

  // Action states
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setErrorMsg('');
      const res = await api.get(`/api/guru/ujian/${ujianId}`);
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
  }, [ujianId]);

  const handleAddNew = () => {
    setEditingId(null);
    setFormData({
      teks: '',
      imageUrl: '',
      tipe: 'PILIHAN_GANDA',
      poin: 1,
      opsi: DEFAULT_OPSI.map(o => ({ ...o }))
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

  const handleDelete = (soalId: string) => {
    setDeleteConfirmId(soalId);
  };

  const handleConfirmDelete = async (soalId: string) => {
    try {
      setIsDeletingId(soalId);
      await api.delete(`/api/guru/soal/${soalId}`);
      toast.success('Soal berhasil dihapus');
      setDeleteConfirmId(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus soal');
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleDuplikat = async (soal: any) => {
    try {
      setDuplicatingId(soal.id);
      await api.post(`/api/guru/ujian/${ujianId}/soal`, {
        teks: soal.teks,
        imageUrl: soal.imageUrl,
        tipe: soal.tipe,
        poin: soal.poin,
        opsi: soal.opsi.map((o: any) => ({ teks: o.teks, imageUrl: o.imageUrl || '', benar: o.benar }))
      });
      toast.success('Soal berhasil diduplikat');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menduplikat soal');
    } finally {
      setDuplicatingId(null);
    }
  };

  const handleTypeChange = (newTipe: SoalForm['tipe']) => {
    setFormData(prev => {
      let newOpsi = [...prev.opsi];
      if (newTipe === 'BENAR_SALAH') {
        newOpsi = [{ teks: 'Benar', benar: true }, { teks: 'Salah', benar: false }];
      } else if (prev.tipe === 'BENAR_SALAH') {
        newOpsi = DEFAULT_OPSI.map(o => ({ ...o }));
      } else if (newTipe === 'PILIHAN_GANDA') {
        let found = false;
        newOpsi = newOpsi.map(o => {
          if (o.benar && !found) { found = true; return { ...o, benar: true }; }
          return { ...o, benar: false };
        });
      }
      return { ...prev, tipe: newTipe, opsi: newOpsi };
    });
  };

  const handleOpsiTeksChange = (index: number, text: string) => {
    setFormData(prev => {
      const newOpsi = [...prev.opsi];
      newOpsi[index] = { ...newOpsi[index], teks: text };
      return { ...prev, opsi: newOpsi };
    });
  };

  const handleOpsiBenarChange = (index: number, checked: boolean) => {
    setFormData(prev => {
      const newOpsi = [...prev.opsi];
      if (prev.tipe === 'PILIHAN_GANDA' || prev.tipe === 'BENAR_SALAH') {
        return { ...prev, opsi: newOpsi.map((o, i) => ({ ...o, benar: i === index })) };
      }
      newOpsi[index] = { ...newOpsi[index], benar: checked };
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
      toast.error('Teks soal tidak boleh kosong');
      return;
    }
    if (formData.tipe !== 'BENAR_SALAH' && formData.opsi.some(o => !o.teks.trim())) {
      toast.error('Semua opsi jawaban harus diisi');
      return;
    }
    if (formData.opsi.length < 2) {
      toast.error('Minimal harus ada 2 opsi jawaban');
      return;
    }
    if (!formData.opsi.some(o => o.benar)) {
      toast.error('Harus ada minimal satu jawaban yang benar');
      return;
    }

    try {
      setIsSaving(true);
      if (editingId) {
        await api.patch(`/api/guru/soal/${editingId}`, formData);
        toast.success('Soal berhasil diperbarui');
      } else {
        await api.post(`/api/guru/ujian/${ujianId}/soal`, formData);
        toast.success('Soal berhasil ditambahkan');
      }
      setIsEditing(false);
      setEditingId(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan soal');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && !ujian) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
        <div className="w-8 h-8 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-sm text-slate-500">Memuat data soal...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <XCircle className="w-12 h-12 text-red-500" />
        <div>
          <p className="font-semibold text-slate-700">Terjadi Kesalahan</p>
          <p className="text-sm text-slate-500 mt-1">{errorMsg}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/dashboard/guru/ujian')} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Kembali
          </Button>
          <Button onClick={fetchData} className="gap-2">
            <RefreshCw className="w-4 h-4" /> Coba Lagi
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/guru/ujian')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <div className="text-sm text-slate-500 font-medium">
            <span className="hover:text-slate-900 cursor-pointer" onClick={() => navigate('/dashboard/guru/ujian')}>Ujian</span>
            <span className="mx-1.5">/</span>
            <span className="text-slate-900">{ujian?.judul || 'Loading...'}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">Bank Soal</h1>
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
                    onClick={() => handleTypeChange(t.value as SoalForm['tipe'])}
                    className={formData.tipe === t.value ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-white'}
                  >
                    {t.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="teks">Pertanyaan <span className="text-red-500">*</span></Label>
              <textarea
                id="teks"
                value={formData.teks}
                onChange={e => setFormData({ ...formData, teks: e.target.value })}
                autoFocus
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
                <Label>Opsi Jawaban <span className="text-red-500">*</span></Label>
                {formData.tipe !== 'BENAR_SALAH' && formData.opsi.length < 6 && (
                  <Button type="button" variant="ghost" size="sm" onClick={addOpsi} className="text-blue-600 h-8">
                    + Tambah Opsi
                  </Button>
                )}
              </div>

              <div className="space-y-3">
                {formData.opsi.map((opsi, idx) => {
                  const isBenarSalah = formData.tipe === 'BENAR_SALAH';
                  return (
                    <div key={idx} className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${opsi.benar ? 'border-green-300 bg-green-50' : 'border-slate-200 bg-white'}`}>
                      <div className="flex items-center h-10 w-10 shrink-0 justify-center">
                        {formData.tipe === 'PG_KOMPLEKS' ? (
                          <input
                            type="checkbox"
                            className="w-5 h-5 text-green-600 rounded border-gray-300 focus:ring-green-600"
                            checked={opsi.benar}
                            onChange={e => handleOpsiBenarChange(idx, e.target.checked)}
                          />
                        ) : (
                          <input
                            type="radio"
                            name="radio-opsi"
                            className="w-5 h-5 text-green-600 border-gray-300 focus:ring-green-600"
                            checked={opsi.benar}
                            onChange={e => handleOpsiBenarChange(idx, e.target.checked)}
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <Input
                          value={opsi.teks}
                          onChange={e => handleOpsiTeksChange(idx, e.target.value)}
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
                {formData.tipe === 'PG_KOMPLEKS'
                  ? 'Centang semua opsi yang merupakan jawaban benar.'
                  : 'Pilih radio/centang di kiri untuk menentukan jawaban benar.'}
              </p>
            </div>
          </CardContent>
          <CardFooter className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end gap-3 rounded-b-xl">
            <Button variant="outline" onClick={() => { setIsEditing(false); setEditingId(null); }} disabled={isSaving}>
              Batal
            </Button>
            <Button onClick={handleSaveSoal} className="gap-2" disabled={isSaving}>
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isSaving ? 'Menyimpan...' : 'Simpan Soal'}
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle>Daftar Soal</CardTitle>
              <CardDescription>
                Total {soalList.length} soal &bull; {soalList.reduce((a, s) => a + s.poin, 0)} poin
              </CardDescription>
            </div>
            <Button onClick={handleAddNew} className="gap-2 shrink-0">
              <Plus className="w-4 h-4" /> Tambah Soal
            </Button>
          </CardHeader>
          <CardContent>
            {soalList.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-100 rounded-xl">
                <FileText className="w-12 h-12 text-slate-300 mb-3" />
                <p className="text-lg font-medium text-slate-700">Belum ada soal</p>
                <p className="text-sm">Klik "Tambah Soal" untuk mulai membuat bank soal.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {soalList.map((soal) => (
                  <div key={soal.id} className="p-5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors shadow-sm">
                    <div className="flex justify-between items-start gap-4 mb-3">
                      <div className="flex gap-3 flex-1 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold shrink-0 text-sm">
                          {soal.nomor}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap gap-2 mb-2">
                            <Badge variant="secondary" className="text-[10px]">{soal.tipe.replace(/_/g, ' ')}</Badge>
                            <Badge variant="outline" className="text-[10px]">{soal.poin} Poin</Badge>
                          </div>
                          <p className="text-slate-900 font-medium leading-relaxed whitespace-pre-wrap">{soal.teks}</p>
                          {soal.imageUrl && (
                            <img src={soal.imageUrl} alt="Lampiran soal" loading="lazy" className="mt-3 max-h-48 rounded border border-slate-200" />
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(soal)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 px-2" title="Edit Soal">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDuplikat(soal)} disabled={duplicatingId === soal.id} className="text-slate-500 hover:text-slate-700 hover:bg-slate-100 h-8 px-2" title="Duplikat Soal">
                          {duplicatingId === soal.id
                            ? <div className="w-4 h-4 border-2 border-slate-400/40 border-t-slate-500 rounded-full animate-spin" />
                            : <Copy className="w-4 h-4" />
                          }
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(soal.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 px-2" title="Hapus Soal">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {deleteConfirmId === soal.id && (
                      <div className="mb-4 flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm">
                        <span className="text-red-700 font-medium flex-1">Yakin hapus soal ini?</span>
                        <Button
                          size="sm"
                          onClick={() => handleConfirmDelete(soal.id)}
                          disabled={isDeletingId === soal.id}
                          className="h-7 bg-red-600 hover:bg-red-700 text-white text-xs px-3"
                        >
                          {isDeletingId === soal.id ? 'Menghapus...' : 'Ya, Hapus'}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setDeleteConfirmId(null)} className="h-7 text-xs px-3">
                          Batal
                        </Button>
                      </div>
                    )}

                    <div className="pl-11 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {soal.opsi.map((opsi: any) => (
                        <div key={opsi.id} className={`flex items-start gap-2 p-2 rounded-lg text-sm border ${opsi.benar ? 'bg-green-50/50 border-green-200 text-green-800' : 'bg-slate-50 border-transparent text-slate-600'}`}>
                          <div className="mt-0.5 shrink-0">
                            {opsi.benar
                              ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                              : <div className="w-4 h-4 rounded-full border border-slate-300" />
                            }
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
