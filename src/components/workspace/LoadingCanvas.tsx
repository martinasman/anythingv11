'use client';

import { useProjectStore } from '@/store/projectStore';
import { Check, Circle, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect } from 'react';

// Animated dots component
function AnimatedDots() {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return <span className="inline-block w-4">{dots}</span>;
}

// Typewriter effect for stage messages
function TypewriterText({ text }: { text: string }) {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    setDisplayedText('');
    let index = 0;
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 30);
    return () => clearInterval(interval);
  }, [text]);

  return <span>{displayedText}</span>;
}

export default function LoadingCanvas() {
  const { toolStatuses } = useProjectStore();
  const tools = Array.from(toolStatuses.values());

  // Find the currently running tool
  const runningTool = tools.find(t => t.status === 'running');

  return (
    <div className="flex flex-col items-center justify-center h-full bg-zinc-50 dark:bg-zinc-900">
      {/* Logo with pulse animation when working */}
      <div className={`mb-8 ${runningTool ? 'animate-pulse' : ''}`}>
        <Image
          src="/anythingicondark.png"
          alt="Anything"
          width={64}
          height={64}
          className="dark:hidden"
        />
        <Image
          src="/anythingiconlight.png"
          alt="Anything"
          width={64}
          height={64}
          className="hidden dark:block"
        />
      </div>

      {/* Current activity - large flowing text */}
      {runningTool && (
        <div className="mb-6 text-center max-w-md px-4">
          <p className="text-lg font-medium text-zinc-900 dark:text-white">
            {runningTool.displayName}<AnimatedDots />
          </p>
          {runningTool.currentStage && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 min-h-[20px]">
              <TypewriterText text={runningTool.currentStage} />
            </p>
          )}
        </div>
      )}

      {/* Tool statuses - compact list */}
      <div className="space-y-2 w-72">
        {tools.length === 0 ? (
          // Fallback when no tools have started yet
          <div className="flex items-center gap-3 justify-center">
            <Loader2 className="w-4 h-4 text-zinc-500 animate-spin" />
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              Starting<AnimatedDots />
            </span>
          </div>
        ) : (
          tools.map((tool) => (
            <div
              key={tool.name}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300 ${
                tool.status === 'running'
                  ? 'bg-zinc-100 dark:bg-zinc-800'
                  : ''
              }`}
            >
              {/* Status icon */}
              {tool.status === 'complete' && (
                <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
              )}
              {tool.status === 'running' && (
                <Loader2 className="w-4 h-4 text-blue-500 animate-spin flex-shrink-0" />
              )}
              {tool.status === 'pending' && (
                <Circle className="w-4 h-4 text-zinc-300 dark:text-zinc-600 flex-shrink-0" />
              )}
              {tool.status === 'error' && (
                <Circle className="w-4 h-4 text-red-500 flex-shrink-0" />
              )}

              {/* Status text */}
              <div className="flex-1 min-w-0">
                <span className={`text-sm block truncate ${
                  tool.status === 'complete'
                    ? 'text-zinc-600 dark:text-zinc-400'
                    : tool.status === 'running'
                    ? 'text-zinc-900 dark:text-white font-medium'
                    : tool.status === 'error'
                    ? 'text-red-500'
                    : 'text-zinc-400 dark:text-zinc-500'
                }`}>
                  {tool.displayName}
                </span>
              </div>

              {/* Duration for completed - only show if we have a meaningful value */}
              {tool.status === 'complete' && tool.duration && tool.duration.length > 0 && (
                <span className="text-xs text-zinc-400 dark:text-zinc-500 flex-shrink-0">
                  {tool.duration}
                </span>
              )}
            </div>
          ))
        )}
      </div>

      {/* Progress shimmer bar */}
      {runningTool && (
        <div className="mt-8 w-64 h-1 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 animate-shimmer"
               style={{
                 backgroundSize: '200% 100%',
                 animation: 'shimmer 2s ease-in-out infinite'
               }}
          />
        </div>
      )}

      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}
