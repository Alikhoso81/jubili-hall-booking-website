import { useCallback, useRef, useState } from 'react';

export interface ToastState {
  type: 'success' | 'error';
  msg: string;
}

export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((type: 'success' | 'error', msg: string) => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ type, msg });
    timer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  const success = useCallback((msg: string) => show('success', msg), [show]);
  const error = useCallback((msg: string) => show('error', msg), [show]);

  return { toast, success, error };
}
