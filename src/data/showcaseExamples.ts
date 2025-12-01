export interface ShowcaseExample {
  id: string;
  input: string;
  identity: {
    name: string;
    tagline: string;
    logoSvg: string;
    colors: { primary: string; secondary: string; accent: string };
    font: string;
  };
  research: {
    competitors: string[];
    marketSize: string;
  };
}

export const SHOWCASE_EXAMPLES: ShowcaseExample[] = [
  {
    id: 'nordic-brew',
    input: 'Premium coffee subscription service in Seattle',
    identity: {
      name: 'Nordic Brew',
      tagline: 'Elevating your morning ritual',
      logoSvg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="55" r="30" fill="#8B4513"/>
        <ellipse cx="50" cy="45" rx="25" ry="8" fill="#D2691E"/>
        <path d="M75 50 Q85 50 85 60 Q85 70 75 70" stroke="#8B4513" stroke-width="4" fill="none"/>
        <path d="M35 25 Q38 15 40 25" stroke="#F4A460" stroke-width="3" stroke-linecap="round"/>
        <path d="M50 20 Q53 10 55 20" stroke="#F4A460" stroke-width="3" stroke-linecap="round"/>
        <path d="M65 25 Q68 15 70 25" stroke="#F4A460" stroke-width="3" stroke-linecap="round"/>
      </svg>`,
      colors: { primary: '#8B4513', secondary: '#D2691E', accent: '#F4A460' },
      font: 'Playfair Display',
    },
    research: {
      competitors: ['Blue Bottle', 'Trade Coffee', 'Atlas Coffee'],
      marketSize: '$12.4B',
    },
  },
  {
    id: 'techflow',
    input: 'AI-powered project management SaaS',
    identity: {
      name: 'TechFlow',
      tagline: 'Where ideas become reality',
      logoSvg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="30" cy="30" r="12" fill="#D97706"/>
        <circle cx="70" cy="30" r="12" fill="#EA580C"/>
        <circle cx="50" cy="70" r="12" fill="#B45309"/>
        <line x1="38" y1="36" x2="44" y2="58" stroke="#D97706" stroke-width="3"/>
        <line x1="62" y1="36" x2="56" y2="58" stroke="#EA580C" stroke-width="3"/>
        <line x1="38" y1="30" x2="58" y2="30" stroke="#D97706" stroke-width="3"/>
      </svg>`,
      colors: { primary: '#D97706', secondary: '#EA580C', accent: '#B45309' },
      font: 'Inter',
    },
    research: {
      competitors: ['Asana', 'Monday', 'Notion'],
      marketSize: '$8.2B',
    },
  },
  {
    id: 'zenith-wellness',
    input: 'Online yoga and meditation studio',
    identity: {
      name: 'Zenith Wellness',
      tagline: 'Find your inner balance',
      logoSvg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="40" stroke="#14B8A6" stroke-width="3" fill="none"/>
        <circle cx="50" cy="50" r="30" stroke="#F472B6" stroke-width="2" fill="none"/>
        <circle cx="50" cy="50" r="20" stroke="#10B981" stroke-width="2" fill="none"/>
        <circle cx="50" cy="50" r="8" fill="#14B8A6"/>
      </svg>`,
      colors: { primary: '#14B8A6', secondary: '#F472B6', accent: '#10B981' },
      font: 'Lato',
    },
    research: {
      competitors: ['Headspace', 'Calm', 'Peloton'],
      marketSize: '$15.1B',
    },
  },
  {
    id: 'aurum-finance',
    input: 'Personal wealth management platform',
    identity: {
      name: 'Aurum Finance',
      tagline: 'Grow your legacy',
      logoSvg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <polygon points="50,15 85,85 15,85" fill="none" stroke="#F59E0B" stroke-width="4"/>
        <polygon points="50,30 72,75 28,75" fill="#1F2937"/>
        <line x1="50" y1="45" x2="50" y2="65" stroke="#F59E0B" stroke-width="3"/>
        <line x1="40" y1="55" x2="60" y2="55" stroke="#F59E0B" stroke-width="3"/>
      </svg>`,
      colors: { primary: '#1F2937', secondary: '#F59E0B', accent: '#71717A' },
      font: 'Poppins',
    },
    research: {
      competitors: ['Wealthfront', 'Betterment', 'Personal Capital'],
      marketSize: '$22.8B',
    },
  },
  {
    id: 'ecoleaf',
    input: 'Sustainable home goods marketplace',
    identity: {
      name: 'EcoLeaf',
      tagline: 'Live green, live better',
      logoSvg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 85 Q50 50 30 30 Q50 40 70 30 Q50 50 50 85" fill="#16A34A"/>
        <path d="M50 85 L50 45" stroke="#84CC16" stroke-width="3"/>
        <path d="M50 55 Q40 50 35 55" stroke="#84CC16" stroke-width="2" fill="none"/>
        <path d="M50 65 Q60 60 65 65" stroke="#84CC16" stroke-width="2" fill="none"/>
      </svg>`,
      colors: { primary: '#16A34A', secondary: '#84CC16', accent: '#A16207' },
      font: 'Nunito',
    },
    research: {
      competitors: ['Grove', 'Thrive Market', 'Package Free'],
      marketSize: '$5.6B',
    },
  },
];
