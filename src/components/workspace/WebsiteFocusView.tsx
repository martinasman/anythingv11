'use client';

import { useEffect, useState } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { Globe, Monitor, Smartphone, Tablet, ExternalLink, ArrowLeft, Code } from 'lucide-react';
import { useCanvasBackground } from '@/hooks/useCanvasBackground';
import WebsiteCodeModal from './WebsiteCodeModal';

type Viewport = 'desktop' | 'tablet' | 'mobile';

const VIEWPORT_WIDTHS: Record<Viewport, string> = {
  desktop: '100%',
  tablet: '768px',
  mobile: '375px',
};

export default function WebsiteFocusView() {
  const { artifacts, runningTools, setCanvasState } = useProjectStore();
  const { bgStyle, isDark } = useCanvasBackground();
  const [viewport, setViewport] = useState<Viewport>('desktop');
  const [websitePreviewUrl, setWebsitePreviewUrl] = useState<string | null>(null);
  const [codeModalOpen, setCodeModalOpen] = useState(false);

  const isWebsiteLoading = runningTools.has('website');

  // Dynamic styling based on background
  const chromeBg = isDark ? 'bg-zinc-800/90 backdrop-blur-sm' : 'bg-zinc-100/90 backdrop-blur-sm';
  const borderColor = isDark ? 'border-zinc-700' : 'border-zinc-200';
  const textPrimary = isDark ? 'text-white' : 'text-zinc-900';
  const textSecondary = isDark ? 'text-zinc-400' : 'text-zinc-600';

  // Create iframe content from website HTML with proper cleanup
  useEffect(() => {
    if (!artifacts.website?.files) {
      setWebsitePreviewUrl(null);
      return;
    }

    const htmlFile = artifacts.website.files.find(f => f.path === '/index.html');
    if (!htmlFile) {
      setWebsitePreviewUrl(null);
      return;
    }

    const cssFile = artifacts.website.files.find(f => f.path === '/styles.css');
    const jsFile = artifacts.website.files.find(f => f.path === '/script.js');

    let modifiedHtml = htmlFile.content;

    if (cssFile) {
      modifiedHtml = modifiedHtml.replace(
        '</head>',
        `<style>${cssFile.content}</style></head>`
      );
    }

    if (jsFile) {
      modifiedHtml = modifiedHtml.replace(
        '</body>',
        `<script>${jsFile.content}</script></body>`
      );
    }

    const blob = new Blob([modifiedHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    setWebsitePreviewUrl(url);

    // CLEANUP: Revoke blob URL when artifact changes or component unmounts
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [artifacts.website]);

  // Empty/Loading state
  if (!websitePreviewUrl) {
    return (
      <div className={`h-full flex flex-col items-center justify-center ${isWebsiteLoading ? 'animate-pulse' : ''}`} style={bgStyle}>
        <Globe size={48} className={isDark ? 'text-zinc-600' : 'text-zinc-300'} />
        <h3 className={`text-lg font-semibold ${textSecondary} mb-2`}>
          {isWebsiteLoading ? 'Building Your Website...' : 'No Website Yet'}
        </h3>
        <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-zinc-400'} text-center max-w-xs`}>
          {isWebsiteLoading
            ? 'Your website is being generated. This may take a moment.'
            : 'Start a conversation to generate your business website.'}
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden flex flex-col rounded-tl-2xl" style={bgStyle}>
      {/* Browser Chrome */}
      <div className={`flex items-center gap-3 px-4 py-2 ${chromeBg} border-b ${borderColor}`}>
        {/* Back button */}
        <button
          onClick={() => setCanvasState({ type: 'overview' })}
          className={`flex items-center gap-1.5 px-2 py-1 text-xs ${textSecondary} hover:${textPrimary} ${isDark ? 'hover:bg-zinc-700' : 'hover:bg-zinc-200'} rounded transition-colors`}
        >
          <ArrowLeft size={14} />
        </button>

        {/* Traffic lights */}
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
        </div>

        {/* URL bar */}
        <div className="flex-1 mx-3">
          <div className={`${isDark ? 'bg-zinc-700' : 'bg-white'} rounded-lg px-3 py-1.5 text-xs ${textSecondary} truncate flex items-center gap-2`}>
            <Globe size={12} />
            {artifacts.identity?.name?.toLowerCase().replace(/\s+/g, '') || 'your-business'}.com
          </div>
        </div>

        {/* Viewport Toggle */}
        <div className={`flex items-center gap-1 ${isDark ? 'bg-zinc-700' : 'bg-white'} rounded-lg p-1`}>
          <button
            onClick={() => setViewport('desktop')}
            className={`p-1.5 rounded transition-colors ${
              viewport === 'desktop'
                ? isDark ? 'bg-zinc-600 text-white' : 'bg-zinc-100 text-zinc-900'
                : `${textSecondary} ${isDark ? 'hover:text-zinc-200' : 'hover:text-zinc-700'}`
            }`}
            title="Desktop view"
          >
            <Monitor size={14} />
          </button>
          <button
            onClick={() => setViewport('tablet')}
            className={`p-1.5 rounded transition-colors ${
              viewport === 'tablet'
                ? isDark ? 'bg-zinc-600 text-white' : 'bg-zinc-100 text-zinc-900'
                : `${textSecondary} ${isDark ? 'hover:text-zinc-200' : 'hover:text-zinc-700'}`
            }`}
            title="Tablet view"
          >
            <Tablet size={14} />
          </button>
          <button
            onClick={() => setViewport('mobile')}
            className={`p-1.5 rounded transition-colors ${
              viewport === 'mobile'
                ? isDark ? 'bg-zinc-600 text-white' : 'bg-zinc-100 text-zinc-900'
                : `${textSecondary} ${isDark ? 'hover:text-zinc-200' : 'hover:text-zinc-700'}`
            }`}
            title="Mobile view"
          >
            <Smartphone size={14} />
          </button>
        </div>

        {/* Code Editor Button */}
        <button
          onClick={() => setCodeModalOpen(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium ${isDark ? 'text-zinc-300 hover:text-white hover:bg-zinc-700' : 'text-zinc-600 hover:text-zinc-900 hover:bg-white'} rounded-lg transition-colors`}
          title="Edit code"
        >
          <Code size={14} />
          Code
        </button>

        {/* Open in new tab */}
        <button
          onClick={() => window.open(websitePreviewUrl, '_blank')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium ${isDark ? 'text-zinc-300 hover:text-white hover:bg-zinc-700' : 'text-zinc-600 hover:text-zinc-900 hover:bg-white'} rounded-lg transition-colors`}
          title="Open in new tab"
        >
          <ExternalLink size={14} />
          Open
        </button>
      </div>

      {/* Website Preview */}
      <div className={`flex-1 relative overflow-auto ${isDark ? 'bg-zinc-900/50' : 'bg-zinc-200'}`}>
        <div
          className="mx-auto min-h-full transition-all duration-300 bg-white"
          style={{
            width: VIEWPORT_WIDTHS[viewport],
            maxWidth: '100%',
            boxShadow: viewport !== 'desktop' ? '0 0 0 1px rgba(0,0,0,0.1), 0 4px 16px rgba(0,0,0,0.1)' : 'none',
          }}
        >
          <iframe
            src={websitePreviewUrl}
            className="w-full border-0"
            style={{ height: '100vh', minHeight: '800px' }}
            sandbox="allow-same-origin allow-scripts"
            title="Website Preview"
          />
        </div>
      </div>

      {/* Code Editor Modal */}
      <WebsiteCodeModal
        isOpen={codeModalOpen}
        onClose={() => setCodeModalOpen(false)}
        isDark={isDark}
      />
    </div>
  );
}
