"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";

interface AmbientBackgroundProps {
  className?: string;
  particleCount?: number;
}

/**
 * AmbientBackground: Creates slow, high-variance ambient motion (12s - 20s cycles)
 * with a shifting gradient mesh that contrasts with snappy micro-interactions.
 */
export function AmbientBackground({
  className = "",
}: AmbientBackgroundProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <div
        className={`absolute inset-0 pointer-events-none overflow-hidden opacity-30 ${className}`}
        aria-hidden="true"
      >
        <div
          className="absolute -top-[20%] -right-[15%] w-[450px] h-[450px] rounded-full filter blur-[20px]"
          style={{ background: "radial-gradient(circle, #c8dfdb 0%, transparent 70%)" }}
        />
      </div>
    );
  }

  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-hidden select-none z-0 ${className}`}
      aria-hidden="true"
    >
      {/* Slow Shifting Gradient Mesh with GPU-accelerated transforms */}
      <motion.div
        className="absolute -top-[20%] -right-[10%] w-[550px] h-[550px] rounded-full opacity-45 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(200, 223, 219, 0.85) 0%, rgba(102, 163, 191, 0.4) 50%, transparent 75%)",
          filter: "blur(20px)",
          willChange: "transform",
          transform: "translate3d(0,0,0)",
          backfaceVisibility: "hidden",
        }}
        animate={{
          scale: [1, 1.12, 0.96, 1],
          x: [0, 25, -20, 0],
          y: [0, -35, 15, 0],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute -bottom-[25%] -left-[10%] w-[480px] h-[480px] rounded-full opacity-35 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(102, 163, 191, 0.5) 0%, rgba(51, 104, 160, 0.25) 50%, transparent 75%)",
          filter: "blur(20px)",
          willChange: "transform",
          transform: "translate3d(0,0,0)",
          backfaceVisibility: "hidden",
        }}
        animate={{
          scale: [1, 0.92, 1.1, 1],
          x: [0, -25, 20, 0],
          y: [0, 25, -15, 0],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}

/**
 * GlobalAmbientFlow: Full-viewport, fixed background that gives every page
 * an organic, tranquil, swimmy aquatic atmosphere while keeping the text
 * crisp and contrast high. GPU-isolated to prevent compositor flickering.
 */
export function GlobalAmbientFlow() {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden select-none -z-10"
      aria-hidden="true"
      style={{ zIndex: -1 }}
    >
      {/* Upper-right tranquil water swell */}
      <motion.div
        className="absolute -top-[15%] right-[-10%] w-[680px] h-[680px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(200, 223, 219, 0.5) 0%, rgba(102, 163, 191, 0.22) 50%, transparent 75%)",
          filter: "blur(24px)",
          willChange: "transform",
          transform: "translate3d(0,0,0)",
          backfaceVisibility: "hidden",
        }}
        animate={{
          x: [0, 45, -35, 0],
          y: [0, -50, 30, 0],
          scale: [1, 1.1, 0.95, 1],
        }}
        transition={{
          duration: 26,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Lower-left deep calm ocean current */}
      <motion.div
        className="absolute bottom-[-15%] -left-[10%] w-[720px] h-[720px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(102, 163, 191, 0.35) 0%, rgba(36, 101, 99, 0.16) 55%, transparent 80%)",
          filter: "blur(24px)",
          willChange: "transform",
          transform: "translate3d(0,0,0)",
          backfaceVisibility: "hidden",
        }}
        animate={{
          x: [0, -40, 35, 0],
          y: [0, 40, -30, 0],
          scale: [1, 0.94, 1.08, 1],
        }}
        transition={{
          duration: 32,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Mid-screen floating luminous tide */}
      <motion.div
        className="absolute top-[35%] left-[25%] w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(215, 236, 232, 0.4) 0%, rgba(102, 163, 191, 0.14) 60%, transparent 80%)",
          filter: "blur(24px)",
          willChange: "transform",
          transform: "translate3d(0,0,0)",
          backfaceVisibility: "hidden",
        }}
        animate={{
          x: [0, 60, -40, 0],
          y: [0, -40, 50, 0],
          scale: [0.96, 1.1, 0.96],
        }}
        transition={{
          duration: 28,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}
