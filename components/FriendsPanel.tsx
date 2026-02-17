"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { X, UserPlus, Check, X as XIcon, Loader2, Search, Plus } from "lucide-react";
import type { FriendWithProfile } from "@/types/friend";

type FriendsPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
};

type Tab = "friends" | "requests" | "sent";

export default function FriendsPanel({
  isOpen,
  onClose,
  userId,
}: FriendsPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>("friends");
  const [friends, setFriends] = useState<FriendWithProfile[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendWithProfile[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendWithProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [friendSearchQuery, setFriendSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{
    userId: string;
    displayName: string;
    username: string | null;
    profileImageUrl: string | null;
  }>>([]);
  const [searching, setSearching] = useState(false);
  const [addingFriend, setAddingFriend] = useState(false);

  const loadData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [friendsRes, pendingRes, sentRes] = await Promise.all([
        fetch(`/api/friends/list?userId=${userId}`),
        fetch(`/api/friends/pending?userId=${userId}`),
        fetch(`/api/friends/sent?userId=${userId}`),
      ]);

      if (friendsRes.ok) {
        const data = await friendsRes.json();
        setFriends(data.friends || []);
      }
      if (pendingRes.ok) {
        const data = await pendingRes.json();
        setPendingRequests(data.requests || []);
      }
      if (sentRes.ok) {
        const data = await sentRes.json();
        setSentRequests(data.requests || []);
      }
    } catch (error) {
      console.error("Failed to load friends data", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, loadData]);

  const handleAcceptRequest = async (friendId: string) => {
    setProcessingIds((prev) => new Set(prev).add(friendId));
    try {
      const response = await fetch("/api/friends/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, friendId }),
      });

      if (response.ok) {
        await loadData();
      } else {
        const data = await response.json();
        alert(data.error || "Fehler beim Akzeptieren");
      }
    } catch (error) {
      console.error("Failed to accept request", error);
      alert("Fehler beim Akzeptieren der Anfrage");
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(friendId);
        return next;
      });
    }
  };

  const handleRejectRequest = async (friendId: string) => {
    setProcessingIds((prev) => new Set(prev).add(friendId));
    try {
      const response = await fetch("/api/friends/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, friendId }),
      });

      if (response.ok) {
        await loadData();
      } else {
        const data = await response.json();
        alert(data.error || "Fehler beim Ablehnen");
      }
    } catch (error) {
      console.error("Failed to reject request", error);
      alert("Fehler beim Ablehnen der Anfrage");
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(friendId);
        return next;
      });
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (!confirm("Möchtest du diese Freundschaft wirklich entfernen?")) {
      return;
    }

    setProcessingIds((prev) => new Set(prev).add(friendId));
    try {
      const response = await fetch("/api/friends/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, friendId }),
      });

      if (response.ok) {
        await loadData();
      } else {
        const data = await response.json();
        alert(data.error || "Fehler beim Entfernen");
      }
    } catch (error) {
      console.error("Failed to remove friend", error);
      alert("Fehler beim Entfernen der Freundschaft");
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(friendId);
        return next;
      });
    }
  };

  const handleSearchUsers = async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        // Filter out current user and existing friends/requests
        const friendIds = new Set([
          ...friends.map((f) => (f.userId === userId ? f.friendId : f.userId)),
          ...pendingRequests.map((r) => r.userId),
          ...sentRequests.map((r) => r.friendId),
        ]);
        setSearchResults(
          (data.users || []).filter(
            (u: any) => u.userId !== userId && !friendIds.has(u.userId)
          )
        );
      }
    } catch (error) {
      console.error("Failed to search users", error);
    } finally {
      setSearching(false);
    }
  };

  const handleSendFriendRequest = async (friendId: string) => {
    if (friendId === userId) {
      alert("Du kannst dir nicht selbst eine Freundschaftsanfrage senden");
      return;
    }

    setAddingFriend(true);
    try {
      const response = await fetch("/api/friends/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, friendId }),
      });

      if (response.ok) {
        setFriendSearchQuery("");
        setSearchResults([]);
        setShowAddFriend(false);
        await loadData();
      } else {
        const data = await response.json();
        alert(data.error || "Fehler beim Senden der Anfrage");
      }
    } catch (error) {
      console.error("Failed to send friend request", error);
      alert("Fehler beim Senden der Anfrage");
    } finally {
      setAddingFriend(false);
    }
  };

  useEffect(() => {
    if (showAddFriend && friendSearchQuery) {
      const timeoutId = setTimeout(() => {
        handleSearchUsers(friendSearchQuery);
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
    }
  }, [friendSearchQuery, showAddFriend]);

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name.trim()[0]?.toUpperCase() ?? "?";
  };

  const filteredFriends = friends.filter((f) =>
    f.friendDisplayName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPending = pendingRequests.filter((f) =>
    f.friendDisplayName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSent = sentRequests.filter((f) =>
    f.friendDisplayName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end md:items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: "100%", scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: "100%", scale: 0.98 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className={clsx(
          "relative z-10 w-full",
          "md:mx-auto md:max-w-md md:rounded-3xl",
          "bg-black border-t md:border border-white/10",
          "shadow-[0_-8px_40px_rgba(0,0,0,0.5)] md:shadow-[0_18px_60px_rgba(0,0,0,0.35)]",
          "overflow-hidden",
          "max-h-[95vh] md:max-h-[90vh]",
          "flex flex-col"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/10 flex-shrink-0">
          <h2 className="text-base font-semibold text-white">Freunde</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Schließen"
            className="p-2 -mr-2 text-white/60 hover:text-white transition-colors rounded-full hover:bg-white/10 flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-4 pt-3 border-b border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab("friends")}
            className={clsx(
              "flex-1 py-2 text-sm font-medium transition-colors rounded-t-lg",
              activeTab === "friends"
                ? "text-white border-b-2 border-brand"
                : "text-white/60 hover:text-white/80"
            )}
          >
            Freunde ({friends.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("requests")}
            className={clsx(
              "flex-1 py-2 text-sm font-medium transition-colors rounded-t-lg relative",
              activeTab === "requests"
                ? "text-white border-b-2 border-brand"
                : "text-white/60 hover:text-white/80"
            )}
          >
            Anfragen
            {pendingRequests.length > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand text-white text-[10px] font-semibold">
                {pendingRequests.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("sent")}
            className={clsx(
              "flex-1 py-2 text-sm font-medium transition-colors rounded-t-lg",
              activeTab === "sent"
                ? "text-white border-b-2 border-brand"
                : "text-white/60 hover:text-white/80"
            )}
          >
            Gesendet ({sentRequests.length})
          </button>
        </div>

        {/* Add Friend / Search */}
        <div className="px-4 pt-3 space-y-2">
          {activeTab === "friends" && (
            <button
              type="button"
              onClick={() => setShowAddFriend(!showAddFriend)}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-brand/30 bg-brand/10 text-brand hover:bg-brand/20 transition-colors text-sm font-medium"
            >
              <Plus className="h-4 w-4" />
              Freund hinzufügen
            </button>
          )}
          {showAddFriend && (
            <div className="space-y-2 p-3 rounded-xl border border-white/10 bg-white/5">
              <label className="block text-xs font-medium text-white mb-2">
                Username oder Name suchen
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <input
                  type="text"
                  value={friendSearchQuery}
                  onChange={(e) => setFriendSearchQuery(e.target.value)}
                  placeholder="@username oder Name..."
                  className="w-full pl-10 pr-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 transition"
                />
                {searching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-white/40" />
                  </div>
                )}
              </div>
              {searchResults.length > 0 && (
                <div className="mt-2 space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                  {searchResults.map((user) => (
                    <button
                      key={user.userId}
                      type="button"
                      onClick={() => handleSendFriendRequest(user.userId)}
                      disabled={addingFriend}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                        {user.profileImageUrl ? (
                          <img
                            src={user.profileImageUrl}
                            alt={user.displayName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-medium">
                            {getInitials(user.displayName)}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {user.displayName}
                        </p>
                        {user.username && (
                          <p className="text-xs text-white/60 truncate">
                            @{user.username}
                          </p>
                        )}
                      </div>
                      {addingFriend ? (
                        <Loader2 className="h-4 w-4 animate-spin text-brand" />
                      ) : (
                        <UserPlus className="h-4 w-4 text-brand" />
                      )}
                    </button>
                  ))}
                </div>
              )}
              {friendSearchQuery.length >= 2 && !searching && searchResults.length === 0 && (
                <p className="text-xs text-white/60 text-center py-2">
                  Keine Benutzer gefunden
                </p>
              )}
            </div>
          )}
          {((activeTab === "friends" && friends.length > 0) ||
            (activeTab === "requests" && pendingRequests.length > 0) ||
            (activeTab === "sent" && sentRequests.length > 0)) && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Suchen..."
                className="w-full pl-10 pr-3 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 transition"
              />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar overscroll-contain">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-brand" />
            </div>
          ) : (
            <>
              {activeTab === "friends" && (
                <div className="p-4 space-y-2">
                  {filteredFriends.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-sm text-white/60">
                        {friends.length === 0
                          ? "Noch keine Freunde"
                          : "Keine Freunde gefunden"}
                      </p>
                    </div>
                  ) : (
                    filteredFriends.map((friend) => {
                      const friendId =
                        friend.userId === userId ? friend.friendId : friend.userId;
                      const isProcessing = processingIds.has(friendId);
                      return (
                        <div
                          key={friend.id}
                          className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                        >
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                            {friend.friendProfileImageUrl ? (
                              <img
                                src={friend.friendProfileImageUrl}
                                alt={friend.friendDisplayName || "Friend"}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-sm font-medium">
                                {getInitials(friend.friendDisplayName)}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                              {friend.friendDisplayName || "Unbekannt"}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveFriend(friendId)}
                            disabled={isProcessing}
                            className="flex-shrink-0 p-2 rounded-lg text-white/60 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                            aria-label="Freund entfernen"
                          >
                            {isProcessing ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <XIcon className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {activeTab === "requests" && (
                <div className="p-4 space-y-2">
                  {filteredPending.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-sm text-white/60">
                        {pendingRequests.length === 0
                          ? "Keine ausstehenden Anfragen"
                          : "Keine Anfragen gefunden"}
                      </p>
                    </div>
                  ) : (
                    filteredPending.map((request) => {
                      const isProcessing = processingIds.has(request.userId);
                      return (
                        <div
                          key={request.id}
                          className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                        >
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                            {request.friendProfileImageUrl ? (
                              <img
                                src={request.friendProfileImageUrl}
                                alt={request.friendDisplayName || "User"}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-sm font-medium">
                                {getInitials(request.friendDisplayName)}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                              {request.friendDisplayName || "Unbekannt"}
                            </p>
                            <p className="text-xs text-white/60">
                              Möchte dein Freund sein
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => handleAcceptRequest(request.userId)}
                              disabled={isProcessing}
                              className="p-2 rounded-lg bg-brand/20 text-brand hover:bg-brand/30 transition-colors disabled:opacity-50"
                              aria-label="Anfrage akzeptieren"
                            >
                              {isProcessing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRejectRequest(request.userId)}
                              disabled={isProcessing}
                              className="p-2 rounded-lg text-white/60 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                              aria-label="Anfrage ablehnen"
                            >
                              {isProcessing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <XIcon className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {activeTab === "sent" && (
                <div className="p-4 space-y-2">
                  {filteredSent.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-sm text-white/60">
                        {sentRequests.length === 0
                          ? "Keine gesendeten Anfragen"
                          : "Keine Anfragen gefunden"}
                      </p>
                    </div>
                  ) : (
                    filteredSent.map((request) => {
                      const isProcessing = processingIds.has(request.friendId);
                      return (
                        <div
                          key={request.id}
                          className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10"
                        >
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                            {request.friendProfileImageUrl ? (
                              <img
                                src={request.friendProfileImageUrl}
                                alt={request.friendDisplayName || "User"}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-sm font-medium">
                                {getInitials(request.friendDisplayName)}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                              {request.friendDisplayName || "Unbekannt"}
                            </p>
                            <p className="text-xs text-white/60">
                              Anfrage ausstehend
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRejectRequest(request.friendId)}
                            disabled={isProcessing}
                            className="flex-shrink-0 p-2 rounded-lg text-white/60 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                            aria-label="Anfrage zurückziehen"
                          >
                            {isProcessing ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <XIcon className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

