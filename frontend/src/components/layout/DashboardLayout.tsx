import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { BottomNav } from './BottomNav';

export const DashboardLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans transition-colors selection:bg-indigo-500 selection:text-white">
      {/* Sidebar with Desktop Collapse & Mobile Slide-in Drawer */}
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out w-full ${
          // Zero margins on mobile; responsive margins on desktop
          isRtl
            ? collapsed ? 'md:mr-20' : 'md:mr-64'
            : collapsed ? 'md:ml-20' : 'md:ml-64'
        }`}
      >
        <Navbar onOpenMobileMenu={() => setMobileOpen(true)} />

        <main className="flex-1 w-full max-w-7xl mx-auto px-3.5 sm:px-6 py-4 sm:py-6 pb-24 md:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Quick Navigation */}
      <BottomNav onOpenMenu={() => setMobileOpen(true)} />
    </div>
  );
};
