/**
 * Website Preview Page
 *
 * Displays the generated website preview for a lead.
 * Previews expire after 30 days.
 */

import { createAdminClient } from '@/utils/supabase/admin';
import { notFound } from 'next/navigation';
import type { LeadWebsiteArtifact } from '@/types/database';

interface PreviewPageProps {
  params: Promise<{ token: string }>;
}

export default async function PreviewPage({ params }: PreviewPageProps) {
  const supabase = createAdminClient();
  const { token } = await params;

  // Fetch the website data
  const { data: websiteData, error } = await supabase
    .from('lead_websites')
    .select('*')
    .eq('preview_token', token)
    .single();

  if (error || !websiteData) {
    notFound();
  }

  // Check if expired
  if (websiteData.expires_at && new Date(websiteData.expires_at) < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Preview Expired</h1>
          <p className="text-gray-600 mb-6">
            This website preview has expired. Please contact us to generate a new preview.
          </p>
          <div className="text-sm text-gray-400">Expired on: {new Date(websiteData.expires_at).toLocaleDateString()}</div>
        </div>
      </div>
    );
  }

  const websiteArtifact = websiteData.data as LeadWebsiteArtifact;
  const indexFile = websiteArtifact.files?.find(
    (f) => f.path === '/index.html' || f.path === 'index.html'
  );

  if (!indexFile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Preview Not Available</h1>
          <p className="text-gray-600">The website preview could not be loaded.</p>
        </div>
      </div>
    );
  }

  // Return the HTML content directly
  // Using dangerouslySetInnerHTML because this is generated website content
  return (
    <html>
      <head>
        <title>{websiteArtifact.leadName || 'Website Preview'}</title>
        <meta name="robots" content="noindex, nofollow" />
      </head>
      <body>
        <div dangerouslySetInnerHTML={{ __html: extractBodyContent(indexFile.content) }} />

        {/* Preview Banner */}
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#1f2937',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '9999px',
            fontSize: '14px',
            fontFamily: 'system-ui, sans-serif',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span style={{ color: '#10b981' }}>●</span>
          Preview for {websiteArtifact.leadName}
          <span style={{ color: '#9ca3af', marginLeft: '8px' }}>
            Expires: {websiteArtifact.expiresAt ? new Date(websiteArtifact.expiresAt).toLocaleDateString() : 'N/A'}
          </span>
        </div>
      </body>
    </html>
  );
}

/**
 * Extract body content from full HTML
 */
function extractBodyContent(html: string): string {
  // If the HTML has a body tag, extract just the body content
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (bodyMatch) {
    return bodyMatch[1];
  }
  return html;
}

/**
 * Generate static params for pre-rendering (optional)
 */
export async function generateMetadata({ params }: PreviewPageProps) {
  const supabase = createAdminClient();
  const { token } = await params;

  const { data: websiteData } = await supabase
    .from('lead_websites')
    .select('data')
    .eq('preview_token', token)
    .single();

  const artifact = websiteData?.data as LeadWebsiteArtifact | undefined;

  return {
    title: artifact?.leadName ? `${artifact.leadName} - Website Preview` : 'Website Preview',
    robots: 'noindex, nofollow',
  };
}
