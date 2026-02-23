'use client';

import Link from 'next/link';
import { Grid2x2Check, Mail, Github, Twitter, Heart } from 'lucide-react';

/**
 * Footer Component
 * Modern footer with links, social media, and animations
 * Part of User Story 1: Landing Page
 */

const FOOTER_SECTIONS = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'Dashboard', href: '#valueprop-dashboard' },
      { label: 'AI Assistant', href: '#valueprop-assistant' },

    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '#' },
      { label: 'Blog', href: '#' },
      { label: 'Careers', href: '#' },
      { label: 'Contact', href: '#' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy', href: '#' },
      { label: 'Terms', href: '#' },
      { label: 'Security', href: '#' },
      { label: 'Cookies', href: '#' },
    ],
  },
];

const SOCIAL_LINKS = [
  { icon: Twitter, label: 'Twitter', href: '#' },
  { icon: Github, label: 'GitHub', href: '#' },
  { icon: Mail, label: 'Email', href: '#' },
];


export function Footer() {
  return (
    <footer className="relative w-full border border-t-2">
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">

      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main content */}
        <div className="py-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand Section */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center w-fit">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-violet-dark">
                <Grid2x2Check className="w-5 h-5" />
              </div>
              <span className="text-lg font-bold text-violet-dark" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Taskie
              </span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              Modern task management designed for focus and productivity.
            </p>
            <div className="flex items-center gap-3 pt-4">
              {SOCIAL_LINKS.map((social) => {
                const Icon = social.icon;
                return (
                  <Link
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-slate-light text-gray-300 hover:bg-violet/20 hover:text-violet transition-all"
                    aria-label={social.label}
                  >
                    <Icon className="w-4 h-4" />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Link Sections */}
          {FOOTER_SECTIONS.map((section) => (
            <div key={section.title} className="space-y-4">
              <h4 className="text-gray-600 font-semibold text-sm uppercase tracking-wider">
                {section.title}
              </h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-violet text-sm transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
                {/* Bottom section */}
        <div className="py-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-light/10">
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} Taskie. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="#"
              className="text-gray-500 hover:text-violet text-sm transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="#"
              className="text-gray-500 hover:text-violet text-sm transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
