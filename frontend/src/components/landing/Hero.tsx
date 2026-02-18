/**
 * Hero Component
 * Main hero section for landing page with headline, subheadline, and CTA
 * Showcases core task management features with interactive demo
 * Part of User Story 1: Landing Page
 */

'use client';

import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Zap, Clock, Sparkles, ListTodo, Calendar, Tag, Lightbulb, Target, CheckSquare } from 'lucide-react';
import { Button } from '../common/Button';
import Link from 'next/link';

interface FloatingCard {
  id: string;
  icon: React.ReactNode;
  color: string;
  position: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
  };
}

const floatingCards: FloatingCard[] = [
  {
    id: 'tasks',
    icon: <ListTodo size={32} strokeWidth={1.5} />,
    color: '#3d444f',
    position: { top: '-15%', left: '3%' },
  },
  {
    id: 'check',
    icon: <CheckCircle2 size={32} strokeWidth={1.5} />,
    color: '#3d444f',
    position: { top: '-15%', right: '3%', left: 'auto' },
  },
  {
    id: 'calendar',
    icon: <Calendar size={32} strokeWidth={1.5} />,
    color: '#3d444f',
    position: { bottom: '20%', left: '2%', top: 'auto' },
  },
  {
    id: 'target',
    icon: <Target size={32} strokeWidth={1.5} />,
    color: '#3d444f',
    position: { bottom: '15%', right: '2%', left: 'auto', top: 'auto' },
  },
  {
    id: 'zap',
    icon: <Zap size={32} strokeWidth={1.5} />,
    color: '#3d444f',
    position: { top: '20%', right: '15%', left: 'auto' },
  },
  {
    id: 'lightbulb',
    icon: <Lightbulb size={32} strokeWidth={1.5} />,
    color: '#3d444f',
    position: { top: '20%', left: '15%' },
  },
];

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

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        // Normalized mouse position (-1 to 1)
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        setMousePosition({ x, y });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <section
      ref={containerRef}
      className="
    relative flex flex-col items-center justify-start
    px-4 sm:px-6
    py-20 sm:py-24 lg:py-28
    overflow-hidden
  "
    >
      {/* Animated background blurs */}
      <div
        className="
      absolute
      top-10 sm:top-20
      right-0 sm:right-10
      w-40 h-40 sm:w-72 sm:h-72
      rounded-full blur-3xl opacity-30 pointer-events-none
    "
        style={{ backgroundColor: '#c68dff' }}
      />
      <div
        className="
      absolute
      bottom-10 sm:bottom-32
      left-0 sm:left-10
      w-52 h-52 sm:w-80 sm:h-80
      rounded-full blur-3xl opacity-30 pointer-events-none
    "
        style={{ backgroundColor: '#cbe857' }}
      />

      <motion.div
        className="w-full max-w-6xl space-y-6 relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header badge */}
        <motion.div
          className="flex items-center justify-center gap-2"
          variants={itemVariants}
        >
          <h4 className="px-3 py-1 rounded-full text-sm sm:text-sm font-semibold text-violet-dark bg-violet/10 border border-violet/30 uppercase text-center">
            Productivity Reimagined
          </h4>
        </motion.div>

        {/* Headline */}
        <motion.div
          className="space-y-5 sm:space-y-6 text-center px-1"
          variants={itemVariants}
        >
          <h1
            className="
          text-5xl
          xs:text-4xl
          sm:text-5xl
          lg:text-7xl
          font-semibold leading-tight tracking-tight text-gray-900
          max-w-[20ch] sm:max-w-none mx-auto
        "
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Work smarter with <br />
            <motion.span
              className="text-violet-dark inline-block"
              animate={{ backgroundPosition: ['0%', '100%', '0%'] }}
              transition={{ duration: 4, repeat: Infinity }}
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              AI assistance
            </motion.span>
          </h1>

          <p
            className="
          text-md sm:text-base lg:text-lg
          max-w-xl sm:max-w-2xl
          mx-auto
          leading-relaxed
          text-slate-light/90
          px-2 sm:px-0
        "
          >
            AI Taskie handles the mechanics while you handle what matters.
            Simple, fast, and built for people who actually get things done.
          </p>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          className="
        flex flex-col sm:flex-row
        gap-3 sm:gap-4
        justify-center items-center
        max-w-xs md:max-w-md mx-auto 
      "
          variants={itemVariants}
        >
          <motion.div
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            className="w-full sm:w-auto"
          >
            <Link href="/signup" className="w-full sm:w-auto block">
              <Button variant="primary" className="w-full sm:w-auto">
                Get Started Free
              </Button>
            </Link>
          </motion.div>

          <motion.div
            
            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            className="w-full sm:w-auto"
          >
            <Button variant="secondary" className="w-full sm:w-auto">
              See How it Works
            </Button>
          </motion.div>
        </motion.div>

        {/* Floating cards (unchanged UI — still desktop only) */}
        {floatingCards.map((card) => (
          <motion.div
            key={card.id}
            className="absolute group hidden lg:block"
            style={{
              top: card.position.top,
              bottom: card.position.bottom,
              left: card.position.left,
              right: card.position.right,
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <motion.div
              className="relative flex items-center justify-center w-14 h-14 rounded-md bg-white shadow-md hover:shadow-md transition-shadow"
              animate={{
                x: mousePosition.x * -20,
                y: mousePosition.y * -20,
              }}
              transition={{ type: 'spring', stiffness: 150, damping: 25 }}
              style={{ color: card.color }}
            >
              {card.icon}
            </motion.div>
          </motion.div>
        ))}
      </motion.div>
    </section>

  );
}
