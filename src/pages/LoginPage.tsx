import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore, Role } from '../store/authStore';
import { Button } from '../components/ui/button';
import { Input, Label } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { Card, CardContent } from '../components/ui/card';
import { Eye, EyeOff, AlertTriangle, GraduationCap } from 'lucide-react';

const SCHOOL_NAME = 'SMA Negeri 1 Demo';

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
          SUPER_ADMIN: '/dashboard/admin',
          GURU: '/dashboard/guru',
          SISWA: '/dashboard/siswa',
        };
        navigate(defaultDash[role], { replace: true });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Login gagal, periksa kredensial Anda');
    }
  };

  const identifierLabel = role === 'SISWA' ? 'Nomor Induk Siswa (NIS)' : 'Alamat Email';
  const identifierPlaceholder = role === 'SISWA' ? 'Contoh: 20250001' : 'Contoh: email@sekolah.sch.id';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="text-center mb-6">
        <div className="mx-auto bg-blue-600 w-14 h-14 rounded-xl flex items-center justify-center mb-3 shadow-lg shadow-blue-200">
          <GraduationCap className="w-8 h-8 text-white" />
        </div>
      </div>

      {/* Form Card */}
      <Card className="w-full max-w-md shadow-xl shadow-slate-200/50 border-0">
        <CardContent className="p-6 sm:p-8">
          <h1 className="text-xl font-bold text-slate-900 mb-1">Selamat Datang</h1>
          <p className="text-sm text-slate-500 mb-6">Pilih peran Anda untuk masuk ke sistem.</p>

          {errorMsg && (
            <div
              role="alert"
              className="mb-5 bg-red-50 text-red-700 p-3 rounded-lg flex items-start gap-2 border border-red-100"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="text-sm font-medium">{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="role">Peran</Label>
              <Select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                disabled={isLoading}
                className="h-11"
              >
                <option value="SISWA">Siswa</option>
                <option value="GURU">Guru</option>
                <option value="SUPER_ADMIN">Admin</option>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="identifier">{identifierLabel}</Label>
              <Input
                id="identifier"
                type={role === 'SISWA' ? 'text' : 'email'}
                placeholder={identifierPlaceholder}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                disabled={isLoading}
                className="h-11"
                autoComplete={role === 'SISWA' ? 'username' : 'email'}
              />
            </div>

            <div className="space-y-1.5">
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
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  disabled={isLoading}
                  aria-label={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
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
          </form>
        </CardContent>
      </Card>

      {/* Nama Sekolah */}
      <p className="mt-6 text-sm font-medium text-slate-600 text-center">{SCHOOL_NAME}</p>
    </div>
  );
}
