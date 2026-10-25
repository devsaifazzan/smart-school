import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../api/client';

export interface UserProfile {
  type: 'student' | 'teacher' | 'parent';
  id: number;
  name: string;
}

export interface PermissionMatrixItem {
  can_read: boolean;
  can_create: boolean;
  can_update: boolean;
  can_delete: boolean;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  profile?: UserProfile | null;
  permissions?: Record<string, PermissionMatrixItem>;
  accessible_modules?: string[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<User>;
  logout: () => void;
  isLoading: boolean;
  hasPermission: (resource: string, action?: 'read' | 'create' | 'update' | 'delete') => boolean;
  getDefaultRoute: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('ssms_token');
    const savedUser = localStorage.getItem('ssms_user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
      } catch {
        setUser(null);
      }

      // Background refresh from /auth/me/ to ensure freshest permissions
      apiClient
        .get('/auth/me/')
        .then((res) => {
          setUser(res.data);
          localStorage.setItem('ssms_user', JSON.stringify(res.data));
        })
        .catch(() => {
          // Token expired or invalid
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (username: string, password: string): Promise<User> => {
    const res = await apiClient.post('/auth/login/', { username, password });
    const { token: receivedToken, user: receivedUser } = res.data;
    setToken(receivedToken);
    setUser(receivedUser);
    localStorage.setItem('ssms_token', receivedToken);
    localStorage.setItem('ssms_user', JSON.stringify(receivedUser));
    return receivedUser;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('ssms_token');
    localStorage.removeItem('ssms_user');
    window.location.href = '/login';
  };

  const hasPermission = (
    resource: string,
    action: 'read' | 'create' | 'update' | 'delete' = 'read'
  ): boolean => {
    if (!user) return false;

    const rName = user.role?.toLowerCase() || '';
    if (rName === 'admin' || rName === 'super_admin') {
      return true;
    }

    // Dashboard access rule
    if (resource === 'dashboard') {
      // If user has access to analytics or full admin/teacher, or has at least 3 modules
      if (user.permissions?.analytics?.can_read) return true;
      if (rName === 'teacher' || rName === 'school_admin') return true;
      // Single-purpose roles (like exams only) shouldn't be forced into empty dashboard
      return false;
    }

    const perm = user.permissions?.[resource];
    if (perm) {
      const key = `can_${action}` as keyof PermissionMatrixItem;
      return Boolean(perm[key]);
    }

    // Check accessible_modules fallback for read
    if (action === 'read' && user.accessible_modules?.includes(resource)) {
      return true;
    }

    return false;
  };

  const getDefaultRoute = (): string => {
    if (!user) return '/login';
    const rName = user.role?.toLowerCase() || '';
    if (rName === 'admin' || rName === 'super_admin' || hasPermission('dashboard')) {
      return '/dashboard';
    }

    // Find first accessible module
    const modules = user.accessible_modules || [];
    if (modules.length > 0) {
      const first = modules[0];
      // Map resource name to url
      const routeMap: Record<string, string> = {
        students: '/students',
        teachers: '/teachers',
        academics: '/academics',
        timetable: '/timetable',
        attendance: '/attendance',
        exams: '/exams',
        finance: '/finance',
        analytics: '/analytics',
        users: '/users',
        roles: '/users',
      };
      return routeMap[first] || `/${first}`;
    }

    return '/dashboard';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isLoading,
        hasPermission,
        getDefaultRoute,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
