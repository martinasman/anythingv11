'use client';

import { Moon, Sun, Rocket, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { useProjectStore } from '@/store/projectStore';


interface ToolbarProps {
  projectName?: string;
}

export default function Toolbar({ projectName = 'New Project' }: ToolbarProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { canvasState, setCanvasState } = useProjectStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleBackToOverview = () => {
    setCanvasState({ type: 'overview' });
  };

  return (
    <div className="z-50 h-10" style={{ background: 'var(--surface-1)' }}>
      <div className="flex items-center justify-between h-full px-4">
        {/* Left Section - Logo & Project */}
        <div className="flex items-center gap-3">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            {mounted && (
              <Image
                src={theme === 'dark' ? '/anythingiconlight.png' : '/anythingicondark.png'}
                alt="Anything"
                width={20}
                height={20}
                className="transition-opacity duration-300"
              />
            )}
            {!mounted && <div className="w-5 h-5" />}
          </Link>

          {/* Divider */}
          <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-700" />

          {/* Project Name */}
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {projectName}
          </span>

          {/* Back to Overview Button - Only show when not on overview */}
          {canvasState.type !== 'overview' && canvasState.type !== 'empty' && (
            <>
              <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-700" />
              <button
                onClick={handleBackToOverview}
                className="flex items-center gap-1.5 px-2 h-7 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
                aria-label="Back to Overview"
              >
                <ArrowLeft size={14} strokeWidth={1.5} />
                <span>Overview</span>
              </button>
            </>
          )}
        </div>

        {/* Center Section - Empty (spacer) */}
        <div className="flex-1" />

        {/* Right Section - Theme & Publish */}
        <div className="flex items-center gap-1.5">
          {/* Theme Toggle */}
          {mounted && (
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center w-7 h-7 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun size={14} strokeWidth={1.5} />
              ) : (
                <Moon size={14} strokeWidth={1.5} />
              )}
            </button>
          )}

          {/* Publish Button */}
          <button
            className="flex items-center gap-1.5 px-3 h-7 text-xs font-medium text-white bg-zinc-900 dark:bg-white dark:text-zinc-900 rounded-md hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
            aria-label="Publish"
          >
            <Rocket size={12} />
            <span>Publish</span>
          </button>
        </div>
      </div>
    </div>
  );
}
