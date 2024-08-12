import { useEffect } from 'react';

export const useHotkey = (key: string, callback: () => void) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === key) {
        callback();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [key, callback]);
};
