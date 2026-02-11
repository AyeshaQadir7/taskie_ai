"use client";

import { useAuth } from "@/lib/auth/useAuth";
import ChatInterface from "@/components/chat/ChatInterface";
import { ChatSkeleton } from "@/components/skeletons/ChatSkeleton";

export default function ChatPage() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <ChatSkeleton />;
  }

  return (
    <div className="fixed inset-0 top-16 lg:top-20 lg:left-64">
      <ChatInterface userId={user.id} />
    </div>
  );
}
