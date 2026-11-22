import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { MandatoryChangePasswordModal } from '../auth/MandatoryChangePasswordModal';

export const AppLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-bct-surface text-slate-800 print:bg-white print:min-h-0 print:block print:overflow-visible">
      <div className="print:hidden">
        <MandatoryChangePasswordModal />
        <Navbar 
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
          isSidebarOpen={isSidebarOpen} 
        />
      </div>

      <div className="flex-1 flex overflow-hidden print:block print:overflow-visible print:h-auto">
        <div className="print:hidden">
          <Sidebar 
            isOpen={isSidebarOpen} 
            onClose={() => setIsSidebarOpen(false)} 
          />
        </div>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 print:p-0 print:m-0 print:overflow-visible print:block print:w-full print:max-w-none">
          <div className="max-w-7xl mx-auto space-y-6 print:max-w-none print:m-0 print:p-0 print:space-y-0">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
