import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
            console.error('Auth check failed:', error);
            setIsAuthenticated(false);
            setUser(null);
        } finally {
            setIsLoading(true); // Set to false when done, but keep as true for initial splash logic if needed
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
