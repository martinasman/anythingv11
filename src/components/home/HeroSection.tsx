'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import HeroInput from './HeroInput';
import Container from '../ui/Container';

export default function HeroSection() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="relative pt-40 pb-24 sm:pt-48 sm:pb-32">
      <Container size="md" className="text-center">
        {/* Logo */}
        <div className="mb-8 animate-fade-in">
          {mounted && (
            <Image
              src={resolvedTheme === 'dark' ? '/logolight.png' : '/logodark.png'}
              alt="Anything"
              width={180}
              height={50}
              className="mx-auto"
              priority
            />
          )}
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-zinc-900 dark:text-neutral-100 mb-6 animate-fade-in-up">
          Turn Any Idea Into a{' '}
          <span className="bg-gradient-to-r from-blue-500 via-blue-400 to-blue-600 bg-clip-text text-transparent">
            Business
          </span>{' '}
          in Minutes
        </h1>

        {/* Subheadline */}
        <p className="text-lg sm:text-xl text-zinc-600 dark:text-neutral-400 mb-8 max-w-2xl mx-auto animate-fade-in-up stagger-1">
          Describe your vision and our AI generates market research, brand identity,
          and a complete website — all in seconds.
        </p>

        {/* Hero Input */}
        <div className="animate-fade-in-up stagger-2">
          <HeroInput />
        </div>

        {/* Trust badge */}
        <p className="mt-6 text-sm text-zinc-500 dark:text-neutral-500 animate-fade-in stagger-3">
          No credit card required • 50 free credits to start
        </p>
      </Container>
    </section>
  );
}
