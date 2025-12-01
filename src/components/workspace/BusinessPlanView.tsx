'use client';

import { useProjectStore } from '@/store/projectStore';
import { DollarSign, Check, Calendar } from 'lucide-react';
import FirstWeekPlanCard from './FirstWeekPlanCard';
import { useCanvasBackground } from '@/hooks/useCanvasBackground';

export default function BusinessPlanView() {
  const { artifacts, runningTools, updateTaskCompletion } = useProjectStore();
  const { bgStyle, isDark } = useCanvasBackground();

  const isBusinessPlanLoading = runningTools.has('businessplan');
  const isFirstWeekLoading = runningTools.has('firstweekplan');

  const businessPlan = artifacts.businessPlan;
  const firstWeekPlan = artifacts.firstWeekPlan;

  // Dynamic styling based on background
  const cardBg = isDark ? 'bg-zinc-900/80 backdrop-blur-sm' : 'bg-white/90 backdrop-blur-sm';
  const textPrimary = isDark ? 'text-white' : 'text-zinc-900';
  const textSecondary = isDark ? 'text-zinc-400' : 'text-zinc-600';
  const skeletonBg = isDark ? 'bg-zinc-700' : 'bg-zinc-200';

  // Task completion handler
  const handleTaskToggle = async (taskId: string, completed: boolean) => {
    await updateTaskCompletion(taskId, completed);
  };

  // Loading state
  if (isBusinessPlanLoading && !businessPlan) {
    return (
      <div className="h-full overflow-auto p-6" style={bgStyle}>
        <div className="max-w-5xl mx-auto animate-pulse">
          <div className="mb-8">
            <div className={`w-48 h-8 ${skeletonBg} rounded mb-2`} />
            <div className={`w-64 h-5 ${skeletonBg} rounded`} />
          </div>
          <div className="space-y-6">
            <div className={`h-64 ${skeletonBg} rounded-xl`} />
            <div className={`h-96 ${skeletonBg} rounded-xl`} />
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!businessPlan) {
    return (
      <div className="h-full flex flex-col items-center justify-center" style={bgStyle}>
        <div className={`w-24 h-24 rounded-2xl border-2 border-dashed ${isDark ? 'border-zinc-600' : 'border-zinc-300'} flex items-center justify-center mb-4`}>
          <DollarSign size={40} className={isDark ? 'text-zinc-600' : 'text-zinc-300'} />
        </div>
        <h3 className={`text-xl font-semibold ${textSecondary} mb-2`}>No Business Plan Yet</h3>
        <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-zinc-400'} text-center max-w-sm`}>
          Start a conversation to generate your business plan and action plan.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto" style={bgStyle}>
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className={`text-2xl font-semibold ${textPrimary}`}>Business Plan & Action Plan</h1>
          <p className={`text-sm ${textSecondary} mt-1`}>
            Your pricing strategy and week 1 roadmap to revenue
          </p>
        </div>

        {/* Business Plan Section */}
        <div className="space-y-4">
          <h2 className={`text-lg font-semibold ${textPrimary}`}>Pricing & Packages</h2>

          {/* Value Proposition */}
          {businessPlan.valueProposition && (
            <div className={`p-4 rounded-xl ${cardBg}`}>
              <p className={`text-sm font-medium ${isDark ? 'text-zinc-300' : 'text-zinc-700'} mb-1`}>Value Proposition</p>
              <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>{businessPlan.valueProposition}</p>
            </div>
          )}

          {/* Pricing Tiers Grid */}
          {businessPlan.pricingTiers && businessPlan.pricingTiers.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {businessPlan.pricingTiers.map((tier, index) => (
                <div
                  key={index}
                  className={`p-5 rounded-xl ${cardBg}`}
                >
                  <h3 className={`text-lg font-semibold ${textPrimary}`}>{tier.name}</h3>
                  <div className={`text-3xl font-bold ${isDark ? 'text-zinc-300' : 'text-zinc-700'} my-3`}>{tier.price}</div>
                  <ul className="space-y-2">
                    {tier.features.map((feature, fIndex) => (
                      <li key={fIndex} className="flex items-start gap-2 text-sm">
                        <Check size={16} className={isDark ? 'text-zinc-500' : 'text-zinc-400'} />
                        <span className={isDark ? 'text-zinc-300' : 'text-zinc-600'}>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {/* Service Packages */}
          {businessPlan.servicePackages && businessPlan.servicePackages.length > 0 && (
            <div className="space-y-3 mt-6">
              <h3 className={`text-md font-semibold ${textPrimary}`}>Service Packages</h3>
              {businessPlan.servicePackages.map((pkg, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-xl ${cardBg}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className={`font-semibold ${textPrimary}`}>{pkg.name}</h4>
                      <p className={`text-sm ${textSecondary} mt-1`}>{pkg.description}</p>
                    </div>
                    <div className={`text-lg font-bold ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>{pkg.price}</div>
                  </div>
                  <div className="mt-3">
                    <p className={`text-xs font-medium ${textSecondary} mb-2`}>Deliverables:</p>
                    <ul className="grid grid-cols-2 gap-2">
                      {pkg.deliverables.map((deliverable, dIndex) => (
                        <li key={dIndex} className="flex items-start gap-2 text-sm">
                          <Check size={14} className={isDark ? 'text-zinc-500' : 'text-zinc-400'} />
                          <span className={isDark ? 'text-zinc-300' : 'text-zinc-600'}>{deliverable}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* First Week Action Plan */}
        {firstWeekPlan && (
          <div className="space-y-4 mt-8">
            <div className="flex items-center gap-2">
              <Calendar className={`w-5 h-5 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`} />
              <h2 className={`text-lg font-semibold ${textPrimary}`}>First Week Action Plan</h2>
            </div>
            <FirstWeekPlanCard plan={firstWeekPlan} isLoading={isFirstWeekLoading} onTaskToggle={handleTaskToggle} isDark={isDark} />
          </div>
        )}

        {/* Loading state for first week plan if business plan exists but plan doesn't */}
        {businessPlan && !firstWeekPlan && isFirstWeekLoading && (
          <div className="space-y-4 mt-8">
            <h2 className={`text-lg font-semibold ${textPrimary}`}>First Week Action Plan</h2>
            <FirstWeekPlanCard plan={{} as any} isLoading={true} onTaskToggle={handleTaskToggle} isDark={isDark} />
          </div>
        )}
      </div>
    </div>
  );
}
