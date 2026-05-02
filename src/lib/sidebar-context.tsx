'use client';

import { createContext, useContext } from 'react';

export const SidebarContext = createContext<{ collapsed: boolean }>({ collapsed: false });

export function useSidebar() {
  return useContext(SidebarContext);
}