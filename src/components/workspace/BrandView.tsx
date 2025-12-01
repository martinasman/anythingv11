'use client';

import { useProjectStore } from '@/store/projectStore';
import { Sparkles, Target, Palette, Type } from 'lucide-react';
import { useCanvasBackground } from '@/hooks/useCanvasBackground';

export default function BrandView() {
  const { artifacts, runningTools } = useProjectStore();
  const { bgStyle, isDark } = useCanvasBackground();

  const isIdentityLoading = runningTools.has('identity');
  const identity = artifacts.identity;
  const businessPlan = artifacts.businessPlan;

  // Dynamic styling based on background
  const cardBg = isDark ? 'bg-zinc-900/80 backdrop-blur-sm' : 'bg-white/90 backdrop-blur-sm';
  const textPrimary = isDark ? 'text-white' : 'text-zinc-900';
  const textSecondary = isDark ? 'text-zinc-400' : 'text-zinc-600';
  const skeletonBg = isDark ? 'bg-zinc-700' : 'bg-zinc-200';

  // Loading state
  if (isIdentityLoading && !identity) {
    return (
      <div className="h-full overflow-auto p-6" style={bgStyle}>
        <div className="max-w-4xl mx-auto animate-pulse">
          <div className="flex items-center gap-6 mb-8">
            <div className={`w-28 h-28 rounded-2xl ${skeletonBg}`} />
            <div className="flex-1">
              <div className={`w-48 h-8 ${skeletonBg} rounded mb-3`} />
              <div className={`w-64 h-5 ${skeletonBg} rounded`} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className={`h-40 ${skeletonBg} rounded-xl`} />
            <div className={`h-40 ${skeletonBg} rounded-xl`} />
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!identity) {
    return (
      <div className="h-full flex flex-col items-center justify-center" style={bgStyle}>
        <div className={`w-24 h-24 rounded-2xl border-2 border-dashed ${isDark ? 'border-zinc-600' : 'border-zinc-300'} flex items-center justify-center mb-4`}>
          <Sparkles size={40} className={isDark ? 'text-zinc-600' : 'text-zinc-300'} />
        </div>
        <h3 className={`text-xl font-semibold ${textSecondary} mb-2`}>
          No Brand Yet
        </h3>
        <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-zinc-400'} text-center max-w-sm`}>
          Start a conversation to generate your brand identity, including logo, colors, and messaging.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto" style={bgStyle}>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header: Logo + Name + Tagline */}
        <div className={`flex items-center gap-6 p-6 rounded-2xl ${cardBg}`}>
          <div className={`w-28 h-28 rounded-2xl overflow-hidden ${isDark ? 'bg-zinc-900' : 'bg-white'} flex items-center justify-center shadow-lg flex-shrink-0`}>
            <img
              src={identity.logoUrl}
              alt={identity.name}
              className="w-full h-full object-contain p-3"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className={`text-3xl font-bold ${textPrimary} mb-2`}>
              {identity.name}
            </h1>
            <p className={`text-lg ${textSecondary}`}>
              {identity.tagline}
            </p>
          </div>
        </div>

        {/* Two column layout for details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Color Palette */}
          <div className={`p-5 rounded-xl ${cardBg}`}>
            <div className="flex items-center gap-2 mb-4">
              <Palette size={18} className={isDark ? 'text-zinc-500' : 'text-zinc-400'} />
              <h3 className={`text-sm font-semibold ${isDark ? 'text-zinc-300' : 'text-zinc-700'} uppercase tracking-wide`}>
                Color Palette
              </h3>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <div
                  className="h-20 rounded-lg shadow-sm border border-white/20 mb-2"
                  style={{ backgroundColor: identity.colors.primary }}
                />
                <p className={`text-xs ${textSecondary} text-center`}>Primary</p>
                <p className={`text-xs font-mono ${textSecondary} text-center`}>{identity.colors.primary}</p>
              </div>
              <div className="flex-1">
                <div
                  className="h-20 rounded-lg shadow-sm border border-white/20 mb-2"
                  style={{ backgroundColor: identity.colors.secondary }}
                />
                <p className={`text-xs ${textSecondary} text-center`}>Secondary</p>
                <p className={`text-xs font-mono ${textSecondary} text-center`}>{identity.colors.secondary}</p>
              </div>
              <div className="flex-1">
                <div
                  className="h-20 rounded-lg shadow-sm border border-white/20 mb-2"
                  style={{ backgroundColor: identity.colors.accent }}
                />
                <p className={`text-xs ${textSecondary} text-center`}>Accent</p>
                <p className={`text-xs font-mono ${textSecondary} text-center`}>{identity.colors.accent}</p>
              </div>
            </div>
          </div>

          {/* Typography */}
          <div className={`p-5 rounded-xl ${cardBg}`}>
            <div className="flex items-center gap-2 mb-4">
              <Type size={18} className={isDark ? 'text-zinc-500' : 'text-zinc-400'} />
              <h3 className={`text-sm font-semibold ${isDark ? 'text-zinc-300' : 'text-zinc-700'} uppercase tracking-wide`}>
                Typography
              </h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className={`text-xs ${textSecondary} mb-1`}>Font Family</p>
                <p className={`text-xl font-medium ${textPrimary}`} style={{ fontFamily: identity.font }}>
                  {identity.font}
                </p>
              </div>
              <div className={`text-xl font-bold ${textPrimary} leading-snug`} style={{ fontFamily: identity.font }}>
                The quick brown fox jumps over the lazy dog
              </div>
            </div>
          </div>
        </div>

        {/* Value Proposition */}
        {businessPlan?.valueProposition && (
          <div className={`p-5 rounded-xl ${cardBg}`}>
            <div className="flex items-center gap-2 mb-3">
              <Target size={18} className={isDark ? 'text-zinc-500' : 'text-zinc-400'} />
              <h3 className={`text-sm font-semibold ${isDark ? 'text-zinc-300' : 'text-zinc-700'} uppercase tracking-wide`}>
                Value Proposition
              </h3>
            </div>
            <p className={`text-base ${isDark ? 'text-zinc-300' : 'text-zinc-700'} leading-relaxed`}>
              {businessPlan.valueProposition}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
