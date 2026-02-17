'use client';

/**
 * FeatureHighlights Component
 * Showcases the four core features with icons and descriptions
 * Part of User Story 1: Landing Page
 */

import { Plus, Trash2, Zap, BarChart3 } from 'lucide-react';

export function FeatureHighlights() {
  const features = [
    {
      icon: Plus,
      title: 'Add & Manage',
      description: 'Create tasks instantly with a clean, distraction-free interface. Update or delete with just a click.',
      color: '#cbe857',
    },
    {
      icon: Zap,
      title: 'Priority & Due Dates',
      description:
        'Organize tasks by priority levels and set due dates. Stay on top of what matters most.',
      color: '#c68dff',
    },
    {
      icon: BarChart3,
      title: 'Track Progress',
      description:
        'Visualize your productivity with real-time dashboards. Watch your completion rates grow daily.',
      color: '#ffd43b',
    },
    {
      icon: Zap,
      title: 'AI Assistant',
      description:
        'Manage tasks with natural language commands. Your AI agent handles updates automatically.',
      color: '#c68dff',
    },
  ];

  return (
    <section className="relative py-20 sm:py-32 px-4 sm:px-6 lg:px-8 bg-white overflow-hidden">
      {/* Subtle background elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-violet/3 rounded-full -ml-48 -mt-48 blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-lime/3 rounded-full -mr-48 -mb-48 blur-3xl"></div>

      <div className="w-full max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2
            className="text-4xl sm:text-5xl font-bold mb-6 tracking-tight"
            style={{
              color: '#323843',
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            Everything You Need
          </h2>
          <p className="text-lg font-light leading-relaxed" style={{ color: '#323843', opacity: 0.75 }}>
            Powerful features designed to help you manage tasks, track progress, and automate your workflow with AI.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group relative p-6 rounded-2xl border border-slate-light/20 hover:border-slate-light/50 hover:shadow-lg transition-all duration-300 bg-white/50 backdrop-blur-sm"
              >
                {/* Icon background */}
                <div
                  className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300"
                  style={{ backgroundColor: feature.color, opacity: 0.15 }}
                >
                  <Icon size={24} style={{ color: feature.color }} />
                </div>

                {/* Content */}
                <h3
                  className="text-lg font-semibold mb-2"
                  style={{ color: '#323843', fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: '#323843', opacity: 0.7 }}>
                  {feature.description}
                </p>

                {/* Bottom accent */}
                <div className="absolute bottom-0 left-6 h-1 w-0 rounded-full group-hover:w-12 transition-all duration-300" style={{ backgroundColor: feature.color }} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
