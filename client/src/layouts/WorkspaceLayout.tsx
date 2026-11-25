import React, { useState } from 'react';
import { PanelLeft } from 'lucide-react';
import { Navbar } from '../components/common/Navbar';
import { Footer } from '../components/common/Footer';
import { Sidebar } from '../components/common/Sidebar';

export const WorkspaceLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#f6f5f4] text-black">
      <Navbar />
      <div className="flex-1 max-w-[1440px] w-full mx-auto flex">
        <Sidebar mobileOpen={sidebarOpen} onCloseMobile={() => setSidebarOpen(false)} />
        <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-10 py-8">
          <div className="lg:hidden mb-4">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[8px] bg-white border border-black/10 text-[13px] font-medium text-black cursor-pointer"
            >
              <PanelLeft className="w-4 h-4" />
              Workspace Sidebar
            </button>
          </div>
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
};
