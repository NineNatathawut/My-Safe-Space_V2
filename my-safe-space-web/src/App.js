import { jsx as _jsx, jsxs as _jsxs } from "hono/jsx/jsx-runtime";
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
import AdminDashboard from './pages/AdminDashboard';
function AdminRoute({ children }) {
    const { isAdmin, isLoading } = useAuth();
    if (isLoading)
        return null;
    if (!isAdmin)
        return _jsx(Navigate, { to: "/", replace: true });
    return children;
}
function AppContent() {
    return (_jsx(BrowserRouter, { children: _jsxs(Routes, { children: [_jsxs(Route, { path: "/", element: _jsx(Layout, {}), children: [_jsx(Route, { index: true, element: _jsx(Home, {}) }), _jsx(Route, { path: "login", element: _jsx(Login, {}) }), _jsx(Route, { path: "register", element: _jsx(Register, {}) }), _jsx(Route, { path: "venting", element: _jsx(Venting, {}) }), _jsx(Route, { path: "post/:id", element: _jsx(PostDetail, {}) }), _jsx(Route, { path: "resources", element: _jsx(Resources, {}) }), _jsx(Route, { path: "profile", element: _jsx(Profile, {}) })] }), _jsx(Route, { path: "/admin-login", element: _jsx(AdminLogin, {}) }), _jsx(Route, { path: "/admin/dashboard", element: _jsx(AdminRoute, { children: _jsx(AdminDashboard, {}) }) })] }) }));
}
export default function App() {
    return (_jsx(AuthProvider, { children: _jsx(AppContent, {}) }));
}
