"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star } from "lucide-react";

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariant = {
  initial: { opacity: 0, y: 30, scale: 0.9 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { duration: 0.6, ease: "easeOut" },
};

// Seeded random function for deterministic values
const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

export default function HeroSection() {
  const [currentView, setCurrentView] = useState<"board" | "agent">("board");
  const [isClient, setIsClient] = useState(false);

  // Ensure client-side rendering for dynamic content
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Alternate between views every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentView((prev) => (prev === "board" ? "agent" : "board"));
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  // Generate deterministic particle data
  const particleData = Array.from({ length: 20 }, (_, i) => ({
    left: `${seededRandom(i * 3) * 100}%`,
    top: `${seededRandom(i * 3 + 1) * 100}%`,
    animationDelay: `${seededRandom(i * 3 + 2) * 6}s`,
    animationDuration: `${4 + seededRandom(i * 3 + 3) * 4}s`,
  }));

  // Generate deterministic matrix rain data
  const matrixRainData = Array.from({ length: 10 }, (_, i) => ({
    left: `${seededRandom(i * 4) * 100}%`,
    animationDelay: `${seededRandom(i * 4 + 1) * 3}s`,
    animationDuration: `${2 + seededRandom(i * 4 + 2) * 2}s`,
    text: seededRandom(i * 4 + 3)
      .toString(36)
      .substring(2, 8),
  }));

  const boardView = () => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 h-full">
        {[
          {
            title: "Backlog",
            count: 7,
            color: "bg-blue-500",
            id: "backlog",
          },
          {
            title: "In Progress",
            count: 3,
            color: "bg-yellow-500",
            id: "in-progress",
          },
          {
            title: "Completed",
            count: 4,
            color: "bg-green-500",
            id: "completed",
          },
        ].map((item, index) => (
          <motion.div
            key={index}
            className="bg-white/5 rounded-lg p-3 hover-glow"
            whileHover={{ scale: 1.05 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 + index * 0.1 }}
          >
            <div className="flex gap-2 items-center mb-2">
              <div className={`w-2 h-2 ${item.color} rounded-full`} />
              <div className="text-white text-xs font-medium">{item.title}</div>
              <motion.div
                className="ml-auto bg-white/10 px-2 py-1 rounded-full text-xs text-white font-bold"
                key={`${item.id}-count`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                {item.count}
              </motion.div>
            </div>
            <div className="w-full flex flex-col gap-2">
              {Array.from({ length: item.count }).map((_, taskIndex) => (
                <motion.div
                  key={`${item.id}-${taskIndex}`}
                  className={`w-full h-8 rounded-md bg-white/10 relative overflow-hidden group cursor-pointer task-hover ${
                    item.id === "backlog"
                      ? "task-status-backlog"
                      : item.id === "in-progress"
                      ? "task-status-progress"
                      : "task-status-completed"
                  } ${
                    taskIndex % 3 === 0
                      ? "task-priority-high"
                      : taskIndex % 3 === 1
                      ? "task-priority-medium"
                      : "task-priority-low"
                  }`}
                  whileHover={{
                    scale: 1.02,
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                    boxShadow: "0 0 20px rgba(16, 185, 129, 0.3)",
                  }}
                  animate={{
                    y: [0, -2, 0],
                    opacity: [0.8, 1, 0.8],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: taskIndex * 0.5,
                  }}
                >
                  {/* Task Processing Animation */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-task-processing"
                    animate={{
                      x: ["-100%", "100%"],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: taskIndex * 0.3,
                      ease: "easeInOut",
                    }}
                  />

                  {/* Task Content */}
                  <div className="absolute inset-0 flex items-center px-3">
                    <div className="w-2 h-2 bg-white/60 rounded-full mr-2 animate-pulse" />
                    <div className="w-16 h-2 bg-white/40 rounded-full mr-2" />
                    <div className="w-8 h-2 bg-white/30 rounded-full" />
                  </div>

                  {/* Progress Bar for In Progress Tasks */}
                  {item.id === "in-progress" && (
                    <motion.div
                      className="absolute bottom-0 left-0 h-1 bg-emerald-500/50 rounded-b-md"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${30 + taskIndex * 20}%`,
                      }}
                      transition={{
                        duration: 2,
                        delay: taskIndex * 0.2,
                      }}
                    />
                  )}

                  {/* Completion Check for Completed Tasks */}
                  {item.id === "completed" && (
                    <motion.div
                      className="absolute top-1/2 right-2 transform -translate-y-1/2 text-emerald-400 font-bold text-sm"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{
                        duration: 0.5,
                        delay: taskIndex * 0.1,
                      }}
                    >
                      ✓
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  const agentView = () => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 h-full">
        <motion.div
          className="bg-white/5 rounded-lg p-3 hover-glow"
          whileHover={{ scale: 1.05 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-2">
                <div className="w-12 h-2 bg-white/10 rounded-md" />
                <div className="h-8 bg-white/10 rounded-md " />
              </div>
              <div className="flex flex-col gap-2">
                <div className="w-12 h-2 bg-white/10 rounded-md " />
                <div className="h-8 bg-white/10 rounded-md " />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="w-12 h-2 bg-white/10 rounded-md" />
              <div className="h-8 bg-white/10 rounded-md " />
            </div>
            {/* Scroll area */}
            <div className="flex flex-col gap-4">
              <div className="w-12 h-2 bg-white/10 rounded-md" />
              <div className="flex items-center justify-between gap-2">
                <div className="h-2 bg-white/40 rounded-md flex flex-1 items-center gap-2 animate-pulse ">
                  <div className="w-4 h-4 bg-green-500 rounded-full ml-32 animate-pulse animate-pulse-glow" />
                </div>
                <div className="w-8 h-2 bg-green-500 rounded-md animate-pulse" />
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="h-2 bg-white/40 rounded-md flex flex-1 items-center gap-2 animate-pulse">
                  <div className="w-4 h-4 bg-green-500 rounded-full ml-24 animate-pulse animate-pulse-glow" />
                </div>
                <div className="w-8 h-2 bg-blue-500 rounded-md animate-pulse" />
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="h-2 bg-white/40 rounded-md flex flex-1 items-center gap-2 animate-pulse">
                  <div className="w-4 h-4 bg-green-500 rounded-full ml-4 animate-pulse animate-pulse-glow" />
                </div>
                <div className="w-8 h-2 bg-rose-500 rounded-md animate-pulse" />
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="h-2 bg-white/40 rounded-md flex flex-1 items-center gap-2 animate-pulse">
                  <div className="w-4 h-4 bg-green-500 rounded-full ml-16 animate-pulse animate-pulse-glow" />
                </div>
                <div className="w-8 h-2 bg-yellow-500 rounded-md animate-pulse" />
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="h-2 bg-white/40 rounded-md flex flex-1 items-center gap-2 animate-pulse">
                  <div className="w-4 h-4 bg-green-500 rounded-full ml-10 animate-pulse animate-pulse-glow" />
                </div>
                <div className="w-8 h-2 bg-purple-500 rounded-md animate-pulse" />
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="w-8 h-2 bg-white/60 rounded-md animate-pulse" />
                <div className="w-8 h-2 bg-green-500 rounded-md animate-pulse" />
              </div>
            </div>

            <div className="h-6 bg-green-600 rounded-md animate-pulse flex items-center justify-center">
              <span className="text-white text-xs font-medium ">
                Generate stories
              </span>
            </div>
          </div>
        </motion.div>
        <motion.div
          className="bg-white/5 rounded-lg p-3 hover-glow"
          whileHover={{ scale: 1.05 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex gap-2 items-center mb-2">
            <div className="text-white text-xs font-medium">
              Generated Stories
            </div>
            <motion.div
              className="ml-auto bg-white/10 px-2 py-1 rounded-full text-xs text-white font-bold"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              6
            </motion.div>
          </div>
          <div className="w-full flex flex-col gap-2">
            {Array.from({ length: 6 }).map((_, taskIndex) => (
              <motion.div
                key={`agent-task-${taskIndex}`}
                className={`w-full h-8 rounded-md bg-white/10 relative overflow-hidden group cursor-pointer task-hover ${"task-status-backlog"} ${
                  taskIndex % 3 === 0
                    ? "task-priority-high"
                    : taskIndex % 3 === 1
                    ? "task-priority-medium"
                    : "task-priority-low"
                }`}
                whileHover={{
                  scale: 1.02,
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  boxShadow: "0 0 20px rgba(16, 185, 129, 0.3)",
                }}
                animate={{
                  y: [0, -2, 0],
                  opacity: [0.8, 1, 0.8],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: taskIndex * 0.5,
                }}
              >
                {/* Task Processing Animation */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-task-processing"
                  animate={{
                    x: ["-100%", "100%"],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: taskIndex * 0.3,
                    ease: "easeInOut",
                  }}
                />

                {/* Task Content */}
                <div className="absolute inset-0 flex items-center px-3">
                  <div className="w-2 h-2 bg-white/60 rounded-full mr-2 animate-pulse" />
                  <div className="w-16 h-2 bg-white/40 rounded-full mr-2" />
                  <div className="w-8 h-2 bg-white/30 rounded-full" />
                </div>

                {/* Progress Bar for In Progress Tasks */}
                <motion.div
                  className="absolute bottom-0 left-0 h-1 bg-emerald-500/50 rounded-b-md"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${30 + taskIndex * 20}%`,
                  }}
                  transition={{
                    duration: 2,
                    delay: taskIndex * 0.2,
                  }}
                />

                {/* Completion Check for Completed Tasks */}
                <motion.div
                  className="absolute top-1/2 right-2 transform -translate-y-1/2 text-emerald-400 font-bold text-sm"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    duration: 0.5,
                    delay: taskIndex * 0.1,
                  }}
                >
                  ✓
                </motion.div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  };

  return (
    <section className="relative overflow-hidden min-h-screen flex items-center justify-center">
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-20 left-10 w-32 h-32 bg-emerald-500/20 rounded-full blur-xl animate-morphing-shape"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-40 right-20 w-24 h-24 bg-blue-500/20 rounded-full blur-xl animate-morphing-shape"
          animate={{
            x: [0, -80, 0],
            y: [0, 60, 0],
            scale: [1, 0.8, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        />
        <motion.div
          className="absolute bottom-40 left-1/4 w-20 h-20 bg-purple-500/20 rounded-full blur-xl animate-morphing-shape"
          animate={{
            x: [0, 60, 0],
            y: [0, -40, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 4,
          }}
        />

        {/* Energy Pulse Orbs */}
        <motion.div
          className="absolute top-1/3 right-1/4 w-16 h-16 bg-emerald-500/30 rounded-full animate-energy-pulse"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Particle System */}
        {isClient &&
          particleData.map((particle, index) => (
            <motion.div
              key={index}
              className="particle animate-particle-float"
              style={{
                left: particle.left,
                top: particle.top,
                animationDelay: particle.animationDelay,
                animationDuration: particle.animationDuration,
              }}
              animate={{
                x: [0, seededRandom(index * 5) * 100 - 50],
                y: [0, seededRandom(index * 5 + 1) * 100 - 50],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 6 + seededRandom(index * 5 + 2) * 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}

        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        {/* Animated Data Streams */}
        <motion.div
          className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent animate-data-stream"
          animate={{
            scaleX: [0, 1, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent animate-data-stream"
          animate={{
            scaleX: [0, 1, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1.5,
          }}
        />
      </div>

      <div className="relative container mx-auto px-4 pt-32 lg:pt-16 pb-8 lg:pb-0 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <motion.div
              className="text-left"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
            >
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="inline-flex items-center px-4 py-2 sm:px-6 sm:py-3 bg-emerald-500/10 backdrop-blur-sm border border-emerald-500/20 text-emerald-300 rounded-full text-sm font-medium mb-6 lg:mb-8 animate-pulse-glow"
              >
                <Star className="w-4 h-4 mr-2 text-emerald-400" />
                <span className="text-emerald-400">
                  Join the Future of Agile Planning
                </span>
              </motion.div>

              {/* Main Heading */}
              <motion.h1
                className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 lg:mb-8 leading-tight"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                <motion.span
                  className="gradient-text-secondary block animate-tech-glow"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  Sprint Smarter,
                </motion.span>
                <motion.span
                  className="gradient-text-primary block animate-tech-glow"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  Deliver Faster
                </motion.span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                className="text-base sm:text-lg lg:text-xl text-emerald-100/90 mb-8 lg:mb-12 leading-relaxed animate-hologram-flicker"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
              >
                Transform agile planning from hours to minutes with SprintiQ's
                AI-native story generation. Create intelligent backlogs,
                optimize sprints, and deliver value 75% faster.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-8 lg:mb-12"
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                transition={{ delay: 1.0 }}
              >
                <motion.div variants={cardVariant}>
                  <Link href="/signup">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="hover-lift"
                    >
                      <Button className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-xl hover:shadow-emerald-500/40 transition-all duration-300 group animate-pulse-glow relative overflow-hidden animate-neural-network">
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                          animate={{
                            x: ["-100%", "100%"],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                        />
                        <span className="relative z-10">Get Beta Access</span>
                        <motion.div
                          whileHover={{ x: 5 }}
                          transition={{ type: "spring", stiffness: 300 }}
                          className="relative z-10"
                        >
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </motion.div>
                      </Button>
                    </motion.div>
                  </Link>
                </motion.div>

                {/* Learn More Link */}
                <motion.div variants={cardVariant}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="hover-lift"
                  >
                    <a
                      href="https://sprintiq.ai"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button className="bg-white text-emerald-600 hover:bg-white px-8 py-4 text-lg font-semibold rounded-xl shadow-xl transition-all duration-300 ">
                        <span>Learn More</span>
                        <motion.div
                          whileHover={{ x: 5 }}
                          transition={{ type: "spring", stiffness: 300 }}
                          className="ml-2"
                        >
                          <ArrowRight className="h-5 w-5" />
                        </motion.div>
                      </Button>
                    </a>
                  </motion.div>
                </motion.div>
              </motion.div>

              {/* Stats */}
              <motion.div
                className="grid grid-cols-2 gap-4 sm:gap-8"
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                transition={{ delay: 1.2 }}
              >
                {[
                  { number: "75%", label: "Time Saved on Planning" },
                  { number: "5x", label: "Faster Backlog Creation" },
                  { number: "99.9%", label: "Uptime" },
                  { number: "40%", label: "Fewer Story Revisions" },
                ].map((stat, index) => (
                  <motion.div
                    key={index}
                    className="text-left hover-lift"
                    variants={cardVariant}
                    whileHover={{ scale: 1.05, y: -5 }}
                  >
                    <motion.div
                      className="text-3xl font-bold text-white mb-1 animate-tech-glow"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 200,
                        delay: 1.4 + index * 0.1,
                      }}
                    >
                      {stat.number}
                    </motion.div>
                    <div className="text-emerald-200/80 text-sm">
                      {stat.label}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right Content - Interactive Dashboard Preview */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.4 }}
            >
              {/* Main Dashboard Card */}
              <motion.div
                className="relative glass-morphism-dark rounded-2xl p-3 sm:p-6 shadow-2xl animate-dashboard-pulse hover-lift h-[450px] sm:h-[500px]"
                whileHover={{ scale: 1.02, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex gap-2">
                    {["bg-red-500", "bg-yellow-500", "bg-green-500"].map(
                      (color, i) => (
                        <motion.div
                          key={i}
                          className={`w-3 h-3 rounded-full ${color} animate-energy-pulse`}
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            delay: i * 0.3,
                          }}
                        />
                      )
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <motion.div
                      className="w-3 h-3 bg-emerald-500 rounded-full animate-energy-pulse"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <div className="text-white font-semibold gradient-text-secondary">
                      SprintiQ Dashboard
                    </div>
                  </div>
                </div>

                {/* Content Grid */}
                <div className="h-full flex gap-4 w-full pb-12">
                  <motion.div
                    className="bg-white/5 rounded-lg p-3 hover-glow"
                    whileHover={{ scale: 1.05 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex flex-col items-center justify-between h-full gap-2">
                      <div className="flex flex-col items-center justify-between h-full gap-2">
                        <div className="flex flex-col items-center gap-2">
                          <Image
                            src="/images/sprint-icon.png"
                            alt="sprintiq-logo"
                            width={40}
                            height={40}
                            className="p-2"
                          />
                          <div className="w-3 h-3 bg-white/10 rounded-full" />
                          <div className="w-3 h-3 bg-white/10 rounded-full" />
                          <div className="w-3 h-3 bg-white/10 rounded-full" />
                          <div className="w-3 h-3 bg-white/10 rounded-full" />
                          <div className="w-3 h-3 bg-white/10 rounded-full" />
                          <div className="w-3 h-3 bg-white/10 rounded-full" />
                        </div>
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-3 h-3 bg-white/10 rounded-full " />
                          <div className="w-6 h-6 bg-white/10 rounded-full " />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                  <div className="flex flex-1 flex-col gap-4">
                    <motion.div
                      className="bg-white/5 rounded-lg p-3 hover-glow"
                      whileHover={{ scale: 1.05 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="w-full flex items-center justify-between">
                        <div className="w-32 h-3 bg-white/10 rounded-full" />
                        <div className="flex gap-2">
                          <div className="w-3 h-3 bg-white/10 rounded-full" />
                          <div className="w-3 h-3 bg-white/10 rounded-full" />
                          <div className="w-3 h-3 bg-white/10 rounded-full" />
                          <div className="w-12 h-3 bg-white/10 rounded-full" />
                          <div className="w-3 h-3 bg-white/10 rounded-full" />
                        </div>
                      </div>
                    </motion.div>

                    {/* Animated View Container */}
                    <div className="relative h-full overflow-hidden">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={currentView}
                          initial={{ opacity: 0, x: 50, scale: 0.9 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          exit={{ opacity: 0, x: -50, scale: 0.9 }}
                          transition={{
                            duration: 0.8,
                            ease: "easeInOut",
                            type: "spring",
                            stiffness: 100,
                          }}
                          className="absolute inset-0"
                        >
                          {currentView === "board" ? boardView() : agentView()}
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                {/* Floating Elements */}
                <motion.div
                  className="absolute -top-4 -right-4 w-20 h-20 bg-emerald-500/20 rounded-full blur-xl animate-morphing-shape"
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 180, 360],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />

                <motion.div
                  className="absolute -bottom-4 -left-4 w-16 h-16 bg-blue-500/20 rounded-full blur-xl animate-morphing-shape"
                  animate={{
                    scale: [1, 0.8, 1],
                    rotate: [0, -180, -360],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1,
                  }}
                />
              </motion.div>

              {/* Floating Notification Cards */}
              <motion.div
                className="hidden sm:flex absolute -top-8 -left-8 glass-morphism-dark rounded-xl p-4 shadow-xl animate-notification-pop hover-rotate"
                animate={{
                  y: [0, -10, 0],
                  rotate: [0, 2, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-white text-sm">AI Story Generated</span>
                </div>
              </motion.div>

              <motion.div
                className="hidden sm:flex absolute -bottom-8 -right-8 glass-morphism-dark rounded-xl p-4 shadow-xl animate-notification-pop hover-rotate"
                animate={{
                  y: [0, 10, 0],
                  rotate: [0, -2, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1,
                }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  <span className="text-white text-sm">Sprint Optimized</span>
                </div>
              </motion.div>

              {/* Matrix Rain Effect */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {isClient &&
                  matrixRainData.map((rain, index) => (
                    <motion.div
                      key={index}
                      className="absolute text-emerald-500/20 text-xs font-mono animate-matrix-rain"
                      style={{
                        left: rain.left,
                        animationDelay: rain.animationDelay,
                        animationDuration: rain.animationDuration,
                      }}
                    >
                      {rain.text}
                    </motion.div>
                  ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-6 h-10 border-2 border-emerald-400/50 rounded-full flex justify-center animate-energy-pulse">
          <motion.div
            className="w-1 h-3 bg-emerald-400 rounded-full mt-2"
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </motion.div>
    </section>
  );
}
