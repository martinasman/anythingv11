'use client';

import { useProjectStore } from '@/store/projectStore';
import { useState, useEffect } from 'react';
import PreviewPanel from './PreviewPanel';
import BrandView from './BrandView';
import WebsiteFocusView from './WebsiteFocusView';
import CRMFocusView from './CRMFocusView';
import BusinessPlanView from './BusinessPlanView';
import FirstWeekPlanView from './FirstWeekPlanView';
import OnboardingWalkthrough from './OnboardingWalkthrough';
import LoadingCanvas from './LoadingCanvas';
import OverviewCanvas from './OverviewCanvas';
import LeadDetailWorkspace from './LeadDetailWorkspace';

// Empty state component
function EmptyStatePrompt() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center max-w-md px-6">
        <div className="mb-6 text-zinc-400 dark:text-zinc-600">
          {/* Wireframe hint SVG */}
          <svg className="w-48 h-48 mx-auto" viewBox="0 0 200 200" fill="none">
            <rect x="20" y="20" width="160" height="160" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" rx="8" />
            <rect x="40" y="40" width="120" height="40" fill="currentColor" opacity="0.1" rx="4" />
            <rect x="40" y="90" width="120" height="70" fill="currentColor" opacity="0.05" rx="4" />
          </svg>
        </div>
        <p className="text-sm text-zinc-500">
          Describe your business idea to get started
        </p>
      </div>
    </div>
  );
}

export default function ContextPanel() {
  const {
    canvasState,
    artifacts,
    hasStartedGeneration,
    hasSeenOnboarding,
    setHasSeenOnboarding,
  } = useProjectStore();

  const [showOnboarding, setShowOnboarding] = useState(false);

  // Determine if all key artifacts are ready for onboarding
  const hasIdentity = !!artifacts.identity;
  const hasWebsite = !!artifacts.website;
  const allKeyArtifactsReady = hasIdentity && hasWebsite;

  // Show onboarding after first generation completes (when key artifacts are ready)
  useEffect(() => {
    if (hasStartedGeneration && !hasSeenOnboarding && allKeyArtifactsReady && canvasState.type === 'overview') {
      setShowOnboarding(true);
    }
  }, [hasStartedGeneration, hasSeenOnboarding, allKeyArtifactsReady, canvasState.type]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    setHasSeenOnboarding(true);
  };

  // Render content based on canvas state
  const renderContent = () => {
    // Empty state - no business yet AND no generation started
    if (!hasStartedGeneration && canvasState.type === 'empty') {
      return <EmptyStatePrompt />;
    }

    // Loading state - show when:
    // 1. Canvas state is explicitly 'loading' (tools running)
    // 2. Generation started but canvas still empty (waiting for first tool marker)
    if (canvasState.type === 'loading' || (hasStartedGeneration && canvasState.type === 'empty')) {
      return <LoadingCanvas />;
    }

    // Overview state - show website preview if available, otherwise show cards
    if (canvasState.type === 'overview') {
      // If website exists, show it as the main preview
      if (artifacts.website?.files?.length) {
        return <WebsiteFocusView />;
      }
      // Otherwise show the overview cards
      return <OverviewCanvas />;
    }

    // Detail state - show specific view
    if (canvasState.type === 'detail') {
      switch (canvasState.view) {
        case 'website':
          return <WebsiteFocusView />;
        case 'brand':
          return <BrandView />;
        case 'offer':
          return <BusinessPlanView />;
        case 'plan':
          return <FirstWeekPlanView />;
        case 'leads':
          return <CRMFocusView />;
        default:
          return <OverviewCanvas />;
      }
    }

    // Lead detail workspace - individual lead view with chat
    if (canvasState.type === 'lead-detail') {
      return <LeadDetailWorkspace leadId={canvasState.leadId} />;
    }

    // Fallback to overview
    return <OverviewCanvas />;
  };

  return (
    <div className="h-full overflow-hidden">
      <PreviewPanel>
        {renderContent()}
      </PreviewPanel>

      {/* Onboarding Modal */}
      {showOnboarding && <OnboardingWalkthrough onComplete={handleOnboardingComplete} />}
    </div>
  );
}
