import { supabase } from "./supabaseClient";
import type { GlobalMessage } from "@/types/globalMessage";
import { createActivityLog } from "./activityLogRepository";

const TABLE = "global_messages";
const BUCKET = "global-chat-images";

function mapRow(row: any): GlobalMessage {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    userEmoji: row.user_emoji,
    content: row.content ?? null,
    imageUrl: row.image_url ?? null,
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

export async function fetchGlobalMessages(): Promise<GlobalMessage[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[globalChatRepository] fetchGlobalMessages error", error);
    const errObj = new Error(error.message || "Failed to fetch messages");
    (errObj as any).error = error;
    throw errObj;
  }

  return (data ?? []).map(mapRow);
}

export async function fetchNewGlobalMessages(sinceIso: string): Promise<GlobalMessage[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .gt("created_at", sinceIso)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[globalChatRepository] fetchNewGlobalMessages error", error);
    throw error;
  }

  return (data ?? []).map(mapRow);
}

type SendInput = {
  userId: string;
  userName: string;
  userEmoji: string;
  content: string | null;
  imageUrl?: string | null;
};

export async function sendGlobalMessage(input: SendInput): Promise<GlobalMessage> {
  const payload = {
    user_id: input.userId,
    user_name: input.userName,
    user_emoji: input.userEmoji,
    content: input.content,
    image_url: input.imageUrl ?? null,
  };

  const { data, error } = await supabase
    .from(TABLE)
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error("[globalChatRepository] sendGlobalMessage error", error);
    const errObj = new Error(error.message || "Failed to send message");
    (errObj as any).error = error;
    throw errObj;
  }

  const message = mapRow(data);

  // Log global chat message
  createActivityLog({
    userId: input.userId,
    userName: input.userName,
    activityType: "CHAT_MESSAGE_SENT",
    metadata: {
      chatType: "global",
      hasContent: !!input.content,
      hasImage: !!input.imageUrl,
      contentLength: input.content?.length ?? 0,
    },
  }).catch((err) => {
    console.warn("[globalChatRepository] Failed to log global chat message", err);
  });

  return message;
}

export async function uploadGlobalChatImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

  const { data, error } = await supabase.storage.from(BUCKET).upload(fileName, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    console.error("[globalChatRepository] uploadGlobalChatImage error", error);
    throw error;
  }

  const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
  return publicUrlData.publicUrl;
}

export function subscribeToGlobalMessages(onInsert: (message: GlobalMessage) => void) {
  const channel = supabase
    .channel(`global-messages`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: TABLE,
      },
      (payload) => {
        if (!payload.new) return;
        onInsert(mapRow(payload.new));
      }
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}



