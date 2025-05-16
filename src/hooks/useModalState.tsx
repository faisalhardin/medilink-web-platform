// src/hooks/useModalState.tsx
import { useLocation } from 'react-router-dom';

export function useModalState<T = any>(options?: { state?: T }): T | undefined {
  // Get location from React Router
  const location = useLocation();
  
  // First check options.state (directly passed)
  if (options?.state) {
    return options.state;
  }
  
  // Fall back to React Router's location state
  return location.state as T | undefined;
}
