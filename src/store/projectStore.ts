import { create } from 'zustand';
import type {
  Project,
  Message,
  Artifact,
  ArtifactType,
  WebsiteArtifact,
  IdentityArtifact,
  ResearchArtifact,
  BusinessPlanArtifact,
  LeadsArtifact,
  OutreachArtifact,
  FirstWeekPlanArtifact,
  Lead,
  LeadActivity,
} from '@/types/database';

// ============================================
// STATE INTERFACE
// ============================================

type ToolType = 'research' | 'identity' | 'website' | 'businessplan' | 'leads' | 'outreach' | 'firstweekplan';
type EditorMode = 'bento' | 'website' | 'leads' | 'outreach';
type ContextView = 'overview' | 'identity' | 'offer' | 'funnel' | 'leads' | 'legal';
export type WorkspaceView = 'HOME' | 'BRAND' | 'CRM' | 'SITE' | 'FINANCE';

// Canvas state types for loading/overview system
export type CanvasState =
  | { type: 'empty' }
  | { type: 'loading' }
  | { type: 'overview' }
  | { type: 'detail'; view: 'website' | 'brand' | 'offer' | 'plan' | 'leads' }
  | { type: 'lead-detail'; leadId: string };

export interface ToolStatus {
  name: string;
  displayName: string;
  status: 'pending' | 'running' | 'complete' | 'error';
  startedAt?: number;
  completedAt?: number;
  duration?: string;
  currentStage?: string; // Current stage message for dynamic progress
}

// Tool display names for loading canvas
export const TOOL_DISPLAY_NAMES: Record<string, string> = {
  'perform_market_research': 'Researching your market',
  'generate_brand_identity': 'Creating your brand',
  'generate_business_plan': 'Setting up your offer',
  'generate_website_files': 'Building your website',
  'generate_first_week_plan': 'Planning your first week',
  'generate_leads': 'Finding prospects',
  'generate_outreach_scripts': 'Writing outreach scripts',
  'edit_website': 'Updating your website',
  'edit_identity': 'Updating your brand',
  'edit_pricing': 'Updating your pricing',
};

interface ProjectState {
  // Core Data
  project: Project | null;
  messages: Message[];
  artifacts: {
    website: WebsiteArtifact | null;
    identity: IdentityArtifact | null;
    research: ResearchArtifact | null;
    businessPlan: BusinessPlanArtifact | null;
    leads: LeadsArtifact | null;
    outreach: OutreachArtifact | null;
    firstWeekPlan: FirstWeekPlanArtifact | null;
  };
  selectedModelId: string;

  // UI State
  isLoading: boolean;
  error: string | null;
  runningTools: Set<ToolType>;
  editorMode: EditorMode;
  hasStartedGeneration: boolean;
  contextView: ContextView;
  workspaceView: WorkspaceView;
  hasSeenOnboarding: boolean;

  // Canvas state for loading/overview system
  canvasState: CanvasState;
  toolStatuses: Map<string, ToolStatus>;


  // Actions
  setInitialData: (
    project: Project,
    messages: Message[],
    rawArtifacts: Artifact[]
  ) => void;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, content: string) => void;
  updateArtifact: (type: ArtifactType, artifact: Artifact) => void;
  setSelectedModelId: (modelId: string) => void;
  setToolRunning: (tool: ToolType, isRunning: boolean) => void;
  setEditorMode: (mode: EditorMode) => void;
  setHasStartedGeneration: (started: boolean) => void;
  setContextView: (view: ContextView) => void;
  setWorkspaceView: (view: WorkspaceView) => void;
  setHasSeenOnboarding: (seen: boolean) => void;
  clearProject: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Lead management actions
  updateLeadStatus: (leadId: string, status: Lead['status']) => Promise<void>;
  addLeadActivity: (activity: Omit<LeadActivity, 'id' | 'createdAt'>) => Promise<void>;

  // First Week Plan actions
  updateTaskCompletion: (taskId: string, completed: boolean) => Promise<void>;

  // Canvas state actions
  setCanvasState: (state: CanvasState) => void;
  startTool: (toolName: string) => void;
  updateToolStage: (toolName: string, stageMessage: string) => void;
  completeTool: (toolName: string, duration?: string) => void;
  failTool: (toolName: string, errorMessage: string) => void;
  resetTools: () => void;

  // Artifact refresh action (fallback for when realtime doesn't fire)
  refreshArtifact: (type: ArtifactType) => Promise<void>;
}

// ============================================
// STORE
// ============================================

