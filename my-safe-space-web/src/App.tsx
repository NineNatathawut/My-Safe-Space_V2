import type { ReactNode } from 'react';
import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PodcastPlayerProvider } from './contexts/PodcastPlayerContext';
import Layout from './components/Layout';
import MiniPlayer from './components/MiniPlayer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Venting from './pages/Venting';
import PostDetail from './pages/PostDetail';
import Resources from './pages/Resources';
import Profile from './pages/Profile';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';

import Assessment from './pages/Assessment';
import AdminCreateAssessment from './pages/AdminCreateAssessment';

const UserProfile = lazy(() => import('./pages/UserProfile'));

function SuspenseWrapper({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-pulse text-slate-400">กำลังโหลด...</div></div>}>
      {children}
    </Suspense>
  );
}

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

        <Route path="/user/:id" element={
          <Layout><SuspenseWrapper><UserProfile /></SuspenseWrapper></Layout>
        } />

        <Route path="/admin-login" element={<AdminLogin />} />
        <Route
          path="/admin-dashboard"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
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
      <PodcastPlayerProvider>
        <AppContent />
        <MiniPlayer />
      </PodcastPlayerProvider>
    </AuthProvider>
  );
}
