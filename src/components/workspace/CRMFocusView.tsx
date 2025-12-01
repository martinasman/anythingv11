'use client';

import { useState } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { Users, Target, Mail, Phone, Linkedin, GripVertical, ExternalLink, AlertTriangle, Globe, X, MapPin, Building2, Loader2 } from 'lucide-react';
import type { Lead } from '@/types/database';
import EmailModal from './EmailModal';
import CallScriptModal from './CallScriptModal';
import { useCanvasBackground } from '@/hooks/useCanvasBackground';

// Kanban column definitions
const COLUMNS: { id: Lead['status']; label: string; color: string }[] = [
  { id: 'new', label: 'New', color: 'bg-blue-500' },
  { id: 'contacted', label: 'Contacted', color: 'bg-blue-400' },
  { id: 'responded', label: 'Responded', color: 'bg-green-500' },
];

// Industry options for the modal
const INDUSTRY_OPTIONS = [
  'Restaurants',
  'Hair Salons & Barbershops',
  'Gyms & Fitness',
  'Dental Offices',
  'Law Firms',
  'Real Estate Agents',
  'Auto Repair & Detailing',
  'Cleaning Services',
  'Contractors & Construction',
  'Medical Clinics',
  'Retail Stores',
  'Spas & Beauty',
];

