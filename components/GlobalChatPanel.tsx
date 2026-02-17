"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import type { UserProfile } from "@/lib/userProfileRepository";
import type { GlobalMessage } from "@/types/globalMessage";
import {
  fetchGlobalMessages,
  fetchNewGlobalMessages,
  sendGlobalMessage,
} from "@/lib/globalChatRepository";
import { supabase } from "@/lib/supabaseClient";

type Props = {
  userId: string;
  userProfile: UserProfile | null;
  dense?: boolean; // for mobile bottom sheet
};

export default function GlobalChatPanel({ userId, userProfile, dense = false }: Props) {
  const [messages, setMessages] = useState<GlobalMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [lastTimestamp, setLastTimestamp] = useState<string | null>(null);
  const [profileImages, setProfileImages] = useState<Record<string, string | null>>({});
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const displayName = userProfile?.displayName ?? "Gast";
  const displayImageUrl = userProfile?.profileImageUrl ?? null;
  const initials = displayName.trim()[0]?.toUpperCase() ?? "G";

  // Initial load
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchGlobalMessages();
        if (!mounted) return;
        setMessages(data);
        setLastTimestamp(data.length > 0 ? data[data.length - 1].createdAt : new Date().toISOString());
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.message || "Global Chat konnte nicht geladen werden.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Fetch profile images for message authors (missing ones only)
  useEffect(() => {
    const fetchMissing = async () => {
      const missingUserIds = Array.from(
        new Set(
          messages
            .map((m) => m.userId)
            .filter((id) => !!id && profileImages[id] === undefined)
        )
      );
      if (missingUserIds.length === 0) return;
      const { data, error } = await supabase
        .from("user_profiles")
        .select("user_id, profile_image_url")
        .in("user_id", missingUserIds);
      if (error) {
        console.warn("[GlobalChatPanel] profile image fetch error", error);
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

  // Polling
  useEffect(() => {
    if (!lastTimestamp) return;
    const interval = setInterval(async () => {
      try {
        const newer = await fetchNewGlobalMessages(lastTimestamp);
        if (newer.length === 0) return;
        setMessages((prev) => {
          const ids = new Set(prev.map((m) => m.id));
          const filtered = newer.filter((m) => !ids.has(m.id));
          return filtered.length ? [...prev, ...filtered] : prev;
        });
        setLastTimestamp(newer[newer.length - 1].createdAt);
      } catch (err) {
        // keep silent to avoid UI spam
      }
    }, 2500);
    return () => clearInterval(interval);
  }, [lastTimestamp]);

  const handleSend = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (sending) return;
      const trimmed = text.trim();
      if (!trimmed) return;

      setSending(true);
      setError(null);
      try {
        const msg = await sendGlobalMessage({
          userId,
          userName: displayName,
          userEmoji: "",
          content: trimmed,
          imageUrl: null, // Bilder sind im GlobalChat nicht erlaubt
        });
        setMessages((prev) => [...prev, msg]);
        setLastTimestamp(msg.createdAt);
        setText("");
      } catch (err: any) {
        setError(err?.message || "Nachricht konnte nicht gesendet werden.");
      } finally {
        setSending(false);
      }
    },
    [sending, text, userId, displayName]
  );

  return (
    <div
      className={clsx(
        dense
          ? "flex flex-col h-full bg-transparent"
          : "flex flex-col rounded-3xl border border-white/10 bg-void-card/90 backdrop-blur-xl text-white shadow-[0_0_30px_rgba(0,0,0,0.5)] mt-4"
      )}
    >
      <div className="flex items-center justify-between px-3 py-3 border-b border-white/10 bg-white/2">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-[0.14em] text-brand-light font-bold">Global Chat</span>
          <span className="text-xs font-medium text-white/60">Alle Nutzer</span>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-white/5 border border-white/10 px-2 py-1 text-[11px]">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 overflow-hidden border border-white/10">
            {displayImageUrl ? (
              <img src={displayImageUrl} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              <span className="text-[10px] font-medium text-white/80">{initials}</span>
            )}
          </div>
          <span className="truncate max-w-[80px] text-white/80">{displayName}</span>
        </div>
      </div>

      <div
        className="max-h-64 min-h-[140px] overflow-y-auto px-3 py-3 space-y-3 text-[13px] custom-scrollbar"
        role="log"
        aria-label="Global Chat Nachrichten"
      >
        {loading && (
          <div className="text-xs text-white/60 flex items-center gap-2" role="status">
            <div className="h-4 w-4 border-2 border-white/10 border-t-brand rounded-full animate-spin" />
            <span>Lade Nachrichten…</span>
          </div>
        )}
        {error && !loading && (
          <div className="text-xs text-red-200 bg-red-500/10 border border-red-400/40 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
        {!loading && messages.length === 0 && (
          <div className="text-xs text-white/40 italic px-2">Noch keine Nachrichten – sag als Erste*r hallo!</div>
        )}

        {messages.map((msg) => {
          const avatarUrl = profileImages[msg.userId] ?? null;
          return (
            <div key={msg.id} className="flex gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 border border-white/10 overflow-hidden flex-shrink-0">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={msg.userName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-semibold text-white/60">{msg.userName?.[0]?.toUpperCase() ?? "?"}</span>
                )}
              </div>
              <div className="flex-1 space-y-0.5">
                <div className="flex items-center gap-2 text-[11px] text-white/50">
                  <span className="font-semibold text-brand-light">{msg.userName}</span>
                  <span>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                {msg.content && <p className="text-sm leading-relaxed text-white/90 font-medium">{msg.content}</p>}
                {msg.imageUrl && (
                  <div className="rounded-xl overflow-hidden border border-white/10 bg-black/30 max-w-[200px] mt-1">
                    <img src={msg.imageUrl} alt="Anhang" className="w-full h-auto object-cover" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="border-t border-white/10 px-3 py-2 bg-white/2">
        <div className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1 rounded-full bg-white/5 px-4 py-2 text-sm text-white border border-white/10 focus:border-brand/50 focus:bg-white/10 focus:outline-none transition-all placeholder:text-white/30"
            placeholder="Nachricht schreiben…"
          />
          <button
            type="submit"
            disabled={sending || !text.trim()}
            className={clsx(
              "rounded-full px-4 py-2 text-sm font-bold transition-all shadow-md",
              sending || !text.trim()
                ? "bg-white/10 text-white/30 cursor-not-allowed border border-white/5"
                : "bg-gradient-to-r from-brand to-brand-light text-white hover:shadow-brand/30 hover:scale-105 active:scale-95 border border-brand/30"
            )}
            aria-label="Senden"
          >
            {sending ? "..." : "Senden"}
          </button>
        </div>
      </form>
    </div>
  );
}


