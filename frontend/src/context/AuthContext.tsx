import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type UserRole = 'Driver' | 'Admin' | 'Analyst';

export interface AuthUser {
    email: string;
    name: string;
    role: UserRole;
    token: string;
}

interface AuthContextType {
    user: AuthUser | null;
    login: (email: string, password: string) => Promise<boolean>;
    register: (email: string, name: string, password: string, role: UserRole) => Promise<boolean>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = 'suraksha_auth_user';

function mockToken() {
    return 'sk_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    });

    useEffect(() => {
        if (user) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }
    }, [user]);

    const login = async (email: string, _password: string): Promise<boolean> => {
        // Mock login — always succeeds. Check localStorage for registered users.
        await new Promise(r => setTimeout(r, 400)); // fake network delay
        try {
            const users: Record<string, AuthUser> = JSON.parse(localStorage.getItem('suraksha_users') || '{}');
            const existing = users[email];
            if (existing) {
                setUser({ ...existing, token: mockToken() });
            } else {
                // Default new login = Driver
                const newUser: AuthUser = { email, name: email.split('@')[0], role: 'Driver', token: mockToken() };
                setUser(newUser);
            }
            return true;
        } catch {
            return false;
        }
    };

    const register = async (email: string, name: string, _password: string, role: UserRole): Promise<boolean> => {
        await new Promise(r => setTimeout(r, 400));
        const newUser: AuthUser = { email, name, role, token: mockToken() };
        try {
            const users: Record<string, AuthUser> = JSON.parse(localStorage.getItem('suraksha_users') || '{}');
            users[email] = newUser;
            localStorage.setItem('suraksha_users', JSON.stringify(users));
        } catch { /* ignore */ }
        setUser(newUser);
        return true;
    };

    const logout = () => setUser(null);

    return (
        <AuthContext.Provider value={{ user, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be inside AuthProvider');
    return ctx;
}
