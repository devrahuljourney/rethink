import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { getProfileAPI } from '../services/API/authAPI';

interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    user: any;
    checkAuth: () => Promise<void>;
    setIsAuthenticated: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const checkAuth = useCallback(async () => {
        try {
            setIsLoading(true);
            const res = await getProfileAPI();
            if (res.success) {
                setIsAuthenticated(true);
                setUser(res.user as any);
            } else {
                setIsAuthenticated(false);
                setUser(null);
            }
        } catch (error) {
            // 401 just means no session yet; only log real failures
            if (axios.isAxiosError(error) && error.response?.status === 401) {
                console.log('Auth check: not logged in');
            } else {
                console.error('Auth check failed:', error);
            }
            setIsAuthenticated(false);
            setUser(null);
        } finally {
            setIsLoading(true);
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    return (
        <AuthContext.Provider value={{ isAuthenticated, isLoading, user, checkAuth, setIsAuthenticated }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
