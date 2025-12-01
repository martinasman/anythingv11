import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import type { LeadsArtifact, LeadActivity } from '@/types/database';

export async function POST(request: Request) {
  try {
    const supabase = createAdminClient();
    const { projectId, activity } = await request.json();

    if (!projectId || !activity) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, activity' },
        { status: 400 }
      );
    }

    // Fetch current leads artifact
    const { data: artifact, error: fetchError } = await supabase
      .from('artifacts')
      .select('*')
      .eq('project_id', projectId)
      .eq('type', 'leads')
      .single();

    if (fetchError) {
      console.error('[API] Error fetching leads artifact:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch leads' },
        { status: 500 }
      );
    }

    if (!artifact) {
      return NextResponse.json(
        { error: 'Leads artifact not found' },
        { status: 404 }
      );
    }

    // Add activity to the artifact
    const leadsData = artifact.data as LeadsArtifact;
    const updatedActivities = [...(leadsData.activities || []), activity as LeadActivity];

    // Save updated artifact
    const { error: updateError } = await supabase
      .from('artifacts')
      .update({
        data: { ...leadsData, activities: updatedActivities },
        updated_at: new Date().toISOString()
      })
      .eq('id', artifact.id);

    if (updateError) {
      console.error('[API] Error updating leads artifact:', updateError);
      return NextResponse.json(
        { error: 'Failed to add activity' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, activity });
  } catch (error) {
    console.error('[API] Activity logging error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
