import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import type { Lead, LeadsArtifact } from '@/types/database';

export async function POST(request: Request) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();
    const { projectId, name, email, company, message, phone } = body;

    // Validate required fields
    if (!projectId) {
      return NextResponse.json(
        { success: false, error: 'Missing projectId' },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Create new lead from form submission
    const newLead: Lead = {
      id: crypto.randomUUID(),
      companyName: company || name || 'Website Visitor',
      industry: 'Inbound Lead',
      website: undefined,
      contactName: name,
      contactEmail: email,
      contactLinkedIn: undefined,
      painPoints: message ? [message] : ['Submitted contact form'],
      score: 80, // High score for inbound leads (1-100 scale)
      scoreBreakdown: ['Inbound lead (+50)', 'Proactive outreach (+30)'],
      icpScore: 8,
      icpMatchReasons: ['Inbound lead - proactively reached out'],
      buyingSignals: ['Submitted website contact form'],
      suggestedAngle: 'Warm lead - follow up promptly',
      status: 'new',
    };

    // Fetch existing leads artifact
    const { data: artifact, error: fetchError } = await supabase
      .from('artifacts')
      .select('*')
      .eq('project_id', projectId)
      .eq('type', 'leads')
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('[API] Error fetching leads artifact:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch leads' },
        { status: 500 }
      );
    }

    if (artifact) {
      // Add to existing leads (at the beginning for visibility)
      const leadsData = artifact.data as LeadsArtifact;
      const updatedLeads = [newLead, ...leadsData.leads];

      const { error: updateError } = await supabase
        .from('artifacts')
        .update({
          data: { ...leadsData, leads: updatedLeads },
          updated_at: new Date().toISOString(),
        })
        .eq('id', artifact.id);

      if (updateError) {
        console.error('[API] Error updating leads:', updateError);
        return NextResponse.json(
          { success: false, error: 'Failed to save lead' },
          { status: 500 }
        );
      }
    } else {
      // Create new leads artifact
      const newLeadsData: LeadsArtifact = {
        leads: [newLead],
        activities: [],
        idealCustomerProfile: {
          industries: ['Inbound'],
          companySize: 'varies',
          painPoints: ['Needs our services'],
          budget: 'Unknown',
        },
        searchCriteria: 'Website form submissions',
      };

      const { error: insertError } = await supabase
        .from('artifacts')
        .insert({
          project_id: projectId,
          type: 'leads',
          data: newLeadsData,
          version: 1,
        });

      if (insertError) {
        console.error('[API] Error creating leads artifact:', insertError);
        return NextResponse.json(
          { success: false, error: 'Failed to save lead' },
          { status: 500 }
        );
      }
    }

    console.log('[API] Lead submitted successfully:', newLead.id);

    return NextResponse.json({
      success: true,
      leadId: newLead.id,
      message: 'Thank you! We will be in touch soon.',
    });
  } catch (error) {
    console.error('[API] Lead submission error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit form' },
      { status: 500 }
    );
  }
}

// Support CORS for external submissions (when website is published)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
