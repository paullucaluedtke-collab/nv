// components/ActivityChatPanel.tsx
"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import clsx from "clsx";
import type { ActivityMessage } from "@/types/activityMessage";
import type { UserProfile } from "@/lib/userProfileRepository";
import {
  fetchActivityMessages,
  fetchNewActivityMessages,
  sendActivityMessage,
  uploadChatImage,
} from "@/lib/activityChatRepository";
import { supabase } from "@/lib/supabaseClient";

type Props = {
  activityId: string;
  activityTitle: string;
  userId: string;
  userProfile: UserProfile | null;
  isClosed?: boolean;
};

export default function ActivityChatPanel({
  activityId,
  activityTitle,
  userId,
  userProfile,
  isClosed,
}: Props) {
  const [messages, setMessages] = useState<ActivityMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastTimestamp, setLastTimestamp] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [profileImages, setProfileImages] = useState<Record<string, string | null>>({});

  const displayName = userProfile?.displayName ?? "Guest";
  const displayImageUrl = userProfile?.profileImageUrl ?? null;
  const initials = displayName.trim()[0]?.toUpperCase() ?? "G";

  // Load messages whenever activityId changes
  useEffect(() => {
    let isMounted = true;

    // Reset lastTimestamp when activity changes
    setLastTimestamp(null);

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchActivityMessages(activityId);
        if (!isMounted) return;
        setMessages(data);
        if (data.length > 0) {
          setLastTimestamp(data[data.length - 1].createdAt);
        } else {
          // No messages yet: use "now" as baseline so future messages are picked up
          setLastTimestamp(new Date().toISOString());
        }
      } catch (err: any) {
        console.error("[ActivityChatPanel] load error", err);
        if (isMounted) {
          const message =
            err?.message ||
            err?.error_description ||
            err?.error?.message ||
            "Nachrichten konnten nicht geladen werden.";
          setError(message);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [activityId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

  // Fetch profile images for message authors (missing only)
  useEffect(() => {
    const fetchMissing = async () => {
      const missing = Array.from(
        new Set(
          messages
            .map((m) => m.userId)
            .filter((id) => !!id && profileImages[id] === undefined)
        )
      );
      if (missing.length === 0) return;
      const { data, error } = await supabase
        .from("user_profiles")
        .select("user_id, profile_image_url")
        .in("user_id", missing);
      if (error) {
        console.warn("[ActivityChatPanel] profile image fetch error", error);
        return;
      }
      setProfileImages((prev) => {
        const next = { ...prev };
        data?.forEach((row) => {
          next[row.user_id] = row.profile_image_url ?? null;
        });
        return next;
      });
    };
    fetchMissing();
  }, [messages, profileImages]);

  // Polling for new messages
  useEffect(() => {
    if (!activityId) return;
    if (!lastTimestamp) return;

    const interval = setInterval(async () => {
      try {
        const newMessages = await fetchNewActivityMessages(
          activityId,
          lastTimestamp
        );

        if (newMessages.length === 0) return;

        setMessages((prev) => {
          if (prev.length === 0) {
            return newMessages;
          }
          // avoid duplicates just in case
          const existingIds = new Set(prev.map((m) => m.id));
          const filtered = newMessages.filter((m) => !existingIds.has(m.id));
          if (filtered.length === 0) return prev;
          return [...prev, ...filtered];
        });

        // update lastTimestamp to latest message we just received
        const latest = newMessages[newMessages.length - 1];
        setLastTimestamp(latest.createdAt);
      } catch (err) {
        console.error("[ActivityChatPanel] polling error", err);
        // do not setError here to avoid spamming UI on transient failures
      }
    }, 2000); // 2 seconds

    return () => clearInterval(interval);
  }, [activityId, lastTimestamp]);

  const handlePickImage = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setImageFile(file);
      }
    },
    []
  );

  const handleSend = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (sending) return;
      const trimmed = text.trim();
      if (!trimmed && !imageFile) return;

      setSending(true);
      setError(null);

      try {
        let imageUrl: string | null = null;
        if (imageFile) {
          imageUrl = await uploadChatImage(imageFile);
        }

        const msg = await sendActivityMessage({
          activityId,
          userId,
          userName: displayName,
          userEmoji: "",
          content: trimmed || null,
          imageUrl,
        });

        setMessages((prev) => [...prev, msg]);
        setLastTimestamp(msg.createdAt);
        setText("");
        setImageFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } catch (err: any) {
        console.error("[ActivityChatPanel] send error", err);
        // Extract Supabase error message if available
        const message =
          err?.message ||
          err?.error_description ||
          err?.error?.message ||
          "Nachricht konnte nicht gesendet werden.";
        setError(message);
      } finally {
        setSending(false);
      }
    },
    [activityId, userId, displayName, text, imageFile, sending]
  );

  return (
    <div className="mt-4 flex flex-col rounded-3xl border border-white/10 bg-void-card/90 backdrop-blur-xl text-white shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent">
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase tracking-[0.14em] font-bold text-brand-light bg-brand/10 px-2 py-0.5 rounded-full border border-brand/20 shadow-[0_0_10px_rgba(41,121,255,0.2)]">
              Chat
            </span>
            {isClosed && (
              <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] font-semibold text-white/50 border border-white/10">
                Beendet
              </span>
            )}
          </div>
          <span className="text-sm font-bold truncate max-w-[220px] text-white">
            {activityTitle}
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-white/5 px-2.5 py-1.5 text-[11px] border border-white/10 ml-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-brand/20 to-brand-light/20 overflow-hidden border border-white/10">
            {displayImageUrl ? (
              <img
                src={displayImageUrl}
                alt={displayName}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-[10px] font-bold text-white">{initials}</span>
            )}
          </div>
          <span className="truncate max-w-[90px] font-medium text-white/80">{displayName}</span>
        </div>
      </div>

      {/* Messages */}
      <div
        className="max-h-80 min-h-[160px] overflow-y-auto px-4 py-4 space-y-3 text-[13px] custom-scrollbar bg-transparent"
        role="log"
        aria-label="Chat-Nachrichten"
        aria-live="polite"
        aria-atomic="false"
      >
        {loading && (
          <div className="text-xs text-white/60 flex items-center gap-2" role="status">
            <div className="h-4 w-4 border-2 border-white/10 border-t-brand rounded-full animate-spin" />
            <span>Lade Nachrichten…</span>
          </div>
        )}
        {!loading && messages.length === 0 && (
          <div className="text-xs text-white/40 text-center py-4 italic">
            Noch keine Nachrichten – sag mal hallo.
          </div>
        )}
        {messages.map((m) => {
          const isMine = m.userId === userId;
          const avatarUrl = profileImages[m.userId] ?? null;
          return (
            <div
              key={m.id}
              className={clsx(
                "flex w-full",
                isMine ? "justify-end" : "justify-start"
              )}
            >
              <div className={clsx("flex gap-2 w-full", isMine ? "flex-row-reverse" : "flex-row")}>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-white/10 to-white/5 overflow-hidden flex-shrink-0 border border-white/10">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={m.userName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-bold text-white/60">
                      {m.userName?.[0]?.toUpperCase() ?? "?"}
                    </span>
                  )}
                </div>
                <div
                  className={clsx(
                    "max-w-[80%] rounded-2xl px-4 py-3 text-[12px] leading-relaxed shadow-lg transition-all duration-200",
                    isMine
                      ? "bg-gradient-to-br from-brand to-brand-light text-white rounded-br-sm shadow-brand/20"
                      : "bg-white/5 backdrop-blur-md text-white rounded-bl-sm border border-white/10"
                  )}
                >
                  <div
                    className={clsx(
                      "mb-1 flex items-center gap-1 text-[10px]",
                      isMine ? "text-white/80" : "text-white/50"
                    )}
                  >
                    <span className="font-semibold tracking-wide">{m.userName}</span>
                    <span className="opacity-60">
                      ·{" "}
                      {new Date(m.createdAt).toLocaleTimeString("de-DE", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  {m.content && (
                    <div className="whitespace-pre-wrap break-words font-medium">
                      {m.content}
                    </div>
                  )}
                  {m.imageUrl && (
                    <div className="mt-2">
                      <a
                        href={m.imageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="block overflow-hidden rounded-xl border border-white/10 bg-black/40"
                      >
                        <img
                          src={m.imageUrl}
                          alt="Attachment"
                          className="w-full max-h-48 object-cover opacity-90 hover:opacity-100 transition-opacity"
                        />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="px-3 pb-1 text-[11px] text-red-400" role="alert">
          {error}
        </div>
      )}

      {/* Image preview */}
      {imageFile && (
        <div className="px-3 pb-2 text-[11px] text-white/70 flex items-center gap-2 bg-white/5 mx-3 rounded-lg border border-white/5">
          <span className="text-brand">📎</span>
          <span className="truncate max-w-[140px] opacity-80">
            {imageFile.name}
          </span>
          <button
            type="button"
            onClick={() => setImageFile(null)}
            className="ml-auto p-1 text-white/40 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="flex items-center gap-2 border-t border-white/10 px-4 py-3 bg-white/2"
      >
        <button
          type="button"
          onClick={handlePickImage}
          aria-label="Bild anhängen"
          className={clsx(
            "flex h-9 w-9 items-center justify-center rounded-full border text-[16px] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand/50",
            imageFile
              ? "bg-brand text-white border-brand/50 shadow-[0_0_10px_rgba(41,121,255,0.4)]"
              : "bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20 text-white/60 hover:text-white"
          )}
          title="Bild anhängen"
        >
          📎
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          aria-label="Bild auswählen"
        />
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={
            imageFile ? "Kommentar hinzufügen…" : "Nachricht schreiben…"
          }
          aria-label="Nachricht eingeben"
          className="flex-1 rounded-full bg-white/5 px-4 py-2.5 text-[13px] text-white outline-none placeholder:text-white/30 focus:ring-1 focus:ring-brand/50 focus:bg-white/10 border border-white/10 transition-all duration-200"
        />
        <button
          type="submit"
          disabled={sending || (!text.trim() && !imageFile)}
          aria-label={sending ? "Nachricht wird gesendet" : "Nachricht senden"}
          className={clsx(
            "rounded-full px-4 py-2 text-[12px] font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand/50 shadow-lg",
            sending || (!text.trim() && !imageFile)
              ? "bg-white/5 text-white/20 cursor-not-allowed border border-white/5"
              : "bg-gradient-to-r from-brand to-brand-light text-white hover:shadow-[0_0_15px_rgba(41,121,255,0.4)] hover:scale-105 active:scale-95 border border-brand/30"
          )}
        >
          {sending ? "..." : "Senden"}
        </button>
      </form>
    </div>
  );
}

