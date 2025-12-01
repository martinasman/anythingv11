'use client';

import { ReactNode } from 'react';

interface PreviewPanelProps {
  children: ReactNode;
}

export default function PreviewPanel({ children }: PreviewPanelProps) {
  return (
    <div className="h-full">
      {children}
    </div>
  );
}
