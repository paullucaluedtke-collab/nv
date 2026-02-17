"use client";

import { useEffect } from "react";
import clsx from "clsx";
import { motion, AnimatePresence, PanInfo, useAnimation } from "framer-motion";

type Props = {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    className?: string;
    height?: "default" | "full" | "auto"; // Default ~70%, Full ~95%, Auto = content
    hasCloseButton?: boolean;
};

export default function GlassSheet({
    isOpen,
    onClose,
    title,
    children,
    className,
    height = "default",
    hasCloseButton = true,
}: Props) {
    const controls = useAnimation();

    // Handle drag to dismiss
    const onDragEnd = async (
        event: MouseEvent | TouchEvent | PointerEvent,
        info: PanInfo
    ) => {
        // If dragged down significantly or fast
        if (info.offset.y > 100 || info.velocity.y > 500) {
            await controls.start({ y: "100%" });
            onClose();
        } else {
            // Snap back
            controls.start({ y: 0 });
        }
    };

    useEffect(() => {
        if (isOpen) {
            controls.start({ y: 0 });
        }
    }, [isOpen, controls]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop - blurred */}
                    <motion.div
                        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        aria-hidden="true"
                    />

                    {/* Sheet */}
                    <motion.div
                        className={clsx(
                            "fixed bottom-0 left-0 right-0 z-50 md:hidden",
                            "flex flex-col",
                            "bg-void-card/95 backdrop-blur-2xl",
                            "rounded-t-[32px] border-t border-white/10",
                            "shadow-[0_-8px_30px_rgba(0,0,0,0.6)]",
                            height === "full" ? "h-[95vh]" : height === "auto" ? "max-h-[90vh] h-auto" : "h-[75vh]", // default 75%
                            className
                        )}
                        initial={{ y: "100%" }}
                        animate={controls}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        drag="y"
                        dragConstraints={{ top: 0 }}
                        dragElastic={0.05} // Subtle overscroll at top
                        onDragEnd={onDragEnd}
                        role="dialog"
                        aria-modal="true"
                        aria-label={title || "Panel"}
                    >
                        {/* Drag Handle & Header */}
                        <div className="flex-shrink-0 relative pt-3 pb-2 px-6">
                            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/20 rounded-full" />

                            <div className="flex items-center justify-between mt-4">
                                {title && (
                                    <h2 className="text-lg font-bold text-white tracking-wide glow-text line-clamp-1">
                                        {title}
                                    </h2>
                                )}
                                {hasCloseButton && (
                                    <button
                                        onClick={onClose}
                                        className="ml-auto p-2 -mr-2 text-white/50 hover:text-white rounded-full bg-transparent"
                                        aria-label="Schließen"
                                    >
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Content Area - Scrollable */}
                        <div className="flex-1 overflow-y-auto px-6 pb-safe-offset min-h-0 custom-scrollbar">
                            {children}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
