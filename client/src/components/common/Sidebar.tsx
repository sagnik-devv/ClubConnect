import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Award,
  Bell,
  Calendar,
  CheckSquare,
  Compass,
  LayoutDashboard,
  ShieldCheck,
  User as UserIcon,
  UserPlus,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { notificationService } from '../../services/notification.service';
import { Avatar } from './Avatar';

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen = false, onCloseMobile }) => {
  const location = useLocation();
  const { user, hasAnyLeadership, leaderMemberships } = useAuth();

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: notificationService.getUnreadCount,
    enabled: Boolean(user),
  });

  const initials = (user?.fullName || 'U')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const links = [
    { label: 'Overview', to: '/dashboard', icon: LayoutDashboard },
    { label: 'Discover Clubs', to: '/clubs', icon: Compass },
    { label: 'Task Board', to: '/tasks', icon: CheckSquare },
    { label: 'Contributions', to: '/contributions', icon: Award },
    { label: 'Recruitment', to: '/recruitment', icon: UserPlus },
    { label: 'Events', to: '/events', icon: Calendar },
    { label: 'Notifications', to: '/notifications', icon: Bell, badge: unreadCount },
    { label: 'My Profile', to: '/profile', icon: UserIcon },
  ];

  const content = (
    <div className="flex flex-col h-full justify-between p-4 bg-white border-r border-black/[0.08]">
      <div className="space-y-5">
        {user && (
          <Link
            to="/profile"
            onClick={onCloseMobile}
            className="block p-3 rounded-[10px] bg-[#f6f5f4] border border-black/[0.06] hover:border-black/15 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Avatar initials={initials} color="#0075de" size="md" />
              <div className="min-w-0">
                <div className="text-[14px] font-semibold text-black truncate">{user.fullName}</div>
                <div className="text-[12px] text-[#615d59] truncate">
                  {user.department || user.email}
                </div>
              </div>
            </div>
            {leaderMemberships.length > 0 && (
              <div className="mt-2.5 text-[11px] font-medium text-[#0075de] truncate">
                Leader in {leaderMemberships.map((m) => m.club.name).join(', ')}
              </div>
            )}
          </Link>
        )}

        <nav className="space-y-1" aria-label="Workspace navigation">
          <div className="px-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wider text-[#757575]">
            Workspace
          </div>
          {links.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onCloseMobile}
                className={`flex items-center justify-between px-2.5 py-2 rounded-[8px] text-[14px] font-medium transition-colors ${
                  active
                    ? 'bg-[#e6f3fe] text-[#0075de]'
                    : 'text-[#615d59] hover:text-black hover:bg-[#f6f5f4]'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </span>
                {typeof item.badge === 'number' && item.badge > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-[#f64932] text-white text-[10px] font-semibold leading-none">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="pt-4 border-t border-black/[0.08] space-y-2.5">
        {hasAnyLeadership && (
          <Link
            to="/president"
            onClick={onCloseMobile}
            className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-[8px] text-[13px] font-semibold bg-[#e6f3fe] text-[#0075de] hover:bg-[#d6ebfd] transition-colors"
          >
            <ShieldCheck className="w-4 h-4" />
            Switch to President Portal
          </Link>
        )}
        <div className="text-[12px] text-[#757575] px-2">
          ClubConnect · PostgreSQL & API backed
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block w-64 shrink-0 min-h-[calc(100vh-4rem)]">{content}</aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/35"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 w-72 max-w-[85vw] h-full bg-white">
            <div className="flex items-center justify-between px-4 py-3 border-b border-black/[0.08]">
              <span className="font-semibold text-[15px]">Workspace Menu</span>
              <button
                type="button"
                onClick={onCloseMobile}
                aria-label="Close workspace menu"
                className="p-1.5 rounded-[8px] hover:bg-black/5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="h-[calc(100%-52px)] overflow-y-auto">{content}</div>
          </div>
        </div>
      )}
    </>
  );
};
