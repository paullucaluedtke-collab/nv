"use client";

import React from "react";

const BackgroundGlow = () => {
    return (
        <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-void">
            {/* Top Center Nebula */}
            <div
                className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[80vw] h-[60vh] rounded-[100%] bg-electric/10 blur-[100px] opacity-60 animate-pulse-soft"
                style={{ animationDuration: '8s' }}
            />

            {/* Bottom Right Glow */}
            <div
                className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[50vh] rounded-full bg-neon-purple/10 blur-[90px] opacity-40 animate-float"
                style={{ animationDuration: '10s' }}
            />

            {/* Bottom Left Glow */}
            <div
                className="absolute bottom-[10%] left-[-10%] w-[50vw] h-[50vh] rounded-full bg-neon-cyan/5 blur-[80px] opacity-30 animate-pulse-soft"
                style={{ animationDuration: '12s', animationDelay: '2s' }}
            />

            {/* Texture Overlay - Disabled (missing asset) */}
            {/* <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] mix-blend-overlay"></div> */}
        </div>
    );
};

export default BackgroundGlow;
