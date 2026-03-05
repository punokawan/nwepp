'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import api from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = api.getToken();
        if (token) {
            api.getMe().then(res => {
                if (res?.success) setUser(res.data);
                setLoading(false);
            }).catch(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (email, password) => {
        const res = await api.login({ email, password });
        if (res?.success) {
            api.setTokens(res.data.access_token, res.data.refresh_token);
            setUser(res.data.user);
            return { success: true };
        }
        return { success: false, error: res?.error || 'Login failed' };
    };

    const register = async (data) => {
        const res = await api.register(data);
        if (res?.success) {
            api.setTokens(res.data.access_token, res.data.refresh_token);
            setUser(res.data.user);
            return { success: true };
        }
        return { success: false, error: res?.error || 'Registration failed' };
    };

    const logout = () => {
        api.clearTokens();
        setUser(null);
        window.location.href = '/login';
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be inside AuthProvider');
    return ctx;
}
