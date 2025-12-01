'use client';

import { useState, useMemo } from 'react';
import { X, Code, Download, ChevronDown, Save, AlertCircle, FileText, FileCode } from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import CodeEditor from '@/components/editor/CodeEditor';
import { exportSingleHTML, exportZIP } from '@/utils/websiteExport';

interface WebsiteCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
}

export default function WebsiteCodeModal({ isOpen, onClose, isDark = false }: WebsiteCodeModalProps) {
  const { artifacts, project } = useProjectStore();
  const [activeTab, setActiveTab] = useState<'html' | 'css' | 'javascript'>('html');
  const [isSaving, setIsSaving] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Initialize drafts from artifact
  const htmlFile = artifacts.website?.files.find(f => f.path === '/index.html');
  const cssFile = artifacts.website?.files.find(f => f.path === '/styles.css');
  const jsFile = artifacts.website?.files.find(f => f.path === '/script.js');

  const [drafts, setDrafts] = useState({
    html: htmlFile?.content || '',
    css: cssFile?.content || '',
    javascript: jsFile?.content || '',
  });

  // Detect unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    return (
      drafts.html !== (htmlFile?.content || '') ||
      drafts.css !== (cssFile?.content || '') ||
      drafts.javascript !== (jsFile?.content || '')
    );
  }, [drafts, htmlFile, cssFile, jsFile]);

  // Handle code changes
  const handleCodeChange = (newCode: string) => {
    setDrafts(prev => ({ ...prev, [activeTab]: newCode }));
    setSaveError(null);
  };

  // Apply changes to artifact
  const handleApply = async () => {
    if (!project?.id || !hasUnsavedChanges) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const response = await fetch('/api/artifacts/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          type: 'website_code',
          data: {
            files: [
              { path: '/index.html', content: drafts.html, type: 'html' },
              { path: '/styles.css', content: drafts.css, type: 'css' },
              { path: '/script.js', content: drafts.javascript, type: 'js' },
            ],
            primaryPage: '/index.html',
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save changes');
      }

      // Close modal on success
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error) {
      console.error('Failed to save:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  // Cancel and close
  const handleCancel = () => {
    // Reset drafts to original
    setDrafts({
      html: htmlFile?.content || '',
      css: cssFile?.content || '',
      javascript: jsFile?.content || '',
    });
    onClose();
  };

  // Export single HTML
  const handleExportHTML = () => {
    const files = [
      { path: '/index.html', content: drafts.html, type: 'html' as const },
      { path: '/styles.css', content: drafts.css, type: 'css' as const },
      { path: '/script.js', content: drafts.javascript, type: 'js' as const },
    ];
    const projectName = artifacts.identity?.name || project?.name || 'website';
    exportSingleHTML(files, projectName);
    setExportOpen(false);
  };

  // Export ZIP
  const handleExportZIP = async () => {
    const files = [
      { path: '/index.html', content: drafts.html, type: 'html' as const },
      { path: '/styles.css', content: drafts.css, type: 'css' as const },
      { path: '/script.js', content: drafts.javascript, type: 'js' as const },
    ];
    const projectName = artifacts.identity?.name || project?.name || 'website';
    await exportZIP(files, projectName);
    setExportOpen(false);
  };

  if (!isOpen) return null;

  const tabConfig = [
    { key: 'html' as const, label: 'index.html', icon: FileText },
    { key: 'css' as const, label: 'styles.css', icon: FileCode },
    { key: 'javascript' as const, label: 'script.js', icon: Code },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm"
      onClick={handleCancel}
    >
      <div
        className="relative w-full max-w-6xl mx-4 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-slate-800 max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <Code size={20} className="text-zinc-500" />
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
              Website Code Editor
            </h3>
          </div>
          <button
            onClick={handleCancel}
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-slate-300 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-6 py-2 border-b border-zinc-200 dark:border-slate-800 bg-zinc-50 dark:bg-slate-800/50">
          {tabConfig.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === key
                  ? 'bg-white dark:bg-slate-700 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-600 dark:text-slate-400 hover:text-zinc-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-hidden">
          <CodeEditor
            value={drafts[activeTab]}
            onChange={handleCodeChange}
            language={activeTab}
            isDark={isDark}
            readOnly={isSaving}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-200 dark:border-slate-800 bg-zinc-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            {hasUnsavedChanges && (
              <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                <AlertCircle size={16} />
                Unsaved changes
              </div>
            )}
            {saveError && (
              <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                <AlertCircle size={16} />
                {saveError}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Export Dropdown */}
            <div className="relative">
              <button
                onClick={() => setExportOpen(!exportOpen)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-600 dark:text-slate-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-slate-700 rounded-lg transition-colors"
              >
                <Download size={16} />
                Export
                <ChevronDown size={14} />
              </button>

              {exportOpen && (
                <div className="absolute bottom-full mb-2 right-0 w-56 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-zinc-200 dark:border-slate-700 overflow-hidden">
                  <button
                    onClick={handleExportHTML}
                    className="w-full px-4 py-3 text-sm text-left hover:bg-zinc-100 dark:hover:bg-slate-700 text-zinc-900 dark:text-white transition-colors"
                  >
                    <div className="font-medium">Single HTML File</div>
                    <div className="text-xs text-zinc-500 dark:text-slate-400">Inline CSS & JS</div>
                  </button>
                  <div className="border-t border-zinc-200 dark:border-slate-700" />
                  <button
                    onClick={handleExportZIP}
                    className="w-full px-4 py-3 text-sm text-left hover:bg-zinc-100 dark:hover:bg-slate-700 text-zinc-900 dark:text-white transition-colors"
                  >
                    <div className="font-medium">ZIP Archive</div>
                    <div className="text-xs text-zinc-500 dark:text-slate-400">Separate files</div>
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-slate-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={handleApply}
              disabled={!hasUnsavedChanges || isSaving}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-zinc-900 dark:bg-white dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>Saving...</>
              ) : (
                <>
                  <Save size={16} />
                  Apply Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
