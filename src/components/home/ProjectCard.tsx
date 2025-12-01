'use client';

import { useRouter } from 'next/navigation';
import { Clock, Trash2, Copy, Share2 } from 'lucide-react';
import type { Project } from '@/types/database';
import { formatRelativeTime } from '@/utils/formatRelativeTime';

interface ProjectCardProps {
  project: Project;
  index: number;
  onDelete?: (projectId: string) => void;
}

// Generate a consistent gradient based on project name
function getGradient(name: string): string {
  const gradients = [
    'from-purple-500 to-pink-500',
    'from-green-500 to-emerald-500',
    'from-orange-500 to-red-500',
    'from-indigo-500 to-purple-500',
    'from-pink-500 to-rose-500',
    'from-amber-500 to-orange-500',
  ];

  // Simple hash based on name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return gradients[Math.abs(hash) % gradients.length];
}

// Get status badge color
function getStatusColor(status: Project['status']): string {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    case 'completed':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    case 'archived':
      return 'bg-zinc-100 text-zinc-600 dark:bg-slate-800 dark:text-slate-400';
    default:
      return 'bg-zinc-100 text-zinc-600 dark:bg-slate-800 dark:text-slate-400';
  }
}

export default function ProjectCard({ project, index, onDelete }: ProjectCardProps) {
  const router = useRouter();
  const gradient = getGradient(project.name);

  const handleClick = () => {
    router.push(`/p/${project.id}`);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(project.id);
  };

  const handleRemix = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement remix functionality
    console.log('Remix project:', project.id);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/p/${project.id}`;
    navigator.clipboard.writeText(url);
    // TODO: Add toast notification
    console.log('Copied to clipboard:', url);
  };

  return (
    <div
      onClick={handleClick}
      className={`group p-4 rounded-2xl bg-white dark:bg-neutral-800/50 border border-zinc-200 dark:border-neutral-700/50 hover-scale cursor-pointer transition-all animate-fade-in-up stagger-${Math.min(index + 1, 6)}`}
    >
      {/* 16:9 Preview */}
      <div className={`aspect-video rounded-xl bg-gradient-to-br ${gradient} mb-3 overflow-hidden`}>
      </div>

      {/* Project info */}
      <div className="space-y-2">
        <h3 className="font-medium text-zinc-900 dark:text-white truncate">
          {project.name}
        </h3>

        {project.description && (
          <p className="text-xs text-zinc-500 dark:text-slate-400 line-clamp-2">
            {project.description}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-1 text-xs text-zinc-400">
            <Clock size={12} />
            <span>{formatRelativeTime(project.updated_at)}</span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={handleShare}
              className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-slate-300 hover:bg-zinc-100 dark:hover:bg-slate-700 rounded transition-colors"
              aria-label="Share"
              title="Copy link"
            >
              <Share2 size={14} />
            </button>
            <button
              onClick={handleRemix}
              className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-slate-300 hover:bg-zinc-100 dark:hover:bg-slate-700 rounded transition-colors"
              aria-label="Remix"
              title="Remix"
            >
              <Copy size={14} />
            </button>
            <button
              onClick={handleDelete}
              className="p-1.5 text-zinc-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
              aria-label="Delete"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
