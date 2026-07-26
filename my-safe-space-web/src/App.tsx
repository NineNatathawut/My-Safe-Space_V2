import type { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Venting from './pages/Venting';
import PostDetail from './pages/PostDetail';
import Resources from './pages/Resources';
import Profile from './pages/Profile';
import AdminLogin from './pages/AdminLogin';

import Assessment from './pages/Assessment';
import AdminCreateAssessment from './pages/AdminCreateAssessment';

function AdminRoute({ children }: { children: ReactNode }) {
  const { isAdmin, isLoading } = useAuth();
  if (isLoading) return null;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}

function AppContent() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="venting" element={<Venting />} />
          <Route path="post/:id" element={<PostDetail />} />
          <Route path="resources" element={<Resources />} />
          <Route path="profile" element={<Profile />} />
          <Route path="/assessment" element={<Assessment />} />
        </Route>

        <Route path="/admin-login" element={<AdminLogin />} />
        <Route
          path="/admin/assessments/create"
          element={
            <AdminRoute>
              <AdminCreateAssessment />
            </AdminRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
