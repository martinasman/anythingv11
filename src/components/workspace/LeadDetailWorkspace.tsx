'use client';

import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ChevronDown,
  Copy,
  Check,
  Mail,
  Phone,
  Globe,
  Star,
  ExternalLink,
  Loader2,
  ChevronUp,
  Link2,
  Send,
} from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import type { Lead } from '@/types/database';
import { useCanvasBackground } from '@/hooks/useCanvasBackground';

interface LeadDetailWorkspaceProps {
  leadId: string;
}

export default function LeadDetailWorkspace({ leadId }: LeadDetailWorkspaceProps) {
  const {
    artifacts,
    setCanvasState,
    updateLeadStatus,
  } = useProjectStore();
  const { isDark } = useCanvasBackground();

  // Find the lead
  const lead = artifacts.leads?.leads.find(l => l.id === leadId);

  // UI state
  const [copied, setCopied] = useState<string | null>(null);
  const [showInfoPanel, setShowInfoPanel] = useState(true);
  const [sendDropdownOpen, setSendDropdownOpen] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [iframeError, setIframeError] = useState(false);

  // Styling
  const bgPrimary = isDark ? 'bg-neutral-950' : 'bg-white';
  const bgSecondary = isDark ? 'bg-neutral-900' : 'bg-zinc-50';
  const textPrimary = isDark ? 'text-white' : 'text-zinc-900';
  const textSecondary = isDark ? 'text-zinc-400' : 'text-zinc-600';
  const borderColor = isDark ? 'border-neutral-800' : 'border-zinc-200';

  // Keyboard shortcut: Escape to go back
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !sendDropdownOpen) {
        handleBack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sendDropdownOpen]);

  // Reset iframe state when lead changes
  useEffect(() => {
    setIframeLoading(true);
    setIframeError(false);
  }, [leadId]);

  // Handle copy
  const handleCopy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  // Handle back navigation
  const handleBack = () => {
    setCanvasState({ type: 'detail', view: 'leads' });
  };

  // Handle send to customer actions
  const handleCopyPreviewLink = async () => {
    if (!lead?.previewToken) return;
    const url = `${window.location.origin}/preview/${lead.previewToken}`;
    await navigator.clipboard.writeText(url);
    setCopied('preview-link');
    setSendDropdownOpen(false);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleOpenEmailComposer = () => {
    if (!lead?.contactEmail || !lead?.previewToken) return;
    const previewUrl = `${window.location.origin}/preview/${lead.previewToken}`;
    const subject = encodeURIComponent(`Website Preview for ${lead.companyName}`);
    const body = encodeURIComponent(`Hi,\n\nI've created a website preview for ${lead.companyName}. You can view it here:\n\n${previewUrl}\n\nLet me know what you think!\n\nBest regards`);
    window.open(`mailto:${lead.contactEmail}?subject=${subject}&body=${body}`, '_blank');
    setSendDropdownOpen(false);
  };

  // If lead not found
  if (!lead) {
    return (
      <div className={`h-full flex items-center justify-center ${bgPrimary}`}>
        <div className="text-center">
          <p className={textSecondary}>Lead not found</p>
          <button
            onClick={handleBack}
            className={`mt-4 px-4 py-2 text-sm font-medium ${isDark ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-zinc-100 hover:bg-zinc-200'} rounded-lg transition-colors`}
          >
            Back to Pipeline
          </button>
        </div>
      </div>
    );
  }

  // Get preview URL
  const previewUrl = lead.previewToken ? `/preview/${lead.previewToken}` : null;
  const hasWebsite = !!previewUrl;

  return (
    <div className={`h-full flex flex-col ${bgPrimary}`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${borderColor} shrink-0`}>
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className={`p-2 rounded-lg ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'} transition-colors group relative`}
            title="Press Escape to go back"
          >
            <ArrowLeft size={18} className={textSecondary} />
            <span className={`absolute left-full ml-1 px-1.5 py-0.5 text-[10px] font-mono ${isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-100 text-zinc-500'} rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap`}>
              Esc
            </span>
          </button>
          <div>
            <h2 className={`font-semibold ${textPrimary}`}>{lead.companyName}</h2>
            <p className={`text-xs ${textSecondary}`}>{lead.industry}</p>
          </div>
        </div>

        {/* Send to Customer Button */}
        <div className="relative">
          <button
            onClick={() => setSendDropdownOpen(!sendDropdownOpen)}
            disabled={!hasWebsite}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              hasWebsite
                ? isDark
                  ? 'bg-blue-600 hover:bg-blue-500 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
                : isDark
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
            }`}
          >
            <Send size={16} />
            Send to Customer
            <ChevronDown size={14} />
          </button>

          {sendDropdownOpen && hasWebsite && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setSendDropdownOpen(false)}
              />
              <div className={`absolute right-0 top-full mt-2 z-20 w-56 rounded-lg border ${borderColor} ${isDark ? 'bg-zinc-900' : 'bg-white'} shadow-lg py-1`}>
                <button
                  onClick={handleCopyPreviewLink}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-50'} transition-colors`}
                >
                  {copied === 'preview-link' ? (
                    <Check size={16} className="text-green-500" />
                  ) : (
                    <Link2 size={16} className={textSecondary} />
                  )}
                  <span className={textPrimary}>
                    {copied === 'preview-link' ? 'Copied!' : 'Copy Preview Link'}
                  </span>
                </button>
                <button
                  onClick={handleOpenEmailComposer}
                  disabled={!lead.contactEmail}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-50'} transition-colors disabled:opacity-50`}
                >
                  <Mail size={16} className={textSecondary} />
                  <span className={textPrimary}>Open Email Composer</span>
                </button>
                {previewUrl && (
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-50'} transition-colors`}
                  >
                    <ExternalLink size={16} className={textSecondary} />
                    <span className={textPrimary}>Open Preview in New Tab</span>
                  </a>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Website Preview */}
        <div className="flex-1 overflow-hidden">
          {hasWebsite ? (
            <div className="h-full flex flex-col">
              {/* Browser Chrome */}
              <div className={`flex items-center gap-3 px-4 py-2 border-b ${borderColor} ${bgSecondary}`}>
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                </div>
                <div className={`flex-1 px-3 py-1 rounded text-xs ${isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-white text-zinc-500'} truncate`}>
                  {window.location.origin}{previewUrl}
                </div>
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-1 rounded ${isDark ? 'hover:bg-zinc-700' : 'hover:bg-zinc-200'} transition-colors`}
                >
                  <ExternalLink size={14} className={textSecondary} />
                </a>
              </div>

              {/* iFrame */}
              <div className="flex-1 relative">
                {iframeLoading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 size={32} className="animate-spin text-blue-500 mx-auto mb-2" />
                      <p className={`text-sm ${textSecondary}`}>Loading preview...</p>
                    </div>
                  </div>
                )}
                {iframeError ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center max-w-sm">
                      <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl ${isDark ? 'bg-red-500/10' : 'bg-red-50'} flex items-center justify-center`}>
                        <Globe size={32} className="text-red-400" />
                      </div>
                      <h3 className={`text-lg font-semibold ${textPrimary} mb-2`}>Preview Unavailable</h3>
                      <p className={`text-sm ${textSecondary} mb-4`}>
                        The preview could not be loaded. It may have expired or been removed.
                      </p>
                      <a
                        href={previewUrl!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium ${isDark ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-500 hover:bg-blue-600'} text-white rounded-lg transition-colors`}
                      >
                        <ExternalLink size={16} />
                        Try Opening Directly
                      </a>
                    </div>
                  </div>
                ) : (
                  <iframe
                    src={previewUrl!}
                    className={`w-full h-full border-0 ${iframeLoading ? 'opacity-0' : 'opacity-100'} transition-opacity`}
                    title={`Preview for ${lead.companyName}`}
                    onLoad={() => setIframeLoading(false)}
                    onError={() => {
                      setIframeLoading(false);
                      setIframeError(true);
                    }}
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-sm">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl ${isDark ? 'bg-zinc-800' : 'bg-zinc-100'} flex items-center justify-center`}>
                  <Globe size={32} className={textSecondary} />
                </div>
                <h3 className={`text-lg font-semibold ${textPrimary} mb-2`}>No Website Preview Yet</h3>
                <p className={`text-sm ${textSecondary} mb-4`}>
                  Generate a website preview for this lead to send them a personalized demo.
                </p>
                <button
                  className={`px-4 py-2 text-sm font-medium ${isDark ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-500 hover:bg-blue-600'} text-white rounded-lg transition-colors`}
                >
                  Generate Website Preview
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Collapsible Lead Info Bar */}
        <div className={`border-t ${borderColor}`}>
          <button
            onClick={() => setShowInfoPanel(!showInfoPanel)}
            className={`w-full flex items-center justify-between px-4 py-2 ${bgSecondary} ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'} transition-colors`}
          >
            <span className={`text-sm font-medium ${textPrimary}`}>Lead Details</span>
            {showInfoPanel ? (
              <ChevronDown size={16} className={textSecondary} />
            ) : (
              <ChevronUp size={16} className={textSecondary} />
            )}
          </button>

          {showInfoPanel && (
            <div className={`p-4 ${bgSecondary} space-y-3`}>
              <div className="flex flex-wrap gap-4">
                {/* Contact Info */}
                {lead.contactEmail && (
                  <div className="flex items-center gap-2">
                    <Mail size={14} className={textSecondary} />
                    <span className={`text-sm ${textPrimary}`}>{lead.contactEmail}</span>
                    <button
                      onClick={() => handleCopy(lead.contactEmail!, 'email')}
                      className={`p-1 rounded ${isDark ? 'hover:bg-zinc-700' : 'hover:bg-zinc-200'}`}
                    >
                      {copied === 'email' ? (
                        <Check size={12} className="text-green-500" />
                      ) : (
                        <Copy size={12} className={textSecondary} />
                      )}
                    </button>
                  </div>
                )}

                {lead.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={14} className={textSecondary} />
                    <span className={`text-sm ${textPrimary}`}>{lead.phone}</span>
                    <button
                      onClick={() => handleCopy(lead.phone!, 'phone')}
                      className={`p-1 rounded ${isDark ? 'hover:bg-zinc-700' : 'hover:bg-zinc-200'}`}
                    >
                      {copied === 'phone' ? (
                        <Check size={12} className="text-green-500" />
                      ) : (
                        <Copy size={12} className={textSecondary} />
                      )}
                    </button>
                  </div>
                )}

                {lead.website && (
                  <a
                    href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:text-blue-500 transition-colors"
                  >
                    <Globe size={14} className={textSecondary} />
                    <span className={`text-sm ${textPrimary}`}>{lead.website}</span>
                    <ExternalLink size={12} className={textSecondary} />
                  </a>
                )}
              </div>

              {/* Score & Status */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${textSecondary}`}>Score:</span>
                  <span className={`text-sm font-medium ${textPrimary}`}>{lead.score}/100</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-xs ${textSecondary}`}>ICP:</span>
                  <span className={`text-sm font-medium ${textPrimary}`}>{lead.icpScore}/10</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-xs ${textSecondary}`}>Status:</span>
                  <select
                    value={lead.status}
                    onChange={(e) => updateLeadStatus(lead.id, e.target.value as Lead['status'])}
                    className={`text-sm px-2 py-1 rounded ${isDark ? 'bg-zinc-800 text-white border-zinc-700' : 'bg-white text-zinc-900 border-zinc-200'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="responded">Responded</option>
                    <option value="closed">Closed</option>
                    <option value="lost">Lost</option>
                  </select>
                </div>

                {lead.rating && (
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={14}
                        className={star <= lead.rating! ? 'text-yellow-400 fill-yellow-400' : textSecondary}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
