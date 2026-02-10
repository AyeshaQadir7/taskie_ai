"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckSquare, MessageSquare } from "lucide-react";

const tabs = [
  { label: "Tasks", href: "/tasks", icon: CheckSquare },
  { label: "Chat Agent", href: "/chat", icon: MessageSquare },
];

export function TabNav() {
  const pathname = usePathname();

  return (
    <div className="sticky top-14 z-30 bg-white border-b border-slate-light/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav className="flex justify-center gap-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href;
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? "border-violet text-violet"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
