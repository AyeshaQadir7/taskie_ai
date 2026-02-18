'use client';

import { motion } from "framer-motion"
import Link from "next/link";
import { Button } from "@/components/common/Button";
import { LayoutDashboard, BotMessageSquare, ArrowUp } from "lucide-react";

/**
 * ValueProp Component
 * Two feature cards showcasing product benefits with realistic UI mockups
 * Displays Dashboard and AI Assistant capabilities
 * Part of User Story 1: Landing Page
 */

interface ValuePropProps {
  features?: Feature[];
}

interface Feature {
  tag: string;
  title: string;
  description: string;
  imageSide?: "left" | "right";
  icon?: React.ReactNode;
}

// Animation configurations
const ANIMATION = {
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  },
  item: {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.7,
        ease: 'easeInOut' as const,
      },
    },
  },
  mockup: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.8, delay: 0.2 },
  },
} as const;

// Dashboard stats
const DASHBOARD_STATS = [
  { label: "Completed", value: "24", color: "#cbe857" },
  { label: "In Progress", value: "8", color: "#c68dff" },
  { label: "Due Soon", value: "3", color: "#ffd43b" },
] as const;

// Chat messages
const CHAT_MESSAGES = [
  { type: "user", text: "Complete all high priority tasks", delay: 0.1 },
  { type: "ai", text: "Created 3 high-priority tasks for you", delay: 0.2 },
  { type: "user", text: "Show my weekly progress", delay: 0.3 },
  { type: "ai", text: "You're 75% done with your weekly goals!", delay: 0.4 },
] as const;

// Class name utilities
const STYLES = {
  statCard: "p-3 rounded-lg border",
  button: "flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-colors",
  messageContainer: "max-w-xs rounded-lg p-3 border",
} as const;

// Sub-component: Browser Chrome
const BrowserChrome = () => (
  <div className="bg-slate-light/5 border-b border-slate-light/20 px-4 py-3 flex items-center gap-2">
    <div className="flex gap-2">
      <div className="w-3 h-3 rounded-full bg-red-400"></div>
      <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
      <div className="w-3 h-3 rounded-full bg-green-400"></div>
    </div>
  </div>
);

// Sub-component: Stat Card
interface StatCardProps {
  label: string;
  value: string;
  color: string;
}

const StatCard = ({ label, value, color }: StatCardProps) => (
  <motion.div
    className={STYLES.statCard}
    style={{ backgroundColor: color + "15" }}
    whileHover={{ y: -2 }}
  >
    <p className="text-2xl font-bold" style={{ color }}>
      {value}
    </p>
    <p className="text-xs text-slate-light font-medium">{label}</p>
  </motion.div>
);

// Sub-component: Chat Message
interface ChatMessageProps {
  type: "user" | "ai";
  text: string;
  delay: number;
}

