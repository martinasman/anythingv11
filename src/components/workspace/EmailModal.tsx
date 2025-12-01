'use client';

import { X, Copy, ExternalLink, Check, Send, Loader2 } from 'lucide-react';
import { useState } from 'react';
import type { Lead, OutreachScript } from '@/types/database';
import { useProjectStore } from '@/store/projectStore';

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead;
  script: OutreachScript;
}

export default function EmailModal({ isOpen, onClose, lead, script }: EmailModalProps) {
  const { addLeadActivity, updateLeadStatus } = useProjectStore();
  const [subject, setSubject] = useState(script.emailScript.subject);
  const [body, setBody] = useState(script.emailScript.body);
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = async () => {
    const fullEmail = `Subject: ${subject}\n\n${body}`;
    await navigator.clipboard.writeText(fullEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenMailto = () => {
    const mailtoUrl = `mailto:${lead.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, '_blank');
  };

  const handleSendEmail = async () => {
    if (!lead.contactEmail) {
      setError('No email address available');
      return;
    }

    setSending(true);
    setError(null);

    try {
      // For now, just log the activity (Resend integration can be added later)
      // In production, this would call /api/leads/email to actually send

      // Simulate a brief delay for UX
      await new Promise(resolve => setTimeout(resolve, 500));

      // Log the email activity
      await addLeadActivity({
        leadId: lead.id,
        type: 'email_sent',
        content: subject,
        metadata: {
          emailSubject: subject,
          emailTo: lead.contactEmail
        }
      });

      // Update lead status to contacted if it was new
      if (lead.status === 'new') {
        await updateLeadStatus(lead.id, 'contacted');
      }

      setSent(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Failed to send email:', err);
      setError('Failed to send email. Please try again.');
    } finally {
      setSending(false);
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
              Email to {lead.companyName}
            </h3>
            <p className="text-sm text-zinc-500 dark:text-slate-400">
              {lead.contactEmail || 'No email available'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-slate-300 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-slate-300 mb-1">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-slate-300 mb-1">
              Message
            </label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={12}
              className="w-full px-4 py-3 rounded-lg border border-zinc-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
            />
          </div>

          {/* Follow-up Scripts */}
          <div className="pt-4 border-t border-zinc-200 dark:border-slate-700">
            <h4 className="text-sm font-medium text-zinc-700 dark:text-slate-300 mb-2">
              Follow-up Templates
            </h4>
            <div className="space-y-2">
              <button
                onClick={() => setBody(script.emailScript.followUp1)}
                className="w-full text-left p-3 rounded-lg bg-zinc-50 dark:bg-slate-800 hover:bg-zinc-100 dark:hover:bg-slate-700 border border-zinc-200 dark:border-slate-700 transition-colors"
              >
                <span className="text-xs font-medium text-zinc-500 dark:text-slate-400">Follow-up 1</span>
                <p className="text-sm text-zinc-700 dark:text-slate-300 truncate mt-1">
                  {script.emailScript.followUp1.slice(0, 100)}...
                </p>
              </button>
              <button
                onClick={() => setBody(script.emailScript.followUp2)}
                className="w-full text-left p-3 rounded-lg bg-zinc-50 dark:bg-slate-800 hover:bg-zinc-100 dark:hover:bg-slate-700 border border-zinc-200 dark:border-slate-700 transition-colors"
              >
                <span className="text-xs font-medium text-zinc-500 dark:text-slate-400">Follow-up 2</span>
                <p className="text-sm text-zinc-700 dark:text-slate-300 truncate mt-1">
                  {script.emailScript.followUp2.slice(0, 100)}...
                </p>
              </button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Success message */}
          {sent && (
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
              <Check size={16} />
              Email sent successfully!
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-200 dark:border-slate-800 bg-zinc-50 dark:bg-slate-800/50">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-600 dark:text-slate-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            onClick={handleOpenMailto}
            disabled={!lead.contactEmail}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-600 dark:text-slate-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-slate-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ExternalLink size={16} />
            Open in Email App
          </button>
          <button
            onClick={handleSendEmail}
            disabled={!lead.contactEmail || sending || sent}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium btn-primary text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : sent ? (
              <Check size={16} />
            ) : (
              <Send size={16} />
            )}
            {sending ? 'Sending...' : sent ? 'Sent!' : 'Send Email'}
          </button>
        </div>
      </div>
    </div>
  );
}
