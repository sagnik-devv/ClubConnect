import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-black/[0.08] bg-[#f6f5f4] mt-20">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-2.5 text-black font-semibold text-[17px] tracking-[-0.02em]"
            >
              <span className="w-7 h-7 rounded-[7px] bg-white border border-black/15 flex items-center justify-center">
                <span className="w-3 h-3 rounded-[3px] bg-[#0075de] block" />
              </span>
              <span>ClubConnect</span>
            </Link>
            <p className="mt-3 text-[14px] text-[#615d59] max-w-xs leading-relaxed">
              Make campus life count. A warm, transparent platform for student clubs and verified contributions.
            </p>
          </div>

          <div>
            <h3 className="text-[13px] font-semibold uppercase tracking-wider text-black/55 mb-3">
              Explore
            </h3>
            <ul className="space-y-2 text-[14px] text-[#615d59]">
              <li><Link to="/clubs" className="hover:text-black transition-colors">Discover Clubs</Link></li>
              <li><Link to="/events" className="hover:text-black transition-colors">Campus Events</Link></li>
              <li><Link to="/about" className="hover:text-black transition-colors">About & Design Thinking</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-[13px] font-semibold uppercase tracking-wider text-black/55 mb-3">
              Workspace
            </h3>
            <ul className="space-y-2 text-[14px] text-[#615d59]">
              <li><Link to="/dashboard" className="hover:text-black transition-colors">Student Dashboard</Link></li>
              <li><Link to="/tasks" className="hover:text-black transition-colors">Task Board</Link></li>
              <li><Link to="/contributions" className="hover:text-black transition-colors">Contribution Tracking</Link></li>
              <li><Link to="/recruitment" className="hover:text-black transition-colors">Recruitment</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-[13px] font-semibold uppercase tracking-wider text-black/55 mb-3">
              Account
            </h3>
            <ul className="space-y-2 text-[14px] text-[#615d59]">
              <li><Link to="/login" className="hover:text-black transition-colors">Sign In</Link></li>
              <li><Link to="/register" className="hover:text-black transition-colors">Create Account</Link></li>
              <li><Link to="/profile" className="hover:text-black transition-colors">Profile Settings</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-black/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-[13px] text-[#757575]">
          <p>© {new Date().getFullYear()} ClubConnect. Make campus life count.</p>
          <p className="font-editorial italic text-[#615d59]">
            Built for student communities, transparent onboarding, and fair collaboration.
          </p>
        </div>
      </div>
    </footer>
  );
};
