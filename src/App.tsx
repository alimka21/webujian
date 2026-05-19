import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAuthStore } from './store/authStore';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import BeritaList from './pages/BeritaList';
import BeritaDetail from './pages/BeritaDetail';
import NotFoundPage from './pages/NotFoundPage';
import DashboardLayout from './components/layout/DashboardLayout';

// Admin
import AdminDashboard from './pages/dashboard/AdminDashboard';
import AdminUjianList from './pages/dashboard/AdminUjianList';
import AlumniTracer from './pages/dashboard/AlumniTracer';
import CmsManage from './pages/dashboard/CmsManage';
import ManageUsers from './pages/dashboard/ManageUsers';
import SiteSettings from './pages/dashboard/SiteSettings';
import StatsAdmin from './pages/dashboard/StatsAdmin';

// Guru
import GuruDashboard from './pages/dashboard/guru/GuruDashboard';
import BuatUjian from './pages/dashboard/guru/BuatUjian';
import KelolaSoal from './pages/dashboard/guru/KelolaSoal';
import DaftarUjian from './pages/dashboard/guru/DaftarUjian';
import Students from './pages/dashboard/Students';
import Attendance from './pages/dashboard/Attendance';
import RekapNilai from './pages/dashboard/guru/RekapNilai';

// Siswa
import SiswaDashboard from './pages/dashboard/SiswaDashboard';
import ExamList from './pages/dashboard/ExamList';
import RiwayatNilaiSiswa from './pages/dashboard/RiwayatNilaiSiswa';
import HasilUjian from './pages/dashboard/siswa/HasilUjian';
import TakeExam from './pages/exam/TakeExam';

export default function App() {
  const { fetchMe, token } = useAuthStore();

  useEffect(() => {
    fetchMe();
  }, [fetchMe, token]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/berita" element={<BeritaList />} />
        <Route path="/berita/:slug" element={<BeritaDetail />} />
        
        {/* Public route but redirect if logged in */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* SISWA: Fullscreen Exam Route (No Dashboard Layout) */}
        <Route 
          path="/exam/:sessionId" 
          element={
            <ProtectedRoute allowedRoles={['SISWA']}>
              <TakeExam />
            </ProtectedRoute>
          } 
        />

        {/* Dashboard Routes with Layout */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          
          {/* Default dashboard redirect based on role is handled in ProtectedRoute, but we can do a base level redirect too */}
          <Route index element={<Navigate to="/dashboard/siswa" replace />} />

          {/* ADMIN ROUTES */}
          <Route path="admin">
            <Route index element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="users" element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                <ManageUsers />
              </ProtectedRoute>
            } />
            <Route path="ujian" element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                <AdminUjianList />
              </ProtectedRoute>
            } />
            <Route path="alumni" element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                <AlumniTracer />
              </ProtectedRoute>
            } />
            <Route path="cms" element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                <CmsManage />
              </ProtectedRoute>
            } />
            <Route path="site" element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                <SiteSettings />
              </ProtectedRoute>
            } />
            <Route path="stats" element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                <StatsAdmin />
              </ProtectedRoute>
            } />
          </Route>

          {/* GURU ROUTES (ujian/soal/rekap juga dibuka untuk SUPER_ADMIN) */}
          <Route path="guru">
            <Route index element={
              <ProtectedRoute allowedRoles={['GURU']}>
                <GuruDashboard />
              </ProtectedRoute>
            } />
            <Route path="ujian" element={
              <ProtectedRoute allowedRoles={['GURU', 'SUPER_ADMIN']}>
                <DaftarUjian />
              </ProtectedRoute>
            } />
            <Route path="ujian/baru" element={
              <ProtectedRoute allowedRoles={['GURU', 'SUPER_ADMIN']}>
                <BuatUjian />
              </ProtectedRoute>
            } />
            <Route path="ujian/:id/soal" element={
              <ProtectedRoute allowedRoles={['GURU', 'SUPER_ADMIN']}>
                <KelolaSoal />
              </ProtectedRoute>
            } />
            <Route path="siswa" element={
              <ProtectedRoute allowedRoles={['GURU']}>
                <Students />
              </ProtectedRoute>
            } />
            <Route path="presensi" element={
              <ProtectedRoute allowedRoles={['GURU']}>
                <Attendance />
              </ProtectedRoute>
            } />
            <Route path="rekap" element={
              <ProtectedRoute allowedRoles={['GURU', 'SUPER_ADMIN']}>
                <RekapNilai />
              </ProtectedRoute>
            } />
          </Route>

          {/* SISWA ROUTES */}
          <Route path="siswa">
            <Route index element={
              <ProtectedRoute allowedRoles={['SISWA']}>
                <SiswaDashboard />
              </ProtectedRoute>
            } />
            <Route path="ujian" element={
              <ProtectedRoute allowedRoles={['SISWA']}>
                <ExamList />
              </ProtectedRoute>
            } />
            <Route path="riwayat" element={
              <ProtectedRoute allowedRoles={['SISWA']}>
                <RiwayatNilaiSiswa />
              </ProtectedRoute>
            } />
            <Route path="hasil/:sessionId" element={
              <ProtectedRoute allowedRoles={['SISWA']}>
                <HasilUjian />
              </ProtectedRoute>
            } />
          </Route>

        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Toaster position="top-right" richColors />
    </Router>
  );
}
