// src/modalComponentRegistry.ts
import { ComponentType, lazy } from 'react';

// Define the interface for components that can be rendered in a modal
export interface ModalComponentProps {
    id?: string;
    state?: Record<string, any>;
    [key: string]: any; // Allow for other props
  }

// Map route patterns to component imports
// The keys should match the patterns in your route definitions
export const modalComponents: Record<string, React.LazyExoticComponent<ComponentType<ModalComponentProps>>> = {
  '/patient-visit/:id': lazy(() => import('./pages/PatientVisitDetail')),
  '/patient': lazy(() => import('./pages/Patient')),
  // Add more mappings as needed
};

// Helper function to find the component for a given path
export function findComponentForPath(path: string): React.LazyExoticComponent<any> | null {
  // Simple pattern matching (you might need something more sophisticated)
  for (const pattern in modalComponents) {
    // Convert route pattern to regex
    // e.g., '/patient-visit/:id' becomes /^\/patient-visit\/[^/]+$/
    const regexPattern = new RegExp(
      '^' + pattern.replace(/:[^/]+/g, '[^/]+') + '$'
    );
    
    if (regexPattern.test(path)) {
      return modalComponents[pattern];
    }
  }
  
  return null;
}
