// src/hooks/useRouteParams.ts
import { useParams } from 'react-router-dom';

export function useRouteParams(props: any = {}) {
  const params = useParams();
  
  // Combine params from useParams() and props, with props taking precedence
  return { ...params, ...props };
}
