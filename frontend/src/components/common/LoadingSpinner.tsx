/**
 * LoadingSpinner Component
 * Animated loading indicator with multiple styles and smooth animations
 */

'use client'

import React from 'react'
import { motion } from 'framer-motion'

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  message?: string
  fullscreen?: boolean
  variant?: 'circle' | 'dots' | 'pulse' | 'bars'
  color?: 'violet' | 'slate' | 'lime'
  blur?: boolean
}

export function LoadingSpinner({
  size = 'md',
  message,
  fullscreen = false,
  variant = 'circle',
  color = 'violet',
  blur = true,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-10 w-10',
    lg: 'h-16 w-16',
  }

  const colorClasses = {
    violet: 'text-violet',
    slate: 'text-slate',
    lime: 'text-lime',
  }

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.4 },
    },
  }

  const messageVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, delay: 0.2 },
    },
  }

  const CircleSpinner = () => (
    <svg
      className={`${sizeClasses[size]} ${colorClasses[color]}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <motion.circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="2"
        className="opacity-20"
      />
      <motion.path
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="opacity-75"
      />
    </svg>
  )

  const DotsSpinner = () => {
    const dotVariants = {
      hidden: { y: 0, opacity: 0.5 },
      visible: { y: -12, opacity: 1 },
    }
    return (
      <div className={`flex gap-1.5 ${colorClasses[color]}`}>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className={`rounded-full ${size === 'sm' ? 'h-1.5 w-1.5' : size === 'md' ? 'h-2 w-2' : 'h-3 w-3'} bg-current`}
            variants={dotVariants}
            animate="visible"
            initial="hidden"
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.1,
            }}
          />
        ))}
      </div>
    )
  }

  const PulseSpinner = () => (
    <motion.div
      className={`${sizeClasses[size]} rounded-full ${colorClasses[color]} bg-current`}
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.8, 0.3, 0.8],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  )

  const BarsSpinner = () => (
    <div className={`flex gap-1 items-end ${colorClasses[color]}`}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={`rounded-sm w-1 ${size === 'sm' ? 'h-2' : size === 'md' ? 'h-4' : 'h-6'} bg-current`}
          animate={{
            scaleY: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.1,
          }}
        />
      ))}
    </div>
  )

  const spinners = {
    circle: CircleSpinner,
    dots: DotsSpinner,
    pulse: PulseSpinner,
    bars: BarsSpinner,
  }

  const SpinnerComponent = spinners[variant]

  const spinner = (
    <motion.div
      className="flex flex-col items-center gap-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <SpinnerComponent />
      {message && (
        <motion.p
          className="text-slate-light text-sm font-medium"
          variants={messageVariants}
          initial="hidden"
          animate="visible"
        >
          {message}
        </motion.p>
      )}
    </motion.div>
  )

  if (fullscreen) {
    return (
      <motion.div
        className={`fixed inset-0 flex items-center justify-center z-50 ${blur ? 'backdrop-blur-sm' : ''}`}
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.75)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {spinner}
      </motion.div>
    )
  }

  return spinner
}
