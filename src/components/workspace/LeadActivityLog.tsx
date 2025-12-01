'use client';

import { Mail, Phone, MessageSquare, ArrowRightLeft, FileText, Globe, Send, Clock } from 'lucide-react';
import type { LeadActivity } from '@/types/database';

interface LeadActivityLogProps {
  activities: LeadActivity[];
  leadId?: string; // Filter to specific lead if provided
  maxItems?: number;
}

const ACTIVITY_ICONS: Record<LeadActivity['type'], typeof Mail> = {
  email_sent: Mail,
  call_made: Phone,
  note_added: MessageSquare,
  status_changed: ArrowRightLeft,
  email_generated: FileText,
  website_generated: Globe,
  outreach_sent: Send,
  follow_up_set: Clock,
};

const ACTIVITY_COLORS: Record<LeadActivity['type'], string> = {
  email_sent: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30',
  call_made: 'text-green-500 bg-green-100 dark:bg-green-900/30',
  note_added: 'text-purple-500 bg-purple-100 dark:bg-purple-900/30',
  status_changed: 'text-orange-500 bg-orange-100 dark:bg-orange-900/30',
  email_generated: 'text-indigo-500 bg-indigo-100 dark:bg-indigo-900/30',
  website_generated: 'text-cyan-500 bg-cyan-100 dark:bg-cyan-900/30',
  outreach_sent: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30',
  follow_up_set: 'text-amber-500 bg-amber-100 dark:bg-amber-900/30',
};

const ACTIVITY_LABELS: Record<LeadActivity['type'], string> = {
  email_sent: 'Email Sent',
  call_made: 'Call Made',
  note_added: 'Note Added',
  status_changed: 'Status Changed',
  email_generated: 'Email Generated',
  website_generated: 'Website Generated',
  outreach_sent: 'Outreach Sent',
  follow_up_set: 'Follow-up Set',
};

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function LeadActivityLog({ activities, leadId, maxItems = 5 }: LeadActivityLogProps) {
  // Filter by lead if specified, then sort by date descending
  const filteredActivities = activities
    .filter(a => !leadId || a.leadId === leadId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, maxItems);

  if (filteredActivities.length === 0) {
    return (
      <div className="text-center py-4 text-zinc-400 dark:text-slate-500 text-sm">
        No activity yet
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {filteredActivities.map((activity) => {
        const Icon = ACTIVITY_ICONS[activity.type];
        const colorClass = ACTIVITY_COLORS[activity.type];
        const label = ACTIVITY_LABELS[activity.type];

        return (
          <div
            key={activity.id}
            className="flex items-start gap-3 p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
              <Icon size={14} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-700 dark:text-slate-300">
                  {label}
                </span>
                <span className="text-xs text-zinc-400 dark:text-slate-500">
                  {formatRelativeTime(activity.createdAt)}
                </span>
              </div>
              {activity.content && (
                <p className="text-xs text-zinc-500 dark:text-slate-400 truncate mt-0.5">
                  {activity.content}
                </p>
              )}
              {activity.metadata?.callDuration && (
                <p className="text-xs text-zinc-400 dark:text-slate-500 mt-0.5">
                  Duration: {activity.metadata.callDuration}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Compact version for inline display in LeadRow
export function LeadActivityBadge({ activities, leadId }: { activities: LeadActivity[], leadId: string }) {
  const leadActivities = activities.filter(a => a.leadId === leadId);
  const count = leadActivities.length;

  if (count === 0) return null;

  const emailCount = leadActivities.filter(a => a.type === 'email_sent').length;
  const callCount = leadActivities.filter(a => a.type === 'call_made').length;

  return (
    <div className="flex items-center gap-1 text-xs text-zinc-400">
      {emailCount > 0 && (
        <span className="flex items-center gap-0.5">
          <Mail size={10} />
          {emailCount}
        </span>
      )}
      {callCount > 0 && (
        <span className="flex items-center gap-0.5">
          <Phone size={10} />
          {callCount}
        </span>
      )}
    </div>
  );
}
