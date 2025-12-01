import { create } from 'zustand';
import { fetchModels, type Model } from '@/lib/services/openRouter';

interface ModelStore {
  models: Model[];
  selectedModel: Model | null;
  isLoading: boolean;
  error: string | null;
  hasFetched: boolean;

  // Actions
  loadModels: () => Promise<void>;
  setSelectedModel: (model: Model | null) => void;
  getModelById: (id: string) => Model | undefined;
}

export const useModelStore = create<ModelStore>((set, get) => ({
  models: [],
  selectedModel: null,
  isLoading: false,
  error: null,
  hasFetched: false,

  loadModels: async () => {
    // Skip if already fetched or currently loading
    if (get().hasFetched || get().isLoading) {
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const models = await fetchModels();
      const defaultModel = models[0] || null;

      set({
        models,
        selectedModel: get().selectedModel || defaultModel,
        isLoading: false,
        hasFetched: true,
      });
    } catch (error) {
      console.error('Failed to load models:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to load models',
        isLoading: false,
        hasFetched: true,
      });
    }
  },

  setSelectedModel: (model) => {
    set({ selectedModel: model });
  },

  getModelById: (id) => {
    return get().models.find((m) => m.id === id);
  },
}));
