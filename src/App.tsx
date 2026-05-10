import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAuthStore } from './store/authStore';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import BeritaDetail from './pages/BeritaDetail';
import NotFoundPage from './pages/NotFoundPage';
import DashboardLayout from './components/layout/DashboardLayout';

// Admin
import AdminDashboard from './pages/dashboard/AdminDashboard';
import AlumniTracer from './pages/dashboard/AlumniTracer';
import CmsManage from './pages/dashboard/CmsManage';

// Guru
import GuruDashboard from './pages/dashboard/guru/GuruDashboard';
import BuatUjian from './pages/dashboard/guru/BuatUjian';
import KelolaSoal from './pages/dashboard/guru/KelolaSoal';
import DaftarUjian from './pages/dashboard/guru/DaftarUjian';
import Students from './pages/dashboard/Students';
import Attendance from './pages/dashboard/Attendance';
import RekapNilai from './pages/dashboard/guru/RekapNilai';

// Siswa
import ExamList from './pages/dashboard/ExamList';
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
          </Route>

          {/* GURU ROUTES */}
          <Route path="guru">
            <Route index element={
              <ProtectedRoute allowedRoles={['GURU']}>
                <GuruDashboard />
              </ProtectedRoute>
            } />
            <Route path="ujian" element={
              <ProtectedRoute allowedRoles={['GURU']}>
                <DaftarUjian />
              </ProtectedRoute>
            } />
            <Route path="ujian/baru" element={
              <ProtectedRoute allowedRoles={['GURU']}>
                <BuatUjian />
              </ProtectedRoute>
            } />
            <Route path="ujian/:id/soal" element={
              <ProtectedRoute allowedRoles={['GURU']}>
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
              <ProtectedRoute allowedRoles={['GURU']}>
                <RekapNilai />
              </ProtectedRoute>
            } />
          </Route>

          {/* SISWA ROUTES */}
          <Route path="siswa" element={
            <ProtectedRoute allowedRoles={['SISWA']}>
              <ExamList />
            </ProtectedRoute>
          } />

        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Toaster position="top-right" richColors />
    </Router>
  );
}
