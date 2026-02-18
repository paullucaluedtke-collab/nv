"use client";

import { useState, useCallback } from "react";

export type ToastVariant = "success" | "error" | "info";

export interface Toast {
    id: string;
    message: string;
    variant: ToastVariant;
}

export function useToast() {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback(
        (message: string, variant: ToastVariant = "success") => {
            const id =
                typeof crypto !== "undefined" && "randomUUID" in crypto
                    ? crypto.randomUUID()
                    : Math.random().toString(36).slice(2);

            const toast: Toast = { id, message, variant };
            setToasts((prev) => [...prev, toast]);

            // auto-dismiss after 3 seconds
            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== id));
            }, 3000);
        },
        []
    );

    return { toasts, showToast };
}
