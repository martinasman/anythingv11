'use client';

import { useProjectStore, type WorkspaceView } from '@/store/projectStore';

const BANNER_CONTENT: Record<WorkspaceView, { title: string; subtitle: string }> = {
  HOME: {
    title: 'TODAY',
    subtitle: 'Start by describing your business idea',
  },
  SITE: {
    title: 'TODAY',
    subtitle: 'Website preview and editing',
  },
  BRAND: {
    title: 'TODAY',
    subtitle: 'Brand identity and visual assets',
  },
  FINANCE: {
    title: 'TODAY',
    subtitle: 'Business plan and financial projections',
  },
  CRM: {
    title: 'TODAY',
    subtitle: 'Customer relationship management',
  },
};

export default function TodayBanner() {
  const { workspaceView } = useProjectStore();
  const content = BANNER_CONTENT[workspaceView];

  return (
    <div className="border-b border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3">
      <div className="flex items-baseline gap-3">
        <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
          {content.title}
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {content.subtitle}
        </p>
      </div>
    </div>
  );
}
