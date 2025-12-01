'use client';

import { useState } from 'react';
import { Sparkles, Globe, Users, Mail, Phone, ChevronRight, X } from 'lucide-react';

interface OnboardingWalkthroughProps {
  onComplete: () => void;
}

const STEPS = [
  {
    title: 'Your Business Foundation',
    description: "We've created your brand identity and website based on your conversation.",
    icon: Sparkles,
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-500',
    features: [
      { icon: Sparkles, text: 'Custom logo and brand colors' },
      { icon: Globe, text: 'Professional website ready to launch' },
    ],
  },
  {
    title: 'Find Your Customers',
    description: 'Generate leads and manage your sales pipeline all in one place.',
    icon: Users,
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-500',
    features: [
      { icon: Users, text: 'AI-powered lead generation' },
      { icon: Users, text: 'Pipeline management with status tracking' },
    ],
  },
  {
    title: 'Close Deals',
    description: 'Contact leads with personalized email and call scripts.',
    icon: Mail,
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-500',
    features: [
      { icon: Mail, text: 'Personalized email templates' },
      { icon: Phone, text: 'Call scripts with objection handlers' },
    ],
  },
];

export default function OnboardingWalkthrough({ onComplete }: OnboardingWalkthroughProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const step = STEPS[currentStep];
  const Icon = step.icon;
  const isLastStep = currentStep === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden">
        {/* Skip button */}
        <button
          onClick={onComplete}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-slate-300 transition-colors"
          aria-label="Skip onboarding"
        >
          <X size={20} />
        </button>

        {/* Step indicator */}
        <div className="flex justify-center gap-2 pt-6 pb-2">
          {STEPS.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentStep
                  ? 'bg-blue-500'
                  : index < currentStep
                  ? 'bg-blue-300'
                  : 'bg-zinc-200 dark:bg-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Step number */}
        <div className="text-center">
          <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
            Step {currentStep + 1} of {STEPS.length}
          </span>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Icon */}
          <div className={`w-20 h-20 mx-auto rounded-2xl ${step.iconBg} flex items-center justify-center mb-6`}>
            <Icon size={40} className={step.iconColor} />
          </div>

          {/* Title & Description */}
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white text-center mb-3">
            {step.title}
          </h2>
          <p className="text-zinc-500 dark:text-slate-400 text-center mb-8">
            {step.description}
          </p>

          {/* Features */}
          <div className="space-y-3 mb-8">
            {step.features.map((feature, index) => {
              const FeatureIcon = feature.icon;
              return (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-slate-800"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    <FeatureIcon size={16} className="text-blue-500" />
                  </div>
                  <span className="text-sm text-zinc-700 dark:text-slate-300">
                    {feature.text}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Action button */}
          <button
            onClick={handleNext}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 btn-primary text-white font-semibold rounded-xl transition-colors"
          >
            {isLastStep ? 'Get Started' : 'Next'}
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
