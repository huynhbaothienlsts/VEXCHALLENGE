import { useCallback, useEffect, useState } from 'react';
import { createInitialProject, normalizeProject } from '../data/challenge';

const STORAGE_KEY = 'vex-challenge-control-center-v2';

const readStoredProject = () => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? normalizeProject(JSON.parse(stored)) : createInitialProject();
  } catch {
    return createInitialProject();
  }
};

const setAtPath = (source, path, nextValue) => {
  const keys = Array.isArray(path) ? path : path.split('.');
  const root = Array.isArray(source) ? [...source] : { ...source };
  let cursor = root;

  keys.forEach((key, index) => {
    const current = cursor[key];
    if (index === keys.length - 1) {
      cursor[key] = typeof nextValue === 'function' ? nextValue(current) : nextValue;
      return;
    }
    cursor[key] = Array.isArray(current) ? [...current] : { ...(current || {}) };
    cursor = cursor[key];
  });

  return root;
};

export function useProject() {
  const [project, setProject] = useState(readStoredProject);
  const [saveState, setSaveState] = useState('Saved on this device');

  useEffect(() => {
    setSaveState('Saving…');
    const save = window.setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
        setSaveState('Saved on this device');
      } catch {
        setSaveState('Could not save on this device');
      }
    }, 120);
    return () => window.clearTimeout(save);
  }, [project]);

  const update = useCallback((path, value) => {
    setProject((current) => setAtPath(current, path, value));
  }, []);

  const resetAll = useCallback(() => {
    const fresh = createInitialProject();
    setProject(fresh);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // The fresh in-memory state still works if storage is unavailable.
    }
  }, []);

  return { project, setProject, update, resetAll, saveState };
}
