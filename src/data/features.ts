import { Search, Palette, Globe, Cpu, Zap, Download } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  gradient: string;
}

export const FEATURES: Feature[] = [
  {
    icon: Search,
    title: 'AI Market Research',
    description: 'Instantly analyze competitors, pricing, and market trends with real-time web search',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Palette,
    title: 'Brand Identity Generator',
    description: 'Get a unique logo, color palette, and typography that matches your industry',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    icon: Globe,
    title: 'Website Builder',
    description: 'Generate a complete, responsive landing page with modern design',
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    icon: Cpu,
    title: '100+ AI Models',
    description: 'Choose from Claude, GPT-4, Gemini, and more via OpenRouter',
    gradient: 'from-orange-500 to-red-500',
  },
  {
    icon: Zap,
    title: 'Real-Time Generation',
    description: 'Watch as your business comes to life in seconds with live streaming',
    gradient: 'from-blue-400 to-blue-600',
  },
  {
    icon: Download,
    title: 'Export Anywhere',
    description: 'Download HTML/CSS/JS or deploy directly to your domain',
    gradient: 'from-teal-500 to-blue-500',
  },
];
