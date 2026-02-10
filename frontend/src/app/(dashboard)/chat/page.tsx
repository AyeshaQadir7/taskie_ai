"use client";

import { useAuth } from "@/lib/auth/useAuth";
import ChatInterface from "@/components/chat/ChatInterface";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

export default function ChatPage() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-9.5rem)]">
      <ChatInterface userId={user.id} />
    </div>
  );
}
