'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/utils/supabase/client';
import type { Project } from '@/types/database';
import ProjectCard from './ProjectCard';
import Container from '../ui/Container';
import { FolderOpen, X } from 'lucide-react';

function SkeletonCard() {
  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-neutral-800/50 border border-zinc-200 dark:border-neutral-700/50 animate-pulse">
      {/* 16:9 preview skeleton */}
      <div className="aspect-video rounded-xl bg-zinc-200 dark:bg-neutral-700 mb-3" />
      <div className="space-y-2">
        <div className="h-5 bg-zinc-200 dark:bg-neutral-700 rounded w-3/4" />
        <div className="h-3 bg-zinc-200 dark:bg-neutral-700 rounded w-full" />
        <div className="h-3 bg-zinc-200 dark:bg-neutral-700 rounded w-2/3" />
        <div className="flex items-center justify-between pt-2">
          <div className="h-3 bg-zinc-200 dark:bg-neutral-700 rounded w-16" />
          {/* Action buttons skeleton */}
          <div className="flex items-center gap-1">
            <div className="h-6 w-6 bg-zinc-200 dark:bg-neutral-700 rounded" />
            <div className="h-6 w-6 bg-zinc-200 dark:bg-neutral-700 rounded" />
            <div className="h-6 w-6 bg-zinc-200 dark:bg-neutral-700 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProjectDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function fetchProjects() {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        const { data, error } = await (supabase
          .from('projects') as any)
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(9);

        if (error) throw error;
        setProjects(data || []);
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      } finally {
        setIsLoading(false);
      }
    }

    if (!authLoading) {
      fetchProjects();
    }
  }, [user, authLoading]);

  const handleDeleteClick = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setProjectToDelete(project);
      setDeleteModalOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;

    setIsDeleting(true);
    try {
      const supabase = createClient();
      const { error } = await (supabase
        .from('projects') as any)
        .delete()
        .eq('id', projectToDelete.id);

      if (error) throw error;

      // Remove from local state
      setProjects(prev => prev.filter(p => p.id !== projectToDelete.id));
      setDeleteModalOpen(false);
      setProjectToDelete(null);
    } catch (error) {
      console.error('Failed to delete project:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Don't render anything if not authenticated
  if (authLoading) return null;
  if (!user) return null;

  return (
    <section className="py-20 sm:py-28">
      <Container>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
            Your Projects
          </h2>
          <p className="text-sm text-zinc-500 dark:text-neutral-400 mt-1">
            Continue where you left off
          </p>
        </div>

        {isLoading ? (
          // Loading skeleton
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : projects.length === 0 ? (
          // Empty state
          <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-zinc-200 dark:border-neutral-700">
            <FolderOpen className="w-12 h-12 mx-auto text-zinc-300 dark:text-neutral-600 mb-4" strokeWidth={1} />
            <h3 className="text-lg font-medium text-zinc-600 dark:text-neutral-400 mb-1">
              No projects yet
            </h3>
            <p className="text-sm text-zinc-400 dark:text-neutral-500">
              Create your first project using the input above
            </p>
          </div>
        ) : (
          // Projects grid
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project, index) => (
              <ProjectCard
                key={project.id}
                project={project}
                index={index}
                onDelete={handleDeleteClick}
              />
            ))}
          </div>
        )}
      </Container>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && projectToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 backdrop-blur-sm"
          onClick={() => !isDeleting && setDeleteModalOpen(false)}
        >
          <div
            className="relative w-full max-w-md mx-4 p-6 bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-neutral-800"
            onClick={e => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => !isDeleting && setDeleteModalOpen(false)}
              className="absolute top-4 right-4 p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-neutral-300 rounded transition-colors"
              disabled={isDeleting}
            >
              <X size={20} />
            </button>

            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
              Delete Project
            </h3>
            <p className="text-sm text-zinc-600 dark:text-neutral-400 mb-6">
              Are you sure you want to delete <span className="font-medium text-zinc-900 dark:text-white">{projectToDelete.name}</span>? This action cannot be undone.
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-neutral-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-sm font-medium bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
