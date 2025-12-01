'use client';

import Header from '@/components/home/Header';
import HeroSection from '@/components/home/HeroSection';
import ShowcaseCarousel from '@/components/home/ShowcaseCarousel';
import Footer from '@/components/home/Footer';
import PendingProjectHandler from '@/components/home/PendingProjectHandler';
import ProjectDashboard from '@/components/home/ProjectDashboard';

export default function Home() {
  return (
    <div className="min-h-screen transition-colors" style={{ background: 'var(--surface-1)' }}>
      {/* Handle pending projects after sign-in redirect */}
      <PendingProjectHandler />

      <Header />

      <main>
        {/* Hero Section */}
        <HeroSection />

        {/* Project Dashboard (only shows when authenticated) */}
        <ProjectDashboard />

        {/* Showcase Carousel */}
        <ShowcaseCarousel />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