export default function CRMFocusView() {
  const { artifacts, runningTools, updateLeadStatus, setCanvasState } = useProjectStore();
  const { bgStyle, isDark } = useCanvasBackground();
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<Lead['status'] | null>(null);
  const [emailModalLead, setEmailModalLead] = useState<Lead | null>(null);
  const [callModalLead, setCallModalLead] = useState<Lead | null>(null);

  // Lead generation modal state
  const [showLeadGenModal, setShowLeadGenModal] = useState(false);
  const [leadGenIndustry, setLeadGenIndustry] = useState('');
  const [leadGenLocation, setLeadGenLocation] = useState('');
  const [leadGenCount, setLeadGenCount] = useState(20);

  const isLeadsLoading = runningTools.has('leads');

  // Dynamic styling based on background - solid backgrounds to match theme
  const cardBg = isDark ? 'bg-zinc-900' : 'bg-white';
  const textPrimary = isDark ? 'text-white' : 'text-zinc-900';
  const textSecondary = isDark ? 'text-zinc-400' : 'text-zinc-600';
  const borderColor = isDark ? 'border-zinc-700' : 'border-zinc-200';

  // Get real leads from artifacts (no dummy data)
  const leads = artifacts.leads;
  const outreach = artifacts.outreach;
  const allLeads = leads?.leads || [];

  const getScriptForLead = (leadId: string) => {
    return outreach?.scripts.find(s => s.leadId === leadId);
  };

  // Handler for opening lead generation modal
  const handleGenerateLeads = () => {
    setShowLeadGenModal(true);
  };

  // Handler for submitting lead generation
  const handleSubmitLeadGen = () => {
    if (!leadGenIndustry || !leadGenLocation) return;

    // Send explicit tool call request
    window.dispatchEvent(new CustomEvent('autoSubmitPrompt', {
      detail: {
        prompt: `Use the generate_leads tool to find ${leadGenCount} leads. Search for "${leadGenIndustry}" businesses in "${leadGenLocation}". Execute the generate_leads tool now with category="${leadGenIndustry}" and location="${leadGenLocation}" and numberOfLeads=${leadGenCount}.`
      }
    }));

    // Close modal and reset
    setShowLeadGenModal(false);
    setLeadGenIndustry('');
    setLeadGenLocation('');
    setLeadGenCount(20);
  };

  // Handler for lead status updates
  const handleUpdateLeadStatus = (leadId: string, status: Lead['status']) => {
    updateLeadStatus(leadId, status);
  };

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedLead(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, columnId: Lead['status']) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, columnId: Lead['status']) => {
    e.preventDefault();
    if (draggedLead && draggedLead.status !== columnId) {
      handleUpdateLeadStatus(draggedLead.id, columnId);
    }
    setDraggedLead(null);
    setDragOverColumn(null);
  };

  // Get leads for a specific column
  const getLeadsForColumn = (status: Lead['status']) => {
    return allLeads.filter(lead => lead.status === status);
  };

  // Always show the Kanban board - no empty state
  return (
    <div className="h-full flex flex-col overflow-hidden" style={bgStyle}>
      {/* Header */}
      <div className={`px-6 py-4 border-b ${borderColor} flex items-center justify-between shrink-0 ${cardBg}`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${isDark ? 'bg-zinc-800' : 'bg-zinc-100'} flex items-center justify-center`}>
            <Users size={20} className={isDark ? 'text-zinc-400' : 'text-zinc-600'} />
          </div>
          <div>
            <h3 className={`font-semibold ${textPrimary}`}>
              Your Pipeline
            </h3>
            <p className={`text-xs ${textSecondary}`}>
              {allLeads.length} {allLeads.length === 1 ? 'prospect' : 'prospects'} · Drag to move
            </p>
          </div>
        </div>
        <button
          onClick={handleGenerateLeads}
          disabled={isLeadsLoading}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium ${isDark ? 'bg-white hover:bg-zinc-100 text-zinc-900' : 'bg-zinc-900 hover:bg-zinc-800 text-white'} rounded-lg transition-colors disabled:opacity-50`}
        >
          <Target size={16} />
          {isLeadsLoading ? 'Generating...' : 'Generate Leads'}
        </button>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
        <div className="flex gap-4 h-full min-w-max">
          {COLUMNS.map(column => {
            const columnLeads = getLeadsForColumn(column.id);
            const isOver = dragOverColumn === column.id;

            return (
              <div
                key={column.id}
                className={`w-80 flex flex-col rounded-xl ${isDark ? 'bg-zinc-800' : 'bg-zinc-100'} border transition-colors ${
                  isOver
                    ? isDark ? 'border-zinc-500 bg-zinc-700' : 'border-zinc-400 bg-zinc-200'
                    : borderColor
                }`}
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                {/* Column Header */}
                <div className={`px-4 py-3 border-b ${borderColor}`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${column.color}`} />
                    <span className={`font-medium text-sm ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                      {column.label}
                    </span>
                    <span className={`ml-auto text-xs ${isDark ? 'text-zinc-200 bg-zinc-600' : 'text-zinc-700 bg-zinc-200'} px-1.5 py-0.5 rounded`}>
                      {columnLeads.length}
                    </span>
                  </div>
                </div>

                {/* Cards */}
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {/* Loading skeletons when generating leads */}
                  {isLeadsLoading && column.id === 'new' ? (
                    <>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={`skeleton-${i}`}
                          className={`p-3 rounded-lg border ${isDark ? 'bg-zinc-700/50 border-zinc-600' : 'bg-white border-zinc-200'} animate-pulse`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-8 h-8 rounded-lg ${isDark ? 'bg-zinc-600' : 'bg-zinc-200'}`} />
                            <div className="flex-1 space-y-2">
                              <div className={`h-4 rounded ${isDark ? 'bg-zinc-600' : 'bg-zinc-200'} w-3/4`} />
                              <div className={`h-3 rounded ${isDark ? 'bg-zinc-600' : 'bg-zinc-200'} w-1/2`} />
                            </div>
                            <div className={`w-8 h-5 rounded ${isDark ? 'bg-zinc-600' : 'bg-zinc-200'}`} />
                          </div>
                          <div className="mt-3 flex gap-2">
                            <div className={`h-6 rounded ${isDark ? 'bg-zinc-600' : 'bg-zinc-200'} w-16`} />
                            <div className={`h-6 rounded ${isDark ? 'bg-zinc-600' : 'bg-zinc-200'} w-20`} />
                          </div>
                        </div>
                      ))}
                      <div className={`flex items-center justify-center gap-2 py-4 ${textSecondary}`}>
                        <Loader2 size={16} className="animate-spin" />
                        <span className="text-xs">Finding leads...</span>
                      </div>
                    </>
                  ) : columnLeads.length === 0 ? (
                    <div className={`text-center py-8 ${isDark ? 'text-zinc-500' : 'text-zinc-400'} text-xs`}>
                      {column.id === 'new' && allLeads.length === 0 ? (
                        <button
                          onClick={handleGenerateLeads}
                          className={`flex flex-col items-center gap-2 w-full py-4 rounded-lg border-2 border-dashed ${isDark ? 'border-zinc-700 hover:border-zinc-600' : 'border-zinc-300 hover:border-zinc-400'} transition-colors`}
                        >
                          <Target size={20} className={isDark ? 'text-zinc-500' : 'text-zinc-400'} />
                          <span>Generate leads</span>
                        </button>
                      ) : (
                        'Drop leads here'
                      )}
                    </div>
                  ) : (
                    columnLeads.map(lead => (
                      <LeadCard
                        key={lead.id}
                        lead={lead}
                        isDragging={draggedLead?.id === lead.id}
                        isDark={isDark}
                        onDragStart={(e) => handleDragStart(e, lead)}
                        onDragEnd={handleDragEnd}
                        onEmail={() => setEmailModalLead(lead)}
                        onCall={() => setCallModalLead(lead)}
                        onClick={() => setCanvasState({ type: 'lead-detail', leadId: lead.id })}
                        hasScript={!!getScriptForLead(lead.id)}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lead Generation Modal */}
      {showLeadGenModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowLeadGenModal(false)}>
          <div
            className={`${isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-zinc-200'} border rounded-2xl p-6 w-full max-w-md shadow-xl`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-lg font-semibold ${textPrimary}`}>Generate Leads</h2>
              <button
                onClick={() => setShowLeadGenModal(false)}
                className={`p-1 rounded-lg ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'} transition-colors`}
              >
                <X size={20} className={textSecondary} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Industry Select */}
              <div>
                <label className={`block text-sm font-medium ${textSecondary} mb-2`}>
                  <Building2 size={14} className="inline mr-2" />
                  Industry
                </label>
                <select
                  value={leadGenIndustry}
                  onChange={(e) => setLeadGenIndustry(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border ${isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-zinc-300 text-zinc-900'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                >
                  <option value="">Select an industry...</option>
                  {INDUSTRY_OPTIONS.map(industry => (
                    <option key={industry} value={industry}>{industry}</option>
                  ))}
                </select>
              </div>

              {/* Location Input */}
              <div>
                <label className={`block text-sm font-medium ${textSecondary} mb-2`}>
                  <MapPin size={14} className="inline mr-2" />
                  Location
                </label>
                <input
                  type="text"
                  value={leadGenLocation}
                  onChange={(e) => setLeadGenLocation(e.target.value)}
                  placeholder="e.g., Austin, TX or Miami, FL"
                  className={`w-full px-4 py-3 rounded-xl border ${isDark ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500' : 'bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>

              {/* Count Slider */}
              <div>
                <label className={`block text-sm font-medium ${textSecondary} mb-2`}>
                  Number of Leads: <span className={textPrimary}>{leadGenCount}</span>
                </label>
                <input
                  type="range"
                  min="10"
                  max="50"
                  step="5"
                  value={leadGenCount}
                  onChange={(e) => setLeadGenCount(parseInt(e.target.value))}
                  className="w-full accent-blue-500"
                />
                <div className={`flex justify-between text-xs ${textSecondary} mt-1`}>
                  <span>10</span>
                  <span>50</span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmitLeadGen}
              disabled={!leadGenIndustry || !leadGenLocation}
              className={`w-full mt-6 py-3 px-4 rounded-xl font-medium transition-colors ${
                leadGenIndustry && leadGenLocation
                  ? isDark ? 'bg-white text-zinc-900 hover:bg-zinc-100' : 'bg-zinc-900 text-white hover:bg-zinc-800'
                  : isDark ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
              }`}
            >
              Generate {leadGenCount} Leads
            </button>
          </div>
        </div>
      )}

      {/* Email Modal */}
      {emailModalLead && getScriptForLead(emailModalLead.id) && (
        <EmailModal
          isOpen={!!emailModalLead}
          onClose={() => setEmailModalLead(null)}
          lead={emailModalLead}
          script={getScriptForLead(emailModalLead.id)!}
        />
      )}

      {/* Call Script Modal */}
      {callModalLead && getScriptForLead(callModalLead.id) && (
        <CallScriptModal
          isOpen={!!callModalLead}
          onClose={() => setCallModalLead(null)}
          lead={callModalLead}
          script={getScriptForLead(callModalLead.id)!}
        />
      )}
    </div>
  );
}

// =============================================================================
// LEAD CARD COMPONENT
// =============================================================================

interface LeadCardProps {
  lead: Lead;
  isDragging: boolean;
  isDark: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onEmail: () => void;
  onCall: () => void;
  onClick: () => void;
  hasScript: boolean;
}

function LeadCard({
  lead,
  isDragging,
  isDark,
  onDragStart,
  onDragEnd,
  onEmail,
  onCall,
  onClick,
  hasScript,
}: LeadCardProps) {
  // Get website status indicator
  const getWebsiteIndicator = () => {
    if (!lead.websiteAnalysis) return null;
    const status = lead.websiteAnalysis.status;
    if (status === 'none') return { icon: AlertTriangle, color: 'text-red-400', label: 'No website' };
    if (status === 'broken') return { icon: AlertTriangle, color: 'text-red-400', label: 'Broken' };
    if (status === 'poor') return { icon: AlertTriangle, color: 'text-orange-400', label: 'Poor' };
    if (status === 'outdated') return { icon: Globe, color: 'text-orange-400', label: 'Outdated' };
    return { icon: Globe, color: 'text-green-400', label: 'Good' };
  };

  const websiteIndicator = getWebsiteIndicator();

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={`${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-zinc-200'} rounded-lg border p-3 cursor-pointer active:cursor-grabbing transition-all ${
        isDragging ? 'opacity-50 scale-95' : isDark ? 'hover:shadow-md hover:border-zinc-600' : 'hover:shadow-md hover:border-zinc-300'
      }`}
    >
      {/* Header with drag handle */}
      <div className="flex items-start gap-2 mb-2">
        <GripVertical size={14} className={`${isDark ? 'text-zinc-500' : 'text-zinc-400'} cursor-grab`} />
        <div className="flex-1 min-w-0">
          <h4 className={`font-medium text-sm ${isDark ? 'text-white' : 'text-zinc-900'} truncate`}>
            {lead.companyName}
          </h4>
          {lead.contactEmail && (
            <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'} truncate`}>
              {lead.contactEmail}
            </p>
          )}
        </div>
        <div className={`text-xs font-medium ${getScoreColor(lead.score, isDark)} px-1.5 py-0.5 rounded`}>
          {lead.score}/100
        </div>
      </div>

      {/* Industry & Website Status */}
      <div className="flex items-center gap-2 mb-2">
        {lead.industry && (
          <span className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'} truncate`}>
            {lead.industry}
          </span>
        )}
        {websiteIndicator && (
          <span className={`flex items-center gap-1 text-xs ${websiteIndicator.color}`}>
            <websiteIndicator.icon size={10} />
            {websiteIndicator.label}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className={`flex items-center gap-1 pt-2 border-t ${isDark ? 'border-zinc-700' : 'border-zinc-100'}`}>
        <button
          onClick={(e) => { e.stopPropagation(); onEmail(); }}
          disabled={!lead.contactEmail}
          className={`p-1.5 rounded ${isDark ? 'text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700'} transition-colors disabled:opacity-40 disabled:cursor-not-allowed`}
          title={lead.contactEmail ? 'Send Email' : 'No email available'}
        >
          <Mail size={14} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onCall(); }}
          disabled={!hasScript}
          className={`p-1.5 rounded ${isDark ? 'text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700'} transition-colors disabled:opacity-40 disabled:cursor-not-allowed`}
          title={hasScript ? 'View Call Script' : 'Generate scripts first'}
        >
          <Phone size={14} />
        </button>
        {lead.contactLinkedIn && (
          <a
            href={lead.contactLinkedIn}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={`p-1.5 rounded ${isDark ? 'text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700'} transition-colors`}
            title="View LinkedIn"
          >
            <Linkedin size={14} />
          </a>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          className={`ml-auto p-1.5 rounded ${isDark ? 'text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700'} transition-colors`}
          title="Open Lead Details"
        >
          <ExternalLink size={14} />
        </button>
      </div>
    </div>
  );
}

// Helper function for score colors - improved contrast for dark mode
function getScoreColor(score: number, isDark: boolean): string {
  if (score >= 80) return isDark ? 'text-green-300 bg-green-900/50' : 'text-green-600 bg-green-100';
  if (score >= 60) return isDark ? 'text-blue-300 bg-blue-900/50' : 'text-blue-600 bg-blue-100';
  if (score >= 40) return isDark ? 'text-orange-300 bg-orange-900/50' : 'text-orange-600 bg-orange-100';
  return isDark ? 'text-zinc-400 bg-zinc-700' : 'text-zinc-500 bg-zinc-100';
}
