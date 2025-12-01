'use client';

import { Mail, Phone, Linkedin, ChevronDown, Info, Flame, CloudSun, Snowflake } from 'lucide-react';
import type { Lead, OutreachScript } from '@/types/database';
import { useState } from 'react';

interface LeadRowProps {
  lead: Lead;
  script?: OutreachScript;
  onEmail: () => void;
  onCall: () => void;
  onStatusChange: (status: Lead['status']) => void;
}

const STATUS_OPTIONS: { value: Lead['status']; label: string; color: string }[] = [
  { value: 'new', label: 'New', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  { value: 'contacted', label: 'Contacted', color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400' },
  { value: 'responded', label: 'Responded', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  { value: 'closed', label: 'Closed', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  { value: 'lost', label: 'Lost', color: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400' },
];

export default function LeadRow({ lead, script, onEmail, onCall, onStatusChange }: LeadRowProps) {
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const currentStatus = STATUS_OPTIONS.find(s => s.value === lead.status) || STATUS_OPTIONS[0];

  return (
    <div className="px-2 py-3 bg-white dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-600 transition-all">
      <div className="grid grid-cols-12 gap-4 items-center">
        {/* Company - col-span-4 */}
        <div className="col-span-4 min-w-0">
          <h4 className="font-semibold text-sm text-zinc-900 dark:text-white truncate">
            {lead.companyName}
          </h4>
          {lead.contactEmail && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
              {lead.contactEmail}
            </p>
          )}
        </div>

        {/* Industry - col-span-2 */}
        <div className="col-span-2">
          <span className="text-sm text-zinc-600 dark:text-zinc-300 truncate block">
            {lead.industry || '—'}
          </span>
        </div>

        {/* ICP Score - col-span-2 */}
        <div className="col-span-2 flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded ${
            lead.icpScore >= 8
              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              : lead.icpScore >= 5
              ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
              : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
          }`}>
            {lead.icpScore >= 8 ? <Flame size={12} /> : lead.icpScore >= 5 ? <CloudSun size={12} /> : <Snowflake size={12} />}
            {lead.icpScore}/10
          </span>

          {/* Match reasons tooltip */}
          {lead.icpMatchReasons && lead.icpMatchReasons.length > 0 && (
            <div className="relative group">
              <Info size={14} className="text-zinc-400 cursor-help" />
              <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-50 w-64 p-2 bg-zinc-900 text-white text-xs rounded-lg shadow-lg">
                <p className="font-semibold mb-1">Why this lead matches:</p>
                <ul className="space-y-0.5">
                  {lead.icpMatchReasons.map((reason, i) => (
                    <li key={i}>✓ {reason}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Status - col-span-2 */}
        <div className="col-span-2 relative">
          <button
            onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${currentStatus.color}`}
          >
            {currentStatus.label}
            <ChevronDown size={14} />
          </button>

          {statusDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setStatusDropdownOpen(false)}
              />
              <div className="absolute left-0 top-full mt-1 z-20 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-lg py-1 min-w-[120px]">
                {STATUS_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    onClick={() => {
                      onStatusChange(option.value);
                      setStatusDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-1.5 text-left text-xs hover:bg-zinc-100 dark:hover:bg-zinc-700 ${
                      option.value === lead.status ? 'font-semibold' : ''
                    }`}
                  >
                    <span className={`inline-block px-2 py-0.5 rounded ${option.color}`}>
                      {option.label}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Actions - col-span-2 */}
        <div className="col-span-2 flex items-center justify-end gap-1">
          {/* Email Button */}
          <button
            onClick={onEmail}
            disabled={!lead.contactEmail}
            className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-zinc-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title={lead.contactEmail ? 'Send Email' : 'No email available'}
          >
            <Mail size={16} />
          </button>

          {/* Call Button */}
          <button
            onClick={onCall}
            disabled={!script}
            className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-zinc-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title={script ? 'View Call Script' : 'Generate scripts first'}
          >
            <Phone size={16} />
          </button>

          {/* LinkedIn Button */}
          {lead.contactLinkedIn && (
            <a
              href={lead.contactLinkedIn}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-zinc-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400 transition-colors"
              title="View LinkedIn"
            >
              <Linkedin size={16} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
