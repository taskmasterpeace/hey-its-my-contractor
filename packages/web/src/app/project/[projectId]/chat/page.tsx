"use client";

import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useChatRealtime } from "@/hooks/useChatRealtime";
import { ChatWindow } from "@/components/chat/ChatWindow";

export default function ProjectChatPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const { user } = useAuth();

  const {
    activeChannel,
    messages,
    members,
    sendMessage,
    editMessage,
    deleteMessage,
    onlineUserIds,
    reads,
    loading,
    messagesReady,
  } = useChatRealtime(projectId);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 8rem)",
        background: "var(--ft-paper)",
        border: "1px solid var(--ft-rule)",
        borderRadius: 4,
        overflow: "hidden",
      }}
    >
      {activeChannel && user ? (
        <ChatWindow
          channel={activeChannel}
          messages={messages}
          members={members}
          currentUserId={user.id}
          onlineUserIds={onlineUserIds}
          reads={reads}
          messagesReady={messagesReady}
          onSendMessage={sendMessage}
          onEditMessage={editMessage}
          onDeleteMessage={deleteMessage}
        />
      ) : (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--ft-paper-2)",
            color: "var(--ft-steel)",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <div
            className="mono"
            style={{ fontSize: 10, letterSpacing: "0.12em" }}
          >
            {loading ? "LOADING" : "NO MESSAGES"}
          </div>
          <div style={{ fontSize: 14 }}>
            {loading ? "Opening messages…" : "Couldn't load messages."}
          </div>
        </div>
      )}
    </div>
  );
}
