'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Paperclip, ChevronDown, Globe, Lightbulb, Mic, ArrowUp, Search } from 'lucide-react';
import { searchModels, type Model } from '@/lib/services/openRouter';
import { useAuth } from '@/contexts/AuthContext';
import { useModelStore } from '@/store/modelStore';

export default function HeroInput() {
  const router = useRouter();
  const { user } = useAuth();
  const [value, setValue] = useState('');
  const [filteredModels, setFilteredModels] = useState<Model[]>([]);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [webEnabled, setWebEnabled] = useState(false);
  const [thinkEnabled, setThinkEnabled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Use global model store
  const { models, selectedModel, isLoading: modelsLoading, loadModels, setSelectedModel } = useModelStore();

  // Load models on mount (will skip if already loaded)
  useEffect(() => {
    loadModels();
  }, [loadModels]);

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

  const hasInput = value.trim().length > 0;

  // Handle form submission - navigate immediately, create project in workspace
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasInput || isSubmitting) return;

    // If user is not authenticated, store pending project and redirect to sign in
    if (!user) {
      sessionStorage.setItem('pendingProject', JSON.stringify({
        prompt: value,
        modelId: selectedModel?.id || 'google/gemini-3-pro-preview',
      }));
      router.push('/signin?redirect=/');
      return;
    }

    setIsSubmitting(true);

    // Navigate immediately - project creation happens in the new page
    const encodedPrompt = encodeURIComponent(value);
    const modelId = selectedModel?.id || 'google/gemini-3-pro-preview';
    router.push(`/p/new?prompt=${encodedPrompt}&model=${encodeURIComponent(modelId)}`);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit}>
        {/* Animated Gradient Border Wrapper */}
        <div className="relative p-[1px] rounded-2xl overflow-visible">
          {/* Animated Gradient Background */}
          <div
            className="absolute inset-0 rounded-2xl opacity-40 animate-gradient-flow"
            style={{
              background: 'linear-gradient(90deg, rgba(227,158,28,0.3) 0%, rgba(245,176,60,0.3) 25%, rgba(209,138,16,0.3) 50%, rgba(227,158,28,0.3) 100%)',
              backgroundSize: '200% 200%',
            }}
          />

          {/* Main Chatbox */}
          <div className="relative border border-zinc-200/50 dark:border-slate-700/50 rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3)] overflow-visible transition-colors" style={{ background: 'var(--surface-1)' }}>
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Ask anything..."
            className="w-full px-6 pt-6 pb-24 text-sm text-black dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 resize-none focus:outline-none bg-transparent"
            rows={1}
            style={{ minHeight: '100px' }}
            disabled={isSubmitting}
          />

        <div className="absolute bottom-0 left-0 right-0 pl-4 pr-3 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {/* Attach Button */}
            <button
              className="flex items-center gap-1 px-2 h-6 text-xs text-zinc-600 dark:text-slate-400 hover:text-zinc-900 dark:hover:text-slate-100 hover:bg-zinc-50 dark:hover:bg-slate-800 rounded transition-colors"
              aria-label="Attach file"
              title="Attach file"
            >
              <Paperclip size={12} strokeWidth={1.5} />
              <span>Attach</span>
            </button>

            {/* Model Switcher Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                className="flex items-center gap-1 px-2 h-6 text-xs text-zinc-700 dark:text-slate-300 hover:bg-zinc-50 dark:hover:bg-slate-800 rounded transition-colors border border-zinc-200 dark:border-slate-700"
                aria-label="Select model"
                disabled={modelsLoading}
              >
                <span className="font-medium">
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
                <div className="absolute left-0 bottom-full mb-2 w-96 bg-white dark:bg-slate-800 border border-zinc-200 dark:border-slate-700 rounded-lg shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden z-50">
                  {/* Search Input */}
                  <div className="p-3 border-b border-zinc-200 dark:border-slate-700">
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
                        className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-50 dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-zinc-900 dark:text-slate-100"
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
                          onClick={() => {
                            setSelectedModel(model);
                            setIsModelDropdownOpen(false);
                            setSearchQuery('');
                          }}
                          className={`w-full px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-slate-700 transition-colors ${
                            selectedModel?.id === model.id
                              ? 'bg-zinc-50 dark:bg-slate-700'
                              : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm text-zinc-900 dark:text-slate-100 truncate">
                                {model.name}
                              </div>
                              <div className="text-xs text-zinc-500 dark:text-slate-400 mt-0.5">
                                {model.provider} • {model.contextLength.toLocaleString()} tokens
                              </div>
                            </div>
                            <div className="text-xs text-zinc-400 dark:text-slate-500 whitespace-nowrap">
                              ${(model.pricing.prompt * 1_000_000).toFixed(2)}/M
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>

                  {/* Footer */}
                  <div className="p-2 border-t border-zinc-200 dark:border-slate-700 text-xs text-zinc-400 dark:text-slate-500 text-center">
                    {filteredModels.length} model{filteredModels.length !== 1 ? 's' : ''}{' '}
                    available
                  </div>
                </div>
              )}
            </div>

            {/* Web Toggle */}
            <button
              onClick={() => setWebEnabled(!webEnabled)}
              className={`flex items-center gap-1 px-2 h-6 text-xs rounded transition-colors ${
                webEnabled
                  ? 'bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-slate-200'
                  : 'text-zinc-600 dark:text-slate-400 hover:text-zinc-900 dark:hover:text-slate-100 hover:bg-zinc-50 dark:hover:bg-slate-800'
              }`}
              aria-label="Toggle web browsing"
              title="Enable web browsing"
            >
              <Globe size={12} strokeWidth={1.5} />
              <span>Web</span>
            </button>

            {/* Think Toggle */}
            <button
              onClick={() => setThinkEnabled(!thinkEnabled)}
              className={`flex items-center gap-1 px-2 h-6 text-xs rounded transition-colors ${
                thinkEnabled
                  ? 'bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-slate-200'
                  : 'text-zinc-600 dark:text-slate-400 hover:text-zinc-900 dark:hover:text-slate-100 hover:bg-zinc-50 dark:hover:bg-slate-800'
              }`}
              aria-label="Toggle deep reasoning"
              title="Enable deep reasoning"
            >
              <Lightbulb size={12} strokeWidth={1.5} />
              <span>Think</span>
            </button>
          </div>

          {/* Smart Submit Button */}
          <button
            type="submit"
            disabled={!hasInput || isSubmitting}
            className="flex items-center justify-center w-8 h-8 btn-primary rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={hasInput ? 'Send message' : 'Voice input'}
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin" />
            ) : hasInput ? (
              <ArrowUp size={16} strokeWidth={2} />
            ) : (
              <Mic size={16} strokeWidth={1.5} />
            )}
          </button>
        </div>
          </div>
        </div>
      </form>
    </div>
  );
}
