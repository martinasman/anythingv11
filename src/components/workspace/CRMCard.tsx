'use client';

import { useState } from 'react';
import { Target, Users, Flame, CloudSun, Snowflake } from 'lucide-react';
import type { Lead, OutreachArtifact, LeadsArtifact } from '@/types/database';
import LeadRow from './LeadRow';
import EmailModal from './EmailModal';
import CallScriptModal from './CallScriptModal';

interface CRMCardProps {
  leads: LeadsArtifact | null;
  outreach: OutreachArtifact | null;
  isLoading: boolean;
  onGenerateLeads: () => void;
  onUpdateLeadStatus?: (leadId: string, status: Lead['status']) => void;
  compact?: boolean;
}

type FilterTab = 'all' | Lead['status'];
type ICPFilter = 'all' | 'hot' | 'warm' | 'cool';

const TABS: { value: FilterTab; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'responded', label: 'Responded' },
  { value: 'closed', label: 'Closed' },
];

const ICP_TABS: { value: ICPFilter; label: string; icon?: React.ReactNode }[] = [
  { value: 'all', label: 'All Scores' },
  { value: 'hot', label: 'Hot', icon: <Flame size={14} /> },
  { value: 'warm', label: 'Warm', icon: <CloudSun size={14} /> },
  { value: 'cool', label: 'Cool', icon: <Snowflake size={14} /> },
];

export default function CRMCard({
  leads,
  outreach,
  isLoading,
  onGenerateLeads,
  onUpdateLeadStatus,
  compact = false,
}: CRMCardProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [icpFilter, setIcpFilter] = useState<ICPFilter>('all');
  const [emailModalLead, setEmailModalLead] = useState<Lead | null>(null);
  const [callModalLead, setCallModalLead] = useState<Lead | null>(null);

  const allLeads = leads?.leads || [];

  // Apply both status and ICP filters
  const filteredLeads = allLeads.filter(lead => {
    // Status filter
    const statusMatch = activeTab === 'all' || lead.status === activeTab;

    // ICP score filter
    let icpMatch = true;
    if (icpFilter === 'hot') {
      icpMatch = lead.icpScore >= 8;
    } else if (icpFilter === 'warm') {
      icpMatch = lead.icpScore >= 5 && lead.icpScore < 8;
    } else if (icpFilter === 'cool') {
      icpMatch = lead.icpScore >= 3 && lead.icpScore < 5;
    }

    return statusMatch && icpMatch;
  });

  const getScriptForLead = (leadId: string) => {
    return outreach?.scripts.find(s => s.leadId === leadId);
  };

  const handleStatusChange = (leadId: string, status: Lead['status']) => {
    onUpdateLeadStatus?.(leadId, status);
  };

  // Empty state
  if (!leads && !isLoading) {
    return (
      <div className="h-full bg-white dark:bg-zinc-800/50 flex flex-col items-center justify-center p-8">
        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center mb-4">
          <Users size={32} className="text-blue-500" />
        </div>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
          No Leads Yet
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center mb-6 max-w-xs">
          Generate leads to start building your sales pipeline
        </p>
        <button
          onClick={onGenerateLeads}
          className="flex items-center gap-2 px-6 py-3 btn-primary font-semibold rounded-xl transition-colors"
        >
          <Target size={20} />
          Generate 10 Leads
        </button>
      </div>
    );
  }

  // Loading state
  if (isLoading && !leads) {
    return (
      <div className="h-full bg-white dark:bg-zinc-800/50 flex flex-col items-center justify-center p-8 animate-pulse">
        <div className="w-16 h-16 rounded-2xl bg-zinc-200 dark:bg-zinc-700 mb-4" />
        <div className="w-32 h-5 bg-zinc-200 dark:bg-zinc-700 rounded mb-2" />
        <div className="w-48 h-4 bg-zinc-200 dark:bg-zinc-700 rounded" />
      </div>
    );
  }

  return (
    <div className="h-full bg-white dark:bg-zinc-800/50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <Users size={20} className="text-blue-500" />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-white">
              Your Leads
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {allLeads.length} {allLeads.length === 1 ? 'prospect' : 'prospects'}
            </p>
          </div>
        </div>
        <button
          onClick={onGenerateLeads}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium btn-primary rounded-lg transition-colors"
        >
          <Target size={16} />
          Generate More
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div className="px-6 py-2 border-b border-zinc-200 dark:border-zinc-700">
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map(tab => {
            const count = tab.value === 'all'
              ? allLeads.length
              : allLeads.filter(l => l.status === tab.value).length;

            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                  activeTab === tab.value
                    ? 'btn-primary'
                    : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800'
                }`}
              >
                {tab.label} {count > 0 && `(${count})`}
              </button>
            );
          })}
        </div>
      </div>

      {/* ICP Score Filter Tabs */}
      <div className="px-6 py-2 border-b border-zinc-200 dark:border-zinc-700">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
            ICP Score:
          </span>
          <div className="flex gap-1 overflow-x-auto">
            {ICP_TABS.map(tab => {
              let count = 0;
              if (tab.value === 'all') {
                count = allLeads.length;
              } else if (tab.value === 'hot') {
                count = allLeads.filter(l => l.icpScore >= 8).length;
              } else if (tab.value === 'warm') {
                count = allLeads.filter(l => l.icpScore >= 5 && l.icpScore < 8).length;
              } else if (tab.value === 'cool') {
                count = allLeads.filter(l => l.icpScore >= 3 && l.icpScore < 5).length;
              }

              return (
                <button
                  key={tab.value}
                  onClick={() => setIcpFilter(tab.value)}
                  className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                    icpFilter === tab.value
                      ? tab.value === 'hot'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : tab.value === 'warm'
                        ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                        : tab.value === 'cool'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-zinc-500 text-white'
                      : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800'
                  }`}
                >
                  {tab.icon}
                  {tab.label} {count > 0 && `(${count})`}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Table Header */}
      <div className="px-6 py-2 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
        <div className="grid grid-cols-12 gap-4 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
          <div className="col-span-4">Company</div>
          <div className="col-span-2">Industry</div>
          <div className="col-span-2">Score</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>
      </div>

      {/* Leads List */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
        {filteredLeads.length === 0 ? (
          <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
            <p className="text-sm">No leads in this category</p>
          </div>
        ) : (
          filteredLeads.map(lead => (
            <LeadRow
              key={lead.id}
              lead={lead}
              script={getScriptForLead(lead.id)}
              onEmail={() => setEmailModalLead(lead)}
              onCall={() => setCallModalLead(lead)}
              onStatusChange={(status) => handleStatusChange(lead.id, status)}
            />
          ))
        )}
      </div>

      {/* Scripts reminder if no outreach */}
      {leads && !outreach && (
        <div className="px-6 py-3 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-700 dark:text-blue-400">
            Generate outreach scripts to enable email and call actions for your leads.
          </p>
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