const ChatMessage = ({ type, text, delay }: ChatMessageProps) => {
  const isUser = type === "user";
  return (
    <motion.div
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
      initial={{ opacity: 0, x: isUser ? 20 : -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
    >
      <div
        className={`${STYLES.messageContainer} ${
          isUser ? "bg-violet rounded-br-none" : "bg-violet/20 rounded-bl-none border-violet/30"
        }`}
      >
        <p className={`text-sm ${isUser ? "text-white" : "font-medium text-slate"}`}>
          {text}
        </p>
      </div>
    </motion.div>
  );
};

// Sub-component: Dashboard Mockup
const DashboardMockup = () => (
  <div className="p-6 space-y-6 bg-slate-light/2">
    <div className="space-y-1">
      <p className="text-xs font-semibold text-slate-light uppercase tracking-widest ">Dashboard</p>
      <h4 className="text-xl font-bold text-slate-light">Your tasks overview</h4>
    </div>

    <div className="grid grid-cols-3 gap-3">
      {DASHBOARD_STATS.map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </div>

    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-light uppercase">Overall Progress</p>
        <p className="text-sm font-bold text-slate">75%</p>
      </div>
      <div className="w-full bg-slate-light/20 rounded-full h-2 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-violet"
          initial={{ width: 0 }}
          whileInView={{ width: "75%" }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>

    <div className="pt-2 flex gap-2">
      <button className={`${STYLES.button} bg-violet/20 text-violet hover:bg-violet/30`}>
        View All
      </button>
      <button className={`${STYLES.button} bg-slate-light/10 text-slate hover:bg-slate-light/20`}>
        New Task
      </button>
    </div>
  </div>
);

// Sub-component: Chat Mockup
const ChatMockup = () => (
  <div className="p-4 space-y-4 bg-slate-light/2 min-h-80 flex flex-col">
    <div className="space-y-3 flex-1">
      {CHAT_MESSAGES.map((msg, idx) => (
        <ChatMessage key={idx} type={msg.type as "user" | "ai"} text={msg.text} delay={msg.delay} />
      ))}
    </div>

    <div className="flex items-center gap-2 pt-2 border-t border-slate-light/20">
      <input
        type="text"
        placeholder="Ask anything..."
        className="flex-1 bg-slate-light/5 border border-slate-light/30 rounded-lg px-3 py-2 text-sm text-slate placeholder-slate-light/50 focus:outline-none focus:border-violet/50"
        disabled
      />
      <motion.button
        className="p-2 rounded-lg text-white"
        style={{ backgroundColor: "#c68dff" }}
        whileHover={{ scale: 1.05 }}
        disabled
      >
        <ArrowUp className="w-5 h-5" />
      </motion.button>
    </div>
  </div>
);

export function ValueProp({
  features = [
    {
      tag: "Dashboard",
      title: "See everything at once",
      description:
        "Your dashboard gives you a clear view of progress and priorities. No scrolling through endless lists, just the clarity you need to move forward.",
      imageSide: "right",
      icon: <LayoutDashboard className="w-6 h-6" />,
    },
    {
      tag: "Assistant",
      title: "Command your tasks with words",
      description:
        "Speak naturally to add, edit, or organize tasks. AI Taskflow understands what you mean and handles the rest, turning conversation into action without friction.",
      imageSide: "left",
      icon: <BotMessageSquare className="w-6 h-6" />,
    },
  ],
}: ValuePropProps) {
  const getOrderClass = (side?: string, isImage?: boolean) => {
    if (isImage) return side === "left" ? "lg:order-1" : "lg:order-2";
    return side === "left" ? "lg:order-2" : "lg:order-1";
  };

  const featureIds = ["dashboard", "assistant"] as const;

  return (
    <section id="value-prop" className="relative py-20 sm:py-32 px-12 sm:px-20 lg:px-20 overflow-hidden">
      {/* Background blurs */}
      {/* <div className="absolute top-1/3 -right-48 w-96 h-96 bg-violet/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/3 -left-48 w-96 h-96 bg-lime/10 rounded-full blur-3xl pointer-events-none"></div> */}

      <div className="w-full max-w-7xl mx-auto relative z-10">
        <motion.div
          className="space-y-24"
          variants={ANIMATION.container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {features.map((feature, index) => (
            <motion.div
              id={`valueprop-${featureIds[index]}`}
              key={`feature-${index}`}
              variants={ANIMATION.item}
              className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center"
            >
              {/* Text Content */}
              <motion.div
                className={`space-y-6 ${getOrderClass(feature.imageSide)}`}
                variants={ANIMATION.item}
              >
                <div className="inline-flex">
                  <span className="px-3 py-1 rounded-full text-sm font-semibold text-violet-dark bg-violet/10 border border-violet/30 uppercase">
                    {feature.tag}
                  </span>
                </div>

                <div>
                  <h3
                    className="text-4xl sm:text-5xl font-semibold text-slate mb-6 tracking-tighter leading-tight"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    {feature.title}
                  </h3>
                  <p className="text-lg text-slate-light/80 leading-snug max-w-lg">
                    {feature.description}
                  </p>
                </div>

                <div className="pt-4">
                  <Link href="/signup">
                    <Button variant="secondary">See How It Works </Button>
                  </Link>
                </div>
              </motion.div>

              {/* Product Mockup */}
              <motion.div
                className={`flex items-center justify-center ${getOrderClass(feature.imageSide, true)}`}
                {...ANIMATION.mockup}
                whileInView={ANIMATION.mockup.animate}
                viewport={{ once: true, margin: "-100px" }}
              >
                <div className="relative w-full max-w-md">
                  <div className="relative bg-white rounded-2xl overflow-hidden shadow-lg border border-slate-light/30">
                    <BrowserChrome />
                    {index === 0 ? <DashboardMockup /> : <ChatMockup />}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
