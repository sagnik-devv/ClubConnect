import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Bell, ChevronDown, LogOut, Menu, ShieldCheck, User as UserIcon, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './Button';
import { useAuth } from '../../context/AuthContext';
import { notificationService } from '../../services/notification.service';
import { Avatar } from './Avatar';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, hasAnyLeadership, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: notificationService.getUnreadCount,
    enabled: isAuthenticated,
  });

  const handleAnchorNav = (hashId: string) => {
    setMobileOpen(false);
    if (location.pathname === '/') {
      const el = document.getElementById(hashId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    navigate(`/#${hashId}`);
  };

  const handleLogout = async () => {
    await logout();
    setMobileOpen(false);
    toast.success('Signed out');
    navigate('/');
  };

  const navLinkBase =
    'px-3 py-2 rounded-[8px] text-[14px] font-medium text-black/60 hover:text-black hover:bg-black/[0.04] transition-colors duration-200 whitespace-nowrap';

  const isActive = (path: string) =>
    location.pathname === path ? 'text-black bg-black/[0.04]' : '';

  const initials = (user?.fullName || 'U')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-40 h-16 bg-[#f6f5f4]/95 backdrop-blur-sm border-b border-black/[0.08] notion-nav-shadow">
      <div className="max-w-[1440px] mx-auto h-full px-4 sm:px-6 lg:px-10 flex items-center justify-between gap-4">
        <Link
          to="/"
          className="flex items-center gap-2.5 text-black font-semibold text-[17px] tracking-[-0.02em] shrink-0"
        >
          <img
            src="/logo.png"
            alt="ClubConnect logo"
            className="h-8 w-auto object-contain shrink-0"
          />
          <span>ClubConnect</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1" aria-label="Primary">
          <Link to="/clubs" className={`${navLinkBase} ${isActive('/clubs')}`}>
            Discover Clubs
          </Link>
          <button
            type="button"
            onClick={() => handleAnchorNav('features')}
            className={`${navLinkBase} cursor-pointer`}
          >
            Features
          </button>
          <button
            type="button"
            onClick={() => handleAnchorNav('how-it-works')}
            className={`${navLinkBase} cursor-pointer`}
          >
            How It Works
          </button>
          <Link to="/about" className={`${navLinkBase} ${isActive('/about')}`}>
            About
          </Link>
          <Link to="/events" className={`${navLinkBase} ${isActive('/events')}`}>
            Events
          </Link>

          {isAuthenticated && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setWorkspaceOpen((v) => !v)}
                onBlur={() => setTimeout(() => setWorkspaceOpen(false), 180)}
                aria-expanded={workspaceOpen}
                className={`${navLinkBase} inline-flex items-center gap-1 cursor-pointer ${
                  [
                    '/dashboard',
                    '/manage',
                    '/tasks',
                    '/contributions',
                    '/recruitment',
                    '/profile',
                  ].includes(location.pathname)
                    ? 'text-black bg-black/[0.04]'
                    : ''
                }`}
              >
                Workspace
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {workspaceOpen && (
                <div className="absolute left-0 mt-1.5 w-60 rounded-[12px] bg-white border border-black/10 p-1.5 z-50 notion-nav-shadow">
                  <Link
                    to="/dashboard"
                    onClick={() => setWorkspaceOpen(false)}
                    className="block px-3 py-2 rounded-[8px] text-[14px] text-black/80 hover:text-black hover:bg-[#f6f5f4]"
                  >
                    <div className="font-medium">Member Portal</div>
                    <div className="text-[12px] text-[#615d59]">Memberships & analytics</div>
                  </Link>
                  {hasAnyLeadership && (
                    <Link
                      to="/president"
                      onClick={() => setWorkspaceOpen(false)}
                      className="block px-3 py-2 rounded-[8px] text-[14px] text-[#0075de] hover:bg-[#e6f3fe]/60"
                    >
                      <div className="font-semibold">President Portal</div>
                      <div className="text-[12px] text-[#615d59]">Club governance & analytics</div>
                    </Link>
                  )}
                  <Link
                    to="/tasks"
                    onClick={() => setWorkspaceOpen(false)}
                    className="block px-3 py-2 rounded-[8px] text-[14px] text-black/80 hover:text-black hover:bg-[#f6f5f4]"
                  >
                    <div className="font-medium">Task Board</div>
                    <div className="text-[12px] text-[#615d59]">Kanban & assignments</div>
                  </Link>
                  <Link
                    to="/contributions"
                    onClick={() => setWorkspaceOpen(false)}
                    className="block px-3 py-2 rounded-[8px] text-[14px] text-black/80 hover:text-black hover:bg-[#f6f5f4]"
                  >
                    <div className="font-medium">Contributions</div>
                    <div className="text-[12px] text-[#615d59]">Submissions & verification</div>
                  </Link>
                  <Link
                    to="/recruitment"
                    onClick={() => setWorkspaceOpen(false)}
                    className="block px-3 py-2 rounded-[8px] text-[14px] text-black/80 hover:text-black hover:bg-[#f6f5f4]"
                  >
                    <div className="font-medium">Recruitment</div>
                    <div className="text-[12px] text-[#615d59]">Applications & reviews</div>
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setWorkspaceOpen(false)}
                    className="block px-3 py-2 rounded-[8px] text-[14px] text-black/80 hover:text-black hover:bg-[#f6f5f4]"
                  >
                    <div className="font-medium">My Profile</div>
                    <div className="text-[12px] text-[#615d59]">Bio, skills & avatar</div>
                  </Link>
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Right Actions */}
        <div className="hidden lg:flex items-center gap-2 shrink-0">
          {isAuthenticated && user ? (
            <>
              {hasAnyLeadership && (
                <Link
                  to="/president"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] text-[13px] font-medium bg-[#e6f3fe] text-[#0075de] hover:bg-[#d6ebfd] transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  President Portal
                </Link>
              )}
              <Link
                to="/notifications"
                aria-label={`Notifications (${unreadCount} unread)`}
                className="relative p-2 rounded-[8px] text-black/65 hover:text-black hover:bg-black/[0.04] transition-colors"
              >
                <Bell className="w-[18px] h-[18px]" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#f64932] text-white text-[10px] font-semibold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Link>
              <Link
                to="/profile"
                className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-[8px] hover:bg-black/[0.04] transition-colors"
              >
                <Avatar
                  initials={initials}
                  profileImage={user.profileImage}
                  seed={user.id}
                  color="#0075de"
                  size="sm"
                />
                <span className="text-[13px] font-medium text-black max-w-[130px] truncate">
                  {user.fullName}
                </span>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" to="/login">
                Log In
              </Button>
              <Button variant="primary" to="/register">
                Get Started
              </Button>
            </>
          )}
        </div>

        {/* Mobile Controls */}
        <div className="flex lg:hidden items-center gap-1.5">
          {isAuthenticated && (
            <Link
              to="/notifications"
              aria-label={`Notifications (${unreadCount} unread)`}
              className="relative p-2 rounded-[8px] text-black/70 hover:bg-black/5"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#f64932] text-white text-[10px] font-semibold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Link>
          )}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            className="p-2 rounded-[8px] text-black hover:bg-black/5 cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-b border-black/10 px-4 py-4 space-y-1 max-h-[85vh] overflow-y-auto">
          <Link to="/clubs" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 rounded-[8px] text-[15px] font-medium text-black hover:bg-[#f6f5f4]">
            Discover Clubs
          </Link>
          <button type="button" onClick={() => handleAnchorNav('features')} className="w-full text-left px-3 py-2.5 rounded-[8px] text-[15px] font-medium text-black/75 hover:bg-[#f6f5f4]">
            Features
          </button>
          <button type="button" onClick={() => handleAnchorNav('how-it-works')} className="w-full text-left px-3 py-2.5 rounded-[8px] text-[15px] font-medium text-black/75 hover:bg-[#f6f5f4]">
            How It Works
          </button>
          <Link to="/events" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 rounded-[8px] text-[15px] font-medium text-black/75 hover:bg-[#f6f5f4]">
            Events
          </Link>
          <Link to="/about" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 rounded-[8px] text-[15px] font-medium text-black/75 hover:bg-[#f6f5f4]">
            About
          </Link>

          {isAuthenticated ? (
            <div className="pt-2 mt-2 border-t border-black/[0.08] space-y-1">
              <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded-[8px] text-[14px] text-black hover:bg-[#f6f5f4]">
                Student Dashboard
              </Link>
              {hasAnyLeadership && (
                <Link to="/president" onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded-[8px] text-[14px] font-semibold text-[#0075de] hover:bg-[#e6f3fe]/60">
                  President Portal
                </Link>
              )}
              <Link to="/tasks" onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded-[8px] text-[14px] text-black hover:bg-[#f6f5f4]">
                Task Board
              </Link>
              <Link to="/contributions" onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded-[8px] text-[14px] text-black hover:bg-[#f6f5f4]">
                Contributions
              </Link>
              <Link to="/recruitment" onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded-[8px] text-[14px] text-black hover:bg-[#f6f5f4]">
                Recruitment
              </Link>
              <Link to="/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-[8px] text-[14px] text-black hover:bg-[#f6f5f4]">
                <UserIcon className="w-4 h-4" /> My Profile
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 rounded-[8px] text-[14px] text-[#e32d14] font-medium hover:bg-[#f64932]/10"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="pt-3 flex items-center gap-2">
              <Button variant="secondary" className="flex-1" to="/login" onClick={() => setMobileOpen(false)}>
                Log In
              </Button>
              <Button variant="primary" className="flex-1" to="/register" onClick={() => setMobileOpen(false)}>
                Get Started
              </Button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
