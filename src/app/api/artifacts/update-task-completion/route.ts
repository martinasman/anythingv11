import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { projectId, taskId, completed } = await request.json();

    if (!projectId || !taskId || typeof completed !== 'boolean') {
      return NextResponse.json({ success: false, error: 'Invalid parameters' }, { status: 400 });
    }

    const supabase = await createClient();

    // Get current artifact
    const { data: artifact, error: fetchError } = await (supabase.from('artifacts') as any)
      .select('*')
      .eq('project_id', projectId)
      .eq('type', 'first_week_plan')
      .single();

    if (fetchError) {
      console.error('Failed to fetch artifact:', fetchError);
      return NextResponse.json({ success: false, error: 'Artifact not found' }, { status: 404 });
    }

    // Update taskCompletion field
    const updatedData = {
      ...artifact.data,
      taskCompletion: {
        ...(artifact.data.taskCompletion || {}),
        [taskId]: completed,
      },
    };

    // Save back to DB
    const { error: updateError } = await (supabase.from('artifacts') as any)
      .update({ data: updatedData, updated_at: new Date().toISOString() })
      .eq('id', artifact.id);

    if (updateError) {
      console.error('Failed to update artifact:', updateError);
      return NextResponse.json({ success: false, error: 'Failed to update' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Task completion update error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
