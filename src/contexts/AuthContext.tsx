import React, { createContext, useContext, useState, useEffect } from 'react';
import { syncService } from '@/services/syncService';

export interface User {
  id: string;
  name: string;
  role: 'admin' | 'waiter' | 'chef' | 'cashier' | 'housekeeping';
  pin: string;
  permissions: string[];
  deviceId?: string;
  lastLogin?: string;
  isActive: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  deviceInfo: {
    id: string;
    name: string;
    type: string;
    role: string;
  };
}

interface AuthContextType extends AuthState {
  login: (pin: string, role?: string) => Promise<boolean>;
  logout: () => void;
  checkPermission: (permission: string) => boolean;
  setDeviceRole: (role: string) => void;
  setDeviceName: (name: string) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_PERMISSIONS = {
  admin: [
    'view_dashboard',
    'manage_users',
    'manage_menu',
    'manage_tables',
    'manage_rooms',
    'view_reports',
    'manage_settings',
    'manage_printers',
    'view_all_orders',
    'manage_orders',
    'process_payments'
  ],
  waiter: [
    'view_dashboard',
    'manage_orders',
    'manage_tables',
    'view_menu',
    'take_orders'
  ],
  chef: [
    'view_kitchen',
    'manage_kitchen_orders',
    'update_order_status',
    'view_menu'
  ],
  cashier: [
    'view_billing',
    'process_payments',
    'print_receipts',
    'view_orders',
    'manage_billing'
  ],
  housekeeping: [
    'manage_rooms',
    'view_room_status',
    'manage_housekeeping'
  ]
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    deviceInfo: {
      id: syncService.getDeviceId(),
      name: localStorage.getItem('lokalrestro_device_name') || 'Unknown Device',
      type: getDeviceType(),
      role: localStorage.getItem('lokalrestro_device_role') || 'General'
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    setIsLoading(true);
    try {
      // Check for existing session
      const response = await fetch('/api/auth/session', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.authenticated && data.user) {
          setAuthState(prev => ({
            ...prev,
            user: data.user,
            isAuthenticated: true
          }));
        }
      }
    } catch (error) {
      console.error('Failed to check auth session:', error);
    }
    setIsLoading(false);
  };

  const login = async (pin: string, role?: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ 
          pin,
          deviceId: authState.deviceInfo.id,
          deviceType: authState.deviceInfo.type,
          role: role || authState.deviceInfo.role
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          const user: User = {
            ...data.user,
            permissions: DEFAULT_PERMISSIONS[data.user.role as keyof typeof DEFAULT_PERMISSIONS] || []
          };

          setAuthState(prev => ({
            ...prev,
            user,
            isAuthenticated: true
          }));

          // Broadcast login event
          syncService.broadcast({
            type: 'user_login',
            action: 'login',
            data: {
              userId: user.id,
              role: user.role,
              deviceId: authState.deviceInfo.id,
              timestamp: Date.now()
            },
            timestamp: Date.now(),
            deviceId: authState.deviceInfo.id
          });

          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout request failed:', error);
    }

    // Broadcast logout event
    if (authState.user) {
      syncService.broadcast({
        type: 'user_logout',
        action: 'logout',
        data: {
          userId: authState.user.id,
          deviceId: authState.deviceInfo.id,
          timestamp: Date.now()
        },
        timestamp: Date.now(),
        deviceId: authState.deviceInfo.id
      });
    }

    setAuthState(prev => ({
      ...prev,
      user: null,
      isAuthenticated: false
    }));
  };

  const checkPermission = (permission: string): boolean => {
    if (!authState.user) return false;
    return authState.user.permissions.includes(permission);
  };

  const setDeviceRole = (role: string) => {
    localStorage.setItem('lokalrestro_device_role', role);
    setAuthState(prev => ({
      ...prev,
      deviceInfo: {
        ...prev.deviceInfo,
        role
      }
    }));
  };

  const setDeviceName = (name: string) => {
    localStorage.setItem('lokalrestro_device_name', name);
    setAuthState(prev => ({
      ...prev,
      deviceInfo: {
        ...prev.deviceInfo,
        name
      }
    }));
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
        checkPermission,
        setDeviceRole,
        setDeviceName,
        isLoading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

function getDeviceType(): string {
  const userAgent = navigator.userAgent.toLowerCase();
  const width = window.screen.width;
  
  if (/android/i.test(userAgent)) {
    return width < 600 ? 'Android Phone' : 'Android Tablet';
  }
  if (/iphone/i.test(userAgent)) return 'iPhone';
  if (/ipad/i.test(userAgent)) return 'iPad';
  if (/windows/i.test(userAgent)) return 'Windows PC';
  if (/mac/i.test(userAgent)) return 'Mac';
  
  return width < 600 ? 'Mobile' : width < 1024 ? 'Tablet' : 'Desktop';
}

// HOC for role-based route protection
export function withRoleProtection(
  Component: React.ComponentType<any>,
  requiredPermissions: string[]
) {
  return function ProtectedComponent(props: any) {
    const { checkPermission, isAuthenticated, isLoading } = useAuth();
    
    if (isLoading) {
      return <div>Loading...</div>;
    }
    
    if (!isAuthenticated) {
      return <div>Please login to access this page</div>;
    }
    
    const hasPermission = requiredPermissions.every(permission => 
      checkPermission(permission)
    );
    
    if (!hasPermission) {
      return <div>You don't have permission to access this page</div>;
    }
    
    return <Component {...props} />;
  };
}

export default AuthProvider;