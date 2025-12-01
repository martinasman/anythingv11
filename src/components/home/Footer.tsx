'use client';

import Link from 'next/link';
import { Twitter, Github, Linkedin } from 'lucide-react';
import Container from '../ui/Container';

const footerLinks = {
  legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
  ],
};

const socialLinks = [
  { icon: Twitter, href: 'https://twitter.com/anything', label: 'Twitter' },
  { icon: Github, href: 'https://github.com/anything', label: 'GitHub' },
  { icon: Linkedin, href: 'https://linkedin.com/company/anything', label: 'LinkedIn' },
];

export default function Footer() {
  return (
    <footer className="py-12 border-t border-zinc-200 dark:border-neutral-800 transition-colors">
      <Container>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-zinc-600 dark:text-neutral-400">
            © {new Date().getFullYear()} Anything. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            {/* Social links */}
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-500 hover:text-zinc-900 dark:hover:text-neutral-100 transition-colors"
                  aria-label={social.label}
                >
                  <social.icon size={18} />
                </a>
              ))}
            </div>
            {/* Legal links */}
            <div className="flex gap-4 text-sm">
              {footerLinks.legal.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-zinc-600 dark:text-neutral-400 hover:text-zinc-900 dark:hover:text-neutral-100 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
}
