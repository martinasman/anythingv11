import { createClient } from '@/utils/supabase/server';
import WorkspaceHydration from '@/components/workspace/WorkspaceHydration';
import type { Project, Message, Artifact } from '@/types/database';

interface WorkspacePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch all data in parallel for faster loading
  const [projectResult, messagesResult, artifactsResult] = await Promise.all([
    (supabase.from('projects') as any)
      .select('*')
      .eq('id', id)
      .single() as Promise<{ data: Project | null }>,
    (supabase.from('messages') as any)
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: true }) as Promise<{ data: Message[] | null }>,
    (supabase.from('artifacts') as any)
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: false }) as Promise<{ data: Artifact[] | null }>,
  ]);

  const project = projectResult.data;
  const messages = messagesResult.data;
  const artifacts = artifactsResult.data;

  console.log('[Workspace Page] Loaded artifacts:', artifacts?.length || 0);
  artifacts?.forEach(a => console.log('[Workspace Page] Artifact type:', a.type));

  return (
    <WorkspaceHydration
      projectId={id}
      initialProject={project}
      initialMessages={messages || []}
      initialArtifacts={artifacts || []}
    />
  );
}
