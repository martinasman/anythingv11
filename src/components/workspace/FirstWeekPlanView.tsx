'use client';

import { useProjectStore } from '@/store/projectStore';
import { Calendar, ArrowLeft } from 'lucide-react';
import FirstWeekPlanCard from './FirstWeekPlanCard';

export default function FirstWeekPlanView() {
  const { artifacts, runningTools, updateTaskCompletion, setCanvasState } = useProjectStore();

  const isFirstWeekLoading = runningTools.has('firstweekplan');
  const firstWeekPlan = artifacts.firstWeekPlan;

  // Task completion handler
  const handleTaskToggle = async (taskId: string, completed: boolean) => {
    await updateTaskCompletion(taskId, completed);
  };

  // Loading state
  if (isFirstWeekLoading && !firstWeekPlan) {
    return (
      <div className="h-full overflow-auto p-6">
        <div className="max-w-4xl mx-auto animate-pulse">
          <div className="mb-8">
            <div className="w-48 h-8 bg-zinc-200 dark:bg-zinc-700 rounded mb-2" />
            <div className="w-64 h-5 bg-zinc-200 dark:bg-zinc-700 rounded" />
          </div>
          <div className="h-96 bg-zinc-200 dark:bg-zinc-700 rounded-xl" />
        </div>
      </div>
    );
  }

  // Empty state
  if (!firstWeekPlan) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-600 flex items-center justify-center mb-4">
          <Calendar size={40} className="text-zinc-300 dark:text-zinc-600" />
        </div>
        <h3 className="text-xl font-semibold text-zinc-500 dark:text-zinc-400 mb-2">No Action Plan Yet</h3>
        <p className="text-sm text-zinc-400 dark:text-zinc-500 text-center max-w-sm">
          Generate your business to get a 7-day action plan.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header with back button */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setCanvasState({ type: 'overview' })}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Overview
          </button>
        </div>

        {/* First Week Plan Card */}
        <FirstWeekPlanCard
          plan={firstWeekPlan}
          isLoading={isFirstWeekLoading}
          onTaskToggle={handleTaskToggle}
        />
      </div>
    </div>
  );
}
