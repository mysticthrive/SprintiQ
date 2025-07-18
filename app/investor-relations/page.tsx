"use client";

import { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  HelpCircle,
  ChartBar,
  AlertCircle,
  Crown,
  Brain,
  Zap,
  Handshake,
} from "lucide-react";
import Navbar from "@/components/landing/layout/navbar";
import Footer from "@/components/landing/layout/footer";
import { motion } from "framer-motion";
import MicrosoftSvg from "@/components/svg/apps/MicrosoftSvg";
import SalesforceSvg from "@/components/svg/apps/SalesforceSvg";
import AWSSvg from "@/components/svg/apps/AWSSvg";
import Image from "next/image";
import BubbleSvg from "@/components/svg/apps/BubbleSvg";
import { SupabaseSvg } from "@/components/svg/apps/SupabaseSvg";
import { VercelSvg } from "@/components/svg/apps/VercelSvg";
import { RocketSvg } from "@/components/svg/RocketSvg";
import { TeamSvg } from "@/components/svg/TeamSvg";
import { BadgeSvg } from "@/components/svg/BadgeSvg";
import { PartnershipSvg } from "@/components/svg/PartnershipSvg";

export default function InvestorRelationsPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  // All slides as an array of JSX elements
  const slides = [
    // Slide 1
    <section
      key="slide-1"
      className="w-full max-w-7xl mx-auto animate-slide-transition relative"
    >
      {/* Main Content */}
      <div className="relative z-10">
        {/* Header Section */}
        <div className="text-center mb-16 animate-fade-in-up">
          <div className="inline-block">
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center px-6 py-3 bg-emerald-500/10 backdrop-blur-sm border border-emerald-500/20 text-emerald-300 rounded-full text-sm font-medium mb-8 animate-pulse-glow"
            >
              <ChartBar className="w-4 h-4 mr-2" />
              Market Analysis
            </motion.div>
          </div>
          <h3 className="text-2xl md:text-4xl font-bold text-white mb-8 bg-gradient-to-r from-emerald-300 via-green-300 to-emerald-400 bg-clip-text text-transparent animate-gradient-shift">
            Market Fragmentation & Convergence Opportunity
          </h3>
          <div className="w-24 h-1 bg-gradient-to-r from-emerald-400 to-green-400 mx-auto rounded-full animate-pulse-glow"></div>
        </div>

        <div className="grid grid-cols-2  gap-6 max-w-6xl mx-auto mb-16">
          <div className="grid grid-rows-2 gap-6">
            <div className="grid grid-cols-2 gap-6">
              <div
                className={`group relative overflow-hidden animate-fade-in-up investor-glass rounded-3xl flex flex-col items-center justify-center h-full p-8 text-center border transition-all duration-700 hover:scale-105`}
                style={{ animationDelay: "0ms" }}
              >
                {/* Value */}
                <div className="text-2xl md:text-4xl font-bold  text-emerald-400 group-hover:text-emerald-300 mb-4 transition-colors duration-300">
                  $27.2B
                </div>

                {/* Label */}
                <div className="text-emerald-100/90 text-sm font-medium group-hover:text-emerald-200 transition-colors duration-300">
                  No-Code/Low-Code Market
                </div>

                {/* Hover Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 to-green-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
              </div>
              <div
                className={`group relative overflow-hidden animate-fade-in-up investor-glass rounded-3xl flex flex-col items-center justify-center h-full p-8 text-center border transition-all duration-700 hover:scale-105`}
                style={{ animationDelay: "0ms" }}
              >
                {/* Value */}
                <div className="text-2xl md:text-4xl font-bold  text-emerald-400 group-hover:text-emerald-300 mb-4 transition-colors duration-300">
                  $10.5B
                </div>

                {/* Label */}
                <div className="text-emerald-100/90 text-sm font-medium group-hover:text-emerald-200 transition-colors duration-300">
                  AI Development Tools Market
                </div>

                {/* Hover Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 to-green-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
              </div>
            </div>
            <div
              className={`group relative overflow-hidden animate-fade-in-up investor-glass rounded-3xl flex flex-col items-center justify-center h-full p-8 text-center border transition-all duration-700 hover:scale-105`}
              style={{ animationDelay: "0ms" }}
            >
              {/* Value */}
              <div className="text-2xl md:text-4xl font-bold  text-emerald-400 group-hover:text-emerald-300 mb-4 transition-colors duration-300">
                $85B
              </div>

              {/* Label */}
              <div className="text-emerald-100/90 text-sm font-medium group-hover:text-emerald-200 transition-colors duration-300">
                Global Agile Market
              </div>

              {/* Hover Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 to-green-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
            </div>
          </div>
          <div
            className={`group relative overflow-hidden animate-fade-in-up investor-glass rounded-3xl p-8 text-center flex flex-col items-center justify-center h-full border transition-all duration-700 hover:scale-105`}
            style={{ animationDelay: "0ms" }}
          >
            {/* Value */}
            <div className="text-5xl md:text-6xl font-bold text-emerald-400 mb-4 group-hover:text-emerald-300 transition-colors duration-300">
              $122.7B
            </div>

            {/* Label */}
            <div className="text-emerald-100/90 text-sm font-medium group-hover:text-emerald-200 transition-colors duration-300">
              Total Market Convergence
            </div>

            {/* Hover Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 to-green-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
          </div>
        </div>

        {/* Platform Opportunity Section */}
        <div
          className="text-center mb-16 animate-fade-in-up"
          style={{ animationDelay: "800ms" }}
        >
          <div className="inline-block">
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center px-6 py-3 bg-emerald-500/10 backdrop-blur-sm border border-emerald-500/20 text-emerald-300 rounded-full text-sm font-medium mb-8 animate-pulse-glow"
            >
              <AlertCircle className="w-4 h-4 mr-2" />
              Our Solution
            </motion.div>
          </div>
          <h3 className="text-2xl md:text-4xl font-bold text-white mb-8 bg-gradient-to-r from-emerald-300 to-green-300 bg-clip-text text-transparent">
            Platform Opportunity
          </h3>
          <div className="w-24 h-1 bg-gradient-to-r from-emerald-400 to-green-400 mx-auto rounded-full animate-pulse-glow"></div>
        </div>

        {/* Platform Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          {[
            {
              value: "2.5",
              label: "Hours (vs 6-18 months)",
              icon: Zap,
              color: "from-yellow-400 to-orange-400",
              metric: "Development Time",
              iconColor: "text-yellow-400",
            },
            {
              value: "5",
              label: "AI Agents",
              icon: Brain,
              color: "from-blue-400 to-purple-400",
              metric: "Technology Stack",
              iconColor: "text-blue-400",
            },
            {
              value: "1st",
              label: "Full Stack Agile Product Development PaaS",
              icon: Crown,
              color: "from-emerald-400 to-green-400",
              metric: "Market Position",
              iconColor: "text-emerald-400",
            },
          ].map((item, index) => (
            <div
              key={item.label}
              className="group relative overflow-hidden animate-fade-in-up investor-glass rounded-3xl p-8 text-center border border-emerald-500/20 shadow-xl transition-all duration-700 hover:scale-105"
              style={{ animationDelay: `${1000 + index * 200}ms` }}
            >
              {/* Animated Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              {/* Icon with gradient background */}
              <div className="relative mb-6">
                <div
                  className={`w-20 h-20 mx-auto rounded-full bg-gradient-to-r ${item.color} p-1 animate-pulse-glow`}
                >
                  <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center text-2xl">
                    <item.icon className={`w-10 h-10 ${item.iconColor}`} />
                  </div>
                </div>
              </div>
              <div className="text-emerald-300 font-medium text-sm uppercase tracking-wider mb-4">
                {item.metric}
              </div>
              {/* Value */}
              <div className="text-5xl md:text-6xl font-bold text-emerald-400 mb-4 group-hover:text-emerald-300 transition-colors duration-300">
                {item.value}
              </div>

              {/* Label */}
              <div className="text-emerald-100/90 text-sm font-medium group-hover:text-emerald-200 transition-colors duration-300 leading-relaxed">
                {item.label}
              </div>

              {/* Hover Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 to-green-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
            </div>
          ))}
        </div>

        {/* Problem Statement */}
        <div
          className="animate-fade-in-up"
          style={{ animationDelay: "1600ms" }}
        >
          <div className="relative overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600/90 via-green-600/90 to-emerald-600/90 backdrop-blur-xl rounded-3xl p-10 text-white text-center max-w-6xl mx-auto border border-emerald-400/50 shadow-2xl">
              <div className="relative z-10">
                <div className="inline-block mb-4">
                  <div className="bg-white/10 backdrop-blur-xl rounded-full px-6 py-2 border border-white/20">
                    <span className="text-emerald-200 font-semibold text-sm uppercase tracking-wider">
                      The Challenge
                    </span>
                  </div>
                </div>
                <p className="text-xl md:text-2xl leading-relaxed">
                  <span className="font-bold text-emerald-200">
                    The Problem:
                  </span>{" "}
                  Product teams waste
                  <span className="font-bold text-yellow-300"> 60-80% </span>
                  of development time on fragmented tools. We're solving this
                  with
                  <span className="font-bold text-emerald-200">
                    {" "}
                    complete AI automation
                  </span>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>,
    // Slide 2
    <section
      key="slide-2"
      className="w-full max-w-7xl mx-auto animate-slide-transition relative"
    >
      {/* Main Content */}
      <div className="relative z-10">
        {/* Header Section */}
        <div className="text-center mb-16 animate-fade-in-up">
          <div className="inline-block">
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center px-6 py-3 bg-emerald-500/10 backdrop-blur-sm border border-emerald-500/20 text-emerald-300 rounded-full text-sm font-medium mb-8 animate-pulse-glow"
            >
              <Brain className="w-4 h-4 mr-2" />
              AI Ecosystem
            </motion.div>
          </div>
          <h3 className="text-2xl md:text-4xl font-bold text-white mb-8 bg-gradient-to-r from-emerald-300 via-green-300 to-emerald-400 bg-clip-text text-transparent animate-gradient-shift">
            The SprintiQ™ Solution: 5-Agent AI Ecosystem
          </h3>
          <div className="text-lg md:text-xl text-emerald-100/90 max-w-4xl mx-auto font-light mb-8">
            Complete Workflow Automation: Idea → Launch in 2.5 Hours
          </div>
          <div className="w-24 h-1 bg-gradient-to-r from-emerald-400 to-green-400 mx-auto rounded-full animate-pulse-glow"></div>
        </div>

        {/* AI Agents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 max-w-6xl mx-auto mb-16">
          {[
            {
              name: "Radar",
              img: "https://i.imgur.com/sOTZtOA.png",
              title: "Concept Validation",
              desc: "Market research, competitor analysis, MVP prioritization",
              delay: "0ms",
            },
            {
              name: "Turbo™",
              img: "https://i.imgur.com/JibWlzP.png",
              title: "Agile Planning",
              desc: "User stories, sprint planning, cross-team coordination",
              delay: "200ms",
            },
            {
              name: "Zen",
              img: "https://i.imgur.com/HcGO6RB.png",
              title: "UI/UX Generation",
              desc: "Design systems, prototypes, accessibility-first",
              delay: "400ms",
            },
            {
              name: "Sync",
              img: "https://i.imgur.com/mcFsodi.png",
              title: "Full-Stack Development",
              desc: "React/Node.js, APIs, database schema, testing",
              delay: "600ms",
            },
            {
              name: "Glide",
              img: "https://i.imgur.com/x5HEHNO.png",
              title: "DevOps & Deployment",
              desc: "CI/CD, monitoring, multi-platform deployment",
              delay: "800ms",
            },
          ].map((agent, index) => (
            <div
              key={agent.name}
              className={`group relative overflow-hidden animate-fade-in-up investor-glass rounded-3xl p-6 text-center border transition-all duration-700 hover:scale-105 flex flex-col items-center`}
              style={{ animationDelay: agent.delay }}
            >
              {/* Animated Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              {/* Agent Image with Rotating Animation */}
              <div className="relative mb-6 flex justify-center items-center w-28 h-28">
                {/* Rotating Line Animation */}
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-emerald-400 border-r-emerald-300 animate-spin-slow"></div>
                <div className="absolute inset-2 rounded-full border-2 border-transparent border-b-green-400 border-l-green-300 animate-spin-slow-reverse"></div>

                {/* Main Avatar Container */}
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-r from-emerald-400 to-green-400 p-1 animate-pulse-glow">
                  <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center">
                    <img
                      src={agent.img}
                      alt={agent.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  </div>
                </div>

                {/* Additional Rotating Elements */}
                <div className="absolute inset-0 rounded-full border border-emerald-500/30 animate-spin-slow"></div>
              </div>

              {/* Agent Name */}
              <div className="text-xl font-bold text-emerald-400 mb-3 group-hover:text-emerald-300 transition-colors duration-300">
                {agent.name}
              </div>

              {/* Agent Title */}
              <div className="text-emerald-300 font-semibold mb-3 text-sm">
                {agent.title}
              </div>

              {/* Agent Description */}
              <div className="text-emerald-100/80 text-xs leading-relaxed">
                {agent.desc}
              </div>

              {/* Hover Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 to-green-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
            </div>
          ))}
        </div>

        {/* Value Proposition */}
        <div
          className="animate-fade-in-up"
          style={{ animationDelay: "1000ms" }}
        >
          <div className="relative overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600/90 via-green-600/90 to-emerald-600/90 backdrop-blur-xl rounded-3xl p-10 text-white text-center max-w-6xl mx-auto border border-emerald-400/50 shadow-2xl">
              <div className="relative z-10">
                <div className="inline-block mb-4">
                  <div className="bg-white/10 backdrop-blur-xl rounded-full px-6 py-2 border border-white/20">
                    <span className="text-emerald-200 font-semibold text-sm uppercase tracking-wider">
                      Why This Matters
                    </span>
                  </div>
                </div>
                <p className="text-xl md:text-2xl leading-relaxed">
                  The reality for agile product developers is a constant,
                  productivity-killing shuffle between{" "}
                  <span className="font-bold text-yellow-300">
                    15+ disconnected tools
                  </span>
                  . SprintiQ™ is the first platform to solve this core problem
                  with
                  <span className="font-bold text-emerald-200">
                    {" "}
                    complete, end-to-end workflow automation
                  </span>
                  giving people back what they value most:{" "}
                  <span className="font-bold text-emerald-200">Time</span>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>,
    // Slide 3
    <section
      key="slide-3"
      className="w-full max-w-7xl mx-auto animate-slide-transition relative"
    >
      {/* Main Content */}
      <div className="relative z-10">
        {/* Header Section */}
        <div className="text-center mb-16 animate-fade-in-up">
          <div className="inline-block">
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center px-6 py-3 bg-emerald-500/10 backdrop-blur-sm border border-emerald-500/20 text-emerald-300 rounded-full text-sm font-medium mb-8 animate-pulse-glow"
            >
              <Zap className="w-4 h-4 mr-2" />
              Workflow Demo
            </motion.div>
          </div>
          <h3 className="text-2xl md:text-4xl font-bold text-white mb-8 bg-gradient-to-r from-emerald-300 via-green-300 to-emerald-400 bg-clip-text text-transparent animate-gradient-shift">
            Prototype Modeling: SprintiQ™ Workflow
          </h3>
          <div className="text-lg md:text-xl text-emerald-100/90 max-w-4xl mx-auto font-light mb-8">
            Complete Product Development Simulation
          </div>
          <div className="w-24 h-1 bg-gradient-to-r from-emerald-400 to-green-400 mx-auto rounded-full animate-pulse-glow"></div>
        </div>

        {/* Workflow Demo Container */}
        <div
          className="animate-fade-in-up mb-16"
          style={{ animationDelay: "400ms" }}
        >
          <div className="investor-glass rounded-3xl p-10 max-w-6xl mx-auto border border-emerald-500/20 shadow-2xl">
            <h3 className="text-2xl md:text-3xl font-bold text-emerald-300 mb-8 bg-gradient-to-r from-emerald-300 to-green-300 bg-clip-text text-transparent text-center">
              Input: "Build a sustainable marketplace for local food producers"
            </h3>

            <div className="space-y-8">
              {[
                {
                  agent: "Radar",
                  time: "2 minutes",
                  img: "https://i.imgur.com/sOTZtOA.png",
                  outputs: [
                    "Market analysis: $47B local food market validation",
                    "Competitor analysis: 12 direct competitors with strategic positioning",
                    "Target personas: 3 validated user segments with pain points",
                    "MVP prioritization: 8 features ranked by impact/effort matrix",
                  ],
                },
                {
                  agent: "SprintiQ™ Turbo",
                  time: "3 minutes",
                  img: "https://i.imgur.com/JibWlzP.png",
                  outputs: [
                    "24 enterprise-grade user stories in proper agile format",
                    "AI-optimized sprint planning with velocity predictions",
                    "Automated risk assessment and mitigation strategies",
                  ],
                },
                {
                  agent: "Zen",
                  time: "15 minutes",
                  img: "https://i.imgur.com/HcGO6RB.png",
                  outputs: [
                    "Complete design system with brand-aware guidelines",
                    "12 responsive screen designs with accessibility compliance",
                    "Interactive prototype with validated user flows",
                  ],
                },
                {
                  agent: "Sync",
                  time: "2 hours",
                  img: "https://i.imgur.com/mcFsodi.png",
                  outputs: [
                    "Production-ready React/Node.js application",
                    "Optimized database schema with secure API endpoints",
                    "Integrated payment processing and authentication",
                  ],
                },
                {
                  agent: "Glide",
                  time: "10 minutes",
                  img: "https://i.imgur.com/x5HEHNO.png",
                  outputs: [
                    "Automated production deployment on multiple platforms",
                    "CI/CD pipeline with monitoring and alerting",
                    "Performance optimization and auto-scaling configuration",
                  ],
                },
              ].map((step, index) => (
                <div
                  key={step.agent}
                  className="group relative overflow-hidden animate-fade-in-up investor-glass rounded-2xl p-6 border border-emerald-500/20 transition-all duration-700 hover:scale-102"
                  style={{ animationDelay: `${600 + index * 200}ms` }}
                >
                  {/* Animated Background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                  <div className="relative z-10">
                    <div className="flex items-center mb-4">
                      <div className="mr-4">
                        <div className="relative w-10 h-10 rounded-full bg-gradient-to-r from-emerald-400 to-green-400 p-1 animate-pulse-glow">
                          <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center">
                            <img
                              src={step.img}
                              alt={step.agent}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-emerald-400 group-hover:text-emerald-300 transition-colors duration-300">
                          {step.agent} Output ({step.time}):
                        </div>
                      </div>
                    </div>
                    <ul className="list-disc list-inside text-emerald-100/90 ml-8 space-y-2 text-sm">
                      {step.outputs.map((output, outputIndex) => (
                        <li
                          key={outputIndex}
                          className="group-hover:text-emerald-200 transition-colors duration-300"
                        >
                          {output}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Hover Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 to-green-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div
          className="animate-fade-in-up"
          style={{ animationDelay: "1600ms" }}
        >
          <div className="relative overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600/90 via-green-600/90 to-emerald-600/90 backdrop-blur-xl rounded-3xl p-10 text-white text-center max-w-6xl mx-auto border border-emerald-400/50 shadow-2xl">
              <div className="relative z-10">
                <div className="inline-block mb-4">
                  <div className="bg-white/10 backdrop-blur-xl rounded-full px-6 py-2 border border-white/20">
                    <span className="text-emerald-200 font-semibold text-sm uppercase tracking-wider">
                      Prototype Results
                    </span>
                  </div>
                </div>
                <p className="text-xl md:text-2xl leading-relaxed">
                  Complete, production-ready application in{" "}
                  <span className="font-bold text-yellow-300">2.5 hours</span>{" "}
                  vs{" "}
                  <span className="font-bold text-emerald-200">3-6 months</span>{" "}
                  traditional development. This modeling demonstrates our
                  platform's{" "}
                  <span className="font-bold text-emerald-200">
                    revolutionary capabilities
                  </span>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>,
    // Slide 4
    <section
      key="slide-4"
      className="w-full max-w-7xl mx-auto animate-slide-transition relative"
    >
      {/* Main Content */}
      <div className="relative z-10">
        {/* Header Section */}
        <div className="text-center mb-16 animate-fade-in-up">
          <div className="inline-block">
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center px-6 py-3 bg-emerald-500/10 backdrop-blur-sm border border-emerald-500/20 text-emerald-300 rounded-full text-sm font-medium mb-8 animate-pulse-glow"
            >
              <Crown className="w-4 h-4 mr-2" />
              Business Model
            </motion.div>
          </div>
          <h3 className="text-2xl md:text-4xl font-bold text-white mb-8 bg-gradient-to-r from-emerald-300 via-green-300 to-emerald-400 bg-clip-text text-transparent animate-gradient-shift">
            Pricing Model: Platform Economics
          </h3>
          <div className="text-lg md:text-xl text-emerald-100/90 max-w-4xl mx-auto font-light mb-8">
            Multi-Agent PaaS with Turbo™ as the Foundation
          </div>
          <div className="w-24 h-1 bg-gradient-to-r from-emerald-400 to-green-400 mx-auto rounded-full animate-pulse-glow"></div>
        </div>

        {/* Pricing Plans */}
        <div
          className="animate-fade-in-up mb-16"
          style={{ animationDelay: "400ms" }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {[
              {
                name: "Free Tier",
                price: "$0",
                features: [
                  "SprintiQ™ basics",
                  "30 stories/month",
                  "1 project",
                  "Lead generation",
                ],
                featured: false,
                delay: "0ms",
              },
              {
                name: "Starter",
                price: "$24",
                features: [
                  "300 stories/month",
                  "3 projects",
                  "Basic integrations",
                  "Email support",
                ],
                featured: false,
                delay: "200ms",
              },
              {
                name: "Professional",
                price: "$49",
                features: [
                  "Unlimited stories",
                  "All integrations",
                  "Priority support",
                  "Advanced AI features",
                ],
                featured: true,
                delay: "400ms",
              },
              {
                name: "Enterprise",
                price: "$99",
                features: [
                  "Custom features",
                  "SSO integration",
                  "Analytics dashboard",
                  "Dedicated support",
                ],
                featured: false,
                delay: "600ms",
              },
            ].map((plan, index) => (
              <div
                key={plan.name}
                className={`group relative overflow-hidden animate-fade-in-up rounded-3xl p-8 text-center border transition-all duration-700 hover:scale-105 ${
                  plan.featured
                    ? "bg-gradient-to-br from-emerald-600/90 to-green-500/90 border-emerald-400/50 shadow-2xl"
                    : "border-emerald-500/20 investor-glass"
                }`}
                style={{ animationDelay: plan.delay }}
              >
                {/* Animated Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                <div className="relative z-10">
                  <div
                    className={`text-2xl font-bold mb-4 ${
                      plan.featured ? "text-white" : "text-emerald-400"
                    } group-hover:text-emerald-300 transition-colors duration-300`}
                  >
                    {plan.name}
                  </div>
                  <div
                    className={`text-4xl md:text-5xl font-bold ${
                      plan.featured ? "text-white" : "text-emerald-400"
                    } mb-6 group-hover:text-emerald-300 transition-colors duration-300`}
                  >
                    {plan.price}
                  </div>
                  <ul className="text-left list-disc list-inside mb-6 text-emerald-100/90 text-sm space-y-2">
                    {plan.features.map((f, featureIndex) => (
                      <li
                        key={featureIndex}
                        className={`${
                          plan.featured
                            ? "text-emerald-100/90"
                            : "text-emerald-100/90"
                        } group-hover:text-emerald-200 transition-colors duration-300`}
                      >
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Hover Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 to-green-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Ecosystem Add-Ons Section */}
        <div
          className="animate-fade-in-up mb-16"
          style={{ animationDelay: "800ms" }}
        >
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-6 bg-gradient-to-r from-emerald-300 to-green-300 bg-clip-text text-transparent">
              The Growth Engine: Ecosystem Add-Ons
            </h3>
            <div className="text-lg md:text-xl text-emerald-100/90 max-w-4xl mx-auto font-light">
              Drives 310% Revenue Growth - "The Shopify of Agile Product
              Development"
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {[
              {
                name: "Radar",
                price: "$29/mo",
                img: "https://i.imgur.com/sOTZtOA.png",
                delay: "0ms",
              },
              {
                name: "Zen",
                price: "$39/mo",
                img: "https://i.imgur.com/HcGO6RB.png",
                delay: "200ms",
              },
              {
                name: "Sync",
                price: "$59/mo",
                img: "https://i.imgur.com/mcFsodi.png",
                delay: "400ms",
              },
              {
                name: "Glide",
                price: "$49/mo",
                img: "https://i.imgur.com/x5HEHNO.png",
                delay: "600ms",
              },
            ].map((addon, index) => (
              <div
                key={addon.name}
                className="group relative overflow-hidden animate-fade-in-up investor-glass rounded-3xl p-6 text-center border border-emerald-500/20 transition-all duration-700 hover:scale-105 flex flex-col items-center"
                style={{ animationDelay: addon.delay }}
              >
                {/* Animated Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                <div className="relative z-10">
                  {/* Agent Image with Rotating Animation */}
                  <div className="relative mb-6 flex justify-center items-center w-24 h-24">
                    {/* Rotating Line Animation */}
                    <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-emerald-400 border-r-emerald-300 animate-spin-slow"></div>
                    <div className="absolute inset-2 rounded-full border-2 border-transparent border-b-green-400 border-l-green-300 animate-spin-slow-reverse"></div>

                    {/* Main Avatar Container */}
                    <div className="relative w-18 h-18 rounded-full bg-gradient-to-r from-emerald-400 to-green-400 p-1 animate-pulse-glow">
                      <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center">
                        <img
                          src={addon.img}
                          alt={addon.name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      </div>
                    </div>

                    {/* Additional Rotating Elements */}
                    <div className="absolute inset-0 rounded-full border border-emerald-500/30 animate-spin-slow"></div>
                  </div>

                  <div className="text-xl font-bold text-emerald-400 mb-3 group-hover:text-emerald-300 transition-colors duration-300">
                    {addon.name}
                  </div>
                  <div className="text-2xl font-bold text-emerald-400 mb-2 group-hover:text-emerald-300 transition-colors duration-300">
                    {addon.price}
                  </div>
                </div>

                {/* Hover Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 to-green-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Value Proposition */}
        <div
          className="animate-fade-in-up"
          style={{ animationDelay: "1200ms" }}
        >
          <div className="relative overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600/90 via-green-600/90 to-emerald-600/90 backdrop-blur-xl rounded-3xl p-10 text-white text-center max-w-6xl mx-auto border border-emerald-400/50 shadow-2xl">
              <div className="relative z-10">
                <div className="inline-block mb-4">
                  <div className="bg-white/10 backdrop-blur-xl rounded-full px-6 py-2 border border-white/20">
                    <span className="text-emerald-200 font-semibold text-sm uppercase tracking-wider">
                      The Magic
                    </span>
                  </div>
                </div>
                <p className="text-xl md:text-2xl leading-relaxed">
                  Complete Bundle at{" "}
                  <span className="font-bold text-yellow-300">$149/month</span>{" "}
                  (20% discount) drives{" "}
                  <span className="font-bold text-emerald-200">
                    310% higher revenue
                  </span>{" "}
                  per customer than single-agent users. This is our{" "}
                  <span className="font-bold text-emerald-200">
                    competitive moat
                  </span>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>,
    // Slide 5
    <section
      key="slide-5"
      className="w-full max-w-7xl mx-auto animate-slide-transition relative"
    >
      {/* Main Content */}
      <div className="relative z-10">
        {/* Header Section */}
        <div className="text-center mb-16 animate-fade-in-up">
          <div className="inline-block">
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center px-6 py-3 bg-emerald-500/10 backdrop-blur-sm border border-emerald-500/20 text-emerald-300 rounded-full text-sm font-medium mb-8 animate-pulse-glow"
            >
              <HelpCircle className="w-4 h-4 mr-2" />
              Platform Stickiness
            </motion.div>
          </div>
          <h3 className="text-2xl md:text-4xl font-bold text-white mb-8 bg-gradient-to-r from-emerald-300 via-green-300 to-emerald-400 bg-clip-text text-transparent animate-gradient-shift">
            Platform Stickiness: Multi-Agent Adoption
          </h3>
          <div className="text-lg md:text-xl text-emerald-100/90 max-w-4xl mx-auto font-light mb-8">
            Why Customers Can't Leave: Integrated Workflow Creates Lock-In
          </div>
          <div className="w-24 h-1 bg-gradient-to-r from-emerald-400 to-green-400 mx-auto rounded-full animate-pulse-glow"></div>
        </div>

        {/* Adoption Table */}
        <div
          className="animate-fade-in-up mb-16"
          style={{ animationDelay: "400ms" }}
        >
          <div className="investor-glass rounded-3xl p-8 max-w-6xl mx-auto border border-emerald-500/20 shadow-2xl">
            <div className="overflow-x-auto">
              <table className="min-w-[700px] w-full text-white border-separate border-spacing-y-2 rounded-2xl overflow-hidden">
                <thead>
                  <tr className="bg-gradient-to-r from-emerald-800/90 to-green-800/90 backdrop-blur-sm">
                    <th className="p-6 text-left font-bold text-lg text-emerald-200 border-b border-emerald-600/50">
                      Agent
                    </th>
                    <th className="p-6 text-left font-bold text-lg text-emerald-200 border-b border-emerald-600/50">
                      Customers
                    </th>
                    <th className="p-6 text-left font-bold text-lg text-emerald-200 border-b border-emerald-600/50">
                      Adoption Rate
                    </th>
                    <th className="p-6 text-left font-bold text-lg text-emerald-200 border-b border-emerald-600/50">
                      Revenue Impact
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["SprintiQ™ Turbo", "335", "100%", "$36.3/month avg"],
                    ["Radar", "201", "60%", "+$29/month"],
                    ["Zen", "168", "50%", "+$39/month"],
                    ["Sync", "134", "40%", "+$59/month"],
                    ["Glide", "100", "30%", "+$49/month"],
                    ["Complete Bundle", "84", "25%", "$149/month avg"],
                  ].map((row, rowIndex) => (
                    <tr
                      key={row[0]}
                      className="group bg-white/5 hover:bg-white/10 transition-all duration-300 border-b border-emerald-500/10 last:border-b-0"
                    >
                      {row.map((cell, j) => (
                        <td
                          key={j}
                          className={`p-6 text-emerald-100/90 font-medium text-lg transition-colors duration-300 ${
                            j === 0 ? "font-semibold text-emerald-300" : ""
                          } ${j === 1 ? "text-emerald-200" : ""} ${
                            j === 2 ? "text-yellow-300" : ""
                          } ${j === 3 ? "text-green-300 font-semibold" : ""}`}
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Network Effect Section */}
        <div
          className="animate-fade-in-up mb-16"
          style={{ animationDelay: "600ms" }}
        >
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-6 bg-gradient-to-r from-emerald-300 to-green-300 bg-clip-text text-transparent">
              The Network Effect: Revenue Grows Exponentially
            </h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {[
              { label: "Single Agent", value: "$36.3", delay: "0ms" },
              { label: "Two Agents (+45%)", value: "$52.8", delay: "200ms" },
              { label: "Three Agents (+146%)", value: "$89.5", delay: "400ms" },
              {
                label: "Complete Ecosystem (+310%)",
                value: "$149",
                delay: "600ms",
              },
            ].map((item, index) => (
              <div
                key={item.label}
                className="group relative overflow-hidden animate-fade-in-up investor-glass rounded-3xl p-6 text-center border border-emerald-500/20 transition-all duration-700 hover:scale-105"
                style={{ animationDelay: item.delay }}
              >
                {/* Animated Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                <div className="relative z-10">
                  <div className="text-4xl md:text-5xl font-bold text-emerald-400 mb-4 group-hover:text-emerald-300 transition-colors duration-300">
                    {item.value}
                  </div>
                  <div className="text-emerald-100/90 text-sm group-hover:text-emerald-200 transition-colors duration-300 leading-relaxed">
                    {item.label}
                  </div>
                </div>

                {/* Hover Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 to-green-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Value Proposition */}
        <div
          className="animate-fade-in-up"
          style={{ animationDelay: "1000ms" }}
        >
          <div className="relative overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600/90 via-green-600/90 to-emerald-600/90 backdrop-blur-xl rounded-3xl p-10 text-white text-center max-w-6xl mx-auto border border-emerald-400/50 shadow-2xl">
              <div className="relative z-10">
                <div className="inline-block mb-4">
                  <div className="bg-white/10 backdrop-blur-xl rounded-full px-6 py-2 border border-white/20">
                    <span className="text-emerald-200 font-semibold text-sm uppercase tracking-wider">
                      Why This Matters
                    </span>
                  </div>
                </div>
                <p className="text-xl md:text-2xl leading-relaxed">
                  Our platform's real power emerges when customers adopt
                  multiple agents. This integration creates a sticky workflow
                  that drives best-in-class SaaS metrics: churn plummets to{" "}
                  <span className="font-bold text-yellow-300">2.8%</span> while
                  net revenue retention soars to{" "}
                  <span className="font-bold text-emerald-200">135%</span>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>,
    // Slide 6
    <section
      key="slide-6"
      className="w-full max-w-7xl mx-auto animate-slide-transition relative"
    >
      {/* Main Content */}
      <div className="relative z-10">
        {/* Header Section */}
        <div className="text-center mb-16 animate-fade-in-up">
          <div className="inline-block">
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center px-6 py-3 bg-emerald-500/10 backdrop-blur-sm border border-emerald-500/20 text-emerald-300 rounded-full text-sm font-medium mb-8 animate-pulse-glow"
            >
              <ChartBar className="w-4 h-4 mr-2" />
              Platform Impact
            </motion.div>
          </div>
          <h3 className="text-2xl md:text-4xl font-bold text-white mb-8 bg-gradient-to-r from-emerald-300 via-green-300 to-emerald-400 bg-clip-text text-transparent animate-gradient-shift">
            The Numbers: Complete Platform Impact
          </h3>
          <div className="text-lg md:text-xl text-emerald-100/90 max-w-4xl mx-auto font-light mb-8">
            Multi-Agent Strategy Delivers 96% Revenue Growth
          </div>
          <div className="w-24 h-1 bg-gradient-to-r from-emerald-400 to-green-400 mx-auto rounded-full animate-pulse-glow"></div>
        </div>
        <div className="investor-glass rounded-3xl p-8 max-w-6xl mx-auto border border-emerald-500/20 shadow-2xl mb-12">
          <div className="overflow-x-auto">
            <table className="min-w-[700px] w-full text-white border-separate border-spacing-y-2 rounded-2xl overflow-hidden">
              <thead>
                <tr className="bg-gradient-to-r from-emerald-800/90 to-green-800/90 backdrop-blur-sm">
                  <th className="p-6 text-left font-bold text-lg text-emerald-200 border-b border-emerald-600/50">
                    Metric
                  </th>
                  <th className="p-6 text-left font-bold text-lg text-emerald-200 border-b border-emerald-600/50">
                    Turbo™ Only
                  </th>
                  <th className="p-6 text-left font-bold text-lg text-emerald-200 border-b border-emerald-600/50">
                    Full Shipyard
                  </th>
                  <th className="p-6 text-left font-bold text-lg text-emerald-200 border-b border-emerald-600/50">
                    Ecosystem Advantage
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Annual Recurring Revenue", "$64,440", "$126,000", "+96%"],
                  ["Total Customers", "148", "335", "+126%"],
                  ["Total Users", "1,475", "2,575", "+75%"],
                  ["Net Margin", "65%", "73%", "+8pts"],
                  ["Enterprise Customers", "15", "50", "+233%"],
                ].map((row, rowIndex) => (
                  <tr
                    key={row[0]}
                    className="group bg-white/5 hover:bg-white/10 transition-all duration-300 border-b border-emerald-500/10 last:border-b-0"
                  >
                    {row.map((cell, j) => (
                      <td
                        key={j}
                        className={`p-6 text-emerald-100/90 font-medium text-lg transition-colors duration-300 ${
                          j === 0 ? "font-semibold text-emerald-300" : ""
                        } ${j === 1 ? "text-emerald-200" : ""} ${
                          j === 2 ? "text-emerald-200" : ""
                        } ${j === 3 ? "text-green-300 font-semibold" : ""}`}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {/* Market Validation Section */}
        <div
          className="animate-fade-in-up mb-16"
          style={{ animationDelay: "600ms" }}
        >
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-6 bg-gradient-to-r from-emerald-300 to-green-300 bg-clip-text text-transparent">
              Market Validation: Ecosystem Drives Growth
            </h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {[
              {
                label: "Revenue from Ecosystem Add-ons",
                value: "49%",
                delay: "0ms",
              },
              {
                label: "Multi-Agent Adoption Rate",
                value: "65%",
                delay: "200ms",
              },
              {
                label: "Complete Bundle Adoption",
                value: "25%",
                delay: "400ms",
              },
              { label: "Net Revenue Retention", value: "185%", delay: "600ms" },
            ].map((item, index) => (
              <div
                key={item.label}
                className="group relative overflow-hidden animate-fade-in-up investor-glass rounded-3xl p-6 text-center border border-emerald-500/20 transition-all duration-700 hover:scale-105"
                style={{ animationDelay: item.delay }}
              >
                {/* Animated Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                <div className="relative z-10">
                  <div className="text-4xl md:text-5xl font-bold text-emerald-400 mb-4 group-hover:text-emerald-300 transition-colors duration-300">
                    {item.value}
                  </div>
                  <div className="text-emerald-100/90 text-sm group-hover:text-emerald-200 transition-colors duration-300 leading-relaxed">
                    {item.label}
                  </div>
                </div>

                {/* Hover Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 to-green-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Value Proposition */}
        <div
          className="animate-fade-in-up"
          style={{ animationDelay: "1000ms" }}
        >
          <div className="relative overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600/90 via-green-600/90 to-emerald-600/90 backdrop-blur-xl rounded-3xl p-10 text-white text-center max-w-6xl mx-auto border border-emerald-400/50 shadow-2xl">
              <div className="relative z-10">
                <div className="inline-block mb-4">
                  <div className="bg-white/10 backdrop-blur-xl rounded-full px-6 py-2 border border-white/20">
                    <span className="text-emerald-200 font-semibold text-sm uppercase tracking-wider">
                      The Breakthrough
                    </span>
                  </div>
                </div>
                <p className="text-xl md:text-2xl leading-relaxed">
                  This proves SprintiQ™ is not just another agile project
                  management tool or vibe coding fad. It is an{" "}
                  <span className="font-bold text-emerald-200">
                    AI-Native PaaS
                  </span>{" "}
                  that becomes more valuable as users adopt more agents. We are
                  building the{" "}
                  <span className="font-bold text-emerald-200">
                    operating system for agile product development
                  </span>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>,
    // Slide 7
    <section
      key="slide-7"
      className="w-full max-w-7xl mx-auto animate-slide-transition relative"
    >
      {/* Main Content */}
      <div className="relative z-10">
        {/* Header Section */}
        <div className="text-center mb-16 animate-fade-in-up">
          <div className="inline-block">
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center px-6 py-3 bg-emerald-500/10 backdrop-blur-sm border border-emerald-500/20 text-emerald-300 rounded-full text-sm font-medium mb-8 animate-pulse-glow"
            >
              <Zap className="w-4 h-4 mr-2" />
              Execution Plan
            </motion.div>
          </div>
          <h3 className="text-2xl md:text-4xl font-bold text-white mb-8 bg-gradient-to-r from-emerald-300 via-green-300 to-emerald-400 bg-clip-text text-transparent animate-gradient-shift">
            Execution Plan: 14-Month Path to Market
          </h3>
          <div className="text-lg md:text-xl text-emerald-100/90 max-w-4xl mx-auto font-light mb-8">
            Proven Team, Clear Milestones, Measurable Results
          </div>
          <div className="w-24 h-1 bg-gradient-to-r from-emerald-400 to-green-400 mx-auto rounded-full animate-pulse-glow"></div>
        </div>
        {/* Execution Phases */}
        <div
          className="animate-fade-in-up mb-16"
          style={{ animationDelay: "400ms" }}
        >
          <div className="space-y-8 max-w-4xl mx-auto">
            {[
              {
                phase: "Phase 1: Foundation (Months 1-6)",
                desc: "Complete Turbo™ agent Alpha platform + Radar development. Target: 425 users, 45 paying customers, proven product-market fit",
                num: "1",
                delay: "0ms",
              },
              {
                phase: "Phase 2: Multi-Agent Expansion (Months 7-12)",
                desc: "Zen + Sync launch with enterprise partnerships. Target: 1,825 users, 255 paying customers",
                num: "2",
                delay: "200ms",
              },
              {
                phase: "Phase 3: Complete Ecosystem (Months 13-14)",
                desc: "Glide + Enterprise features complete. Target: 2,575 users, 335 paying customers, Series A readiness",
                num: "3",
                delay: "400ms",
              },
            ].map((step, index) => (
              <div
                key={step.num}
                className="group relative overflow-hidden animate-fade-in-up investor-glass rounded-3xl p-8 border-l-4 border-emerald-400 shadow-2xl transition-all duration-700 hover:scale-102"
                style={{ animationDelay: step.delay }}
              >
                {/* Animated Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                <div className="relative z-10 flex items-center gap-8">
                  <div className="flex-shrink-0 w-16 h-16 flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-600 to-green-600 text-white text-3xl font-bold border-2 border-emerald-400 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    {step.num}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-xl text-emerald-300 mb-3 group-hover:text-emerald-200 transition-colors duration-300">
                      {step.phase}
                    </div>
                    <div className="text-emerald-100/90 text-lg leading-relaxed group-hover:text-emerald-100 transition-colors duration-300">
                      {step.desc}
                    </div>
                  </div>
                </div>

                {/* Hover Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 to-green-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
              </div>
            ))}
          </div>
        </div>
        {/* Risk-Mitigated Milestones */}
        <div
          className="animate-fade-in-up mb-16"
          style={{ animationDelay: "600ms" }}
        >
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-6 bg-gradient-to-r from-emerald-300 to-green-300 bg-clip-text text-transparent">
              Risk-Mitigated Milestones:
            </h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {[
              {
                label: "6",
                value: "Product-Market Fit Validated",
                delay: "0ms",
              },
              {
                label: "12",
                value: "Multi-Agent Traction Proven",
                delay: "200ms",
              },
              {
                label: "14",
                value: "Complete Platform Launch",
                delay: "400ms",
              },
              { label: "16", value: "Series A Funding", delay: "600ms" },
            ].map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 60, scale: 0.9, rotateY: -15 }}
                animate={{ opacity: 1, y: 0, scale: 1, rotateY: 0 }}
                transition={{
                  duration: 0.8,
                  delay: index * 0.2,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                whileHover={{
                  y: -15,
                  scale: 1.05,
                  rotateY: 5,
                  transition: {
                    duration: 0.4,
                    ease: "easeOut",
                  },
                }}
                whileTap={{
                  scale: 0.98,
                  transition: { duration: 0.1 },
                }}
                className="group relative overflow-hidden investor-glass rounded-3xl p-6 h-full flex flex-col justify-center items-center text-center border border-emerald-500/20"
              >
                {/* Enhanced Animated Background */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  whileHover={{ opacity: 1 }}
                />

                {/* Floating particles effect */}
                <motion.div
                  className="absolute inset-0 overflow-hidden rounded-3xl"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                >
                  <motion.div
                    className="absolute top-4 left-4 w-2 h-2 bg-emerald-400/30 rounded-full"
                    animate={{
                      y: [0, -20, 0],
                      opacity: [0.3, 0.8, 0.3],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      delay: index * 0.5,
                    }}
                  />
                  <motion.div
                    className="absolute bottom-6 right-6 w-1 h-1 bg-green-400/40 rounded-full"
                    animate={{
                      y: [0, 15, 0],
                      opacity: [0.4, 0.9, 0.4],
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      delay: index * 0.7,
                    }}
                  />
                </motion.div>

                <div className="relative z-10">
                  <motion.div
                    className="text-4xl md:text-5xl font-bold text-emerald-400 mb-4 group-hover:text-emerald-300 transition-colors duration-300"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: index * 0.2 + 0.3, duration: 0.6 }}
                    whileHover={{
                      scale: 1.1,
                      transition: { duration: 0.3 },
                    }}
                  >
                    <span className="text-emerald-40 text-3xl">Month</span>{" "}
                    {item.label}
                  </motion.div>
                  <motion.div
                    className="text-emerald-100/90 text-lg group-hover:text-emerald-200 transition-colors duration-300 leading-relaxed"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.2 + 0.5, duration: 0.6 }}
                  >
                    {item.value}
                  </motion.div>
                </div>

                {/* Enhanced Hover Effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 to-green-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"
                  whileHover={{ opacity: 1 }}
                />

                {/* Glow effect */}
                <motion.div
                  className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  whileHover={{ opacity: 1 }}
                />

                {/* Border animation */}
                <motion.div
                  className="absolute inset-0 rounded-3xl border-2 border-transparent"
                  whileHover={{
                    borderColor: "rgba(16, 185, 129, 0.3)",
                    transition: { duration: 0.3 },
                  }}
                />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Value Proposition */}
        <div
          className="animate-fade-in-up"
          style={{ animationDelay: "1000ms" }}
        >
          <div className="relative overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600/90 via-green-600/90 to-emerald-600/90 backdrop-blur-xl rounded-3xl p-10 text-white text-center max-w-6xl mx-auto border border-emerald-400/50 shadow-2xl">
              <div className="relative z-10">
                <div className="inline-block mb-4">
                  <div className="bg-white/10 backdrop-blur-xl rounded-full px-6 py-2 border border-white/20">
                    <span className="text-emerald-200 font-semibold text-sm uppercase tracking-wider">
                      De-Risked Approach
                    </span>
                  </div>
                </div>
                <p className="text-xl md:text-2xl leading-relaxed">
                  We're mitigating risk through deliberate, phased execution.
                  Each agent we build is validated on the market before we
                  proceed, ensuring every step is a calculated success. This
                  isn't a speculative bet; it's a{" "}
                  <span className="font-bold text-emerald-200">
                    proven playbook
                  </span>{" "}
                  executed by an{" "}
                  <span className="font-bold text-emerald-200">
                    experienced team
                  </span>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>,
    // Slide 8
    <section
      key="slide-8"
      className="w-full max-w-7xl mx-auto animate-slide-transition relative"
    >
      {/* Main Content */}
      <div className="relative z-10">
        {/* Header Section */}
        <div className="text-center mb-16 animate-fade-in-up">
          <div className="inline-block">
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center px-6 py-3 bg-emerald-500/10 backdrop-blur-sm border border-emerald-500/20 text-emerald-300 rounded-full text-sm font-medium mb-8 animate-pulse-glow"
            >
              <Handshake className="w-4 h-4 mr-2" />
              Strategic Partnerships
            </motion.div>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 bg-gradient-to-r from-emerald-300 via-green-300 to-emerald-400 bg-clip-text text-transparent animate-gradient-shift">
            Strategic Moats: Partnership Network
          </h2>
          <div className="text-lg md:text-xl text-emerald-100/90 max-w-4xl mx-auto font-light mb-8">
            Platform Integrations Create Competitive Barriers
          </div>
          <div className="w-24 h-1 bg-gradient-to-r from-emerald-400 to-green-400 mx-auto rounded-full animate-pulse-glow"></div>
        </div>

        {/* Tier 1 Partners Section */}
        <div
          className="text-center mb-16 animate-fade-in-up"
          style={{ animationDelay: "400ms" }}
        >
          <motion.h3
            className="text-2xl md:text-3xl font-bold text-white mb-8 bg-gradient-to-r from-emerald-300 to-green-300 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            Tier 1 Strategic Partners:
          </motion.h3>
        </div>

        {/* Tier 1 Partners Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 justify-center items-stretch gap-8 mb-16 h-full">
          {[
            {
              name: "Bubble.io",
              desc: "No-Code Platform",
              img: <BubbleSvg />,
              note: "25% revenue share, 500K+ users",
            },
            {
              name: "Supabase",
              desc: "Backend-as-a-Service",
              img: <SupabaseSvg />,
              note: "Real-time integration, 100K+ developers",
            },
            {
              name: "Vercel",
              desc: "Frontend Deployment",
              img: <VercelSvg />,
              note: "Developer-first platform, 1M+ sites",
            },
          ].map((partner, index) => (
            <motion.div
              key={partner.name}
              initial={{ opacity: 0, y: 60, scale: 0.9, rotateY: -15 }}
              animate={{ opacity: 1, y: 0, scale: 1, rotateY: 0 }}
              transition={{
                duration: 0.8,
                delay: index * 0.2,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              whileHover={{
                y: -15,
                scale: 1.05,
                rotateY: 5,
                transition: {
                  duration: 0.4,
                  ease: "easeOut",
                },
              }}
              whileTap={{
                scale: 0.98,
                transition: { duration: 0.1 },
              }}
              className="group relative overflow-hidden bg-white/5 backdrop-blur-xl rounded-2xl p-6 text-center border border-emerald-500/20 shadow-2xl flex flex-col items-center h-full"
            >
              {/* Enhanced Animated Background */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                whileHover={{ opacity: 1 }}
              />

              {/* Floating particles effect */}
              <motion.div
                className="absolute inset-0 overflow-hidden rounded-2xl"
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
              >
                <motion.div
                  className="absolute top-4 left-4 w-2 h-2 bg-emerald-400/30 rounded-full"
                  animate={{
                    y: [0, -20, 0],
                    opacity: [0.3, 0.8, 0.3],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: index * 0.5,
                  }}
                />
                <motion.div
                  className="absolute bottom-6 right-6 w-1 h-1 bg-green-400/40 rounded-full"
                  animate={{
                    y: [0, 15, 0],
                    opacity: [0.4, 0.9, 0.4],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    delay: index * 0.7,
                  }}
                />
              </motion.div>

              <div className="relative z-10">
                <div className={`${partner.name !== "Microsoft" ? "p-9" : ""}`}>
                  {partner.img}
                </div>
                <motion.div
                  className="text-2xl font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.2 + 0.3, duration: 0.6 }}
                  whileHover={{
                    scale: 1.1,
                    transition: { duration: 0.3 },
                  }}
                >
                  {partner.name}
                </motion.div>
                <motion.div
                  className="text-emerald-300 font-semibold mb-2 text-lg"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.2 + 0.4, duration: 0.6 }}
                >
                  {partner.desc}
                </motion.div>
                <motion.div
                  className="text-emerald-100/80 text-sm group-hover:text-emerald-300 transition-colors"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.2 + 0.5, duration: 0.6 }}
                >
                  {partner.note}
                </motion.div>
              </div>

              {/* Enhanced Hover Effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 to-green-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
                whileHover={{ opacity: 1 }}
              />

              {/* Glow effect */}
              <motion.div
                className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                whileHover={{ opacity: 1 }}
              />

              {/* Border animation */}
              <motion.div
                className="absolute inset-0 rounded-2xl border-2 border-transparent"
                whileHover={{
                  borderColor: "rgba(16, 185, 129, 0.3)",
                  transition: { duration: 0.3 },
                }}
              />
            </motion.div>
          ))}
        </div>
        {/* Tier 2 Partners Section */}
        <div
          className="text-center mb-16 animate-fade-in-up"
          style={{ animationDelay: "800ms" }}
        >
          <motion.h3
            className="text-2xl md:text-3xl font-bold text-white mb-8 bg-gradient-to-r from-emerald-300 to-green-300 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
          >
            Tier 2 Enterprise Partners:
          </motion.h3>
        </div>

        {/* Tier 2 Partners Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 justify-center items-stretch gap-8 mb-16 h-full">
          {[
            {
              name: "Microsoft",
              desc: "Power Platform",
              img: <MicrosoftSvg />,
              note: "Enterprise market validation",
            },
            {
              name: "Salesforce",
              desc: "CRM Integration",
              img: <SalesforceSvg />,
              note: "Enterprise customer access",
            },
            {
              name: "AWS Amplify",
              desc: "Cloud Infrastructure",
              img: <AWSSvg />,
              note: "Enterprise cloud deployment",
            },
          ].map((partner, index) => (
            <motion.div
              key={partner.name}
              initial={{ opacity: 0, y: 60, scale: 0.9, rotateY: -15 }}
              animate={{ opacity: 1, y: 0, scale: 1, rotateY: 0 }}
              transition={{
                duration: 0.8,
                delay: index * 0.2,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              whileHover={{
                y: -15,
                scale: 1.05,
                rotateY: 5,
                transition: {
                  duration: 0.4,
                  ease: "easeOut",
                },
              }}
              whileTap={{
                scale: 0.98,
                transition: { duration: 0.1 },
              }}
              className="group relative overflow-hidden bg-white/5 backdrop-blur-xl rounded-2xl p-6 text-center border border-emerald-500/20 shadow-2xl flex flex-col items-center h-full"
            >
              {/* Enhanced Animated Background */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                whileHover={{ opacity: 1 }}
              />

              {/* Floating particles effect */}
              <motion.div
                className="absolute inset-0 overflow-hidden rounded-2xl"
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
              >
                <motion.div
                  className="absolute top-4 left-4 w-2 h-2 bg-emerald-400/30 rounded-full"
                  animate={{
                    y: [0, -20, 0],
                    opacity: [0.3, 0.8, 0.3],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: index * 0.5,
                  }}
                />
                <motion.div
                  className="absolute bottom-6 right-6 w-1 h-1 bg-green-400/40 rounded-full"
                  animate={{
                    y: [0, 15, 0],
                    opacity: [0.4, 0.9, 0.4],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    delay: index * 0.7,
                  }}
                />
              </motion.div>

              <div className="relative z-10">
                <div className={`${partner.name !== "Microsoft" ? "p-9" : ""}`}>
                  {partner.img}
                </div>
                <motion.div
                  className="text-2xl font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.2 + 0.3, duration: 0.6 }}
                  whileHover={{
                    scale: 1.1,
                    transition: { duration: 0.3 },
                  }}
                >
                  {partner.name}
                </motion.div>
                <motion.div
                  className="text-emerald-300 font-semibold mb-2 text-lg"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.2 + 0.4, duration: 0.6 }}
                >
                  {partner.desc}
                </motion.div>
                <motion.div
                  className="text-emerald-100/80 text-sm group-hover:text-emerald-300 transition-colors"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.2 + 0.5, duration: 0.6 }}
                >
                  {partner.note}
                </motion.div>
              </div>

              {/* Enhanced Hover Effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 to-green-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
                whileHover={{ opacity: 1 }}
              />

              {/* Glow effect */}
              <motion.div
                className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                whileHover={{ opacity: 1 }}
              />

              {/* Border animation */}
              <motion.div
                className="absolute inset-0 rounded-2xl border-2 border-transparent"
                whileHover={{
                  borderColor: "rgba(16, 185, 129, 0.3)",
                  transition: { duration: 0.3 },
                }}
              />
            </motion.div>
          ))}
        </div>
        {/* Revenue Impact Section */}
        <div
          className="text-center mb-16 animate-fade-in-up"
          style={{ animationDelay: "1200ms" }}
        >
          <motion.h3
            className="text-3xl md:text-4xl font-bold text-white mb-8 bg-gradient-to-r from-emerald-300 to-green-300 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.4 }}
          >
            Partnership Revenue Impact:
          </motion.h3>
        </div>

        {/* Revenue Impact Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-6xl mx-auto mb-16">
          {[
            { label: "Platform Partner Revenue Share", value: "25%" },
            { label: "White-label Setup Fees", value: "$25K" },
            { label: "Marketplace Commission", value: "15%" },
            { label: "Annual Partner Revenue", value: "$200K" },
          ].map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 60, scale: 0.9, rotateY: -15 }}
              animate={{ opacity: 1, y: 0, scale: 1, rotateY: 0 }}
              transition={{
                duration: 0.8,
                delay: index * 0.15,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              whileHover={{
                y: -15,
                scale: 1.05,
                rotateY: 5,
                transition: {
                  duration: 0.4,
                  ease: "easeOut",
                },
              }}
              whileTap={{
                scale: 0.98,
                transition: { duration: 0.1 },
              }}
              className="group relative overflow-hidden bg-white/5 backdrop-blur-xl rounded-2xl p-6 text-center border border-emerald-500/20 shadow-2xl h-full flex flex-col justify-center"
            >
              {/* Enhanced Animated Background */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                whileHover={{ opacity: 1 }}
              />

              {/* Floating particles effect */}
              <motion.div
                className="absolute inset-0 overflow-hidden rounded-2xl"
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
              >
                <motion.div
                  className="absolute top-4 left-4 w-2 h-2 bg-emerald-400/30 rounded-full"
                  animate={{
                    y: [0, -20, 0],
                    opacity: [0.3, 0.8, 0.3],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: index * 0.5,
                  }}
                />
                <motion.div
                  className="absolute bottom-6 right-6 w-1 h-1 bg-green-400/40 rounded-full"
                  animate={{
                    y: [0, 15, 0],
                    opacity: [0.4, 0.9, 0.4],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    delay: index * 0.7,
                  }}
                />
              </motion.div>

              <div className="relative z-10">
                <motion.div
                  className="text-4xl font-bold text-emerald-400 mb-3 group-hover:text-emerald-300 transition-colors"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.15 + 0.3, duration: 0.6 }}
                  whileHover={{
                    scale: 1.1,
                    transition: { duration: 0.3 },
                  }}
                >
                  {item.value}
                </motion.div>
                <motion.div
                  className="text-emerald-100/90 text-sm group-hover:text-emerald-300 transition-colors"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.15 + 0.5, duration: 0.6 }}
                >
                  {item.label}
                </motion.div>
              </div>

              {/* Enhanced Hover Effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 to-green-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
                whileHover={{ opacity: 1 }}
              />

              {/* Glow effect */}
              <motion.div
                className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                whileHover={{ opacity: 1 }}
              />

              {/* Border animation */}
              <motion.div
                className="absolute inset-0 rounded-2xl border-2 border-transparent"
                whileHover={{
                  borderColor: "rgba(16, 185, 129, 0.3)",
                  transition: { duration: 0.3 },
                }}
              />
            </motion.div>
          ))}
        </div>
        {/* Strategic Value Proposition */}
        <div
          className="animate-fade-in-up"
          style={{ animationDelay: "1600ms" }}
        >
          <div className="relative overflow-hidden">
            <motion.div
              className="bg-gradient-to-r from-emerald-600/90 via-green-600/90 to-emerald-600/90 backdrop-blur-xl rounded-3xl p-10 text-white text-center max-w-6xl mx-auto border border-emerald-400/50 shadow-2xl"
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: 1.8 }}
            >
              <div className="relative z-10">
                <div className="inline-block mb-6">
                  <div className="bg-white/10 backdrop-blur-xl rounded-full px-6 py-2 border border-white/20">
                    <span className="text-emerald-200 font-semibold text-sm uppercase tracking-wider">
                      Strategic Value
                    </span>
                  </div>
                </div>
                <p className="text-xl md:text-2xl leading-relaxed">
                  Through strategic partnerships, we gain more than revenue; we
                  secure vital distribution channels and build a defensive moat
                  by deeply integrating
                  <span className="font-bold text-emerald-200">
                    {" "}
                    SprintiQ™{" "}
                  </span>
                  into the development ecosystem.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>,
    // Slide 9
    <section
      key="slide-9"
      className="w-full max-w-7xl mx-auto animate-slide-transition relative"
    >
      {/* Main Content */}
      <div className="relative z-10">
        {/* Header Section */}
        <div className="text-center mb-16 animate-fade-in-up">
          <div className="inline-block">
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center px-6 py-3 bg-emerald-500/10 backdrop-blur-sm border border-emerald-500/20 text-emerald-300 rounded-full text-sm font-medium mb-8 animate-pulse-glow"
            >
              <Crown className="w-4 h-4 mr-2" />
              Competitive Advantage
            </motion.div>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 bg-gradient-to-r from-emerald-300 via-green-300 to-emerald-400 bg-clip-text text-transparent animate-gradient-shift">
            Why SprintiQ™ Wins: Competitive Moats
          </h2>
          <div className="text-lg md:text-xl text-emerald-100/90 max-w-4xl mx-auto font-light mb-8">
            First-Mover Advantage in a Blue Ocean Market
          </div>
          <div className="w-24 h-1 bg-gradient-to-r from-emerald-400 to-green-400 mx-auto rounded-full animate-pulse-glow"></div>
        </div>
        {/* Competitive Analysis Table */}
        <div
          className="animate-fade-in-up mb-16"
          style={{ animationDelay: "400ms" }}
        >
          <div className="investor-glass rounded-3xl p-8 max-w-6xl mx-auto border border-emerald-500/20 shadow-2xl">
            <motion.table
              className="min-w-[700px] w-full text-white border-separate border-spacing-y-2 rounded-2xl overflow-hidden"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <thead>
                <tr className="bg-gradient-to-r from-emerald-800/90 to-green-800/90 backdrop-blur-sm">
                  <th className="p-6 text-left font-bold text-lg text-emerald-200 border-b border-emerald-600/50">
                    Competitor
                  </th>
                  <th className="p-6 text-left font-bold text-lg text-emerald-200 border-b border-emerald-600/50">
                    Their Strength
                  </th>
                  <th className="p-6 text-left font-bold text-lg text-emerald-200 border-b border-emerald-600/50">
                    Fatal Weakness
                  </th>
                  <th className="p-6 text-left font-bold text-lg text-emerald-200 border-b border-emerald-600/50">
                    SprintiQ™ Advantage
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  [
                    "Linear/Jira",
                    "Market leader, enterprise adoption",
                    "No design/dev integration",
                    "Complete workflow automation",
                  ],
                  [
                    "Figma",
                    "Design collaboration leader",
                    "No planning/dev integration",
                    "AI-generated designs from stories",
                  ],
                  [
                    "GitHub Copilot",
                    "Code generation, dev adoption",
                    "No planning/design integration",
                    "Complete project context",
                  ],
                  [
                    "Bubble.io",
                    "Visual development",
                    "Limited enterprise features",
                    "Enterprise-grade with AI planning",
                  ],
                ].map((row, rowIndex) => (
                  <tr
                    key={row[0]}
                    className="group bg-white/5 hover:bg-white/10 transition-all duration-300 border-b border-emerald-500/10 last:border-b-0"
                  >
                    {row.map((cell, j) => (
                      <td
                        key={j}
                        className={`p-6 text-emerald-100/90 font-medium text-lg transition-colors duration-300 ${
                          j === 0 ? "font-semibold text-emerald-300" : ""
                        } ${j === 1 ? "text-emerald-200" : ""} ${
                          j === 2 ? "text-emerald-200" : ""
                        } ${j === 3 ? "text-green-300 font-semibold" : ""}`}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </motion.table>
          </div>
        </div>
        {/* Defensive Moats Section */}
        <div
          className="text-center mb-16 animate-fade-in-up"
          style={{ animationDelay: "800ms" }}
        >
          <motion.h3
            className="text-3xl md:text-4xl font-bold text-white mb-8 bg-gradient-to-r from-emerald-300 to-green-300 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
          >
            Our Unbeatable Defensive Moats:
          </motion.h3>
        </div>

        {/* Defensive Moats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-6xl mx-auto mb-16">
          {[
            { label: "First-Mover Advantage", value: "1st" },
            { label: "Multi-Agent Orchestration", value: "5-Agent" },
            { label: "Platform Integrations", value: "15+" },
            { label: "AI Model Accuracy", value: "99.9%" },
          ].map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 60, scale: 0.9, rotateY: -15 }}
              animate={{ opacity: 1, y: 0, scale: 1, rotateY: 0 }}
              transition={{
                duration: 0.8,
                delay: index * 0.15,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              whileHover={{
                y: -15,
                scale: 1.05,
                rotateY: 5,
                transition: {
                  duration: 0.4,
                  ease: "easeOut",
                },
              }}
              whileTap={{
                scale: 0.98,
                transition: { duration: 0.1 },
              }}
              className="group relative overflow-hidden bg-white/5 backdrop-blur-xl rounded-2xl p-6 text-center border border-emerald-500/20 shadow-2xl h-full flex flex-col justify-center"
            >
              {/* Enhanced Animated Background */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                whileHover={{ opacity: 1 }}
              />

              {/* Floating particles effect */}
              <motion.div
                className="absolute inset-0 overflow-hidden rounded-2xl"
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
              >
                <motion.div
                  className="absolute top-4 left-4 w-2 h-2 bg-emerald-400/30 rounded-full"
                  animate={{
                    y: [0, -20, 0],
                    opacity: [0.3, 0.8, 0.3],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: index * 0.5,
                  }}
                />
                <motion.div
                  className="absolute bottom-6 right-6 w-1 h-1 bg-green-400/40 rounded-full"
                  animate={{
                    y: [0, 15, 0],
                    opacity: [0.4, 0.9, 0.4],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    delay: index * 0.7,
                  }}
                />
              </motion.div>

              <div className="relative z-10">
                <motion.div
                  className="text-4xl font-bold text-emerald-400 mb-3 group-hover:text-emerald-300 transition-colors"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.15 + 0.3, duration: 0.6 }}
                  whileHover={{
                    scale: 1.1,
                    transition: { duration: 0.3 },
                  }}
                >
                  {item.value}
                </motion.div>
                <motion.div
                  className="text-emerald-100/90 text-sm group-hover:text-emerald-300 transition-colors"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.15 + 0.5, duration: 0.6 }}
                >
                  {item.label}
                </motion.div>
              </div>

              {/* Enhanced Hover Effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 to-green-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
                whileHover={{ opacity: 1 }}
              />

              {/* Glow effect */}
              <motion.div
                className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                whileHover={{ opacity: 1 }}
              />

              {/* Border animation */}
              <motion.div
                className="absolute inset-0 rounded-2xl border-2 border-transparent"
                whileHover={{
                  borderColor: "rgba(16, 185, 129, 0.3)",
                  transition: { duration: 0.3 },
                }}
              />
            </motion.div>
          ))}
        </div>
        {/* Competitive Reality Proposition */}
        <div
          className="animate-fade-in-up"
          style={{ animationDelay: "1200ms" }}
        >
          <div className="relative overflow-hidden">
            <motion.div
              className="bg-gradient-to-r from-emerald-600/90 via-green-600/90 to-emerald-600/90 backdrop-blur-xl rounded-3xl p-10 text-white text-center max-w-6xl mx-auto border border-emerald-400/50 shadow-2xl"
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: 1.6 }}
            >
              <div className="relative z-10">
                <div className="inline-block mb-6">
                  <div className="bg-white/10 backdrop-blur-xl rounded-full px-6 py-2 border border-white/20">
                    <span className="text-emerald-200 font-semibold text-sm uppercase tracking-wider">
                      The Reality
                    </span>
                  </div>
                </div>
                <p className="text-xl md:text-2xl leading-relaxed">
                  Competitors are focused on protecting their individual
                  features. We see the bigger picture. By creating the first and
                  only platform for complete workflow automation, we are
                  defining a new market and establishing a significant
                  <span className="font-bold text-emerald-200">
                    {" "}
                    first-mover advantage
                  </span>
                  .
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>,
    // Slide 10
    <section
      key="slide-10"
      className="w-full max-w-7xl mx-auto animate-slide-transition relative"
    >
      {/* Main Content */}
      <div className="relative z-10">
        {/* Header Section */}
        <div className="text-center mb-16 animate-fade-in-up">
          <div className="inline-block">
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center px-6 py-3 bg-emerald-500/10 backdrop-blur-sm border border-emerald-500/20 text-emerald-300 rounded-full text-sm font-medium mb-8 animate-pulse-glow"
            >
              <ChartBar className="w-4 h-4 mr-2" />
              Financial Projections
            </motion.div>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 bg-gradient-to-r from-emerald-300 via-green-300 to-emerald-400 bg-clip-text text-transparent animate-gradient-shift">
            Financial Model: Path to $126K ARR
          </h2>
          <div className="text-lg md:text-xl text-emerald-100/90 max-w-4xl mx-auto font-light mb-8">
            Conservative Projections with Exponential Upside
          </div>
          <div className="w-24 h-1 bg-gradient-to-r from-emerald-400 to-green-400 mx-auto rounded-full animate-pulse-glow"></div>
        </div>
        {/* Financial Projections Table */}
        <div
          className="animate-fade-in-up mb-16"
          style={{ animationDelay: "400ms" }}
        >
          <div className="investor-glass rounded-3xl p-8 max-w-6xl mx-auto border border-emerald-500/20 shadow-2xl">
            <motion.table
              className="min-w-[700px] w-full text-white border-separate border-spacing-y-2 rounded-2xl overflow-hidden"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <thead>
                <tr className="bg-gradient-to-r from-emerald-800/90 to-green-800/90 backdrop-blur-sm">
                  <th className="p-6 text-left font-bold text-lg text-emerald-200 border-b border-emerald-600/50">
                    Timeframe
                  </th>
                  <th className="p-6 text-left font-bold text-lg text-emerald-200 border-b border-emerald-600/50">
                    Users
                  </th>
                  <th className="p-6 text-left font-bold text-lg text-emerald-200 border-b border-emerald-600/50">
                    Customers
                  </th>
                  <th className="p-6 text-left font-bold text-lg text-emerald-200 border-b border-emerald-600/50">
                    MRR
                  </th>
                  <th className="p-6 text-left font-bold text-lg text-emerald-200 border-b border-emerald-600/50">
                    ARR
                  </th>
                  <th className="p-6 text-left font-bold text-lg text-emerald-200 border-b border-emerald-600/50">
                    Key Milestone
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  [
                    "Month 1-6",
                    "425",
                    "45",
                    "$1,044",
                    "$12,528",
                    "Product-Market Fit",
                  ],
                  [
                    "Month 7-12",
                    "1,825",
                    "255",
                    "$6,760",
                    "$81,120",
                    "Multi-Agent Validation",
                  ],
                  [
                    "Month 13-14",
                    "2,575",
                    "335",
                    "$10,500",
                    "$126,000",
                    "Complete Platform Launch",
                  ],
                ].map((row, rowIndex) => (
                  <tr
                    key={row[0]}
                    className="group bg-white/5 hover:bg-white/10 transition-all duration-300 border-b border-emerald-500/10 last:border-b-0"
                  >
                    {row.map((cell, j) => (
                      <td
                        key={j}
                        className={`p-6 text-emerald-100/90 font-medium text-lg transition-colors duration-300 ${
                          j === 0 ? "font-semibold text-emerald-300" : ""
                        } ${j === 3 ? "text-emerald-200" : ""} ${
                          j === 4 ? "text-green-300 font-semibold" : ""
                        } ${j === 5 ? "text-emerald-200" : ""}`}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </motion.table>
          </div>
        </div>
        {/* 5-Year Vision Section */}
        <div
          className="text-center mb-16 animate-fade-in-up"
          style={{ animationDelay: "800ms" }}
        >
          <motion.h3
            className="text-3xl md:text-4xl font-bold text-white mb-8 bg-gradient-to-r from-emerald-300 to-green-300 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
          >
            5-Year Vision
          </motion.h3>
        </div>

        {/* 5-Year Vision Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-6xl mx-auto mb-16">
          {[
            { label: "Conservative ($1M funding)", value: "$15M" },
            { label: "Moderate ($12M funding)", value: "$31.5M" },
            { label: "Aggressive ($30M funding)", value: "$45M" },
            { label: "Gross Margin", value: "73%" },
          ].map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 60, scale: 0.9, rotateY: -15 }}
              animate={{ opacity: 1, y: 0, scale: 1, rotateY: 0 }}
              transition={{
                duration: 0.8,
                delay: index * 0.15,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              whileHover={{
                y: -15,
                scale: 1.05,
                rotateY: 5,
                transition: {
                  duration: 0.4,
                  ease: "easeOut",
                },
              }}
              whileTap={{
                scale: 0.98,
                transition: { duration: 0.1 },
              }}
              className="group relative overflow-hidden bg-white/5 backdrop-blur-xl rounded-2xl p-6 text-center border border-emerald-500/20 shadow-2xl h-full flex flex-col justify-center"
            >
              {/* Enhanced Animated Background */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                whileHover={{ opacity: 1 }}
              />

              {/* Floating particles effect */}
              <motion.div
                className="absolute inset-0 overflow-hidden rounded-2xl"
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
              >
                <motion.div
                  className="absolute top-4 left-4 w-2 h-2 bg-emerald-400/30 rounded-full"
                  animate={{
                    y: [0, -20, 0],
                    opacity: [0.3, 0.8, 0.3],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: index * 0.5,
                  }}
                />
                <motion.div
                  className="absolute bottom-6 right-6 w-1 h-1 bg-green-400/40 rounded-full"
                  animate={{
                    y: [0, 15, 0],
                    opacity: [0.4, 0.9, 0.4],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    delay: index * 0.7,
                  }}
                />
              </motion.div>

              <div className="relative z-10">
                <motion.div
                  className="text-4xl font-bold text-emerald-400 mb-3 group-hover:text-emerald-300 transition-colors"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.15 + 0.3, duration: 0.6 }}
                  whileHover={{
                    scale: 1.1,
                    transition: { duration: 0.3 },
                  }}
                >
                  {item.value}
                </motion.div>
                <motion.div
                  className="text-emerald-100/90 text-sm group-hover:text-emerald-300 transition-colors"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.15 + 0.5, duration: 0.6 }}
                >
                  {item.label}
                </motion.div>
              </div>

              {/* Enhanced Hover Effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 to-green-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
                whileHover={{ opacity: 1 }}
              />

              {/* Glow effect */}
              <motion.div
                className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                whileHover={{ opacity: 1 }}
              />

              {/* Border animation */}
              <motion.div
                className="absolute inset-0 rounded-2xl border-2 border-transparent"
                whileHover={{
                  borderColor: "rgba(16, 185, 129, 0.3)",
                  transition: { duration: 0.3 },
                }}
              />
            </motion.div>
          ))}
        </div>

        {/* Investment Thesis Proposition */}
        <div
          className="animate-fade-in-up"
          style={{ animationDelay: "1200ms" }}
        >
          <div className="relative overflow-hidden">
            <motion.div
              className="bg-gradient-to-r from-emerald-600/90 via-green-600/90 to-emerald-600/90 backdrop-blur-xl rounded-3xl p-10 text-white text-center max-w-6xl mx-auto border border-emerald-400/50 shadow-2xl"
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: 1.6 }}
            >
              <div className="relative z-10">
                <div className="inline-block mb-6">
                  <div className="bg-white/10 backdrop-blur-xl rounded-full px-6 py-2 border border-white/20">
                    <span className="text-emerald-200 font-semibold text-sm uppercase tracking-wider">
                      Investment Thesis
                    </span>
                  </div>
                </div>
                <p className="text-xl md:text-2xl leading-relaxed">
                  SprintiQ™ combines the explosive potential of category
                  creation with the safety of best-in-class PaaS metrics. Our
                  44x LTV/CAC and 135% net revenue retention signal a rare
                  opportunity to invest in a venture-scale business with a
                  highly predictable and profitable model.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>,
    // Slide 11
    <section
      key="slide-11"
      className="w-full max-w-7xl mx-auto animate-slide-transition relative"
    >
      {/* Main Content */}
      <div className="relative z-10">
        {/* Header Section */}
        <div className="text-center mb-16 animate-fade-in-up">
          <div className="inline-block">
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center px-6 py-3 bg-emerald-500/10 backdrop-blur-sm border border-emerald-500/20 text-emerald-300 rounded-full text-sm font-medium mb-8 animate-pulse-glow"
            >
              <Zap className="w-4 h-4 mr-2" />
              Funding Strategy
            </motion.div>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 bg-gradient-to-r from-emerald-300 via-green-300 to-emerald-400 bg-clip-text text-transparent animate-gradient-shift">
            Funding Strategy: $1M to Market Leadership
          </h2>
          <div className="text-lg md:text-xl text-emerald-100/90 max-w-4xl mx-auto font-light mb-8">
            Every Dollar Allocated for Maximum Impact
          </div>
          <div className="w-24 h-1 bg-gradient-to-r from-emerald-400 to-green-400 mx-auto rounded-full animate-pulse-glow"></div>
        </div>
        {/* Funding Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-6xl mx-auto mb-16">
          {[
            { label: "Angel Round (Foundation)", value: "$250K" },
            { label: "Seed Round (Scale)", value: "$750K" },
            { label: "14 Months to Complete Platform", value: "14" },
            { label: "ARR at Completion", value: "$126K" },
          ].map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 60, scale: 0.9, rotateY: -15 }}
              animate={{ opacity: 1, y: 0, scale: 1, rotateY: 0 }}
              transition={{
                duration: 0.8,
                delay: index * 0.15,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              whileHover={{
                y: -15,
                scale: 1.05,
                rotateY: 5,
                transition: {
                  duration: 0.4,
                  ease: "easeOut",
                },
              }}
              whileTap={{
                scale: 0.98,
                transition: { duration: 0.1 },
              }}
              className="group relative overflow-hidden bg-white/5 backdrop-blur-xl rounded-2xl p-6 text-center border border-emerald-500/20 shadow-2xl h-full flex flex-col justify-center"
            >
              {/* Enhanced Animated Background */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                whileHover={{ opacity: 1 }}
              />

              {/* Floating particles effect */}
              <motion.div
                className="absolute inset-0 overflow-hidden rounded-2xl"
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
              >
                <motion.div
                  className="absolute top-4 left-4 w-2 h-2 bg-emerald-400/30 rounded-full"
                  animate={{
                    y: [0, -20, 0],
                    opacity: [0.3, 0.8, 0.3],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: index * 0.5,
                  }}
                />
                <motion.div
                  className="absolute bottom-6 right-6 w-1 h-1 bg-green-400/40 rounded-full"
                  animate={{
                    y: [0, 15, 0],
                    opacity: [0.4, 0.9, 0.4],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    delay: index * 0.7,
                  }}
                />
              </motion.div>

              <div className="relative z-10">
                <motion.div
                  className="text-4xl font-bold text-emerald-400 mb-3 group-hover:text-emerald-300 transition-colors"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.15 + 0.3, duration: 0.6 }}
                  whileHover={{
                    scale: 1.1,
                    transition: { duration: 0.3 },
                  }}
                >
                  {item.value}
                </motion.div>
                <motion.div
                  className="text-emerald-100/90 text-sm group-hover:text-emerald-300 transition-colors"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.15 + 0.5, duration: 0.6 }}
                >
                  {item.label}
                </motion.div>
              </div>

              {/* Enhanced Hover Effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 to-green-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
                whileHover={{ opacity: 1 }}
              />

              {/* Glow effect */}
              <motion.div
                className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                whileHover={{ opacity: 1 }}
              />

              {/* Border animation */}
              <motion.div
                className="absolute inset-0 rounded-2xl border-2 border-transparent"
                whileHover={{
                  borderColor: "rgba(16, 185, 129, 0.3)",
                  transition: { duration: 0.3 },
                }}
              />
            </motion.div>
          ))}
        </div>
        {/* Capital Allocation Section */}
        <div
          className="text-center mb-16 animate-fade-in-up"
          style={{ animationDelay: "800ms" }}
        >
          <motion.h3
            className="text-3xl md:text-4xl font-bold text-white mb-8 bg-gradient-to-r from-emerald-300 to-green-300 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
          >
            Capital Allocation Strategy:
          </motion.h3>
        </div>

        {/* Capital Allocation List */}
        <div className="space-y-8 max-w-4xl mx-auto mb-16">
          {[
            {
              num: "40",
              title: "Product Development ($400K)",
              desc: "5-agent AI development (Radar, Turbo, Zen, Sync, Glide), enterprise security, platform integrations—the core technology that creates our moat",
            },
            {
              num: "30",
              title: "Sales & Marketing ($300K)",
              desc: "Enterprise sales team, developer advocacy, content marketing, strategic partnerships—building the SprintiQ™ brand and customer base",
            },
            {
              num: "20",
              title: "Infrastructure & Operations ($200K)",
              desc: "Cloud infrastructure, legal compliance, enterprise security, operational excellence—foundation for scale",
            },
            {
              num: "10",
              title: "Growth Buffer ($100K)",
              desc: "Strategic contingency for accelerated hiring, market opportunities, competitive responses—ensuring agile execution",
            },
          ].map((step, index) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 1.2 + index * 0.1 }}
              whileHover={{
                x: 10,
                transition: { duration: 0.3 },
              }}
              className="flex items-center gap-6 bg-white/5 backdrop-blur-xl rounded-2xl p-6 border-l-4 border-emerald-400 shadow-2xl hover:shadow-emerald-500/20 transition-all duration-300"
            >
              <motion.div
                className="flex-shrink-0 w-14 h-14 flex items-center justify-center rounded-full bg-emerald-700 text-white text-2xl font-bold border-2 border-emerald-400"
                whileHover={{
                  scale: 1.1,
                  transition: { duration: 0.3 },
                }}
              >
                {step.num} <span className="text-xs">%</span>
              </motion.div>
              <div>
                <motion.div
                  className="font-semibold text-white mb-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 + index * 0.1 + 0.2, duration: 0.6 }}
                >
                  {step.title}
                </motion.div>
                <motion.div
                  className="text-emerald-100/90 text-lg"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 + index * 0.1 + 0.4, duration: 0.6 }}
                >
                  {step.desc}
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ROI Promise Proposition */}
        <div
          className="animate-fade-in-up"
          style={{ animationDelay: "1600ms" }}
        >
          <div className="relative overflow-hidden">
            <motion.div
              className="bg-gradient-to-r from-emerald-600/90 via-green-600/90 to-emerald-600/90 backdrop-blur-xl rounded-3xl p-10 text-white text-center max-w-6xl mx-auto border border-emerald-400/50 shadow-2xl"
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: 1.8 }}
            >
              <div className="relative z-10">
                <div className="inline-block mb-6">
                  <div className="bg-white/10 backdrop-blur-xl rounded-full px-6 py-2 border border-white/20">
                    <span className="text-emerald-200 font-semibold text-sm uppercase tracking-wider">
                      ROI Promise
                    </span>
                  </div>
                </div>
                <p className="text-xl md:text-2xl leading-relaxed">
                  Your $1M investment is the catalyst to complete our Shipyard
                  platform and conservatively achieve $126K in ARR within 12-14
                  months. This milestone positions SprintiQ™ for a $5M+ Series A
                  at a premium 10x+ revenue multiple.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>,
    // Slide 12
    <section
      key="slide-12"
      className="w-full max-w-7xl mx-auto animate-slide-transition relative"
    >
      {/* Main Content */}
      <div className="relative z-10">
        {/* Header Section */}
        <div className="text-center mb-16 animate-fade-in-up">
          <div className="inline-block">
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center px-6 py-3 bg-emerald-500/10 backdrop-blur-sm border border-emerald-500/20 text-emerald-300 rounded-full text-sm font-medium mb-8 animate-pulse-glow"
            >
              <Crown className="w-4 h-4 mr-2" />
              Investment Opportunity
            </motion.div>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 bg-gradient-to-r from-emerald-300 via-green-300 to-emerald-400 bg-clip-text text-transparent animate-gradient-shift">
            Investment Opportunity
          </h2>
          <div className="text-lg md:text-xl text-emerald-100/90 max-w-4xl mx-auto font-light mb-8">
            Join Us in Revolutionizing Product Development
          </div>
          <div className="w-24 h-1 bg-gradient-to-r from-emerald-400 to-green-400 mx-auto rounded-full animate-pulse-glow"></div>
        </div>
        {/* Vision Statement */}
        <div
          className="animate-fade-in-up mb-16"
          style={{ animationDelay: "400ms" }}
        >
          <div className="relative overflow-hidden">
            <motion.div
              className="bg-gradient-to-r from-emerald-600/90 via-green-600/90 to-emerald-600/90 backdrop-blur-xl rounded-3xl p-10 text-white text-center max-w-6xl mx-auto border border-emerald-400/50 shadow-2xl"
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <div className="relative z-10">
                <div className="inline-block mb-6">
                  <div className="bg-white/10 backdrop-blur-xl rounded-full px-6 py-2 border border-white/20">
                    <span className="text-emerald-200 font-semibold text-sm uppercase tracking-wider">
                      Our Vision
                    </span>
                  </div>
                </div>
                <motion.h3
                  className="text-3xl font-bold mb-6 text-white group-hover:text-emerald-300 transition-colors"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                >
                  We're not just building a product—we're creating an entirely
                  new category of AI-native development platforms
                </motion.h3>
                <motion.p
                  className="text-emerald-100/90 text-xl"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0, duration: 0.6 }}
                >
                  Transform how software is built worldwide with the first
                  complete workflow automation platform
                </motion.p>
              </div>
            </motion.div>
          </div>
        </div>
        {/* What We're Seeking Section */}
        <div
          className="text-center mb-16 animate-fade-in-up"
          style={{ animationDelay: "800ms" }}
        >
          <motion.h3
            className="text-3xl md:text-4xl font-bold text-white mb-8 bg-gradient-to-r from-emerald-300 to-green-300 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
          >
            What We're Seeking:
          </motion.h3>
        </div>

        {/* What We're Seeking Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-6xl mx-auto mb-16">
          {[
            { label: "Angel Round (6 mos validation)", value: "$250K" },
            { label: "Seed Round Growth (7-14 mos)", value: "$750K" },
            { label: "Strategic", value: "Partners" },
            { label: "Enterprise", value: "Customers" },
          ].map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 60, scale: 0.9, rotateY: -15 }}
              animate={{ opacity: 1, y: 0, scale: 1, rotateY: 0 }}
              transition={{
                duration: 0.8,
                delay: index * 0.15,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              whileHover={{
                y: -15,
                scale: 1.05,
                rotateY: 5,
                transition: {
                  duration: 0.4,
                  ease: "easeOut",
                },
              }}
              whileTap={{
                scale: 0.98,
                transition: { duration: 0.1 },
              }}
              className="group relative overflow-hidden bg-white/5 backdrop-blur-xl rounded-2xl p-6 text-center border border-emerald-500/20 shadow-2xl h-full flex flex-col justify-center"
            >
              {/* Enhanced Animated Background */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                whileHover={{ opacity: 1 }}
              />

              {/* Floating particles effect */}
              <motion.div
                className="absolute inset-0 overflow-hidden rounded-2xl"
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
              >
                <motion.div
                  className="absolute top-4 left-4 w-2 h-2 bg-emerald-400/30 rounded-full"
                  animate={{
                    y: [0, -20, 0],
                    opacity: [0.3, 0.8, 0.3],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: index * 0.5,
                  }}
                />
                <motion.div
                  className="absolute bottom-6 right-6 w-1 h-1 bg-green-400/40 rounded-full"
                  animate={{
                    y: [0, 15, 0],
                    opacity: [0.4, 0.9, 0.4],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    delay: index * 0.7,
                  }}
                />
              </motion.div>

              <div className="relative z-10">
                <motion.div
                  className="text-4xl font-bold text-emerald-400 mb-3 group-hover:text-emerald-300 transition-colors"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.15 + 0.3, duration: 0.6 }}
                  whileHover={{
                    scale: 1.1,
                    transition: { duration: 0.3 },
                  }}
                >
                  {item.value}
                </motion.div>
                <motion.div
                  className="text-emerald-100/90 text-lg group-hover:text-emerald-300 transition-colors"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.15 + 0.5, duration: 0.6 }}
                >
                  {item.label}
                </motion.div>
              </div>

              {/* Enhanced Hover Effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 to-green-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
                whileHover={{ opacity: 1 }}
              />

              {/* Glow effect */}
              <motion.div
                className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                whileHover={{ opacity: 1 }}
              />

              {/* Border animation */}
              <motion.div
                className="absolute inset-0 rounded-2xl border-2 border-transparent"
                whileHover={{
                  borderColor: "rgba(16, 185, 129, 0.3)",
                  transition: { duration: 0.3 },
                }}
              />
            </motion.div>
          ))}
        </div>
        {/* Why Invest Now Section */}
        <div
          className="text-center mb-16 animate-fade-in-up"
          style={{ animationDelay: "1200ms" }}
        >
          <motion.h3
            className="text-3xl md:text-4xl font-bold text-white mb-8 bg-gradient-to-r from-emerald-300 to-green-300 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.4 }}
          >
            Why Invest Now:
          </motion.h3>
        </div>

        {/* Why Invest Now List */}
        <div className="space-y-8 max-w-4xl mx-auto mb-16">
          {[
            {
              icon: <RocketSvg color="#A7F3D0" />,
              title: "Massive Market Opportunity",
              desc: "$122B converging market with perfect timing",
            },
            {
              icon: <TeamSvg color="#A7F3D0" />,
              title: "Proven Team & Technology",
              desc: "Experienced team with working MVP and early validation",
            },
            {
              icon: <BadgeSvg color="#A7F3D0" />,
              title: "First-Mover Advantage",
              desc: "Creating new category with defensive moats",
            },
            {
              icon: <PartnershipSvg color="#A7F3D0" />,
              title: "Exceptional Exit Potential",
              desc: "Strategic value to Microsoft, Salesforce, Atlassian",
            },
          ].map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 1.6 + index * 0.1 }}
              whileHover={{
                x: 10,
                transition: { duration: 0.3 },
              }}
              className="flex items-center gap-6 bg-white/5 backdrop-blur-xl rounded-2xl p-6 border-l-4 border-emerald-400 shadow-2xl hover:shadow-emerald-500/20 transition-all duration-300"
            >
              <motion.div
                className="flex-shrink-0 w-14 h-14 p-2 flex items-center justify-center rounded-full bg-emerald-700 text-white text-3xl font-bold border-2 border-emerald-400"
                whileHover={{
                  scale: 1.1,
                  transition: { duration: 0.3 },
                }}
              >
                {step.icon}
              </motion.div>
              <div>
                <motion.div
                  className="font-semibold text-white mb-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.6 + index * 0.1 + 0.2, duration: 0.6 }}
                >
                  {step.title}
                </motion.div>
                <motion.div
                  className="text-emerald-100/90 text-lg"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.6 + index * 0.1 + 0.4, duration: 0.6 }}
                >
                  {step.desc}
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Call to Action Buttons */}
        <div className="flex flex-col md:flex-row justify-center items-center gap-8 mb-16">
          <motion.a
            href="mailto:jeffrey@sprintiq.com"
            className="bg-gradient-to-r from-emerald-600 to-green-500 text-white px-10 py-4 rounded-full font-bold shadow-2xl hover:from-emerald-700 hover:to-green-600 transition-all text-xl"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 2.0 }}
            whileHover={{
              scale: 1.05,
              transition: { duration: 0.3 },
            }}
          >
            Schedule Demo
          </motion.a>
          <motion.a
            href="mailto:david@sprintiq.com"
            className="bg-gradient-to-r from-emerald-600 to-green-500 text-white px-10 py-4 rounded-full font-bold shadow-2xl hover:from-emerald-700 hover:to-green-600 transition-all text-xl"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 2.2 }}
            whileHover={{
              scale: 1.05,
              transition: { duration: 0.3 },
            }}
          >
            Technical Deep Dive
          </motion.a>
        </div>

        {/* Contact Information */}
        <motion.div
          className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 text-center text-emerald-100/90 max-w-6xl mx-auto border border-emerald-500/20 shadow-2xl"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 2.4 }}
        >
          <span className="font-semibold text-white">Contact:</span>{" "}
          jeffrey@sprintiq.com | david@sprintiq.com | www.sprintiq.com
        </motion.div>
      </div>
    </section>,
  ];

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setCurrentSlide((s) => Math.max(0, s - 1));
      } else if (e.key === "ArrowRight") {
        setCurrentSlide((s) => Math.min(slides.length - 1, s + 1));
      } else if (e.key === " ") {
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [slides.length]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 overflow-hidden">
      <Navbar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

      <main className="pt-32 pb-16">
        {/* Hero Section */}
        <section className="text-center mb-12 px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 animate-gradient-shift bg-gradient-to-r from-white via-emerald-100 to-emerald-300 bg-clip-text text-transparent">
              SprintiQ™ Shipyard Ecosystem
            </h1>
            <div className="text-lg md:text-xl text-emerald-100/90 max-w-3xl mx-auto mb-8 italic font-light">
              The World's First Complete AI-Native Product Development Platform
            </div>
          </div>
        </section>

        {/* Slides Container */}
        <div className="relative max-w-7xl mx-auto px-4">
          <div className="min-h-[600px] flex items-center justify-center">
            <div className="w-full animate-fade-in-up">
              {slides[currentSlide]}
            </div>
          </div>
        </div>

        {/* Enhanced Navigation */}
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-40">
          <div className="bg-black/40 backdrop-blur-xl rounded-full px-6 py-3 border border-emerald-500/20 shadow-2xl">
            <div className="flex items-center gap-6">
              <button
                className="p-2 rounded-full bg-emerald-600/80 hover:bg-emerald-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
                onClick={() => setCurrentSlide((s) => Math.max(0, s - 1))}
                disabled={currentSlide === 0}
              >
                <ChevronLeft className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
              </button>

              <div className="text-white font-bold text-lg min-w-[80px] text-center">
                {currentSlide + 1} / {slides.length}
              </div>

              <button
                className="p-2 rounded-full bg-emerald-600/80 hover:bg-emerald-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
                onClick={() =>
                  setCurrentSlide((s) => Math.min(slides.length - 1, s + 1))
                }
                disabled={currentSlide === slides.length - 1}
              >
                <ChevronRight className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Slide Indicators */}
        <div className="fixed bottom-32 left-1/2 transform -translate-x-1/2 z-40">
          <div className="flex gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? "bg-emerald-400 scale-125"
                    : "bg-emerald-400/30 hover:bg-emerald-400/60"
                }`}
                onClick={() => setCurrentSlide(index)}
              />
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
