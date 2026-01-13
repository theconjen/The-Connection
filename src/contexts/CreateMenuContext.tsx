/**
 * CREATE MENU CONTEXT - The Connection Mobile App
 * -----------------------------------------------
 * Global state management for the fan menu
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface CreateMenuContextType {
  isMenuOpen: boolean;
  openMenu: () => void;
  closeMenu: () => void;
}

const CreateMenuContext = createContext<CreateMenuContextType | undefined>(undefined);

export function CreateMenuProvider({ children }: { children: ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const openMenu = () => {
    setIsMenuOpen(true);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };


  return (
    <CreateMenuContext.Provider value={{ isMenuOpen, openMenu, closeMenu }}>
      {children}
    </CreateMenuContext.Provider>
  );
}

export function useCreateMenu() {
  const context = useContext(CreateMenuContext);
  if (!context) {
    throw new Error('useCreateMenu must be used within CreateMenuProvider');
  }
  return context;
}
