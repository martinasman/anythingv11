import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import type { LeadsArtifact, Lead } from '@/types/database';

export async function PATCH(request: Request) {
  try {
    const supabase = createAdminClient();
    const { projectId, leadId, status } = await request.json();

    if (!projectId || !leadId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, leadId, status' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses: Lead['status'][] = ['new', 'contacted', 'responded', 'closed', 'lost'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }

    // Update dedicated leads table (primary source)
    const { error: leadUpdateError } = await supabase
      .from('leads')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', leadId);

    if (leadUpdateError) {
      console.error('[API] Error updating lead in leads table:', leadUpdateError);
      // Don't fail - the lead might only exist in artifacts
    }

    // Also update artifacts for backwards compatibility (if artifact exists)
    const { data: artifact } = await supabase
      .from('artifacts')
      .select('*')
      .eq('project_id', projectId)
      .eq('type', 'leads')
      .single();

    if (artifact) {
      const leadsData = artifact.data as LeadsArtifact;
      const updatedLeads = leadsData.leads.map(lead =>
        lead.id === leadId ? { ...lead, status } : lead
      );

      const { error: artifactUpdateError } = await supabase
        .from('artifacts')
        .update({
          data: { ...leadsData, leads: updatedLeads },
          updated_at: new Date().toISOString()
        })
        .eq('id', artifact.id);

      if (artifactUpdateError) {
        console.error('[API] Error updating leads artifact:', artifactUpdateError);
        // Non-fatal - the dedicated leads table was already updated
      }
    }

    return NextResponse.json({ success: true, leadId, status });
  } catch (error) {
    console.error('[API] Lead status update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
