import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './components/layout/DashboardLayout';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import ExamList from './pages/dashboard/ExamList';
import TakeExam from './pages/exam/TakeExam';
import AlumniTracer from './pages/dashboard/AlumniTracer';
import Attendance from './pages/dashboard/Attendance';
import Students from './pages/dashboard/Students';
import CmsManage from './pages/dashboard/CmsManage';

function PrivateRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/dashboard" />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        
        {/* Exam execution is separate from dashboard layout to allow fullscreen/anti-cheat */}
        <Route 
          path="/exam/:id" 
          element={
            <PrivateRoute allowedRoles={['STUDENT']}>
              <TakeExam />
            </PrivateRoute>
          } 
        />

        <Route 
          path="/dashboard" 
          element={
            <PrivateRoute>
              <DashboardLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="exams" element={<ExamList />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="alumni" element={<AlumniTracer />} />
          <Route path="students" element={<Students />} />
          <Route path="cms" element={<CmsManage />} />
        </Route>
      </Routes>
    </Router>
  );
}