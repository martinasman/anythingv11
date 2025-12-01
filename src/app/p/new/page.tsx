'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import WorkspaceLayout from '@/components/workspace/WorkspaceLayout';
import { useProjectStore } from '@/store/projectStore';

function NewProjectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const { setInitialData } = useProjectStore();
  const [projectId, setProjectId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasCreated = useRef(false);

  const prompt = searchParams?.get('prompt') || '';
  const modelId = searchParams?.get('model') || 'google/gemini-3-pro-preview';

  // Create project and redirect
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      // Store pending project and redirect to sign in
      sessionStorage.setItem('pendingProject', JSON.stringify({ prompt, modelId }));
      router.push('/signin?redirect=/');
      return;
    }

    if (hasCreated.current || !prompt) return;
    hasCreated.current = true;

    async function createProject() {
      try {
        const supabase = createClient();
        const { data: project, error: createError } = await (supabase
          .from('projects') as any)
          .insert({
            name: prompt.slice(0, 50),
            description: prompt,
            status: 'active',
            user_id: user!.id,
            model_id: modelId,
          })
          .select()
          .single();

        if (createError) throw createError;

        // Initialize store with the new project
        setInitialData(project, [], []);
        setProjectId(project.id);

        // Update URL without full navigation (keeps components mounted)
        window.history.replaceState(null, '', `/p/${project.id}?prompt=${encodeURIComponent(prompt)}`);

        // Dispatch auto-submit event for the chat
        requestAnimationFrame(() => {
          const event = new CustomEvent('autoSubmitPrompt', {
            detail: { prompt },
          });
          window.dispatchEvent(event);
        });
      } catch (err) {
        console.error('Failed to create project:', err);
        setError('Failed to create project. Please try again.');
        hasCreated.current = false;
      }
    }

    createProject();
  }, [user, authLoading, prompt, modelId, router, setInitialData]);

  // Show error state
  if (error) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-zinc-50 dark:bg-slate-950">
        <div className="text-center space-y-3">
          <div className="text-red-500 text-sm">{error}</div>
          <button
            onClick={() => router.push('/')}
            className="text-xs text-blue-500 hover:text-blue-600 underline"
          >
            Return to home
          </button>
        </div>
      </div>
    );
  }

  // Show workspace immediately while project creates in background
  return <WorkspaceLayout projectId={projectId || 'new'} />;
}

export default function NewProjectPage() {
  return (
    <Suspense fallback={
      <div className="h-screen w-full flex items-center justify-center" style={{ background: 'var(--surface-1)' }}>
        <div className="w-6 h-6 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <NewProjectContent />
    </Suspense>
  );
}
