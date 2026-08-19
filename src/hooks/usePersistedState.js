import { useState, useCallback } from 'react';
import { loadJSON, saveJSON } from '../data/storage.js';

/**
 * Same shape as useState, but the value is read from localStorage on first
 * render and written back to localStorage on every update.
 */
export function usePersistedState(key, fallback) {
  const [value, setValue] = useState(() => loadJSON(key, fallback));

  const update = useCallback((next) => {
    setValue(prev => {
      const resolved = typeof next === 'function' ? next(prev) : next;
      saveJSON(key, resolved);
      return resolved;
    });
  }, [key]);

  return [value, update];
}
