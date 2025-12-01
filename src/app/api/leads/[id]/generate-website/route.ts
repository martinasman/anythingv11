/**
 * Generate Website Preview for Lead
 *
 * Creates an industry-specific website preview for a lead
 * that can be shared with them via a preview link.
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { getIndustryWebsiteStyle, ARCHITECT_SYSTEM_PROMPT } from '@/config/agentPrompts';
import { nanoid } from 'nanoid';
import type { LeadWebsiteArtifact } from '@/types/database';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

interface AIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminClient();
    const { id: leadId } = await params;
    const body = await request.json();
    const { industry, businessName, projectId } = body;

    if (!leadId) {
      return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 });
    }

    // Get industry-specific website style
    const industryStyle = getIndustryWebsiteStyle(industry || 'default');

    // Generate preview token
    const previewToken = nanoid(21);

    // Build the prompt for website generation
    const prompt = buildWebsitePrompt(businessName, industry, industryStyle);

    // Generate website using AI
    const websiteFiles = await generateWebsiteWithAI(prompt);

    if (!websiteFiles) {
      return NextResponse.json(
        { error: 'Failed to generate website' },
        { status: 500 }
      );
    }

    // Calculate expiration (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Save to lead_websites table
    const { error: insertError } = await supabase
      .from('lead_websites')
      .insert({
        project_id: projectId,
        lead_id: leadId,
        preview_token: previewToken,
        data: {
          leadId,
          leadName: businessName,
          previewToken,
          files: websiteFiles,
          expiresAt: expiresAt.toISOString(),
        } as LeadWebsiteArtifact,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error('[GenerateWebsite] Error saving website:', insertError);
      return NextResponse.json(
        { error: 'Failed to save website preview' },
        { status: 500 }
      );
    }

    // Update lead with preview token
    await supabase
      .from('leads')
      .update({
        preview_token: previewToken,
        updated_at: new Date().toISOString(),
      })
      .eq('id', leadId);

    // Also update the leads artifact if it exists
    if (projectId) {
      const { data: artifact } = await supabase
        .from('artifacts')
        .select('*')
        .eq('project_id', projectId)
        .eq('type', 'leads')
        .single();

      if (artifact) {
        const leadsData = artifact.data;
        const updatedLeads = leadsData.leads?.map((lead: any) =>
          lead.id === leadId ? { ...lead, previewToken } : lead
        );

        await supabase
          .from('artifacts')
          .update({
            data: { ...leadsData, leads: updatedLeads },
            updated_at: new Date().toISOString(),
          })
          .eq('id', artifact.id);
      }
    }

    const previewUrl = `/preview/${previewToken}`;

    return NextResponse.json({
      success: true,
      previewToken,
      previewUrl,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error('[GenerateWebsite] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function buildWebsitePrompt(
  businessName: string,
  industry: string,
  style: ReturnType<typeof getIndustryWebsiteStyle>
): string {
  return `Generate a STUNNING, industry-specific landing page for:

BUSINESS: ${businessName}
INDUSTRY: ${industry}

===== STYLE DIRECTIVE =====
Design Style: ${style.style}
Color Scheme: ${style.colorScheme}
Typography: ${style.typography}
Imagery Guidelines: ${style.imagery}
CTA Style: ${style.ctaStyle}

===== SECTIONS TO INCLUDE =====
${style.sections.map((s, i) => `${i + 1}. ${s}`).join('\n')}

===== CRITICAL REQUIREMENTS =====
1. Use placeholder images from https://placehold.co (e.g., https://placehold.co/600x400/1a1a1a/white?text=Hero+Image)
2. Include realistic placeholder content that matches the industry
3. Mobile-responsive design using Tailwind CSS CDN
4. Include smooth animations and hover effects
5. Professional look that would impress a business owner
6. Add a footer with "Website Preview - Powered by [Your Agency]"

===== OUTPUT FORMAT =====
Return ONLY a valid JSON object:
{
  "files": [
    {
      "path": "/index.html",
      "content": "<!DOCTYPE html>...",
      "type": "html"
    }
  ]
}

No markdown, no explanations - ONLY the JSON.`;
}

async function generateWebsiteWithAI(
  prompt: string
): Promise<Array<{ path: string; content: string; type: string }> | null> {
  if (!OPENROUTER_API_KEY) {
    console.error('[GenerateWebsite] No OpenRouter API key');
    return generateFallbackWebsite();
  }

  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4',
        messages: [
          { role: 'system', content: ARCHITECT_SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 12000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data: AIResponse = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    // Parse JSON from response
    let jsonContent = content;
    if (content.includes('```json')) {
      jsonContent = content.split('```json')[1].split('```')[0];
    } else if (content.includes('```')) {
      jsonContent = content.split('```')[1].split('```')[0];
    }

    const parsed = JSON.parse(jsonContent.trim());

    if (!parsed.files || !Array.isArray(parsed.files)) {
      throw new Error('Invalid response structure');
    }

    return parsed.files;
  } catch (error) {
    console.error('[GenerateWebsite] AI generation failed:', error);
    return generateFallbackWebsite();
  }
}

function generateFallbackWebsite(): Array<{ path: string; content: string; type: string }> {
  return [
    {
      path: '/index.html',
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your New Website</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; }
  </style>
</head>
<body class="bg-white text-gray-900">
  <header class="py-6 px-8 flex justify-between items-center border-b">
    <h1 class="text-2xl font-bold">Your Business</h1>
    <nav class="flex gap-6">
      <a href="#" class="text-gray-600 hover:text-gray-900">Services</a>
      <a href="#" class="text-gray-600 hover:text-gray-900">About</a>
      <a href="#" class="text-gray-600 hover:text-gray-900">Contact</a>
    </nav>
  </header>

  <main>
    <section class="py-20 px-8 text-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <h2 class="text-5xl font-bold mb-6">Welcome to Your New Website</h2>
      <p class="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
        This is a preview of what your professional website could look like.
        We can customize every aspect to match your brand and business needs.
      </p>
      <button class="bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-700 transition">
        Get Started
      </button>
    </section>

    <section class="py-16 px-8">
      <h3 class="text-3xl font-bold text-center mb-12">Our Services</h3>
      <div class="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        <div class="p-6 border rounded-xl hover:shadow-lg transition">
          <h4 class="text-xl font-semibold mb-3">Service One</h4>
          <p class="text-gray-600">Description of your first service offering.</p>
        </div>
        <div class="p-6 border rounded-xl hover:shadow-lg transition">
          <h4 class="text-xl font-semibold mb-3">Service Two</h4>
          <p class="text-gray-600">Description of your second service offering.</p>
        </div>
        <div class="p-6 border rounded-xl hover:shadow-lg transition">
          <h4 class="text-xl font-semibold mb-3">Service Three</h4>
          <p class="text-gray-600">Description of your third service offering.</p>
        </div>
      </div>
    </section>
  </main>

  <footer class="py-8 px-8 bg-gray-100 text-center text-gray-600">
    <p>Website Preview - Powered by Your Agency</p>
  </footer>
</body>
</html>`,
      type: 'html',
    },
  ];
}
