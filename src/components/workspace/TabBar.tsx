'use client';

import { Sparkles, Users, Globe, DollarSign } from 'lucide-react';
import { useProjectStore, type WorkspaceView } from '@/store/projectStore';
import { useMemo } from 'react';

const TAB_CONFIG = [
  { id: 'SITE' as const, label: 'Website', icon: Globe, viewId: 'website' },
  { id: 'BRAND' as const, label: 'Brand', icon: Sparkles, viewId: 'identity' },
  { id: 'FINANCE' as const, label: 'Offer', icon: DollarSign, viewId: 'business-plan' },
  { id: 'CRM' as const, label: 'Leads', icon: Users, viewId: 'crm' },
];

export default function TabBar() {
  const { workspaceView, setWorkspaceView, artifacts, hasStartedGeneration } = useProjectStore();

  // Only show tabs for artifacts that exist (no phase gating)
  const visibleTabs = useMemo(() => {
    return TAB_CONFIG.filter(tab => {
      if (!hasStartedGeneration) return false;

      // Show tab only if artifact exists
      if (tab.id === 'SITE') return !!artifacts.website;
      if (tab.id === 'BRAND') return !!artifacts.identity;
      if (tab.id === 'FINANCE') return !!artifacts.businessPlan;
      if (tab.id === 'CRM') return !!artifacts.leads;

      return false;
    });
  }, [artifacts, hasStartedGeneration]);

  if (visibleTabs.length === 0) return null;

  return (
    <div className="border-t border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
      <div className="flex items-center justify-center gap-1 px-4 py-2">
        {visibleTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = workspaceView === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setWorkspaceView(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-white'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-700/50'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
