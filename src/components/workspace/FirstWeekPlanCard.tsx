'use client';

import { useState } from 'react';
import { Calendar, ChevronDown, ChevronRight, CheckCircle2, Circle, Clock, Zap } from 'lucide-react';
import type { FirstWeekPlanArtifact } from '@/types/database';

interface FirstWeekPlanCardProps {
  plan: FirstWeekPlanArtifact;
  isLoading?: boolean;
  onTaskToggle: (taskId: string, completed: boolean) => void;
  isDark?: boolean;
}

export default function FirstWeekPlanCard({ plan, isLoading, onTaskToggle, isDark = true }: FirstWeekPlanCardProps) {
  const [expandedDay, setExpandedDay] = useState<number | null>(1); // Default Day 1 open

  // Dynamic styling based on background
  const cardBg = isDark ? 'bg-zinc-900/80 backdrop-blur-sm' : 'bg-white/90 backdrop-blur-sm';
  const textPrimary = isDark ? 'text-white' : 'text-zinc-900';
  const textSecondary = isDark ? 'text-zinc-400' : 'text-zinc-600';
  const borderColor = isDark ? 'border-zinc-700' : 'border-zinc-200';
  const skeletonBg = isDark ? 'bg-zinc-700' : 'bg-zinc-200';

  const getPriorityColor = (priority: string) => {
    if (isDark) {
      switch (priority) {
        case 'critical':
          return 'bg-red-900/30 text-red-400';
        case 'high':
          return 'bg-orange-900/30 text-orange-400';
        default:
          return 'bg-zinc-700 text-zinc-300';
      }
    } else {
      switch (priority) {
        case 'critical':
          return 'bg-red-100 text-red-700';
        case 'high':
          return 'bg-orange-100 text-orange-700';
        default:
          return 'bg-zinc-100 text-zinc-600';
      }
    }
  };

  if (isLoading) {
    return (
      <div className={`${cardBg} rounded-2xl p-6 animate-pulse`}>
        <div className={`h-6 ${skeletonBg} rounded w-1/3 mb-4`} />
        <div className={`h-4 ${skeletonBg} rounded w-2/3 mb-6`} />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`h-16 ${skeletonBg} rounded-xl`} />
          ))}
        </div>
      </div>
    );
  }

  const completedTasks = plan.taskCompletion || {};

  return (
    <div className={`${cardBg} rounded-2xl overflow-hidden`}>
      {/* Header */}
      <div className={`p-6 border-b ${borderColor}`}>
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-10 h-10 rounded-xl ${isDark ? 'bg-zinc-800' : 'bg-zinc-100'} flex items-center justify-center`}>
            <Calendar className={`w-5 h-5 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`} />
          </div>
          <div>
            <h3 className={`font-semibold ${textPrimary}`}>First Week Action Plan</h3>
            <p className={`text-sm ${textSecondary}`}>Your path to first revenue</p>
          </div>
        </div>

        {/* Strategy Banner */}
        <div className={`${isDark ? 'bg-zinc-800' : 'bg-zinc-100'} rounded-xl p-4 mt-4`}>
          <div className="flex items-start gap-2">
            <Zap className={`w-5 h-5 ${isDark ? 'text-zinc-400' : 'text-zinc-600'} mt-0.5 flex-shrink-0`} />
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>Quickest Path to Revenue</p>
              <p className={`text-sm ${textSecondary} mt-1`}>{plan.quickestPath}</p>
            </div>
          </div>
        </div>

        {/* Expected Metrics */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className={`text-center p-3 ${isDark ? 'bg-zinc-800' : 'bg-zinc-100'} rounded-xl`}>
            <p className={`text-lg font-bold ${textPrimary}`}>
              {plan.expectedMetrics.expectedCloses}
            </p>
            <p className={`text-xs ${textSecondary}`}>Expected Clients</p>
          </div>
          <div className={`text-center p-3 ${isDark ? 'bg-zinc-800' : 'bg-zinc-100'} rounded-xl`}>
            <p className={`text-lg font-bold ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
              {plan.expectedMetrics.expectedRevenue}
            </p>
            <p className={`text-xs ${textSecondary}`}>Expected Revenue</p>
          </div>
          <div className={`text-center p-3 ${isDark ? 'bg-zinc-800' : 'bg-zinc-100'} rounded-xl`}>
            <p className={`text-lg font-bold ${textPrimary}`}>
              {plan.expectedMetrics.totalOutreach}
            </p>
            <p className={`text-xs ${textSecondary}`}>Total Outreach</p>
          </div>
        </div>
      </div>

      {/* Days */}
      <div className={`divide-y ${isDark ? 'divide-zinc-700' : 'divide-zinc-200'}`}>
        {plan.days.map((day) => {
          const isExpanded = expandedDay === day.day;
          const dayTasks = day.tasks.map((_, i) => `${day.day}-${i}`);
          const completedCount = dayTasks.filter((t) => completedTasks[t]).length;
          const isComplete = completedCount === day.tasks.length;

          return (
            <div key={day.day} className={cardBg}>
              {/* Day Header */}
              <button
                onClick={() => setExpandedDay(isExpanded ? null : day.day)}
                className={`w-full px-6 py-4 flex items-center justify-between ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-50'} transition-colors`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      isComplete
                        ? 'bg-green-500 text-white'
                        : isDark ? 'bg-zinc-700 text-zinc-300' : 'bg-zinc-200 text-zinc-600'
                    }`}
                  >
                    {isComplete ? <CheckCircle2 className="w-5 h-5" /> : day.day}
                  </div>
                  <div className="text-left">
                    <p className={`font-medium ${textPrimary}`}>
                      Day {day.day}: {day.theme}
                    </p>
                    <p className={`text-sm ${textSecondary}`}>{day.goal}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs ${textSecondary}`}>
                    {completedCount}/{day.tasks.length}
                  </span>
                  {isExpanded ? (
                    <ChevronDown className={`w-5 h-5 ${textSecondary}`} />
                  ) : (
                    <ChevronRight className={`w-5 h-5 ${textSecondary}`} />
                  )}
                </div>
              </button>

              {/* Expanded Tasks */}
              {isExpanded && (
                <div className="px-6 pb-4 space-y-3">
                  {day.tasks.map((task, taskIndex) => {
                    const taskId = `${day.day}-${taskIndex}`;
                    const isTaskComplete = completedTasks[taskId];

                    return (
                      <div
                        key={taskIndex}
                        className={`p-4 rounded-xl border transition-all ${
                          isTaskComplete
                            ? isDark ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200'
                            : isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-zinc-50 border-zinc-200'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <button onClick={() => onTaskToggle(taskId, !isTaskComplete)} className="mt-0.5 flex-shrink-0">
                            {isTaskComplete ? (
                              <CheckCircle2 className="w-5 h-5 text-green-500" />
                            ) : (
                              <Circle className={`w-5 h-5 ${isDark ? 'text-zinc-600' : 'text-zinc-300'}`} />
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <p
                                className={`font-medium ${
                                  isTaskComplete
                                    ? isDark ? 'text-green-400 line-through' : 'text-green-700 line-through'
                                    : textPrimary
                                }`}
                              >
                                {task.task}
                              </p>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                                {task.priority}
                              </span>
                            </div>
                            <p className={`text-sm ${textSecondary} mb-2`}>{task.details}</p>
                            <div className={`flex items-center gap-2 text-xs ${textSecondary}`}>
                              <Clock className="w-3 h-3" />
                              {task.duration}
                            </div>

                            {/* Script if available */}
                            {task.script && (
                              <div className={`mt-3 p-3 rounded-lg border ${isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-zinc-200'}`}>
                                <p className={`text-xs font-medium ${textSecondary} mb-2`}>
                                  📝 Script Template:
                                </p>
                                <pre className={`text-xs ${isDark ? 'text-zinc-300' : 'text-zinc-700'} whitespace-pre-wrap font-mono`}>
                                  {task.script}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Day Metrics */}
                  <div className={`mt-4 p-3 rounded-xl ${isDark ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
                    <p className={`text-xs font-medium ${isDark ? 'text-zinc-300' : 'text-zinc-700'} mb-2`}>
                      📊 Success Metrics for Day {day.day}:
                    </p>
                    <ul className={`text-xs ${textSecondary} space-y-1`}>
                      {day.metrics.map((metric, i) => (
                        <li key={i}>• {metric}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Critical Success Factors Footer */}
      <div className={`p-6 ${isDark ? 'bg-zinc-900/50' : 'bg-zinc-50'} border-t ${borderColor}`}>
        <p className={`text-sm font-medium ${isDark ? 'text-zinc-300' : 'text-zinc-700'} mb-2`}>🎯 Critical Success Factors:</p>
        <ul className={`text-xs ${textSecondary} space-y-1`}>
          {plan.criticalSuccessFactors.map((factor, i) => (
            <li key={i}>• {factor}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
