"use client";
import { useRef, useEffect } from "react";

const VideoHeroBg = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.75; // Slow down the video slightly
    }
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden z-0 opacity-90">
      {/* Video Background */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{ filter: "brightness(0.3) contrast(1.2)" }}
      >
        {/* You can add multiple video sources for different formats */}
        <source src="/videos/hero-bg.mp4" type="video/mp4" />
        {/* Fallback for browsers that don't support video */}
        Your browser does not support the video tag.
      </video>

      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/60 via-emerald-900/40 to-slate-900/60" />

      {/* Optional: Animated particles or floating elements */}
      <div className="absolute inset-0">
        {/* Floating dots/particles for extra visual interest */}
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-emerald-400/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default VideoHeroBg;
