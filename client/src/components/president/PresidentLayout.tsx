import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeftRight,
  Award,
  BarChart3,
  Bell,
  Building2,
  Calendar,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Megaphone,
  PanelLeft,
  Settings,
  UserCheck,
  UserCog,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { usePresidentClub } from '../../context/PresidentClubContext';
import { notificationService } from '../../services/notification.service';
import { Avatar } from '../common/Avatar';
import { Badge } from '../common/Badge';

export const ClubSelector: React.FC<{ collapsed?: boolean }> = ({ collapsed }) => {
  const { authorizedClubs, selectedClubId, setSelectedClubId } = usePresidentClub();

  if (authorizedClubs.length === 0) return null;
  if (collapsed) {
    const active = authorizedClubs.find((c) => c.id === selectedClubId) || authorizedClubs[0];
    return (
      <div
        title={active.name}
        className="w-9 h-9 mx-auto rounded-[8px] bg-[#e6f3fe] text-[#0075de] font-bold text-[13px] flex items-center justify-center border border-[#0075de]/20"
      >
        {active.name.slice(0, 2).toUpperCase()}
      </div>
    );
  }

  return (
    <div className="p-3 rounded-[10px] bg-[#f6f5f4] border border-black/[0.08]">
      <label
        htmlFor="president-club-selector"
        className="block text-[11px] font-semibold uppercase tracking-wider text-[#757575] mb-1.5"
      >
        Managed Club ({authorizedClubs.length})
      </label>
      <select
        id="president-club-selector"
        value={selectedClubId}
        onChange={(e) => setSelectedClubId(e.target.value)}
        className="w-full px-2.5 py-1.5 rounded-[8px] border border-black/15 bg-white text-[13px] font-semibold text-black focus:outline-none focus:border-[#0075de]"
      >
        {authorizedClubs.map((club) => (
          <option key={club.id} value={club.id}>
            {club.name} ({club.myRole})
          </option>
        ))}
      </select>
    </div>
  );
};

