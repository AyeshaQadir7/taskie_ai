
'use client';

/**
 * Features Component
 * Two-part features section:
 * 1. Left column with heading
 * 2. Right column with timeline-style features
 * Inspired by professional SaaS landing pages
 * Part of User Story 1: Landing Page
 */
import React from "react"
import { motion } from "framer-motion"
import { Check, LayoutDashboard, CircleAlert, BotMessageSquare, ArrowRight } from "lucide-react"
import { Button } from '../common/Button';
import Link from "next/link";

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

interface FeaturesProps {
  features?: Feature[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: 'easeInOut' as const,
    },
  },
};

export function Features({
  features = [
    {
      icon: <Check className="w-6 h-6" strokeWidth={1.5} />,
      title: "Manage tasks with ease",
      description: "Effortlessly organize and manage your tasks with our intuitive interface designed for simplicity and clarity.",
      color: "#b373e6",
    },
    {
      icon: <LayoutDashboard className="w-6 h-6" strokeWidth={1.5} />,
      title: "Track progress visually",
      description: "See your progress at a glance with clear visual indicators and organized task views.",
      color: "#3d444f",
    },
    {
      icon: <CircleAlert className="w-6 h-6" strokeWidth={1.5} />,
      title: "Set priorities that stick",
      description: "Define what matters most and ensure your important tasks stay at the top of your list.",
      color: "#b373e6",
    },
    {
      icon: <BotMessageSquare className="w-6 h-6" strokeWidth={1.5} />,
      title: "Control tasks with AI",
      description: "Leverage AI capabilities to intelligently manage and organize your tasks.",
      color: "#3d444f",
    },
  ],
}: FeaturesProps) {
  return (
    <section id="features" className="bg-white py-20 sm:py-32 px-6 sm:px-6 lg:px-8 relative overflow-visible">
      {/* Blur blob background - positioned in section */}
      <div className="absolute hidden md:block -left-20 top-56 w-96 h-96 bg-violet/30 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-6xl mx-auto relative z-10">
        <motion.div
          suppressHydrationWarning
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {/* Left Column */}
          <motion.div className="flex flex-col justify-start" variants={itemVariants}>

            <span className="px-3 py-1 w-24 mb-4 rounded-full text-sm font-semibold text-violet-dark bg-violet/10 border border-violet/30 uppercase">Features</span>
            <h2 className="text-4xl sm:text-5xl font-semibold text-slate mb-8 tracking-tight leading-tight" style={{
              fontFamily: "'Space Grotesk', sans-serif",
            }}>
              Everything you need to
              <br />
              <span className="text-violet-dark text-6xl">stay on top</span>

            </h2>
            <div

              className="inline-flex items-center gap-2 text-purple-600 font-medium hover:text-violet-dark transition-colors"

            >
              <Link href="/features">
                <Button variant="secondary">
                  Discover More
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Right Column - Features Timeline */}
          <motion.div className="relative" variants={containerVariants}>
            {/* Vertical connecting line */}
            <div className="absolute left-4 top-0 bottom-0 w-[2px] bg-gradient-to-b from-slate-light to-transparent"></div>

            {/* Features list */}
            <div className="space-y-10">
              {features.map((feature, index) => (
                <motion.div key={index} className="flex gap-6" variants={itemVariants}>
                  {/* Icon connector dot */}
                  <motion.div
                    className="relative"
                    transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                  >
                    <div
                      className="flex items-center justify-center w-10 h-10 rounded-full text-white flex-shrink-0 shadow-md"
                      style={{ backgroundColor: feature.color }}
                    >
                      {feature.icon}
                    </div>
                  </motion.div>

                  {/* Feature content */}
                  <motion.div
                    className="flex-1 pt-1 group cursor-pointer"
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <h3 className="text-lg font-bold text-slate group-hover:text-violet-dark transition-colors"
                      style={{
                        fontFamily: "'Space Grotesk', sans-serif",
                      }}>
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed"
                      style={{
                        fontFamily: "'Space Grotesk', sans-serif",
                      }}>
                      {feature.description}
                    </p>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
