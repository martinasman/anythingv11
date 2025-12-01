'use client';

import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import ChatPanel from './ChatPanel';
import ContextPanel from './ContextPanel';
import Toolbar from './Toolbar';

interface WorkspaceLayoutProps {
  projectId: string;
}

export default function WorkspaceLayout({ projectId }: WorkspaceLayoutProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="h-screen w-full flex flex-col">
      {/* Top Toolbar */}
      <Toolbar projectName={`Project ${projectId}`} />

      {/* Single ChatPanel - rendered once, responsive positioning */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row">
        {/* Chat Panel - responsive sizing */}
        <div
          className={`transition-all duration-300 flex flex-col md:flex-col ${
            isChatOpen ? 'h-1/2 md:h-full' : 'h-0 md:h-full'
          } md:w-1/4 md:border-r border-b md:border-b-0 border-zinc-200 dark:border-zinc-700 overflow-hidden`}
        >
          <ChatPanel projectName={`Project ${projectId}`} />
        </div>

        {/* Right Panel - Preview (always visible) */}
        <div className="flex-1 min-h-0">
          <ContextPanel />
        </div>

        {/* Chat toggle button (floating, mobile only) */}
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="fixed bottom-20 right-4 z-10 p-3 rounded-full bg-blue-500 text-white shadow-lg md:hidden"
          aria-label="Toggle chat"
        >
          <MessageSquare size={20} />
        </button>
      </div>
    </div>
  );
}
