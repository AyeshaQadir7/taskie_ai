/**
 * LandingCTA Component
 * Bold call-to-action section with contained rectangular gradient background
 * Inspired by modern SaaS landing pages with striking color and typography
 * Part of User Story 1: Landing Page
 */

'use client';

import Link from "next/link";
import { motion } from "framer-motion";
import { Lock, Check } from "lucide-react";
import { Button } from "@/components/common/Button";

interface LandingCTAProps {
  headline?: string;
  headlineHighlight?: string;
  description?: string;
  primaryCtaText?: string;
  primaryCtaHref?: string;
  trustBadgeText?: string;
  freeText?: string;
}

const containerVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.6,
      staggerChildren: 0.15,
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

export function LandingCTA({
  headline = "Ready to master your",
  headlineHighlight = "productivity with AI?",
  description = "Experience the future of task management. Get AI-powered assistance, real-time dashboards, and intelligent prioritization—all in one place.",
  primaryCtaText = "Start Saving Time",
  primaryCtaHref = "/signup",
  trustBadgeText = "Free forever for individuals",
  freeText = "AI agent included",
}: LandingCTAProps) {
  return (
    <motion.section
      className="relative py-24 px-4 sm:px-6 lg:px-8"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={containerVariants}
    >
      <div className="w-full max-w-6xl mx-auto bg-gradient-to-br from-violet to-violet-dark rounded-2xl lg:rounded-3xl py-20 sm:py-18 px-6 sm:px-8 lg:px-12 relative overflow-hidden">
        <div className="w-full max-w-3xl mx-auto text-center relative z-10">
          {/* Headline with highlight */}
          <motion.h2
            className="text-3xl sm:text-3xl lg:text-5xl font-semibold text-white mb-8 tracking-tight leading-tight"
            style={{
              color: "#ffffff",
              fontFamily: "'Space Grotesk', sans-serif",
            }}
            variants={itemVariants}
          >
            {headline}
            <br />
            <span className="">{headlineHighlight}</span>
          </motion.h2>

          {/* Description */}
          <motion.p
            className="text-md sm:text-lg text-white mb-12 leading-relaxed max-w-2xl mx-auto"
            variants={itemVariants}
          >
            Get AI-powered assistance, real-time dashboards, and intelligent <br/> prioritization all in one place.
          </motion.p>

          {/* Primary CTA Button - bold and prominent */}
          <motion.div className="mb-12" variants={itemVariants}>
            <Link href={primaryCtaHref}>
              <Button
                variant="accent"
                size="lg"
                className="px-10 py-4 text-lg font-bold shadow-xl hover:shadow-2xl bg-lime text-slate hover:bg-lime/90"
              >
                {primaryCtaText}
              </Button>
            </Link>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8 border-t border-white/20"
            variants={itemVariants}
          >
            {/* Badge 1 */}
            <div className="flex items-center gap-2">
              <Check color="#ffffff" strokeWidth={1.5} />
              <span className="text-white font-medium text-sm">
                {trustBadgeText}
              </span>
            </div>

            {/* Badge 2 */}
            <div className="flex items-center gap-2">
              <Lock color="#ffffff" strokeWidth={1.5} />
              <span className="text-white/90 font-medium text-sm">
                {freeText}
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}
