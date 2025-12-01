'use client';

import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Container from '../ui/Container';
import SectionHeading from '../ui/SectionHeading';
import ShowcaseCard from './ShowcaseCard';
import { SHOWCASE_EXAMPLES } from '@/data/showcaseExamples';

export default function ShowcaseCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 340; // Card width + gap
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
      setTimeout(checkScroll, 300);
    }
  };

  return (
    <section className="py-28 sm:py-36 overflow-hidden">
      <Container>
        <SectionHeading
          title="See What AI Can Create"
          subtitle="Real examples of businesses generated in under a minute"
        />
      </Container>

      {/* Carousel wrapper */}
      <div className="relative">
        {/* Scroll buttons */}
        <button
          onClick={() => scroll('left')}
          disabled={!canScrollLeft}
          className={`absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white dark:bg-neutral-800 shadow-lg flex items-center justify-center transition-opacity ${
            canScrollLeft ? 'opacity-100 hover:bg-zinc-100 dark:hover:bg-neutral-700' : 'opacity-0 pointer-events-none'
          }`}
        >
          <ChevronLeft size={24} className="text-zinc-700 dark:text-neutral-300" />
        </button>

        <button
          onClick={() => scroll('right')}
          disabled={!canScrollRight}
          className={`absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white dark:bg-neutral-800 shadow-lg flex items-center justify-center transition-opacity ${
            canScrollRight ? 'opacity-100 hover:bg-zinc-100 dark:hover:bg-neutral-700' : 'opacity-0 pointer-events-none'
          }`}
        >
          <ChevronRight size={24} className="text-zinc-700 dark:text-neutral-300" />
        </button>

        {/* Gradient fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white dark:from-[#0A0A0A] to-transparent z-[5] pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white dark:from-[#0A0A0A] to-transparent z-[5] pointer-events-none" />

        {/* Scrollable container */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-6 justify-center overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {SHOWCASE_EXAMPLES.map((example, index) => (
            <div key={example.id} className={`snap-center animate-fade-in-up stagger-${index + 1}`}>
              <ShowcaseCard example={example} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