export const useProjectStore = create<ProjectState>((set, get) => ({
  // Initial State
  project: null,
  messages: [],
  artifacts: {
    website: null,
    identity: null,
    research: null,
    businessPlan: null,
    leads: null,
    outreach: null,
    firstWeekPlan: null,
  },
  selectedModelId: 'anthropic/claude-3.5-sonnet',
  isLoading: false,
  error: null,
  runningTools: new Set<ToolType>(),
  editorMode: 'bento' as EditorMode,
  hasStartedGeneration: false,
  contextView: 'overview' as ContextView,
  workspaceView: 'HOME' as WorkspaceView,
  hasSeenOnboarding: typeof window !== 'undefined' ? localStorage.getItem('hasSeenOnboarding') === 'true' : false,
  canvasState: { type: 'empty' } as CanvasState,
  toolStatuses: new Map<string, ToolStatus>(),

  // Actions
  setInitialData: (project, messages, rawArtifacts) => {
    console.log('[Store] setInitialData called with', rawArtifacts.length, 'artifacts');
    const artifacts = {
      website: null as WebsiteArtifact | null,
      identity: null as IdentityArtifact | null,
      research: null as ResearchArtifact | null,
      businessPlan: null as BusinessPlanArtifact | null,
      leads: null as LeadsArtifact | null,
      outreach: null as OutreachArtifact | null,
      firstWeekPlan: null as FirstWeekPlanArtifact | null,
    };

    // Parse raw artifacts into typed state
    rawArtifacts.forEach((artifact) => {
      console.log('[Store] Processing artifact:', artifact.type);
      if (artifact.type === 'website_code') {
        artifacts.website = artifact.data as WebsiteArtifact;
        console.log('[Store] Loaded website artifact');
      } else if (artifact.type === 'identity') {
        artifacts.identity = artifact.data as IdentityArtifact;
        console.log('[Store] Loaded identity artifact');
      } else if (artifact.type === 'market_research') {
        artifacts.research = artifact.data as ResearchArtifact;
        console.log('[Store] Loaded research artifact');
      } else if (artifact.type === 'business_plan') {
        artifacts.businessPlan = artifact.data as BusinessPlanArtifact;
        console.log('[Store] Loaded business plan artifact');
      } else if (artifact.type === 'leads') {
        artifacts.leads = artifact.data as LeadsArtifact;
        console.log('[Store] Loaded leads artifact');
      } else if (artifact.type === 'outreach') {
        artifacts.outreach = artifact.data as OutreachArtifact;
        console.log('[Store] Loaded outreach artifact');
      } else if (artifact.type === 'first_week_plan') {
        artifacts.firstWeekPlan = artifact.data as FirstWeekPlanArtifact;
        console.log('[Store] Loaded first week plan artifact');
      }
    });

    console.log('[Store] Final artifacts:', artifacts);

    // Deduplicate messages by ID - server is source of truth
    const messageMap = new Map();

    // Only use database messages, don't merge with local state
    // This prevents stale optimistic messages from persisting after reload
    messages.forEach(msg => messageMap.set(msg.id, msg));

    const deduplicatedMessages = Array.from(messageMap.values())
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    // Determine if generation has started (any artifacts exist or messages beyond initial)
    const hasAnyArtifacts = rawArtifacts.length > 0;
    const hasUserMessages = deduplicatedMessages.some(m => m.role === 'user');

    // Determine canvas state based on loaded data
    const canvasState: CanvasState = hasAnyArtifacts
      ? { type: 'overview' }
      : { type: 'empty' };

    set({
      project,
      messages: deduplicatedMessages,
      artifacts,
      selectedModelId: project.model_id || 'deepseek/deepseek-r1',
      isLoading: false,
      error: null,
      hasStartedGeneration: hasAnyArtifacts || hasUserMessages,
      canvasState,
      toolStatuses: new Map<string, ToolStatus>(), // Reset tool statuses
    });
  },

  addMessage: (message) => {
    set((state) => {
      // Prevent duplicate messages by ID
      const exists = state.messages.some(m => m.id === message.id);
      if (exists) {
        console.warn('[Store] Duplicate message blocked:', message.id);
        return state; // No change
      }
      return {
        messages: [...state.messages, message],
      };
    });
  },

  updateMessage: (messageId, content) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId ? { ...msg, content } : msg
      ),
    }));
  },

  updateArtifact: (type, artifact) => {
    console.log('[Store] updateArtifact called:', type, artifact);

    // Validate inputs
    if (!artifact) {
      console.error('[Store] Cannot update: artifact is null/undefined');
      return;
    }

    if (!artifact.data) {
      console.error('[Store] Cannot update: artifact.data is null/undefined');
      return;
    }

    const oldArtifacts = get().artifacts;

    set((state) => {
      const newArtifacts = { ...state.artifacts };

      if (type === 'website_code') {
        console.log('[Store] Updating website artifact');
        newArtifacts.website = artifact.data as WebsiteArtifact;
      } else if (type === 'identity') {
        console.log('[Store] Updating identity artifact');
        const identityData = artifact.data as IdentityArtifact;
        console.log('[Store] Identity data:', {
          name: identityData.name,
          logoUrlType: typeof identityData.logoUrl,
          logoUrlLength: identityData.logoUrl?.length,
          logoUrlStart: identityData.logoUrl?.substring(0, 100),
          colors: identityData.colors,
          font: identityData.font,
          tagline: identityData.tagline,
        });
        newArtifacts.identity = identityData;
      } else if (type === 'market_research') {
        console.log('[Store] Updating research artifact');
        newArtifacts.research = artifact.data as ResearchArtifact;
      } else if (type === 'business_plan') {
        console.log('[Store] Updating business plan artifact');
        newArtifacts.businessPlan = artifact.data as BusinessPlanArtifact;
      } else if (type === 'leads') {
        console.log('[Store] Updating leads artifact');
        newArtifacts.leads = artifact.data as LeadsArtifact;
      } else if (type === 'outreach') {
        console.log('[Store] Updating outreach artifact');
        newArtifacts.outreach = artifact.data as OutreachArtifact;
      } else if (type === 'first_week_plan') {
        console.log('[Store] Updating first week plan artifact');
        newArtifacts.firstWeekPlan = artifact.data as FirstWeekPlanArtifact;
      } else {
        console.error('[Store] Unknown artifact type:', type);
        return state; // Don't update state for unknown types
      }

      console.log('[Store] New artifacts state:', newArtifacts);
      return { artifacts: newArtifacts };
    });

  },

  setSelectedModelId: (modelId) => set({ selectedModelId: modelId }),

  setEditorMode: (mode) => set({ editorMode: mode }),

  setHasStartedGeneration: (started) => set({ hasStartedGeneration: started }),

  setContextView: (view) => set({ contextView: view }),

  setWorkspaceView: (view) => set({ workspaceView: view }),

  setHasSeenOnboarding: (seen) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('hasSeenOnboarding', seen.toString());
    }
    set({ hasSeenOnboarding: seen });
  },

  setToolRunning: (tool, isRunning) => {
    set((state) => {
      const newRunningTools = new Set(state.runningTools);
      if (isRunning) {
        newRunningTools.add(tool);
      } else {
        newRunningTools.delete(tool);
      }
      return { runningTools: newRunningTools };
    });
  },

  clearProject: () => {
    set({
      project: null,
      messages: [],
      artifacts: {
        website: null,
        identity: null,
        research: null,
        businessPlan: null,
        leads: null,
        outreach: null,
        firstWeekPlan: null,
      },
      selectedModelId: 'anthropic/claude-3.5-sonnet',
      isLoading: false,
      error: null,
      runningTools: new Set<ToolType>(),
      editorMode: 'bento' as EditorMode,
      hasStartedGeneration: false,
      contextView: 'overview' as ContextView,
      workspaceView: 'HOME' as WorkspaceView,
      canvasState: { type: 'empty' } as CanvasState,
      toolStatuses: new Map<string, ToolStatus>(),
    });
  },

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  // Lead management actions
  updateLeadStatus: async (leadId, status) => {
    const state = get();
    const projectId = state.project?.id;

    // Get previous status for activity log (if lead exists in artifacts)
    let previousStatus: Lead['status'] | undefined;

    // Optimistic update if lead exists in artifacts
    if (state.artifacts.leads) {
      const lead = state.artifacts.leads.leads.find(l => l.id === leadId);
      previousStatus = lead?.status;

      set((state) => ({
        artifacts: {
          ...state.artifacts,
          leads: state.artifacts.leads ? {
            ...state.artifacts.leads,
            leads: state.artifacts.leads.leads.map(l =>
              l.id === leadId ? { ...l, status } : l
            )
          } : null
        }
      }));
    }

    // ALWAYS persist to API - it handles both artifacts AND dedicated leads table
    if (projectId) {
      try {
        const response = await fetch('/api/leads/status', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, leadId, status })
        });

        if (!response.ok) {
          console.error('[Store] Failed to update lead status:', response.status);
          return;
        }

        // Log status change activity
        await get().addLeadActivity({
          leadId,
          type: 'status_changed',
          content: `Status changed to ${status}`,
          metadata: { previousStatus, newStatus: status }
        });
      } catch (error) {
        console.error('[Store] Failed to persist lead status:', error);
      }
    } else {
      console.error('[Store] No project ID to update lead status');
    }
  },

  addLeadActivity: async (activityData) => {
    const state = get();
    const projectId = state.project?.id;

    const activity: LeadActivity = {
      id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...activityData,
      createdAt: new Date().toISOString()
    };

    // Optimistic update
    set((state) => ({
      artifacts: {
        ...state.artifacts,
        leads: state.artifacts.leads ? {
          ...state.artifacts.leads,
          activities: [...(state.artifacts.leads.activities || []), activity]
        } : null
      }
    }));

    // Persist to API if we have a project
    if (projectId) {
      try {
        await fetch('/api/leads/activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, activity })
        });
      } catch (error) {
        console.error('[Store] Failed to persist activity:', error);
      }
    }
  },

  // First Week Plan actions
  updateTaskCompletion: async (taskId, completed) => {
    const state = get();
    const projectId = state.project?.id;

    if (!state.artifacts.firstWeekPlan) {
      console.error('[Store] No first week plan artifact to update');
      return;
    }

    // Optimistic update
    set((state) => ({
      artifacts: {
        ...state.artifacts,
        firstWeekPlan: state.artifacts.firstWeekPlan ? {
          ...state.artifacts.firstWeekPlan,
          taskCompletion: {
            ...(state.artifacts.firstWeekPlan.taskCompletion || {}),
            [taskId]: completed,
          },
        } : null
      }
    }));

    // Persist to API if we have a project
    if (projectId) {
      try {
        await fetch('/api/artifacts/update-task-completion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, taskId, completed })
        });
      } catch (error) {
        console.error('[Store] Failed to persist task completion:', error);
        // Optionally revert optimistic update here
      }
    }
  },

  // Canvas state actions
  setCanvasState: (state) => {
    console.log('[Store] setCanvasState:', state);
    set({ canvasState: state });
  },

  startTool: (toolName) => {
    console.log('[Store] startTool:', toolName);
    set((state) => {
      const newToolStatuses = new Map(state.toolStatuses);
      newToolStatuses.set(toolName, {
        name: toolName,
        displayName: TOOL_DISPLAY_NAMES[toolName] || toolName,
        status: 'running',
        startedAt: Date.now(),
      });
      return { toolStatuses: newToolStatuses };
    });
  },

  updateToolStage: (toolName, stageMessage) => {
    set((state) => {
      const newToolStatuses = new Map(state.toolStatuses);
      const tool = newToolStatuses.get(toolName);
      if (tool) {
        newToolStatuses.set(toolName, {
          ...tool,
          currentStage: stageMessage,
        });
      }
      return { toolStatuses: newToolStatuses };
    });
  },

  completeTool: (toolName, duration) => {
    console.log('[Store] completeTool:', toolName, duration);
    set((state) => {
      const newToolStatuses = new Map(state.toolStatuses);
      const tool = newToolStatuses.get(toolName);
      if (tool) {
        newToolStatuses.set(toolName, {
          ...tool,
          status: 'complete',
          completedAt: Date.now(),
          duration,
        });
      }
      return { toolStatuses: newToolStatuses };
    });
  },

  resetTools: () => {
    console.log('[Store] resetTools');
    set({ toolStatuses: new Map<string, ToolStatus>() });
  },

  failTool: (toolName, errorMessage) => {
    console.log('[Store] failTool:', toolName, errorMessage);
    set((state) => {
      const newToolStatuses = new Map(state.toolStatuses);
      const tool = newToolStatuses.get(toolName);
      if (tool) {
        newToolStatuses.set(toolName, {
          ...tool,
          status: 'error',
          completedAt: Date.now(),
        });
      }
      return { toolStatuses: newToolStatuses };
    });
  },

  refreshArtifact: async (type) => {
    const { project, updateArtifact } = get();
    if (!project) {
      console.log('[Store] refreshArtifact: No project, skipping');
      return;
    }

    console.log('[Store] refreshArtifact: Fetching', type, 'for project', project.id);

    try {
      const response = await fetch(`/api/artifacts/get?projectId=${project.id}&type=${type}`);
      if (!response.ok) {
        console.error('[Store] refreshArtifact: Failed to fetch', response.status);
        return;
      }

      const { artifact } = await response.json();
      if (artifact) {
        console.log('[Store] refreshArtifact: Got artifact for type:', type);
        console.log('[Store] refreshArtifact: Artifact data preview:', JSON.stringify(artifact).substring(0, 200));
        if (type === 'leads' && artifact.data?.leads) {
          console.log('[Store] refreshArtifact: Found', artifact.data.leads.length, 'leads in artifact');
        }
        updateArtifact(type, artifact);
      } else {
        console.log('[Store] refreshArtifact: No artifact found for type:', type);
      }
    } catch (error) {
      console.error('[Store] refreshArtifact: Error', error);
    }
  },

}));
