'use client';

import { useState, useEffect } from 'react';
import { FileCode, Check, Loader2 } from 'lucide-react';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface CodeChange {
  file: string;
  description: string;
  before?: string;
  after?: string;
  timestamp: number;
  status: 'pending' | 'complete';
}

interface CodeChangeViewerProps {
  changes: CodeChange[];
  isStreaming: boolean;
}

// ============================================
// HELPER: GROUP CHANGES BY FILE
// ============================================

function groupChangesByFile(changes: CodeChange[]): Record<string, CodeChange[]> {
  return changes.reduce((acc, change) => {
    if (!acc[change.file]) {
      acc[change.file] = [];
    }
    acc[change.file].push(change);
    return acc;
  }, {} as Record<string, CodeChange[]>);
}

// ============================================
// HELPER: GET FILE ICON COLOR
// ============================================

function getFileColor(filename: string): string {
  if (filename.endsWith('.html')) return 'text-orange-500';
  if (filename.endsWith('.css')) return 'text-blue-500';
  if (filename.endsWith('.js')) return 'text-yellow-500';
  return 'text-zinc-500';
}

// ============================================
// CODE CHANGE VIEWER COMPONENT
// ============================================

export function CodeChangeViewer({ changes, isStreaming }: CodeChangeViewerProps) {
  const [isOpen, setIsOpen] = useState(true);

  // Auto-collapse when all changes complete and streaming stops
  useEffect(() => {
    const allComplete = changes.length > 0 && changes.every(c => c.status === 'complete');
    if (allComplete && !isStreaming) {
      const timer = setTimeout(() => {
        setIsOpen(false);
      }, 3000); // Stay open 3 seconds after completion
      return () => clearTimeout(timer);
    }
  }, [changes, isStreaming]);

  // Keep open while streaming
  useEffect(() => {
    if (isStreaming) {
      setIsOpen(true);
    }
  }, [isStreaming]);

  if (changes.length === 0) return null;

  const groupedChanges = groupChangesByFile(changes);
  const fileCount = Object.keys(groupedChanges).length;
  const totalChanges = changes.length;
  const completedChanges = changes.filter(c => c.status === 'complete').length;

  return (
    <div className="mb-4 rounded-xl bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/10 dark:to-blue-900/10 overflow-hidden border border-purple-200 dark:border-purple-700/30 shadow-sm">
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-purple-900 dark:text-purple-100 hover:bg-purple-100/50 dark:hover:bg-purple-800/20 transition-colors"
      >
        <span className="flex items-center gap-2.5">
          <FileCode className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          <span>
            Code Changes: {completedChanges}/{totalChanges} • {fileCount} file{fileCount > 1 ? 's' : ''}
          </span>
        </span>
      </button>

      {/* Content - collapsible */}
      {isOpen && (
        <div className="px-4 pb-4 pt-2 space-y-3">
          {Object.entries(groupedChanges).map(([file, fileChanges]) => (
            <div key={file} className="space-y-1.5">
              {/* File header */}
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                <FileCode className={`h-3.5 w-3.5 ${getFileColor(file)}`} />
                <span>{file}</span>
              </div>

              {/* Changes for this file */}
              <div className="pl-5 space-y-1.5">
                {fileChanges.map((change, idx) => (
                  <div
                    key={`${change.file}-${idx}`}
                    className={`flex items-start gap-2.5 text-xs py-1.5 px-2.5 rounded-lg transition-all ${
                      change.status === 'complete'
                        ? 'bg-green-50 dark:bg-green-900/10 border-l-2 border-green-500'
                        : 'bg-blue-50 dark:bg-blue-900/10 border-l-2 border-blue-500 animate-pulse'
                    }`}
                  >
                    {change.status === 'complete' ? (
                      <Check className="h-3 w-3 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <Loader2 className="h-3 w-3 animate-spin text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="text-zinc-700 dark:text-zinc-200 font-medium leading-relaxed">
                        {change.description}
                      </div>

                      {/* Show before/after if available */}
                      {change.before && change.after && (
                        <div className="mt-1 flex items-center gap-2 text-[10px] font-mono">
                          <span className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded truncate max-w-[120px]">
                            {change.before}
                          </span>
                          <span className="text-zinc-400">→</span>
                          <span className="text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded truncate max-w-[120px]">
                            {change.after}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
