"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useChatRealtime, type Channel } from "@/hooks/useChatRealtime";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { ChannelRail } from "@/components/chat/ChannelRail";
import { ManageGroupDialog } from "@/components/chat/ManageGroupDialog";

export default function ProjectChatPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const { user } = useAuth();

  const {
    channels,
    activeChannel,
    messages,
    members,
    sendMessage,
    editMessage,
    deleteMessage,
    selectChannel,
    createChannel,
    updateChannel,
    deleteChannel,
    onlineUserIds,
    reads,
    loading,
    messagesReady,
  } = useChatRealtime(projectId);

  const [managingChannel, setManagingChannel] = useState<Channel | null>(null);

  if (!user) {
    return (
      <div
        style={{
          height: "calc(100vh - 8rem)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--ft-steel)",
        }}
      >
        <span className="mono" style={{ fontSize: 10, letterSpacing: "0.12em" }}>
          LOADING…
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        height: "calc(100vh - 8rem)",
        background: "var(--ft-paper)",
        border: "1px solid var(--ft-rule)",
        borderRadius: 4,
        overflow: "hidden",
        minHeight: 0,
      }}
    >
      <ChannelRail
        channels={channels}
        members={members}
        currentUserId={user.id}
        activeChannelId={activeChannel?.id ?? null}
        onlineUserIds={onlineUserIds}
        onSelect={selectChannel}
        onCreateDM={async (otherUserId) => {
          await createChannel({
            type: "direct",
            participants: [otherUserId],
          });
        }}
        onCreateGroup={async (name, participants) => {
          await createChannel({ type: "group", name, participants });
        }}
        onManageGroup={(channel) => setManagingChannel(channel)}
        onDeleteGroup={async (channel) => {
          await deleteChannel(channel.id);
        }}
      />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          minHeight: 0,
        }}
      >
        {activeChannel ? (
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
              flexDirection: "column",
              gap: 8,
              background: "var(--ft-paper-2)",
              color: "var(--ft-steel)",
              padding: 32,
              textAlign: "center",
            }}
          >
            <div
              className="mono"
              style={{ fontSize: 10, letterSpacing: "0.12em" }}
            >
              {loading ? "LOADING" : "NOTHING SELECTED"}
            </div>
            <div style={{ fontSize: 14, maxWidth: 360 }}>
              {loading
                ? "Opening messages…"
                : "Pick a channel on the left, or start a direct message."}
            </div>
          </div>
        )}
      </div>

      {managingChannel && (
        <ManageGroupDialog
          channel={managingChannel}
          members={members}
          currentUserId={user.id}
          onClose={() => setManagingChannel(null)}
          onUpdate={async (updates) => {
            await updateChannel({ channelId: managingChannel.id, ...updates });
          }}
          onDelete={async () => {
            await deleteChannel(managingChannel.id);
          }}
        />
      )}
    </div>
  );
}
