'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { ArrowUp, Plus, Paperclip, ChevronDown, Search, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useProjectStore, type WorkspaceView } from '@/store/projectStore';
import { useModelStore } from '@/store/modelStore';
import { searchModels, type Model } from '@/lib/services/openRouter';
import { TOOL_DISPLAY_NAMES } from '@/store/projectStore';
import { WorkSection, type WorkItem, type ProgressStage } from './WorkSection';
import { CodeChangeViewer, type CodeChange } from './CodeChangeViewer';

interface ChatPanelProps {
  projectName?: string;
}

// Placeholder text based on workspace view
const PLACEHOLDER_BY_VIEW: Record<WorkspaceView, string> = {
  HOME: 'Ask anything...',
  SITE: 'Edit your website...',
  BRAND: 'Refine your brand identity...',
  FINANCE: 'Update your pricing and offer...',
  CRM: 'Manage your leads and outreach...',
};

// Get placeholder based on context (lead-aware)
const getPlaceholder = (workspaceView: WorkspaceView, currentLeadName: string | null): string => {
  if (currentLeadName) {
    return `Ask about ${currentLeadName}...`;
  }
  return PLACEHOLDER_BY_VIEW[workspaceView];
};

// Tool-specific emojis for context-aware loading messages
const TOOL_EMOJIS: Record<string, string> = {
  'perform_market_research': '🔍',
  'generate_brand_identity': '✨',
  'generate_business_plan': '📊',
  'generate_website_files': '🌐',
  'generate_first_week_plan': '📅',
  'generate_leads': '🎯',
  'generate_outreach_scripts': '📧',
  'edit_website': '🌐',
  'edit_identity': '✨',
  'edit_pricing': '💰',
};

