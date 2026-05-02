'use client';

import { useState } from 'react';
import Sidebar from "@/components/Sidebar";
import { SidebarContext } from '@/lib/sidebar-context';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <SidebarContext.Provider value={{ collapsed }}>
      <div className="min-h-screen flex">
        <Sidebar onCollapsedChange={setCollapsed} />
        <main style={{ marginLeft: collapsed ? '4rem' : '14rem' }} className="flex-1 transition-all duration-300">
          {children}
        </main>
      </div>
    </SidebarContext.Provider>
  );
}
