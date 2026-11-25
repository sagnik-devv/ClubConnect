import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { AuthUser, ClubRole, NotificationItem } from '../types';
import { authService, LoginPayload, RegisterPayload } from '../services/auth.service';

const LEADER_ROLES: ClubRole[] = [
  'PRESIDENT',
  'VICE_PRESIDENT',
  'SECRETARY',
  'TREASURER',
  'COORDINATOR',
];

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  leaderMemberships: AuthUser['memberships'];
  hasAnyLeadership: boolean;
  hasClubLeadership: (clubId: string) => boolean;
  login: (payload: LoginPayload) => Promise<AuthUser>;
  register: (payload: RegisterPayload) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      await authService.ensureCsrf().catch(() => undefined);
      const current = await authService.getMe();
      setUser(current);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  // Connect Socket.IO for live notifications while authenticated
  useEffect(() => {
    if (!user) return;
    const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;
    const socket: Socket = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    socket.on('notification:new', (notif: NotificationItem) => {
      toast.info(notif.title, { description: notif.message });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
    });

    return () => {
      socket.disconnect();
    };
  }, [user, queryClient]);

  const login = async (payload: LoginPayload) => {
    const loggedIn = await authService.login(payload);
    setUser(loggedIn);
    queryClient.clear();
    return loggedIn;
  };

  const register = async (payload: RegisterPayload) => {
    const created = await authService.register(payload);
    setUser(created);
    queryClient.clear();
    return created;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    queryClient.clear();
  };

  const leaderMemberships = (user?.memberships ?? []).filter(
    (m) => m.status === 'ACTIVE' && LEADER_ROLES.includes(m.role)
  );

  const hasClubLeadership = (clubId: string) =>
    user?.globalRole === 'SUPER_ADMIN' ||
    leaderMemberships.some((m) => m.clubId === clubId);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: Boolean(user),
        leaderMemberships,
        hasAnyLeadership: user?.globalRole === 'SUPER_ADMIN' || leaderMemberships.length > 0,
        hasClubLeadership,
        login,
        register,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