export default function ChatPanel({ projectName = 'New Project' }: ChatPanelProps) {
  const {
    project,
    messages: storeMessages,
    selectedModelId,
    setSelectedModelId,
    addMessage,
    updateMessage,
    setToolRunning,
    editorMode,
    workspaceView,
    setHasStartedGeneration,
    setWorkspaceView,
    // Canvas state for lead context
    canvasState,
    artifacts,
    // Canvas state actions
    setCanvasState,
    startTool,
    updateToolStage,
    completeTool,
    failTool,
    resetTools,
    refreshArtifact,
  } = useProjectStore();

  // Get current lead if viewing lead detail
  const currentLead = canvasState.type === 'lead-detail'
    ? artifacts.leads?.leads.find(l => l.id === canvasState.leadId)
    : null;

  // Use global model store (already loaded from homepage)
  const { models, selectedModel, isLoading: modelsLoading, loadModels, setSelectedModel, getModelById } = useModelStore();
  const [filteredModels, setFilteredModels] = useState<Model[]>([]);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [workItems, setWorkItems] = useState<Record<string, WorkItem>>({});
  const [codeChanges, setCodeChanges] = useState<Record<string, CodeChange[]>>({});
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const submissionLockRef = useRef(false);
  const handleSendMessageRef = useRef<((messageText?: string) => Promise<void>) | undefined>(undefined);

  // Load models if not already loaded (fallback for direct navigation)
  useEffect(() => {
    loadModels();
  }, [loadModels]);

  // Sync selected model with project's model ID
  useEffect(() => {
    if (selectedModelId && models.length > 0) {
      const projectModel = getModelById(selectedModelId);
      if (projectModel && projectModel.id !== selectedModel?.id) {
        setSelectedModel(projectModel);
      }
    }
  }, [selectedModelId, models, selectedModel?.id, getModelById, setSelectedModel]);

  // Initialize filtered models when models load
  useEffect(() => {
    setFilteredModels(models);
  }, [models]);

  // Handle search
  useEffect(() => {
    setFilteredModels(searchModels(models, searchQuery));
  }, [searchQuery, models]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsModelDropdownOpen(false);
        setSearchQuery('');
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isModelDropdownOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isModelDropdownOpen]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [storeMessages]);

  // Handle message submission
  const handleSendMessage = useCallback(async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    console.log('[ChatPanel] handleSendMessage called', { textToSend, isLoading, projectId: project?.id, locked: submissionLockRef.current });

    // Prevent double submission with lock
    if (submissionLockRef.current) {
      console.log('[ChatPanel] Submission blocked - already in progress');
      return;
    }

    if (!textToSend || isLoading || !project?.id) {
      console.warn('[ChatPanel] Early return:', { hasText: !!textToSend, isLoading, hasProject: !!project?.id });
      return;
    }

    // Acquire lock
    submissionLockRef.current = true;

    // Clear input immediately
    setInput('');
    setIsLoading(true);

    // Mark that generation has started - this shows the ghost cards
    setHasStartedGeneration(true);

    // Add user message optimistically to store
    const userMessage = {
      id: crypto.randomUUID(),
      project_id: project.id,
      role: 'user' as const,
      content: textToSend,
      created_at: new Date().toISOString(),
    };
    addMessage(userMessage);

    // Create placeholder assistant message with generic "Thinking..."
    // (will be updated when actual tool starts with context-aware message)
    const assistantMessageId = crypto.randomUUID();
    const assistantMessage = {
      id: assistantMessageId,
      project_id: project.id,
      role: 'assistant' as const,
      content: '💭 Thinking...',
      created_at: new Date().toISOString(),
    };
    addMessage(assistantMessage);

    try {
      // Create abort controller for this request
      abortControllerRef.current = new AbortController();

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            ...storeMessages.map(m => ({ role: m.role, content: m.content, id: m.id })),
            { role: 'user', content: textToSend, id: userMessage.id }
          ],
          projectId: project.id,
          modelId: selectedModelId,
          assistantMessageId, // Pass assistant message ID for DB save
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Tool name to store ToolType mapping
      const toolNameToType: Record<string, 'research' | 'identity' | 'website' | 'businessplan' | 'leads' | 'outreach'> = {
        'perform_market_research': 'research',
        'generate_brand_identity': 'identity',
        'generate_website_files': 'website',
        'generate_business_plan': 'businessplan',
        'generate_leads': 'leads',
        'generate_outreach_scripts': 'outreach',
        // Edit tools map to the same artifact types
        'edit_website': 'website',
        'edit_identity': 'identity',
        'edit_pricing': 'businessplan',
      };

      // Tool name to workspace view mapping for AI auto-switch
      const toolNameToView: Record<string, 'HOME' | 'BRAND' | 'CRM' | 'SITE' | 'FINANCE'> = {
        'generate_website_files': 'SITE',
        'edit_website': 'SITE',
        'generate_brand_identity': 'BRAND',
        'edit_identity': 'BRAND',
        'generate_business_plan': 'FINANCE',
        'edit_pricing': 'FINANCE',
        'generate_leads': 'CRM',
        'generate_outreach_scripts': 'CRM',
      };

      // Reset work items and code changes tracking
      setWorkItems({});
      setCodeChanges({});
      resetTools(); // Reset canvas tool statuses

      // Track if we've started any tools (for canvas state transition)
      let hasStartedAnyTool = false;

      // Read the plain text stream and update message progressively
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let hasReceivedText = false;

      if (reader) {
        console.log('[ChatPanel] Stream started');

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log('[ChatPanel] Stream complete');
            // Clear all running tools
            Object.values(toolNameToType).forEach(toolType => {
              setToolRunning(toolType, false);
            });

            // Transition to overview only if artifacts actually exist
            // Don't show overview before website/brand/etc are ready
            if (hasStartedAnyTool) {
              const { artifacts } = useProjectStore.getState();
              const hasArtifacts = Object.values(artifacts).some(a => a !== null);

              if (hasArtifacts) {
                // Small delay to let the user see the completion state
                setTimeout(() => {
                  setCanvasState({ type: 'overview' });
                }, 500);
              } else {
                // Stay on loading canvas - artifacts still being processed
                console.log('[ChatPanel] Stream complete but no artifacts yet - staying on loading');
              }
            }

            // If no text was received, show completion message
            if (!hasReceivedText || assistantContent.trim() === '') {
              updateMessage(assistantMessageId, 'Your business is ready.');
            }
            break;
          }

          const chunk = decoder.decode(value, { stream: true });

          // Parse [WORK:tool:description] markers (tool started)
          const workMatches = chunk.matchAll(/\[WORK:(\w+):([^\]]+)\]/g);
          for (const match of workMatches) {
            const [, toolName, description] = match;
            const toolType = toolNameToType[toolName];

            // Only show loading canvas for generation tools, NOT edit tools
            // Edit tools should update in place without the full loading screen
            // generate_leads should NOT show loading canvas - it's a conversational flow
            const isGenerationTool = toolName.startsWith('generate_') || toolName === 'perform_market_research';
            const skipLoadingCanvas = toolName === 'generate_leads';
            if (!hasStartedAnyTool && isGenerationTool && !skipLoadingCanvas) {
              hasStartedAnyTool = true;
              setCanvasState({ type: 'loading' });
            }

            // Update local work items state
            setWorkItems(prev => ({
              ...prev,
              [toolName]: {
                toolName,
                description,
                status: 'running',
              },
            }));

            // Update global canvas tool status
            startTool(toolName);

            if (toolType) setToolRunning(toolType, true);

            // Update assistant message with context-aware loading text
            const emoji = TOOL_EMOJIS[toolName] || '⚙️';
            const displayName = TOOL_DISPLAY_NAMES[toolName] || description;
            updateMessage(assistantMessageId, `${emoji} ${displayName}...`);
          }

          // Tool name to artifact type for refresh
          const toolNameToArtifactType: Record<string, 'website_code' | 'identity' | 'market_research' | 'business_plan' | 'leads' | 'outreach'> = {
            'generate_website_files': 'website_code',
            'edit_website': 'website_code',
            'generate_brand_identity': 'identity',
            'edit_identity': 'identity',
            'perform_market_research': 'market_research',
            'generate_business_plan': 'business_plan',
            'edit_pricing': 'business_plan',
            'generate_leads': 'leads',
            'generate_outreach_scripts': 'outreach',
          };

          // Parse [WORK_DONE:tool:duration] markers (tool completed)
          const doneMatches = chunk.matchAll(/\[WORK_DONE:(\w+):([^\]]+)\]/g);
          for (const match of doneMatches) {
            const [, toolName, duration] = match;
            const toolType = toolNameToType[toolName];

            // Update local work items state
            setWorkItems(prev => ({
              ...prev,
              [toolName]: {
                ...prev[toolName],
                status: 'complete',
                duration,
              },
            }));

            // Update global canvas tool status
            completeTool(toolName, duration);

            if (toolType) setToolRunning(toolType, false);

            // AI Auto-switch: Navigate to relevant view when tool completes
            const targetView = toolNameToView[toolName];
            if (targetView) {
              setWorkspaceView(targetView);
            }

            // Fallback: Manually refresh artifact from database after tool completes
            // This ensures the UI updates even if Supabase Realtime doesn't fire
            const artifactType = toolNameToArtifactType[toolName];
            if (artifactType) {
              console.log('[ChatPanel] Refreshing artifact after tool completion:', artifactType);
              // Longer delay for leads to ensure database has been updated
              const delay = toolName === 'generate_leads' ? 1500 : 500;
              setTimeout(async () => {
                console.log('[ChatPanel] Executing refresh for:', artifactType);
                await refreshArtifact(artifactType);
                // For leads, do a second refresh after another delay to be safe
                if (toolName === 'generate_leads') {
                  setTimeout(() => {
                    console.log('[ChatPanel] Second refresh for leads');
                    refreshArtifact(artifactType);
                  }, 2000);
                }
              }, delay);
            }
          }

          // Parse [WORK_ERROR:tool:message] markers (tool failed)
          const errorMatches = chunk.matchAll(/\[WORK_ERROR:(\w+):([^\]]+)\]/g);
          for (const match of errorMatches) {
            const [, toolName, errorMessage] = match;
            const toolType = toolNameToType[toolName];

            console.error('[ChatPanel] Tool failed:', toolName, errorMessage);

            // Update local work items state
            setWorkItems(prev => ({
              ...prev,
              [toolName]: {
                ...prev[toolName],
                status: 'error',
                errorMessage,
              },
            }));

            // Update global canvas tool status
            failTool(toolName, errorMessage);

            if (toolType) setToolRunning(toolType, false);
          }

          // Parse [CODE_CHANGE:file:description|before|after] markers
          const codeChangeMatches = chunk.matchAll(/\[CODE_CHANGE:([^:]+):([^\]|]+)(?:\|([^|]+)\|([^|]+))?\]/g);
          for (const match of codeChangeMatches) {
            const [, file, description, before, after] = match;

            setCodeChanges(prev => ({
              ...prev,
              [assistantMessageId]: [
                ...(prev[assistantMessageId] || []),
                {
                  file,
                  description,
                  before,
                  after,
                  timestamp: Date.now(),
                  status: 'complete',
                },
              ],
            }));
          }

          // Parse [PROGRESS:stage:message] markers for multi-stage progress
          const progressMatches = chunk.matchAll(/\[PROGRESS:([^:]+):([^\]]+)\]/g);
          for (const match of progressMatches) {
            const [, stageId, message] = match;

            setWorkItems(prev => {
              // Find the currently running tool to add this stage to
              const runningToolName = Object.keys(prev).find(k => prev[k].status === 'running');
              if (!runningToolName) return prev;

              // Also update global tool status for LoadingCanvas
              updateToolStage(runningToolName, message);

              const currentTool = prev[runningToolName];
              const existingStages = currentTool.stages || [];

              // Mark previous stages as complete, add new stage as active
              const updatedStages: ProgressStage[] = existingStages.map(s => ({
                ...s,
                status: 'complete' as const,
              }));

              // Add the new stage as active
              updatedStages.push({
                id: stageId,
                message,
                status: 'active',
                timestamp: Date.now(),
              });

              return {
                ...prev,
                [runningToolName]: {
                  ...currentTool,
                  currentStage: stageId,
                  stages: updatedStages,
                },
              };
            });
          }

          // Remove all markers from displayed content (including legacy markers for backwards compatibility)
          const cleanChunk = chunk
            .replace(/\[WORK:\w+:[^\]]+\]\n?/g, '')
            .replace(/\[WORK_DONE:\w+:[^\]]+\]\n?/g, '')
            .replace(/\[WORK_ERROR:\w+:[^\]]+\]\n?/g, '')
            .replace(/\[CODE_CHANGE:[^\]]+\]\n?/g, '')
            // Legacy marker cleanup (backwards compatibility during transition)
            .replace(/\[THINKING\][^\n]*\n?/g, '')
            .replace(/\[PROGRESS:[^\]]+\]\n?/g, '')
            .replace(/\[STEP:[^\]]+\]\n?/g, '')
            .replace(/\[TOOL_START:\w+\]\n?/g, '')
            .replace(/\[TOOL_COMPLETE:\w+\]\n?/g, '');

          // Only update if we receive actual text
          if (cleanChunk && cleanChunk.trim()) {
            assistantContent += cleanChunk;
            hasReceivedText = true;
            updateMessage(assistantMessageId, assistantContent);
          }
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Request aborted');
      } else {
        console.error('Failed to send message:', error);
        // Update message with error
        updateMessage(assistantMessageId, 'Error: Failed to get response. Please try again.');
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
      submissionLockRef.current = false; // Release lock
    }
  }, [project?.id, isLoading, input, storeMessages, selectedModelId, addMessage, updateMessage, setToolRunning, setHasStartedGeneration, setWorkspaceView]);

  // Keep ref updated with latest handleSendMessage
  useEffect(() => {
    handleSendMessageRef.current = handleSendMessage;
  }, [handleSendMessage]);

  // Listen for auto-submit event from WorkspaceHydration
  // IMPORTANT: Use ref to avoid re-registering listener when handleSendMessage changes
  useEffect(() => {
    const handleAutoSubmit = (event: CustomEvent) => {
      console.log('[ChatPanel] autoSubmitPrompt event received', event.detail);
      const { prompt } = event.detail;
      if (prompt && handleSendMessageRef.current) {
        console.log('[ChatPanel] Auto-submitting prompt via ref:', prompt);
        handleSendMessageRef.current(prompt);
      } else {
        console.warn('[ChatPanel] Auto-submit blocked - no ref or prompt');
      }
    };

    console.log('[ChatPanel] Setting up autoSubmitPrompt listener (stable)');
    window.addEventListener('autoSubmitPrompt', handleAutoSubmit as EventListener);
    return () => {
      console.log('[ChatPanel] Removing autoSubmitPrompt listener');
      window.removeEventListener('autoSubmitPrompt', handleAutoSubmit as EventListener);
    };
  }, []); // Empty deps - listener stays stable, uses ref for latest function

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage();
  };

  const hasInput = input.trim().length > 0;

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--surface-1)' }}>
      {/* Chat Stream */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-6 py-8 space-y-6 scrollbar-hide">
        {storeMessages.length === 0 ? (
          /* Empty State */
          <div className="flex items-center justify-center h-full" />
        ) : (
          /* Message List */
          <>
            {storeMessages.map((message, index) => {
              const isLastMessage = index === storeMessages.length - 1;
              const isStreaming = isLastMessage && isLoading && message.role === 'assistant';
              const isInitialLoading = isStreaming && message.content.startsWith('⏳');
              const hasWorkItems = isLastMessage && Object.keys(workItems).length > 0;
              const hasCodeChanges = codeChanges[message.id] && codeChanges[message.id].length > 0;

              return (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'user' ? (
                    /* User message - keep in bubble */
                    <div className="max-w-[80%] rounded-2xl px-4 py-3 text-sm bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
                      {message.content}
                    </div>
                  ) : (
                    /* AI message - display with icon */
                    <div className="flex gap-3 w-full max-w-full">
                      {/* AI Icon */}
                      <div className="flex-shrink-0 w-7 h-7 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                        <Image
                          src="/anythingicondark.png"
                          alt="AI"
                          width={28}
                          height={28}
                          className="dark:hidden"
                        />
                        <Image
                          src="/anythingiconlight.png"
                          alt="AI"
                          width={28}
                          height={28}
                          className="hidden dark:block"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Work Section - collapsible progress display */}
                        {hasWorkItems && (
                          <WorkSection
                            items={Object.values(workItems)}
                            isStreaming={isLoading}
                          />
                        )}

                        {/* Code Changes Viewer - show real-time code edits */}
                        {hasCodeChanges && (
                          <CodeChangeViewer
                            changes={codeChanges[message.id]}
                            isStreaming={isStreaming}
                          />
                        )}

                        {/* Message Content */}
                        {message.content.trim() && (
                          <div className="text-sm text-zinc-900 dark:text-zinc-100 whitespace-pre-wrap leading-relaxed">
                            {isInitialLoading ? (
                              <div className="flex items-center gap-2">
                                <span className="relative flex h-4 w-4">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500"></span>
                                </span>
                                <span className="text-zinc-600 dark:text-zinc-400">
                                  {message.content.replace(/^[^\s]+\s/, '')}
                                  <span className="inline-flex ml-1">
                                    <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                                    <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                                    <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
                                  </span>
                                </span>
                              </div>
                            ) : (
                              <>
                                {message.content}
                                {isStreaming && (
                                  <span className="inline-block ml-1 w-2 h-4 bg-zinc-400 dark:bg-zinc-500 animate-pulse" />
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Bottom Input */}
      <form onSubmit={handleSubmit}>
        <div className="p-1.5">
          <div className="relative rounded-2xl" style={{ background: 'var(--surface-2)', boxShadow: 'var(--shadow-md)' }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e as any);
                }
              }}
              placeholder={getPlaceholder(workspaceView, currentLead?.companyName ?? null)}
              className="w-full pl-4 pr-12 pt-3 pb-12 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 resize-none focus:outline-none bg-transparent rounded-2xl"
              rows={1}
              style={{ minHeight: '120px' }}
              disabled={isLoading}
            />

            {/* Left Action Buttons */}
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
              <button
                type="button"
                className="flex items-center justify-center w-7 h-7 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all"
                aria-label="Add attachment"
              >
                <Plus size={14} strokeWidth={1.5} />
              </button>
              <button
                type="button"
                className="flex items-center justify-center w-7 h-7 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all"
                aria-label="Attach file"
              >
                <Paperclip size={14} strokeWidth={1.5} />
              </button>

              {/* Model Picker Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                  className="flex items-center gap-1 px-2 h-6 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded transition-colors border border-zinc-200 dark:border-zinc-700"
                  aria-label="Select model"
                  disabled={modelsLoading}
                >
                  <span className="font-medium max-w-[120px] truncate">
                    {modelsLoading
                      ? 'Loading...'
                      : selectedModel
                        ? selectedModel.name
                        : 'Select Model'}
                  </span>
                  <ChevronDown
                    size={12}
                    strokeWidth={1.5}
                    className={`transition-transform ${isModelDropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {isModelDropdownOpen && !modelsLoading && (
                  <div className="absolute left-0 bottom-full mb-2 w-96 rounded-lg overflow-hidden z-50" style={{ background: 'var(--surface-3)', boxShadow: 'var(--shadow-xl)' }}>
                    {/* Search Input */}
                    <div className="p-3 border-b border-zinc-100 dark:border-zinc-700/50">
                      <div className="relative">
                        <Search
                          size={14}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                        />
                        <input
                          ref={searchInputRef}
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search models..."
                          className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-zinc-900 dark:text-zinc-100"
                        />
                      </div>
                    </div>

                    {/* Models List */}
                    <div className="max-h-96 overflow-y-auto">
                      {filteredModels.length === 0 ? (
                        <div className="px-4 py-8 text-center text-xs text-zinc-400">
                          No models found
                        </div>
                      ) : (
                        filteredModels.map((model) => (
                          <button
                            key={model.id}
                            type="button"
                            onClick={() => {
                              setSelectedModel(model);
                              setSelectedModelId(model.id);
                              setIsModelDropdownOpen(false);
                              setSearchQuery('');
                            }}
                            className={`w-full px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors ${
                              selectedModel?.id === model.id
                                ? 'bg-zinc-50 dark:bg-zinc-700'
                                : ''
                            }`}
                          >
                            <div className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                              {model.name}
                            </div>
                            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                              {model.id}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Send Button */}
            <button
              type="submit"
              disabled={!hasInput || isLoading}
              className="absolute bottom-3 right-3 flex items-center justify-center w-7 h-7 text-white bg-zinc-900 dark:bg-white dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Send message"
            >
              <ArrowUp size={16} strokeWidth={2} />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
