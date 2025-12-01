import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { projectId, type, data } = body;

    // Validate required fields
    if (!projectId || !type || !data) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, type, data' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch current artifact to get version
    const { data: currentArtifact, error: fetchError } = await (supabase
      .from('artifacts') as any)
      .select('*')
      .eq('project_id', projectId)
      .eq('type', type)
      .single();

    if (fetchError) {
      console.error('[API] Error fetching artifact:', fetchError);
      return NextResponse.json(
        { error: 'Artifact not found' },
        { status: 404 }
      );
    }

    // Update artifact with incremented version
    const { data: updatedArtifact, error: updateError } = await (supabase
      .from('artifacts') as any)
      .update({
        data: data,
        version: (currentArtifact.version || 1) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('project_id', projectId)
      .eq('type', type)
      .select()
      .single();

    if (updateError) {
      console.error('[API] Error updating artifact:', updateError);
      return NextResponse.json(
        { error: 'Failed to update artifact' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      artifact: updatedArtifact,
    });
  } catch (error) {
    console.error('[API] Artifact update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
