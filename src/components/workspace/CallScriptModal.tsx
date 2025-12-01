'use client';

import { X, Copy, Check, Phone, Clock, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import type { Lead, OutreachScript } from '@/types/database';
import { useProjectStore } from '@/store/projectStore';

interface CallScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead;
  script: OutreachScript;
}

const CALL_OUTCOMES = [
  { value: 'connected', label: 'Connected - Had conversation' },
  { value: 'voicemail', label: 'Left voicemail' },
  { value: 'no_answer', label: 'No answer' },
  { value: 'follow_up_scheduled', label: 'Follow-up scheduled' },
  { value: 'not_interested', label: 'Not interested' },
];

export default function CallScriptModal({ isOpen, onClose, lead, script }: CallScriptModalProps) {
  const { addLeadActivity, updateLeadStatus } = useProjectStore();
  const [copied, setCopied] = useState(false);
  const [showLogForm, setShowLogForm] = useState(false);
  const [callDuration, setCallDuration] = useState('');
  const [callOutcome, setCallOutcome] = useState('connected');
  const [callNotes, setCallNotes] = useState('');
  const [logging, setLogging] = useState(false);

  if (!isOpen) return null;

  const { callScript } = script;

  const handleCopyAll = async () => {
    const fullScript = `
CALL SCRIPT FOR: ${lead.companyName}

OPENER:
${callScript.opener}

VALUE PROPOSITION:
${callScript.valueProposition}

DISCOVERY QUESTIONS:
${callScript.questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

OBJECTION HANDLERS:
${Object.entries(callScript.objectionHandlers).map(([obj, response]) => `- "${obj}"\n  → ${response}`).join('\n\n')}

CLOSE:
${callScript.closeAttempt}
    `.trim();

    await navigator.clipboard.writeText(fullScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogCall = async () => {
    setLogging(true);

    try {
      const outcomeLabel = CALL_OUTCOMES.find(o => o.value === callOutcome)?.label || callOutcome;

      // Log the call activity
      await addLeadActivity({
        leadId: lead.id,
        type: 'call_made',
        content: callNotes || outcomeLabel,
        metadata: {
          callDuration: callDuration || 'Not specified',
          callOutcome
        }
      });

      // Update lead status to contacted if it was new
      if (lead.status === 'new') {
        await updateLeadStatus(lead.id, 'contacted');
      }

      // Close modal after logging
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error) {
      console.error('Failed to log call:', error);
    } finally {
      setLogging(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl mx-4 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-slate-800 max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-slate-800 bg-blue-500/10 dark:bg-blue-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full btn-primary flex items-center justify-center">
              <Phone size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                Call Script
              </h3>
              <p className="text-sm text-zinc-500 dark:text-slate-400">
                {lead.companyName} {lead.contactName && `- ${lead.contactName}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-slate-300 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Log Call Form (collapsible) */}
          {showLogForm && (
            <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 space-y-4">
              <h4 className="text-sm font-semibold text-green-800 dark:text-green-300 flex items-center gap-2">
                <MessageSquare size={16} />
                Log This Call
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-slate-400 mb-1">
                    Duration
                  </label>
                  <div className="relative">
                    <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      placeholder="e.g., 5 min"
                      value={callDuration}
                      onChange={e => setCallDuration(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-zinc-900 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-slate-400 mb-1">
                    Outcome
                  </label>
                  <select
                    value={callOutcome}
                    onChange={e => setCallOutcome(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-zinc-900 dark:text-white"
                  >
                    {CALL_OUTCOMES.map(outcome => (
                      <option key={outcome.value} value={outcome.value}>
                        {outcome.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-slate-400 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  placeholder="Key points discussed, next steps..."
                  value={callNotes}
                  onChange={e => setCallNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-zinc-900 dark:text-white resize-none"
                />
              </div>

              <button
                onClick={handleLogCall}
                disabled={logging}
                className="w-full py-2 text-sm font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {logging ? 'Saving...' : 'Save Call Log'}
              </button>
            </div>
          )}

          {/* Opener */}
          <section>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-2">
              Opener
            </h4>
            <p className="text-sm text-zinc-700 dark:text-slate-300 bg-zinc-50 dark:bg-slate-800 p-4 rounded-lg">
              {callScript.opener}
            </p>
          </section>

          {/* Value Proposition */}
          <section>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-2">
              Value Proposition
            </h4>
            <p className="text-sm text-zinc-700 dark:text-slate-300 bg-zinc-50 dark:bg-slate-800 p-4 rounded-lg">
              {callScript.valueProposition}
            </p>
          </section>

          {/* Discovery Questions */}
          <section>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-2">
              Discovery Questions
            </h4>
            <ul className="space-y-2">
              {callScript.questions.map((question, index) => (
                <li
                  key={index}
                  className="text-sm text-zinc-700 dark:text-slate-300 bg-zinc-50 dark:bg-slate-800 p-3 rounded-lg flex gap-2"
                >
                  <span className="text-blue-500 font-semibold">{index + 1}.</span>
                  {question}
                </li>
              ))}
            </ul>
          </section>

          {/* Objection Handlers */}
          <section>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-2">
              Objection Handlers
            </h4>
            <div className="space-y-3">
              {Object.entries(callScript.objectionHandlers).map(([objection, response], index) => (
                <div key={index} className="bg-zinc-50 dark:bg-slate-800 p-4 rounded-lg">
                  <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">
                    &ldquo;{objection}&rdquo;
                  </p>
                  <p className="text-sm text-zinc-700 dark:text-slate-300 pl-4 border-l-2 border-blue-500">
                    {response}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Close */}
          <section>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-2">
              Close Attempt
            </h4>
            <p className="text-sm text-zinc-700 dark:text-slate-300 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              {callScript.closeAttempt}
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-zinc-200 dark:border-slate-800 bg-zinc-50 dark:bg-slate-800/50">
          <button
            onClick={() => setShowLogForm(!showLogForm)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              showLogForm
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : 'text-zinc-600 dark:text-slate-400 hover:bg-zinc-100 dark:hover:bg-slate-700'
            }`}
          >
            <Phone size={16} />
            {showLogForm ? 'Hide Log Form' : 'Log Call'}
          </button>
          <button
            onClick={handleCopyAll}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium btn-primary text-white rounded-lg transition-colors"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copied!' : 'Copy Full Script'}
          </button>
        </div>
      </div>
    </div>
  );
}
