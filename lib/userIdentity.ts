import { STORAGE_KEYS } from "./storageKeys";

export const USER_ID_STORAGE_KEY = STORAGE_KEYS.USER_ID;

export function getOrCreateUserId(): string {
  if (typeof window === "undefined") {
    return "ssr-user";
  }

  const existing = window.localStorage.getItem(USER_ID_STORAGE_KEY);
  if (existing && typeof existing === "string") {
    return existing;
  }

  const newId =
    (window.crypto?.randomUUID?.() as string | undefined) ??
    `user_${Math.random().toString(36).slice(2)}_${Date.now()}`;

  window.localStorage.setItem(USER_ID_STORAGE_KEY, newId);
  return newId;
}


