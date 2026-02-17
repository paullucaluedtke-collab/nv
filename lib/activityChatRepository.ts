// lib/activityChatRepository.ts
import { supabase } from "./supabaseClient";
import type { ActivityMessage } from "@/types/activityMessage";
import { createActivityLog } from "./activityLogRepository";

const TABLE = "activity_messages";
const BUCKET = "activity-chat-images";

function mapRowToMessage(row: any): ActivityMessage {
  return {
    id: row.id,
    activityId: row.activity_id,
    userId: row.user_id,
    userName: row.user_name,
    userEmoji: row.user_emoji,
    content: row.content ?? null,
    imageUrl: row.image_url ?? null,
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

export async function fetchActivityMessages(
  activityId: string
): Promise<ActivityMessage[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("activity_id", activityId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[activityChatRepository] fetchActivityMessages error", error);
    // Create an error object with the message for better UI handling
    const errorObj = new Error(error.message || "Failed to fetch messages");
    (errorObj as any).error = error;
    throw errorObj;
  }

  return (data ?? []).map(mapRowToMessage);
}

// NEW: fetch only messages created after a certain timestamp
export async function fetchNewActivityMessages(
  activityId: string,
  sinceIso: string
): Promise<ActivityMessage[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("activity_id", activityId)
    .gt("created_at", sinceIso)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[activityChatRepository] fetchNewActivityMessages error", error);
    throw error;
  }

  return (data ?? []).map(mapRowToMessage);
}

type SendMessageInput = {
  activityId: string;
  userId: string;
  userName: string;
  userEmoji: string;
  content: string | null;
  imageUrl?: string | null;
};

export async function sendActivityMessage(
  input: SendMessageInput
): Promise<ActivityMessage> {
  const payload = {
    activity_id: input.activityId,
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
    console.error("[activityChatRepository] sendActivityMessage error", error);
    // Create an error object with the message for better UI handling
    const errorObj = new Error(error.message || "Failed to send message");
    (errorObj as any).error = error;
    throw errorObj;
  }

  const message = mapRowToMessage(data);

  // Log chat message
  createActivityLog({
    userId: input.userId,
    userName: input.userName,
    activityType: "CHAT_MESSAGE_SENT",
    activityId: input.activityId,
    metadata: {
      hasContent: !!input.content,
      hasImage: !!input.imageUrl,
      contentLength: input.content?.length ?? 0,
    },
  }).catch((err) => {
    console.warn("[activityChatRepository] Failed to log chat message", err);
  });

  return message;
}

export async function uploadChatImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const fileName = `${Date.now()}_${Math.random()
    .toString(36)
    .slice(2)}.${ext}`;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("[activityChatRepository] uploadChatImage error", error);
    throw error;
  }

  const { data: publicUrlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(data.path);

  return publicUrlData.publicUrl;
}

export function subscribeToActivityMessages(
  activityId: string,
  onInsert: (message: ActivityMessage) => void
) {
  const channel = supabase
    .channel(`activity-messages:${activityId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: TABLE,
        filter: `activity_id=eq.${activityId}`,
      },
      (payload) => {
        if (!payload.new) return;
        const message = {
          id: payload.new.id,
          activityId: payload.new.activity_id,
          userId: payload.new.user_id,
          userName: payload.new.user_name,
          userEmoji: payload.new.user_emoji,
          content: payload.new.content ?? null,
          imageUrl: payload.new.image_url ?? null,
          createdAt: payload.new.created_at ?? new Date().toISOString(),
        } satisfies ActivityMessage;

        onInsert(message);
      }
    )
    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        // optional: console.log for debugging
        // console.log("[activityChatRepository] Realtime subscribed for", activityId);
      }
    });

  return () => {
    supabase.removeChannel(channel);
  };
}