export const PresidentLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { selectedClub } = usePresidentClub();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: notificationService.getUnreadCount,
    enabled: Boolean(user),
  });

  const initials = (user?.fullName || 'P')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = async () => {
    await logout();
    toast.success('Signed out');
    navigate('/');
  };

  const navGroups = [
    {
      heading: 'Workspace',
      items: [
        { label: 'Overview', to: '/president', icon: LayoutDashboard },
        { label: 'My Clubs', to: '/president/clubs', icon: Building2 },
      ],
    },
    {
      heading: 'Management',
      items: [
        { label: 'Members', to: '/president/members', icon: Users },
        { label: 'Membership Requests', to: '/president/membership-requests', icon: UserCheck },
        { label: 'Tasks', to: '/president/tasks', icon: CheckSquare },
        { label: 'Contributions', to: '/president/contributions', icon: Award },
        { label: 'Recruitment', to: '/president/recruitment', icon: UserPlus },
        { label: 'Events', to: '/president/events', icon: Calendar },
        { label: 'Announcements', to: '/president/announcements', icon: Megaphone },
      ],
    },
    {
      heading: 'Insights',
      items: [{ label: 'Analytics', to: '/president/analytics', icon: BarChart3 }],
    },
    {
      heading: 'Settings',
      items: [
        { label: 'Club Settings', to: '/president/settings', icon: Settings },
        { label: 'Profile Settings', to: '/profile', icon: UserCog },
      ],
    },
  ];

  const renderSidebarBody = (isMobile = false) => {
    const isNarrow = collapsed && !isMobile;
    return (
      <div className="flex flex-col h-full justify-between p-3.5 bg-white border-r border-black/[0.08]">
        <div className="space-y-4 overflow-y-auto">
          {/* Brand + Collapse */}
          <div className="flex items-center justify-between px-1">
            {!isNarrow && (
              <Link to="/president" className="flex items-center gap-2 font-bold text-[15px] text-black">
                <img
                  src="/logo.png"
                  alt="ClubConnect logo"
                  className="h-7 w-auto object-contain shrink-0"
                />
                <span>President Portal</span>
              </Link>
            )}
            {!isMobile && (
              <button
                type="button"
                onClick={() => setCollapsed((v) => !v)}
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                className="p-1.5 rounded-[6px] text-[#615d59] hover:text-black hover:bg-[#f6f5f4] cursor-pointer"
              >
                {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            )}
          </div>

          <ClubSelector collapsed={isNarrow} />

          <nav className="space-y-4" aria-label="President navigation">
            {navGroups.map((group) => (
              <div key={group.heading}>
                {!isNarrow && (
                  <div className="px-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wider text-[#757575]">
                    {group.heading}
                  </div>
                )}
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active =
                      item.to === '/president'
                        ? location.pathname === '/president'
                        : location.pathname.startsWith(item.to);
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setMobileOpen(false)}
                        title={isNarrow ? item.label : undefined}
                        className={`flex items-center gap-2.5 px-2.5 py-2 rounded-[8px] text-[13px] font-medium transition-colors ${
                          active
                            ? 'bg-[#e6f3fe] text-[#0075de]'
                            : 'text-[#615d59] hover:text-black hover:bg-[#f6f5f4]'
                        } ${isNarrow ? 'justify-center' : ''}`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        {!isNarrow && <span className="truncate">{item.label}</span>}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom Profile + Portal Switcher + Logout */}
        <div className="pt-3 border-t border-black/[0.08] space-y-2">
          {!isNarrow && user && (
            <div className="flex items-center gap-2.5 px-2 py-1.5">
              <Avatar initials={initials} color="#02093a" size="sm" />
              <div className="min-w-0">
                <div className="text-[13px] font-semibold text-black truncate">{user.fullName}</div>
                <div className="text-[11px] text-[#757575] truncate">
                  {selectedClub?.myRole || 'Leader'}
                </div>
              </div>
            </div>
          )}

          <Link
            to="/dashboard"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-2 px-2.5 py-2 rounded-[8px] bg-[#f6f5f4] hover:bg-[#e6f3fe] text-[13px] font-medium text-black hover:text-[#0075de] transition-colors ${
              isNarrow ? 'justify-center' : ''
            }`}
            title="Switch to Member Portal"
          >
            <ArrowLeftRight className="w-4 h-4 shrink-0" />
            {!isNarrow && <span>Switch to Member Portal</span>}
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-[8px] text-[13px] font-medium text-[#e32d14] hover:bg-[#f64932]/10 transition-colors cursor-pointer ${
              isNarrow ? 'justify-center' : ''
            }`}
            title="Log out"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isNarrow && <span>Log out</span>}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f6f5f4] text-black flex">
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:block shrink-0 transition-all duration-200 ${collapsed ? 'w-[72px]' : 'w-64'}`}>
        <div className="sticky top-0 h-screen">{renderSidebarBody(false)}</div>
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-black/35" onClick={() => setMobileOpen(false)} />
          <div className="relative z-10 w-72 max-w-[85vw] h-full bg-white">
            <div className="flex items-center justify-between px-4 py-3 border-b border-black/[0.08]">
              <span className="font-semibold text-[15px]">President Portal</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-[8px] hover:bg-black/5 cursor-pointer"
                aria-label="Close sidebar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="h-[calc(100%-52px)]">{renderSidebarBody(true)}</div>
          </div>
        </div>
      )}

      {/* Main Column */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* President Top Header */}
        <header className="sticky top-0 z-30 h-16 bg-[#f6f5f4]/95 backdrop-blur-sm border-b border-black/[0.08] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-[8px] bg-white border border-black/10 text-black cursor-pointer"
              aria-label="Open President sidebar"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
            {selectedClub && (
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[14px] font-semibold text-black truncate">
                  {selectedClub.name}
                </span>
                <Badge variant="blue">{selectedClub.myRole}</Badge>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/dashboard"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-white border border-black/10 text-[13px] font-medium text-black hover:bg-[#e6f3fe] hover:text-[#0075de] transition-colors"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              Member Portal
            </Link>
            <Link
              to="/notifications"
              className="relative p-2 rounded-[8px] bg-white border border-black/10 text-black/70 hover:text-black"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#f64932] text-white text-[10px] font-semibold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Link>
          </div>
        </header>

        <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    </div>
  );
};
