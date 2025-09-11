// File: src/modalRoutes.ts
import React from 'react';

// Define a type for your modal routes
interface ModalRoute {
  // Use a function that returns a dynamic import for the component
  component: () => Promise<{ default: React.ComponentType<any> }>;
  // Add any other route-specific data if needed
}

// Map of route paths to modal components
// Use dynamic segments like :id to match variable parts of the path
export const modalRoutes: Record<string, ModalRoute> = {
  '/patient-visit/:id': {
    // This function should return the result of a dynamic import
    // Adjust the path './pages/patient-visit/[id]' to your actual component file location
    component: () => import('./pages/PatientVisitDetail'),
  },
  // Add other modal routes here
  // '/another-modal-path/:someParam': {
  //   component: () => import('./pages/AnotherModalPage'),
  // },
};
