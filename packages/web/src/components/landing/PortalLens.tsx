"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface PortalLensProps {
  baseImage: string;
  revealImage: string;
  lensSize?: number;
}

export function PortalLens({
  baseImage,
  revealImage,
  lensSize = 280,
}: PortalLensProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const revealRef = useRef<HTMLDivElement>(null);
  const lensRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const posRef = useRef({ x: -1000, y: -1000 });

  const [isHovering, setIsHovering] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    setIsTouchDevice(
      "ontouchstart" in window || navigator.maxTouchPoints > 0
    );
  }, []);

  const activeLensSize = isTouchDevice ? lensSize * 1.3 : lensSize;

  // Direct DOM manipulation for zero-lag cursor tracking
  const updateLensPosition = useCallback(() => {
    const { x, y } = posRef.current;
    const half = activeLensSize / 2;

    if (revealRef.current) {
      revealRef.current.style.clipPath = `circle(${half}px at ${x}px ${y}px)`;
    }
    if (lensRef.current) {
      lensRef.current.style.left = `${x - half}px`;
      lensRef.current.style.top = `${y - half}px`;
    }

    rafRef.current = null;
  }, [activeLensSize]);

  const scheduleUpdate = useCallback(
    (x: number, y: number) => {
      posRef.current = { x, y };
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(updateLensPosition);
      }
    },
    [updateLensPosition]
  );

  // Mouse handlers
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    scheduleUpdate(e.clientX - rect.left, e.clientY - rect.top);
  };

  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => {
    setIsHovering(false);
    scheduleUpdate(-1000, -1000);
  };

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    setIsHovering(true);
    const touch = e.touches[0];
    const rect = containerRef.current.getBoundingClientRect();
    scheduleUpdate(touch.clientX - rect.left, touch.clientY - rect.top);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const touch = e.touches[0];
    const rect = containerRef.current.getBoundingClientRect();
    scheduleUpdate(touch.clientX - rect.left, touch.clientY - rect.top);
  };

  const handleTouchEnd = () => {
    setIsHovering(false);
    scheduleUpdate(-1000, -1000);
  };

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden cursor-none group touch-none"
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Base Image - Finished House */}
      <img
        src={baseImage}
        alt="Finished project"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Overlay gradient for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

      {/* Reveal Layer - Construction (clipped by lens) */}
      <div
        ref={revealRef}
        className="absolute inset-0"
        style={{
          opacity: isHovering ? 1 : 0,
          transition: "opacity 0.3s",
          clipPath: `circle(${activeLensSize / 2}px at -1000px -1000px)`,
        }}
      >
        <img
          src={revealImage}
          alt="Under construction"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-amber-500/10 mix-blend-overlay pointer-events-none" />
      </div>

      {/* Lens Border Ring — positioned via ref for zero lag */}
      <div
        ref={lensRef}
        className="absolute pointer-events-none"
        style={{
          width: activeLensSize,
          height: activeLensSize,
          opacity: isHovering ? 1 : 0,
          transition: "opacity 0.2s",
          left: -1000,
          top: -1000,
        }}
      >
        {/* Outer glow */}
        <div className="absolute inset-0 rounded-full bg-yellow-400/20 blur-xl scale-125" />

        {/* Glass lens border */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `
              radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3) 0%, transparent 50%),
              linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%)
            `,
            boxShadow: `
              0 0 0 3px rgba(0, 86, 210, 0.6),
              0 0 0 6px rgba(0, 86, 210, 0.25),
              0 0 30px rgba(0, 86, 210, 0.3),
              inset 0 0 20px rgba(255, 255, 255, 0.1)
            `,
          }}
        />

        {/* Inner highlight */}
        <div
          className="absolute inset-2 rounded-full opacity-50"
          style={{
            background: `radial-gradient(circle at 70% 70%, transparent 50%, rgba(255,255,255,0.05) 100%)`,
          }}
        />
      </div>

      {/* Hint text */}
      <div
        className={`absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/60 backdrop-blur-sm rounded-full text-white text-sm font-medium transition-all duration-500 ${
          isHovering ? "opacity-0 translate-y-4" : "opacity-100"
        }`}
      >
        <span className="flex items-center gap-2">
          {isTouchDevice ? (
            <>
              <svg
                className="w-4 h-4 animate-pulse"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11"
                />
              </svg>
              Touch & drag to see the build process
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4 animate-pulse"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              Hover to see the build process
            </>
          )}
        </span>
      </div>

      {/* "During Construction" label when hovering */}
      <div
        className={`absolute top-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-[#FFDD00] text-black rounded-full text-sm font-bold transition-all duration-300 ${
          isHovering ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
        }`}
      >
        During Construction
      </div>
    </div>
  );
}
