import { jsx as _jsx } from "hono/jsx/jsx-runtime";
import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        const savedToken = localStorage.getItem('token');
        if (savedToken) {
            setToken(savedToken);
            validateToken();
        }
        else {
            setIsLoading(false);
        }
    }, []);
    const validateToken = async () => {
        try {
            const res = await api.get('/api/auth/me');
            if (res.data.success) {
                setUser(res.data.user);
            }
            else {
                throw new Error('Invalid response');
            }
        }
        catch {
            localStorage.removeItem('token');
            setToken(null);
            setUser(null);
        }
        finally {
            setIsLoading(false);
        }
    };
    const login = async (email, password) => {
        try {
            const res = await api.post('/api/auth/login', { email, password });
            const newToken = res.data.token ||
                res.data.access_token ||
                res.data.data?.session?.access_token ||
                res.data.session?.access_token;
            if (!newToken) {
                return { success: false, error: 'ระบบหา Token ไม่เจอ' };
            }
            localStorage.setItem('token', newToken);
            setToken(newToken);
            const userRes = await api.get('/api/auth/me');
            if (userRes.data.success) {
                setUser(userRes.data.user);
            }
            return { success: true, token: newToken, user: userRes.data.user };
        }
        catch (err) {
            return {
                success: false,
                error: err.response?.data?.error || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
            };
        }
    };
    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('alias_name');
        setUser(null);
        setToken(null);
    };
    return (_jsx(AuthContext.Provider, { value: {
            user,
            token,
            isAuthenticated: !!user && !!token,
            isAdmin: user?.role === 'admin',
            isLoading,
            login,
            logout,
        }, children: children }));
}
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx)
        throw new Error('useAuth ต้องใช้ภายใน AuthProvider');
    return ctx;
}
