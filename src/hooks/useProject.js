import { useEffect, useRef, useState } from 'react';
import { createInitialProject, STORAGE_KEY } from '../data/challenge';

const loadProject = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...createInitialProject(), ...JSON.parse(saved) } : createInitialProject();
  } catch {
    return createInitialProject();
  }
};

export function useProject() {
  const [project, setProject] = useState(loadProject);
  const [saveState, setSaveState] = useState('Saved locally');
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) firstRender.current = false;
    setSaveState('Saving…');
    const timer = window.setTimeout(() => {
      const payload = { ...project, lastSaved: new Date().toISOString() };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        setSaveState('Saved locally');
      } catch {
        setSaveState('Storage is full — export your project');
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [project]);

  const update = (path, value) => {
    setProject((previous) => {
      const next = structuredClone(previous);
      const keys = Array.isArray(path) ? path : path.split('.');
      let target = next;
      keys.slice(0, -1).forEach((key) => { target = target[key]; });
      const finalKey = keys.at(-1);
      target[finalKey] = typeof value === 'function' ? value(target[finalKey]) : value;
      return next;
    });
  };

  const replaceProject = (value) => setProject({ ...createInitialProject(), ...value });
  const resetProject = () => {
    localStorage.removeItem(STORAGE_KEY);
    setProject(createInitialProject());
  };

  return { project, update, replaceProject, resetProject, saveState };
}
