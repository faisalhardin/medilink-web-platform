import { useState, useCallback } from 'react';

export const useDrawer = (initialOpen = false) => {
  const [isOpen, setIsOpen] = useState(initialOpen);

  const openDrawer = useCallback(() => setIsOpen(true), []);
  const closeDrawer = useCallback(() => setIsOpen(false), []);
  const toggleDrawer = useCallback(() => setIsOpen(prev => !prev), []);

  return {
    isOpen,
    openDrawer,
    closeDrawer,
    toggleDrawer
  };
};
