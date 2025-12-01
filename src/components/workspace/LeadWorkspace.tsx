'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Building2,
  Globe,
  Phone,
  Mail,
  MapPin,
  Star,
  AlertTriangle,
  CheckCircle,
  Clock,
  ExternalLink,
  Loader2,
  Send,
  FileCode,
  MessageSquare,
  Plus,
  ChevronRight,
  Eye,
  Copy,
  Check,
  Zap,
  TrendingUp,
  Users,
  Calendar,
} from 'lucide-react';
import type { Lead, LeadActivity, WebsiteAnalysis } from '@/types/database';
import { useProjectStore } from '@/store/projectStore';

// ============================================
// TYPES
// ============================================

interface LeadWorkspaceProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
}

type TabId = 'overview' | 'website' | 'outreach' | 'activity';

// ============================================
// MAIN COMPONENT
// ============================================

export default function LeadWorkspace({ lead, isOpen, onClose, isDark = true }: LeadWorkspaceProps) {
  const { addLeadActivity, updateLeadStatus, artifacts } = useProjectStore();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [isGeneratingWebsite, setIsGeneratingWebsite] = useState(false);
  const [isGeneratingOutreach, setIsGeneratingOutreach] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  // Dynamic styling
  const bgPrimary = isDark ? 'bg-zinc-900' : 'bg-white';
  const bgSecondary = isDark ? 'bg-zinc-800' : 'bg-zinc-50';
  const textPrimary = isDark ? 'text-white' : 'text-zinc-900';
  const textSecondary = isDark ? 'text-zinc-400' : 'text-zinc-600';
  const borderColor = isDark ? 'border-zinc-700' : 'border-zinc-200';

  if (!isOpen) return null;

  const handleCopy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleGenerateWebsite = async () => {
    setIsGeneratingWebsite(true);
    try {
      const response = await fetch(`/api/leads/${lead.id}/generate-website`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lead.id,
          industry: lead.industry,
          businessName: lead.companyName,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate website');

      const data = await response.json();

      await addLeadActivity({
        leadId: lead.id,
        type: 'website_generated',
        content: `Preview website generated`,
        metadata: { previewToken: data.previewToken, previewUrl: data.previewUrl },
      });

      // Refresh the page or update state to show new preview
      window.location.reload();
    } catch (error) {
      console.error('Failed to generate website:', error);
    } finally {
      setIsGeneratingWebsite(false);
    }
  };

  const handleGenerateOutreach = async () => {
    setIsGeneratingOutreach(true);
    try {
      const response = await fetch(`/api/leads/${lead.id}/generate-outreach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lead.id,
          industry: lead.industry,
          businessName: lead.companyName,
          websiteAnalysis: lead.websiteAnalysis,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate outreach');

      await addLeadActivity({
        leadId: lead.id,
        type: 'email_generated',
        content: 'Personalized outreach scripts generated',
      });

      // Refresh
      window.location.reload();
    } catch (error) {
      console.error('Failed to generate outreach:', error);
    } finally {
      setIsGeneratingOutreach(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    await addLeadActivity({
      leadId: lead.id,
      type: 'note_added',
      content: newNote.trim(),
    });

    setNewNote('');
  };

  const handleStatusChange = async (newStatus: Lead['status']) => {
    await updateLeadStatus(lead.id, newStatus);
  };

  // Get activities for this lead
  const activities = (artifacts.leads?.activities || []).filter((a) => a.leadId === lead.id);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`h-full w-full max-w-2xl ${bgPrimary} shadow-2xl flex flex-col overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b ${borderColor} flex items-center justify-between shrink-0`}>
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-xl ${bgSecondary} flex items-center justify-center`}
            >
              <Building2 size={24} className={textSecondary} />
            </div>
            <div>
              <h2 className={`text-lg font-semibold ${textPrimary}`}>{lead.companyName}</h2>
              <div className="flex items-center gap-2">
                <span className={`text-sm ${textSecondary}`}>{lead.industry}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getScoreColor(lead.score)}`}>
                  Score: {lead.score}/100
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'} transition-colors`}
          >
            <X size={20} className={textSecondary} />
          </button>
        </div>

        {/* Tabs */}
        <div className={`px-6 border-b ${borderColor} flex gap-1 shrink-0`}>
          {[
            { id: 'overview' as TabId, label: 'Overview', icon: Building2 },
            { id: 'website' as TabId, label: 'Website', icon: FileCode },
            { id: 'outreach' as TabId, label: 'Outreach', icon: Send },
            { id: 'activity' as TabId, label: 'Activity', icon: Clock },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? `border-blue-500 ${textPrimary}`
                  : `border-transparent ${textSecondary} hover:${textPrimary}`
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'overview' && (
            <OverviewTab
              lead={lead}
              isDark={isDark}
              onStatusChange={handleStatusChange}
              onCopy={handleCopy}
              copied={copied}
            />
          )}

          {activeTab === 'website' && (
            <WebsiteTab
              lead={lead}
              isDark={isDark}
              isGenerating={isGeneratingWebsite}
              onGenerate={handleGenerateWebsite}
            />
          )}

          {activeTab === 'outreach' && (
            <OutreachTab
              lead={lead}
              isDark={isDark}
              isGenerating={isGeneratingOutreach}
              onGenerate={handleGenerateOutreach}
            />
          )}

          {activeTab === 'activity' && (
            <ActivityTab
              lead={lead}
              activities={activities}
              isDark={isDark}
              newNote={newNote}
              onNoteChange={setNewNote}
              onAddNote={handleAddNote}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// OVERVIEW TAB
// ============================================

function OverviewTab({
  lead,
  isDark,
  onStatusChange,
  onCopy,
  copied,
}: {
  lead: Lead;
  isDark: boolean;
  onStatusChange: (status: Lead['status']) => void;
  onCopy: (text: string, field: string) => void;
  copied: string | null;
}) {
  const bgSecondary = isDark ? 'bg-zinc-800' : 'bg-zinc-50';
  const textPrimary = isDark ? 'text-white' : 'text-zinc-900';
  const textSecondary = isDark ? 'text-zinc-400' : 'text-zinc-600';
  const borderColor = isDark ? 'border-zinc-700' : 'border-zinc-200';

  return (
    <div className="p-6 space-y-6">
      {/* Status Selector */}
      <div className={`p-4 rounded-xl ${bgSecondary}`}>
        <label className={`text-sm font-medium ${textSecondary} mb-2 block`}>Lead Status</label>
        <div className="flex gap-2">
          {(['new', 'contacted', 'responded', 'closed', 'lost'] as Lead['status'][]).map((status) => (
            <button
              key={status}
              onClick={() => onStatusChange(status)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                lead.status === status
                  ? getStatusButtonStyle(status, true)
                  : `${isDark ? 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600' : 'bg-zinc-200 text-zinc-500 hover:bg-zinc-300'}`
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Contact Information */}
      <div className={`p-4 rounded-xl ${bgSecondary}`}>
        <h3 className={`text-sm font-medium ${textPrimary} mb-3`}>Contact Information</h3>
        <div className="space-y-3">
          {lead.phone && (
            <ContactRow
              icon={Phone}
              label="Phone"
              value={lead.phone}
              isDark={isDark}
              onCopy={() => onCopy(lead.phone!, 'phone')}
              copied={copied === 'phone'}
            />
          )}
          {lead.contactEmail && (
            <ContactRow
              icon={Mail}
              label="Email"
              value={lead.contactEmail}
              isDark={isDark}
              onCopy={() => onCopy(lead.contactEmail!, 'email')}
              copied={copied === 'email'}
            />
          )}
          {lead.website && (
            <ContactRow
              icon={Globe}
              label="Website"
              value={lead.website}
              isDark={isDark}
              isLink
              onCopy={() => onCopy(lead.website!, 'website')}
              copied={copied === 'website'}
            />
          )}
          {lead.address && (
            <ContactRow
              icon={MapPin}
              label="Address"
              value={lead.address}
              isDark={isDark}
              onCopy={() => onCopy(lead.address!, 'address')}
              copied={copied === 'address'}
            />
          )}
        </div>
      </div>

      {/* Score Breakdown */}
      {lead.scoreBreakdown && lead.scoreBreakdown.length > 0 && (
        <div className={`p-4 rounded-xl ${bgSecondary}`}>
          <h3 className={`text-sm font-medium ${textPrimary} mb-3 flex items-center gap-2`}>
            <TrendingUp size={16} />
            Score Breakdown
          </h3>
          <div className="space-y-2">
            {lead.scoreBreakdown.map((reason, i) => (
              <div key={i} className={`text-sm ${textSecondary} flex items-start gap-2`}>
                <ChevronRight size={14} className="mt-0.5 shrink-0" />
                {reason}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Website Analysis */}
      {lead.websiteAnalysis && (
        <WebsiteAnalysisCard analysis={lead.websiteAnalysis} isDark={isDark} />
      )}

      {/* Rating */}
      {lead.rating && (
        <div className={`p-4 rounded-xl ${bgSecondary}`}>
          <h3 className={`text-sm font-medium ${textPrimary} mb-2`}>Google Rating</h3>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={16}
                  className={star <= lead.rating! ? 'text-yellow-400 fill-yellow-400' : textSecondary}
                />
              ))}
            </div>
            <span className={`text-sm ${textPrimary}`}>{lead.rating}</span>
            {lead.reviewCount && (
              <span className={`text-sm ${textSecondary}`}>({lead.reviewCount} reviews)</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// WEBSITE TAB
// ============================================

function WebsiteTab({
  lead,
  isDark,
  isGenerating,
  onGenerate,
}: {
  lead: Lead;
  isDark: boolean;
  isGenerating: boolean;
  onGenerate: () => void;
}) {
  const bgSecondary = isDark ? 'bg-zinc-800' : 'bg-zinc-50';
  const textPrimary = isDark ? 'text-white' : 'text-zinc-900';
  const textSecondary = isDark ? 'text-zinc-400' : 'text-zinc-600';

  const hasPreview = !!lead.previewToken;

  return (
    <div className="p-6 space-y-6">
      {/* Current Website Status */}
      {lead.websiteAnalysis && (
        <WebsiteAnalysisCard analysis={lead.websiteAnalysis} isDark={isDark} showFullDetails />
      )}

      {/* Preview Website */}
      <div className={`p-6 rounded-xl ${bgSecondary}`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className={`text-lg font-semibold ${textPrimary} mb-1`}>Preview Website</h3>
            <p className={`text-sm ${textSecondary}`}>
              Generate a professional website preview to show this lead what you can build for them.
            </p>
          </div>
          {hasPreview && (
            <a
              href={`/preview/${lead.previewToken}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
            >
              <Eye size={14} />
              View Preview
            </a>
          )}
        </div>

        {hasPreview ? (
          <div className={`p-4 rounded-lg ${isDark ? 'bg-zinc-700' : 'bg-zinc-200'}`}>
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle size={20} className="text-green-400" />
              <span className={`font-medium ${textPrimary}`}>Preview Generated</span>
            </div>
            <div className={`text-sm ${textSecondary} space-y-1`}>
              <p>
                Preview URL:{' '}
                <code className={`px-1.5 py-0.5 rounded ${isDark ? 'bg-zinc-600' : 'bg-zinc-300'}`}>
                  /preview/{lead.previewToken}
                </code>
              </p>
              <p>Share this link with the lead to show them their potential new website.</p>
            </div>
            <button
              onClick={onGenerate}
              disabled={isGenerating}
              className={`mt-4 flex items-center gap-2 px-4 py-2 text-sm font-medium ${isDark ? 'bg-zinc-600 hover:bg-zinc-500' : 'bg-zinc-300 hover:bg-zinc-400'} rounded-lg transition-colors disabled:opacity-50`}
            >
              {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
              Regenerate
            </button>
          </div>
        ) : (
          <button
            onClick={onGenerate}
            disabled={isGenerating}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 text-base font-semibold bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Generating Preview...
              </>
            ) : (
              <>
                <FileCode size={20} />
                Generate Website Preview
              </>
            )}
          </button>
        )}
      </div>

      {/* Industry-Specific Note */}
      <div className={`p-4 rounded-xl ${isDark ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
        <p className={`text-sm ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
          <strong>Industry-Optimized:</strong> The preview will be tailored specifically for the{' '}
          <strong>{lead.industry || 'business'}</strong> industry with appropriate design, sections,
          and content.
        </p>
      </div>
    </div>
  );
}

// ============================================
// OUTREACH TAB
// ============================================

function OutreachTab({
  lead,
  isDark,
  isGenerating,
  onGenerate,
}: {
  lead: Lead;
  isDark: boolean;
  isGenerating: boolean;
  onGenerate: () => void;
}) {
  const bgSecondary = isDark ? 'bg-zinc-800' : 'bg-zinc-50';
  const textPrimary = isDark ? 'text-white' : 'text-zinc-900';
  const textSecondary = isDark ? 'text-zinc-400' : 'text-zinc-600';

  const hasOutreach = lead.outreachGenerated;

  return (
    <div className="p-6 space-y-6">
      {/* Generate Outreach */}
      <div className={`p-6 rounded-xl ${bgSecondary}`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className={`text-lg font-semibold ${textPrimary} mb-1`}>Personalized Outreach</h3>
            <p className={`text-sm ${textSecondary}`}>
              Generate personalized email scripts and call scripts based on this lead&apos;s specific
              situation and website analysis.
            </p>
          </div>
        </div>

        {hasOutreach ? (
          <div className={`p-4 rounded-lg ${isDark ? 'bg-zinc-700' : 'bg-zinc-200'}`}>
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle size={20} className="text-green-400" />
              <span className={`font-medium ${textPrimary}`}>Outreach Scripts Ready</span>
            </div>
            <div className={`text-sm ${textSecondary}`}>
              <p>Personalized scripts have been generated for this lead.</p>
            </div>
            <button
              onClick={onGenerate}
              disabled={isGenerating}
              className={`mt-4 flex items-center gap-2 px-4 py-2 text-sm font-medium ${isDark ? 'bg-zinc-600 hover:bg-zinc-500' : 'bg-zinc-300 hover:bg-zinc-400'} rounded-lg transition-colors disabled:opacity-50`}
            >
              {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
              Regenerate
            </button>
          </div>
        ) : (
          <button
            onClick={onGenerate}
            disabled={isGenerating}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 text-base font-semibold bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Generating Outreach...
              </>
            ) : (
              <>
                <MessageSquare size={20} />
                Generate Outreach Scripts
              </>
            )}
          </button>
        )}
      </div>

      {/* Outreach Tips */}
      <div className={`p-4 rounded-xl ${bgSecondary}`}>
        <h4 className={`text-sm font-medium ${textPrimary} mb-3`}>Outreach Tips for This Lead</h4>
        <div className="space-y-2">
          {lead.websiteAnalysis?.status === 'none' && (
            <TipItem isDark={isDark}>
              Lead has <strong>no website</strong> - position yourself as the solution to get them
              online
            </TipItem>
          )}
          {lead.websiteAnalysis?.status === 'broken' && (
            <TipItem isDark={isDark}>
              Website is <strong>broken or unreachable</strong> - offer to fix their online presence
            </TipItem>
          )}
          {lead.websiteAnalysis?.status === 'poor' && (
            <TipItem isDark={isDark}>
              Website has <strong>multiple issues</strong> - highlight specific problems you can solve
            </TipItem>
          )}
          {lead.websiteAnalysis?.status === 'outdated' && (
            <TipItem isDark={isDark}>
              Website is <strong>outdated</strong> - focus on modernization and mobile optimization
            </TipItem>
          )}
          {!lead.websiteAnalysis && (
            <TipItem isDark={isDark}>
              Research their current online presence before reaching out
            </TipItem>
          )}
          <TipItem isDark={isDark}>
            Reference specific details about their business to show you&apos;ve done your research
          </TipItem>
          <TipItem isDark={isDark}>
            If you generated a preview website, include the link in your outreach
          </TipItem>
        </div>
      </div>
    </div>
  );
}

// ============================================
// ACTIVITY TAB
// ============================================

function ActivityTab({
  lead,
  activities,
  isDark,
  newNote,
  onNoteChange,
  onAddNote,
}: {
  lead: Lead;
  activities: LeadActivity[];
  isDark: boolean;
  newNote: string;
  onNoteChange: (note: string) => void;
  onAddNote: () => void;
}) {
  const bgSecondary = isDark ? 'bg-zinc-800' : 'bg-zinc-50';
  const textPrimary = isDark ? 'text-white' : 'text-zinc-900';
  const textSecondary = isDark ? 'text-zinc-400' : 'text-zinc-600';
  const borderColor = isDark ? 'border-zinc-700' : 'border-zinc-200';

  return (
    <div className="p-6 space-y-6">
      {/* Add Note */}
      <div className={`p-4 rounded-xl ${bgSecondary}`}>
        <h3 className={`text-sm font-medium ${textPrimary} mb-3`}>Add Note</h3>
        <div className="flex gap-2">
          <textarea
            value={newNote}
            onChange={(e) => onNoteChange(e.target.value)}
            placeholder="Add a note about this lead..."
            rows={2}
            className={`flex-1 px-3 py-2 rounded-lg ${isDark ? 'bg-zinc-700 text-white placeholder-zinc-500' : 'bg-white text-zinc-900 placeholder-zinc-400'} border ${borderColor} resize-none text-sm`}
          />
          <button
            onClick={onAddNote}
            disabled={!newNote.trim()}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      {/* Activity Timeline */}
      <div>
        <h3 className={`text-sm font-medium ${textPrimary} mb-3 flex items-center gap-2`}>
          <Clock size={16} />
          Activity Timeline
        </h3>
        {activities.length === 0 ? (
          <div className={`text-center py-8 ${textSecondary}`}>
            <Clock size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No activity yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((activity) => (
                <ActivityItem key={activity.id} activity={activity} isDark={isDark} />
              ))}
          </div>
        )}
      </div>

      {/* Lead Notes from initial data */}
      {lead.notes && lead.notes.length > 0 && (
        <div>
          <h3 className={`text-sm font-medium ${textPrimary} mb-3 flex items-center gap-2`}>
            <MessageSquare size={16} />
            Saved Notes
          </h3>
          <div className="space-y-2">
            {lead.notes.map((note) => (
              <div
                key={note.id}
                className={`p-3 rounded-lg ${bgSecondary} border ${borderColor}`}
              >
                <p className={`text-sm ${textPrimary}`}>{note.content}</p>
                <p className={`text-xs ${textSecondary} mt-1`}>
                  {new Date(note.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// HELPER COMPONENTS
// ============================================

function ContactRow({
  icon: Icon,
  label,
  value,
  isDark,
  isLink,
  onCopy,
  copied,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  isDark: boolean;
  isLink?: boolean;
  onCopy: () => void;
  copied: boolean;
}) {
  const textPrimary = isDark ? 'text-white' : 'text-zinc-900';
  const textSecondary = isDark ? 'text-zinc-400' : 'text-zinc-600';

  return (
    <div className="flex items-center justify-between group">
      <div className="flex items-center gap-3">
        <Icon size={16} className={textSecondary} />
        <div>
          <span className={`text-xs ${textSecondary}`}>{label}</span>
          {isLink ? (
            <a
              href={value.startsWith('http') ? value : `https://${value}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`block text-sm ${textPrimary} hover:text-blue-500 transition-colors`}
            >
              {value}
            </a>
          ) : (
            <p className={`text-sm ${textPrimary}`}>{value}</p>
          )}
        </div>
      </div>
      <button
        onClick={onCopy}
        className={`p-1.5 rounded opacity-0 group-hover:opacity-100 ${isDark ? 'hover:bg-zinc-700' : 'hover:bg-zinc-200'} transition-all`}
      >
        {copied ? (
          <Check size={14} className="text-green-400" />
        ) : (
          <Copy size={14} className={textSecondary} />
        )}
      </button>
    </div>
  );
}

function WebsiteAnalysisCard({
  analysis,
  isDark,
  showFullDetails,
}: {
  analysis: WebsiteAnalysis;
  isDark: boolean;
  showFullDetails?: boolean;
}) {
  const bgSecondary = isDark ? 'bg-zinc-800' : 'bg-zinc-50';
  const textPrimary = isDark ? 'text-white' : 'text-zinc-900';
  const textSecondary = isDark ? 'text-zinc-400' : 'text-zinc-600';

  const statusConfig = {
    none: { label: 'No Website', color: 'text-red-400', bg: 'bg-red-500/20', icon: AlertTriangle },
    broken: { label: 'Broken', color: 'text-red-400', bg: 'bg-red-500/20', icon: AlertTriangle },
    poor: { label: 'Poor Quality', color: 'text-orange-400', bg: 'bg-orange-500/20', icon: AlertTriangle },
    outdated: { label: 'Outdated', color: 'text-orange-400', bg: 'bg-orange-500/20', icon: Clock },
    good: { label: 'Good', color: 'text-green-400', bg: 'bg-green-500/20', icon: CheckCircle },
  };

  const config = statusConfig[analysis.status];
  const StatusIcon = config.icon;

  return (
    <div className={`p-4 rounded-xl ${bgSecondary}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className={`text-sm font-medium ${textPrimary}`}>Website Analysis</h3>
        <div className={`flex items-center gap-2 px-2 py-1 rounded-full ${config.bg}`}>
          <StatusIcon size={14} className={config.color} />
          <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
        </div>
      </div>

      {/* Opportunity Score */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className={`text-xs ${textSecondary}`}>Opportunity Score</span>
          <span className={`text-sm font-medium ${textPrimary}`}>{analysis.score}/100</span>
        </div>
        <div className={`h-2 rounded-full ${isDark ? 'bg-zinc-700' : 'bg-zinc-200'}`}>
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400"
            style={{ width: `${analysis.score}%` }}
          />
        </div>
      </div>

      {/* Issues */}
      {analysis.issues.length > 0 && (
        <div className="space-y-1">
          {analysis.issues.slice(0, showFullDetails ? undefined : 3).map((issue, i) => (
            <div key={i} className={`text-xs ${textSecondary} flex items-start gap-2`}>
              <span className="text-red-400 mt-0.5">•</span>
              {issue}
            </div>
          ))}
        </div>
      )}

      {/* Technologies */}
      {showFullDetails && analysis.technologies && analysis.technologies.length > 0 && (
        <div className="mt-3 pt-3 border-t border-zinc-700">
          <span className={`text-xs ${textSecondary}`}>Technologies: </span>
          <span className={`text-xs ${textPrimary}`}>{analysis.technologies.join(', ')}</span>
        </div>
      )}
    </div>
  );
}

function ActivityItem({ activity, isDark }: { activity: LeadActivity; isDark: boolean }) {
  const bgSecondary = isDark ? 'bg-zinc-800' : 'bg-zinc-50';
  const textPrimary = isDark ? 'text-white' : 'text-zinc-900';
  const textSecondary = isDark ? 'text-zinc-400' : 'text-zinc-600';
  const borderColor = isDark ? 'border-zinc-700' : 'border-zinc-200';

  const typeConfig: Record<string, { icon: React.ComponentType<{ size?: number; className?: string }>; color: string }> = {
    email_sent: { icon: Mail, color: 'text-blue-400' },
    call_made: { icon: Phone, color: 'text-green-400' },
    status_changed: { icon: Users, color: 'text-purple-400' },
    note_added: { icon: MessageSquare, color: 'text-blue-400' },
    website_generated: { icon: FileCode, color: 'text-cyan-400' },
    outreach_generated: { icon: Send, color: 'text-orange-400' },
    meeting_scheduled: { icon: Calendar, color: 'text-pink-400' },
  };

  const config = typeConfig[activity.type] || { icon: Clock, color: textSecondary };
  const ActivityIcon = config.icon;

  return (
    <div className={`p-3 rounded-lg ${bgSecondary} border ${borderColor}`}>
      <div className="flex items-start gap-3">
        <div className={`p-1.5 rounded-lg ${isDark ? 'bg-zinc-700' : 'bg-zinc-200'}`}>
          <ActivityIcon size={14} className={config.color} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm ${textPrimary}`}>{activity.content}</p>
          <p className={`text-xs ${textSecondary} mt-0.5`}>
            {new Date(activity.createdAt).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}

function TipItem({ children, isDark }: { children: React.ReactNode; isDark: boolean }) {
  const textSecondary = isDark ? 'text-zinc-400' : 'text-zinc-600';

  return (
    <div className={`text-sm ${textSecondary} flex items-start gap-2`}>
      <Zap size={14} className="text-blue-500 mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function getScoreColor(score: number): string {
  if (score >= 80) return 'bg-green-500/20 text-green-400';
  if (score >= 60) return 'bg-blue-500/20 text-blue-400';
  if (score >= 40) return 'bg-orange-500/20 text-orange-400';
  return 'bg-red-500/20 text-red-400';
}

function getStatusButtonStyle(status: Lead['status'], active: boolean): string {
  if (!active) return '';

  const colors: Record<Lead['status'], string> = {
    new: 'bg-blue-500 text-white',
    contacted: 'bg-sky-500 text-white',
    responded: 'bg-green-500 text-white',
    closed: 'bg-emerald-500 text-white',
    lost: 'bg-red-500 text-white',
  };

  return colors[status];
}
