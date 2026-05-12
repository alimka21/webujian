import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore, Role } from '../store/authStore';
import { Button } from '../components/ui/button';
import { Input, Label } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Eye, EyeOff, AlertTriangle, GraduationCap, Shield, Users } from 'lucide-react';

export default function LoginPage() {
  const [role, setRole] = useState<Role>('SISWA');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useAuthStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!identifier.trim() || !password.trim()) {
      setErrorMsg('Semua field wajib diisi');
      return;
    }

    if ((role === 'GURU' || role === 'SUPER_ADMIN') && !identifier.includes('@')) {
      setErrorMsg('Format email tidak valid');
      return;
    }

    try {
      await login(identifier, password, role);
      
      const from = location.state?.from?.pathname;
      if (from) {
        navigate(from, { replace: true });
      } else {
        const defaultDash: Record<Role, string> = {
          SUPER_ADMIN: "/dashboard/admin",
          GURU: "/dashboard/guru",
          SISWA: "/dashboard/siswa"
        };
        navigate(defaultDash[role], { replace: true });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Login gagal, periksa kredensial Anda');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="mx-auto bg-blue-600 w-16 h-16 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-blue-200">
          <GraduationCap className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Sistem Sekolah Gen Z</h1>
        <p className="text-slate-500 mt-2 max-w-sm">Login untuk mengakses ujian, presensi, dan manajemen kelas Anda.</p>
      </div>

      <Card className="w-full max-w-4xl overflow-hidden shadow-xl shadow-slate-200/50 border-0">
        <div className="grid md:grid-cols-5">
          {/* Kolom Kiri: Pilih Role */}
          <div className="bg-slate-100 p-8 md:col-span-2 border-r border-slate-200">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-6">Pilih Peran Anda</h2>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setRole('SISWA')}
                className={`w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all ${
                  role === 'SISWA' ? 'bg-white border-blue-500 ring-1 ring-blue-500 shadow-sm' : 'bg-transparent border-transparent hover:bg-slate-200'
                } border`}
              >
                <div className={`p-2 rounded-lg ${role === 'SISWA' ? 'bg-blue-50 text-blue-600' : 'bg-slate-200 text-slate-500'}`}>
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <div className={`font-semibold ${role === 'SISWA' ? 'text-blue-900' : 'text-slate-700'}`}>Siswa</div>
                  <div className="text-xs text-slate-500">Login dengan NIS</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRole('GURU')}
                className={`w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all ${
                  role === 'GURU' ? 'bg-white border-blue-500 ring-1 ring-blue-500 shadow-sm' : 'bg-transparent border-transparent hover:bg-slate-200'
                } border`}
              >
                <div className={`p-2 rounded-lg ${role === 'GURU' ? 'bg-blue-50 text-blue-600' : 'bg-slate-200 text-slate-500'}`}>
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className={`font-semibold ${role === 'GURU' ? 'text-blue-900' : 'text-slate-700'}`}>Guru</div>
                  <div className="text-xs text-slate-500">Login dengan Email</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRole('SUPER_ADMIN')}
                className={`w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all ${
                  role === 'SUPER_ADMIN' ? 'bg-white border-blue-500 ring-1 ring-blue-500 shadow-sm' : 'bg-transparent border-transparent hover:bg-slate-200'
                } border`}
              >
                <div className={`p-2 rounded-lg ${role === 'SUPER_ADMIN' ? 'bg-blue-50 text-blue-600' : 'bg-slate-200 text-slate-500'}`}>
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <div className={`font-semibold ${role === 'SUPER_ADMIN' ? 'text-blue-900' : 'text-slate-700'}`}>Admin</div>
                  <div className="text-xs text-slate-500">Akses Manajemen</div>
                </div>
              </button>
            </div>
          </div>

          {/* Kolom Kanan: Form */}
          <div className="p-8 md:p-12 md:col-span-3 flex flex-col justify-center bg-white">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Selamat Datang Kembali</h2>
            <p className="text-slate-500 mb-8">
              Silakan masukkan {role === 'SISWA' ? 'NIS' : 'Email'} dan kata sandi Anda.
            </p>

            {errorMsg && (
              <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-lg flex items-start gap-3 border border-red-100">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <span className="text-sm font-medium">{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="identifier">{role === 'SISWA' ? 'Nomor Induk Siswa (NIS)' : 'Alamat Email'}</Label>
                <Input
                  id="identifier"
                  type={role === 'SISWA' ? 'text' : 'email'}
                  placeholder={role === 'SISWA' ? 'Contoh: 20250001' : 'Contoh: email@sekolah.sch.id'}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  disabled={isLoading}
                   className="h-11"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password">Kata Sandi</Label>
                  <button
                    type="button"
                    onClick={() => toast.info('Silakan hubungi administrator sekolah untuk reset password')}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Lupa sandi?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Masukkan sandi..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="pr-10 h-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button type="submit" disabled={isLoading} className="w-full h-11 text-base mt-2">
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Memproses...</span>
                  </div>
                ) : (
                  'Masuk ke Sistem'
                )}
              </Button>
              
              <div className="mt-8 text-center text-sm text-slate-500">
                Data demo (Siswa): <strong className="text-slate-700">20250001</strong> / <strong className="text-slate-700">siswa123</strong><br/>
                Guru: <strong className="text-slate-700">budi@sekolah.sch.id</strong> / <strong className="text-slate-700">guru123</strong><br/>
                Admin: <strong className="text-slate-700">admin@sekolah.sch.id</strong> / <strong className="text-slate-700">admin123</strong>
              </div>
            </form>
          </div>
        </div>
      </Card>
    </div>
  );
}
