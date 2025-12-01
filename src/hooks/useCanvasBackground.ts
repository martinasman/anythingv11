'use client';

import { useState, useEffect, CSSProperties } from 'react';

// Background options - shared across all canvas views
export const backgrounds = [
  { id: 'dark', type: 'color', value: '#000000', label: 'Dark', isDark: true },
  { id: 'light', type: 'color', value: '#f4f4f5', label: 'Light', isDark: false },
  { id: 'slate', type: 'color', value: '#0f172a', label: 'Slate', isDark: true },
  { id: 'zinc', type: 'color', value: '#27272a', label: 'Zinc', isDark: true },
  { id: 'anime', type: 'image', value: '/anythingAnimeBackground1.png', label: 'Anime', isDark: true },
  { id: 'cosmos', type: 'image', value: '/cosmos.jpg', label: 'Cosmos', isDark: true },
  { id: 'satellite', type: 'image', value: '/sattelite.jpg', label: 'Satellite', isDark: true },
] as const;

export type BackgroundId = typeof backgrounds[number]['id'];

interface UseCanvasBackgroundReturn {
  selectedBgId: BackgroundId;
  setSelectedBgId: (id: BackgroundId) => void;
  bgStyle: CSSProperties;
  isDark: boolean;
  mounted: boolean;
}

export function useCanvasBackground(): UseCanvasBackgroundReturn {
  const [selectedBgId, setSelectedBgId] = useState<BackgroundId>('dark');
  const [mounted, setMounted] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('overviewBgId');
    if (saved && backgrounds.find(bg => bg.id === saved)) {
      setSelectedBgId(saved as BackgroundId);
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('overviewBgId', selectedBgId);
    }
  }, [selectedBgId, mounted]);

  const selectedBg = backgrounds.find(bg => bg.id === selectedBgId) || backgrounds[0];
  const isDark = selectedBg.isDark;

  // Background style
  const bgStyle: CSSProperties = selectedBg.type === 'image'
    ? { backgroundImage: `url(${selectedBg.value})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { backgroundColor: selectedBg.value };

  return {
    selectedBgId,
    setSelectedBgId,
    bgStyle,
    isDark,
    mounted,
  };
}
