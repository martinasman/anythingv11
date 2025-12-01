'use client';

import { Target, MessageSquare, DollarSign, Check, ChevronRight, Lock } from 'lucide-react';

interface JourneyBarProps {
  hasLeads: boolean;
  hasScripts: boolean;
  leadsCount?: number;
  scriptsCount?: number;
  onGenerateLeads: () => void;
  onCreateScripts: () => void;
}

export default function JourneyBar({
  hasLeads,
  hasScripts,
  leadsCount = 0,
  scriptsCount = 0,
  onGenerateLeads,
  onCreateScripts,
}: JourneyBarProps) {
  // Determine current step
  const currentStep = hasScripts ? 3 : hasLeads ? 2 : 1;

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-800/50 border border-zinc-200 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <DollarSign size={20} />
          Path to Your First Sale
        </h3>
      </div>

      {/* Steps */}
      <div className="p-6">
        <div className="flex items-start gap-4">
          {/* Step 1: Get Leads */}
          <div className="flex-1">
            <div className={`p-4 rounded-xl border-2 transition-all ${
              currentStep === 1
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : hasLeads
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-zinc-200 dark:border-slate-700 bg-zinc-50 dark:bg-slate-800/50 opacity-50'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  hasLeads
                    ? 'bg-blue-500'
                    : currentStep === 1
                    ? 'bg-blue-500'
                    : 'bg-zinc-300 dark:bg-slate-600'
                }`}>
                  {hasLeads ? (
                    <Check size={16} className="text-white" />
                  ) : (
                    <span className="text-sm font-bold text-white">1</span>
                  )}
                </div>
                <div>
                  <h4 className={`text-sm font-semibold ${
                    hasLeads
                      ? 'text-blue-700 dark:text-blue-300'
                      : currentStep === 1
                      ? 'text-blue-700 dark:text-blue-300'
                      : 'text-zinc-500'
                  }`}>
                    Get Leads
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-slate-400">
                    {hasLeads ? `${leadsCount} prospects found` : '10 qualified prospects'}
                  </p>
                </div>
              </div>

              {currentStep === 1 && !hasLeads && (
                <button
                  onClick={onGenerateLeads}
                  className="w-full py-2.5 px-4 btn-primary text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Target size={16} />
                  Generate 10 Leads
                </button>
              )}
            </div>
          </div>

          {/* Arrow */}
          <div className="flex items-center pt-6">
            <ChevronRight size={24} className={hasLeads ? 'text-blue-500' : 'text-zinc-300 dark:text-slate-600'} />
          </div>

          {/* Step 2: Contact */}
          <div className="flex-1">
            <div className={`p-4 rounded-xl border-2 transition-all ${
              currentStep === 2
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : hasScripts
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-zinc-200 dark:border-slate-700 bg-zinc-50 dark:bg-slate-800/50 opacity-50'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  hasScripts
                    ? 'bg-blue-500'
                    : currentStep === 2
                    ? 'bg-blue-500'
                    : 'bg-zinc-300 dark:bg-slate-600'
                }`}>
                  {hasScripts ? (
                    <Check size={16} className="text-white" />
                  ) : (
                    <span className="text-sm font-bold text-white">2</span>
                  )}
                </div>
                <div>
                  <h4 className={`text-sm font-semibold ${
                    hasScripts
                      ? 'text-blue-700 dark:text-blue-300'
                      : currentStep === 2
                      ? 'text-blue-700 dark:text-blue-300'
                      : 'text-zinc-500'
                  }`}>
                    Contact
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-slate-400">
                    {hasScripts ? `${scriptsCount} scripts ready` : 'Call & email scripts'}
                  </p>
                </div>
              </div>

              {currentStep === 2 && !hasScripts && (
                <button
                  onClick={onCreateScripts}
                  className="w-full py-2.5 px-4 btn-primary text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <MessageSquare size={16} />
                  Create Scripts
                </button>
              )}

              {currentStep < 2 && (
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <Lock size={12} />
                  <span>Generate leads first</span>
                </div>
              )}
            </div>
          </div>

          {/* Arrow */}
          <div className="flex items-center pt-6">
            <ChevronRight size={24} className={hasScripts ? 'text-blue-500' : 'text-zinc-300 dark:text-slate-600'} />
          </div>

          {/* Step 3: Close */}
          <div className="flex-1">
            <div className={`p-4 rounded-xl border-2 transition-all ${
              currentStep === 3
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-zinc-200 dark:border-slate-700 bg-zinc-50 dark:bg-slate-800/50 opacity-50'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep === 3
                    ? 'bg-blue-500'
                    : 'bg-zinc-300 dark:bg-slate-600'
                }`}>
                  <span className="text-sm font-bold text-white">3</span>
                </div>
                <div>
                  <h4 className={`text-sm font-semibold ${
                    currentStep === 3
                      ? 'text-blue-700 dark:text-blue-300'
                      : 'text-zinc-500'
                  }`}>
                    Close
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-slate-400">
                    Make your first sale
                  </p>
                </div>
              </div>

              {currentStep === 3 ? (
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  Contact your leads and close your first deal!
                </p>
              ) : (
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <Lock size={12} />
                  <span>Complete previous steps</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
