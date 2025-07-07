"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  Users,
  Target,
  Award,
  Heart,
  Zap,
  Shield,
  Globe,
  TrendingUp,
  Star,
  CheckCircle,
  Linkedin,
  Twitter,
  Github,
} from "lucide-react";
import Navbar from "@/components/landing/layout/navbar";
import Footer from "@/components/landing/layout/footer";

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: "easeOut" },
};

const slideInLeft = {
  initial: { opacity: 0, x: -50 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.8, ease: "easeOut" },
};

const slideInRight = {
  initial: { opacity: 0, x: 50 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.8, ease: "easeOut" },
};

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

const iconVariant = {
  initial: { scale: 0, rotate: -180 },
  animate: { scale: 1, rotate: 0 },
  transition: { duration: 0.6, ease: "easeOut", delay: 0.2 },
};

export default function AboutPage() {
  const team = [
    {
      name: "Sarah Johnson",
      role: "CEO & Co-Founder",
      bio: "Former VP of Engineering at TechCorp with 15+ years in product development",
      image: "/images/avatar/ceo-1.png",
      social: {
        linkedin: "#",
        twitter: "#",
      },
    },
    {
      name: "Michael Chen",
      role: "CTO & Co-Founder",
      bio: "Ex-Google engineer passionate about building scalable systems",
      image: "/images/avatar/ceo-2.png",
      social: {
        linkedin: "#",
        github: "#",
      },
    },
    {
      name: "Emily Rodriguez",
      role: "Head of Product",
      bio: "Product strategist with expertise in user experience and agile methodologies",
      image: "/images/avatar/ceo-3.png",
      social: {
        linkedin: "#",
        twitter: "#",
      },
    },
    {
      name: "David Kim",
      role: "Head of Engineering",
      bio: "Full-stack developer with a passion for clean code and innovative solutions",
      image: "/images/avatar/ceo-1.png",
      social: {
        linkedin: "#",
        github: "#",
      },
    },
  ];

  const values = [
    {
      icon: <Heart className="h-8 w-8 text-white" />,
      title: "Customer First",
      description:
        "Every decision we make starts with our customers. We listen, learn, and build solutions that truly matter.",
    },
    {
      icon: <Shield className="h-8 w-8 text-white" />,
      title: "Trust & Security",
      description:
        "We protect your data like it's our own. Security and privacy are built into everything we do.",
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-white" />,
      title: "Continuous Innovation",
      description:
        "We're always pushing boundaries, exploring new technologies, and improving our platform.",
    },
    {
      icon: <Users className="h-8 w-8 text-white" />,
      title: "Team Collaboration",
      description:
        "Great things happen when teams work together. We build tools that bring people closer.",
    },
  ];

  const milestones = [
    {
      year: "2020",
      title: "Company Founded",
      description: "Started with a vision to revolutionize project management",
    },
    {
      year: "2021",
      title: "First 1,000 Users",
      description: "Reached our first major milestone with early adopters",
    },
    {
      year: "2022",
      title: "Series A Funding",
      description: "Raised $10M to accelerate product development",
    },
    {
      year: "2023",
      title: "10,000+ Teams",
      description: "Crossed 10,000 active teams using SprintiQ daily",
    },
    {
      year: "2024",
      title: "AI Integration",
      description: "Launched AI-powered features for intelligent planning",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500 rounded-full mix-blend-multiply filter blur-xl opacity-20"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.3, 0.2],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute -bottom-40 -left-40 w-80 h-80 bg-green-500 rounded-full mix-blend-multiply filter blur-xl opacity-20"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.3, 0.2, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2,
            }}
          />
          <motion.div
            className="absolute top-40 left-40 w-60 h-60 bg-teal-500 rounded-full mix-blend-multiply filter blur-xl opacity-20"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
          />
        </div>

        <div className="relative container mx-auto px-4 pt-16 z-10">
          <div className="max-w-6xl mx-auto text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center px-6 py-3 bg-emerald-500/10 backdrop-blur-sm border border-emerald-500/20 text-emerald-300 rounded-full text-sm font-medium mb-8 animate-pulse-glow"
            >
              <Star className="w-4 h-4 mr-2" />
              Building the future of project management
            </motion.div>

            {/* Main Heading */}
            <motion.h1
              className="text-6xl md:text-8xl font-bold mb-8"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <motion.span
                className="bg-gradient-to-r from-white via-emerald-100 to-emerald-200 bg-clip-text text-transparent animate-gradient-shift"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                About
              </motion.span>
              <br />
              <motion.span
                className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent animate-gradient-shift"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                SprintiQ
              </motion.span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-xl md:text-2xl text-emerald-100/90 mb-12 max-w-4xl mx-auto leading-relaxed"
            >
              We're on a mission to transform how teams collaborate and deliver
              exceptional results. Our story began with a simple belief: project
              management should empower, not overwhelm.
            </motion.p>

            {/* Stats */}
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
            >
              {[
                { number: "10K+", label: "Active Teams" },
                { number: "50K+", label: "Projects Completed" },
                { number: "99.9%", label: "Uptime" },
                { number: "4.9/5", label: "Customer Rating" },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  variants={cardVariant}
                  whileHover={{ scale: 1.1, y: -5 }}
                  className="text-center animate-bounce-gentle"
                  style={{ animationDelay: `${index * 0.5}s` }}
                >
                  <motion.div
                    className="text-3xl font-bold text-white mb-1"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 200,
                      delay: 0.8 + index * 0.1,
                    }}
                  >
                    {stat.number}
                  </motion.div>
                  <div className="text-emerald-200/80">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-24 px-4 bg-white/5 backdrop-blur-xl">
        <div className="container mx-auto">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <motion.h2
                  className="text-4xl md:text-5xl font-bold text-white mb-6"
                  whileHover={{ scale: 1.02 }}
                >
                  Our{" "}
                  <span className="text-emerald-400 animate-gradient-shift">
                    Mission
                  </span>
                </motion.h2>
                <motion.p
                  className="text-xl text-emerald-100/90 mb-8 leading-relaxed"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                >
                  We believe that great software should feel intuitive,
                  powerful, and delightful to use. That's why we've built
                  SprintiQ from the ground up to be the project management
                  platform that teams actually love using.
                </motion.p>
                <motion.p
                  className="text-lg text-emerald-100/80 mb-8 leading-relaxed"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                >
                  Our mission is to eliminate the friction between great ideas
                  and successful execution. We're building tools that adapt to
                  how teams naturally work, not the other way around.
                </motion.p>
                <motion.div
                  className="flex flex-wrap gap-4"
                  variants={staggerContainer}
                  initial="initial"
                  whileInView="animate"
                  viewport={{ once: true }}
                >
                  {[
                    "User-Centric Design",
                    "Continuous Innovation",
                    "Global Accessibility",
                    "Data Security",
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      variants={cardVariant}
                      whileHover={{ scale: 1.05, y: -2 }}
                      className="flex items-center space-x-2 bg-emerald-500/10 backdrop-blur-sm border border-emerald-500/20 text-emerald-300 rounded-full px-4 py-2 text-sm animate-shimmer"
                    >
                      <motion.div
                        variants={iconVariant}
                        className="animate-check-bounce"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </motion.div>
                      <span>{item}</span>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
              <motion.div
                className="relative"
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <div className="aspect-[4/5] w-full max-w-md mx-auto">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-accent/20 rounded-2xl transform rotate-6"
                    whileHover={{ rotate: 8, scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  />
                  <motion.div
                    className="absolute inset-0 glass-card overflow-hidden rounded-2xl shadow-2xl animate-float"
                    whileHover={{ scale: 1.05, rotate: -2 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Image
                      src="/images/about.png"
                      alt=""
                      width={400}
                      height={400}
                      className="w-full h-full rounded-2xl object-cover"
                    />
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Our{" "}
              <span className="text-emerald-400 animate-gradient-shift">
                Values
              </span>
            </h2>
            <p className="text-xl text-emerald-100/90 max-w-3xl mx-auto">
              The principles that guide everything we do and every decision we
              make
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {values.map((value, index) => (
              <motion.div key={index} variants={cardVariant}>
                <Card className="group p-8 hover:shadow-2xl transition-all duration-500 border-0 bg-white/10 backdrop-blur-xl cursor-pointer relative overflow-hidden border border-emerald-500/20 hover:border-emerald-400/40 animate-fade-in-up">
                  <motion.div
                    whileHover={{ scale: 1.05, y: -10 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <CardContent className="p-0 relative z-10 text-center">
                      <motion.div
                        className="w-16 h-16 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 flex items-center justify-center mb-6 mx-auto animate-pulse-glow"
                        whileHover={{
                          scale: 1.2,
                          rotate: 360,
                          boxShadow: "0 0 30px rgba(16, 185, 129, 0.6)",
                        }}
                        transition={{ duration: 0.6 }}
                      >
                        {value.icon}
                      </motion.div>
                      <motion.h3
                        className="text-xl font-bold text-white mb-3 group-hover:text-emerald-400 transition-colors"
                        whileHover={{ scale: 1.05 }}
                      >
                        {value.title}
                      </motion.h3>
                      <p className="text-emerald-100/80 leading-relaxed">
                        {value.description}
                      </p>
                    </CardContent>
                  </motion.div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-24 px-4 bg-white/5 backdrop-blur-xl">
        <div className="container mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Our{" "}
              <span className="text-emerald-400 animate-gradient-shift">
                Journey
              </span>
            </h2>
            <p className="text-xl text-emerald-100/90 max-w-3xl mx-auto">
              From a small startup to a platform trusted by thousands of teams
              worldwide
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Timeline line */}
              <motion.div
                className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-emerald-500 to-green-600 rounded-full"
                initial={{ scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                style={{ originY: 0 }}
              />

              {milestones.map((milestone, index) => (
                <motion.div
                  key={index}
                  className={`relative flex items-center mb-12 ${
                    index % 2 === 0 ? "flex-row" : "flex-row-reverse"
                  }`}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: index * 0.2 }}
                >
                  <div
                    className={`w-1/2 ${
                      index % 2 === 0 ? "pr-8 text-right" : "pl-8 text-left"
                    }`}
                  >
                    <motion.div
                      className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-emerald-500/20 hover:border-emerald-400/40 transition-all duration-300 animate-shimmer"
                      whileHover={{ scale: 1.05, y: -5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <motion.div
                        className="text-emerald-400 font-bold text-lg mb-2"
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        viewport={{ once: true }}
                        transition={{
                          type: "spring",
                          stiffness: 200,
                          delay: index * 0.2 + 0.3,
                        }}
                      >
                        {milestone.year}
                      </motion.div>
                      <h3 className="text-xl font-bold text-white mb-2">
                        {milestone.title}
                      </h3>
                      <p className="text-emerald-100/80">
                        {milestone.description}
                      </p>
                    </motion.div>
                  </div>

                  {/* Timeline dot */}
                  <motion.div
                    className="absolute left-1/2 transform -translate-x-1/2 w-6 h-6 bg-gradient-to-r from-emerald-500 to-green-600 rounded-full border-4 border-slate-900 z-10 animate-pulse-glow"
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      delay: index * 0.2 + 0.5,
                    }}
                    whileHover={{ scale: 1.5 }}
                  />

                  <div className="w-1/2"></div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Meet Our{" "}
              <span className="text-emerald-400 animate-gradient-shift">
                Team
              </span>
            </h2>
            <p className="text-xl text-emerald-100/90 max-w-3xl mx-auto">
              The passionate individuals behind SprintiQ who are dedicated to
              building the future of project management
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {team.map((member, index) => (
              <motion.div key={index} variants={cardVariant}>
                <Card className="group hover:shadow-2xl transition-all duration-500 border-0 bg-white/10 backdrop-blur-xl cursor-pointer relative overflow-hidden border border-emerald-500/20 hover:border-emerald-400/40 animate-bounce-in">
                  <motion.div
                    whileHover={{ scale: 1.05, y: -10 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <CardContent className="p-6 text-center">
                      <div className="relative mb-6">
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <Image
                            src={member.image}
                            alt={member.name}
                            width={120}
                            height={120}
                            className="rounded-full mx-auto border-4 border-emerald-500/20 group-hover:border-emerald-400/40 transition-all duration-300 animate-float"
                            style={{ animationDelay: `${index * 0.5}s` }}
                          />
                        </motion.div>
                      </div>
                      <motion.h3
                        className="text-xl font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors"
                        whileHover={{ scale: 1.05 }}
                      >
                        {member.name}
                      </motion.h3>
                      <p className="text-emerald-400 font-medium mb-3">
                        {member.role}
                      </p>
                      <p className="text-emerald-100/80 text-sm mb-4 leading-relaxed">
                        {member.bio}
                      </p>
                      <motion.div
                        className="flex justify-center space-x-3"
                        variants={staggerContainer}
                        initial="initial"
                        whileInView="animate"
                        viewport={{ once: true }}
                      >
                        {member.social.linkedin && (
                          <motion.a
                            href={member.social.linkedin}
                            variants={iconVariant}
                            whileHover={{ scale: 1.2, rotate: 360 }}
                            className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center hover:bg-emerald-500/30 transition-colors animate-bounce-gentle"
                          >
                            <Linkedin className="w-4 h-4 text-emerald-400" />
                          </motion.a>
                        )}
                        {member.social.twitter && (
                          <motion.a
                            href={member.social.twitter}
                            variants={iconVariant}
                            whileHover={{ scale: 1.2, rotate: 360 }}
                            className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center hover:bg-emerald-500/30 transition-colors animate-bounce-gentle"
                            style={{ animationDelay: "0.2s" }}
                          >
                            <Twitter className="w-4 h-4 text-emerald-400" />
                          </motion.a>
                        )}
                        {member.social.github && (
                          <motion.a
                            href={member.social.github}
                            variants={iconVariant}
                            whileHover={{ scale: 1.2, rotate: 360 }}
                            className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center hover:bg-emerald-500/30 transition-colors animate-bounce-gentle"
                            style={{ animationDelay: "0.4s" }}
                          >
                            <Github className="w-4 h-4 text-emerald-400" />
                          </motion.a>
                        )}
                      </motion.div>
                    </CardContent>
                  </motion.div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Culture Section */}
      <section className="py-24 px-4 bg-white/5 backdrop-blur-xl">
        <div className="container mx-auto">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <motion.h2
                  className="text-4xl md:text-5xl font-bold text-white mb-6"
                  whileHover={{ scale: 1.02 }}
                >
                  Our{" "}
                  <span className="text-emerald-400 animate-gradient-shift">
                    Culture
                  </span>
                </motion.h2>
                <motion.p
                  className="text-xl text-emerald-100/90 mb-8 leading-relaxed"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                >
                  We're building more than just software – we're creating a
                  culture of innovation, collaboration, and continuous learning.
                  Our team is our greatest asset.
                </motion.p>
                <motion.div
                  className="space-y-6"
                  variants={staggerContainer}
                  initial="initial"
                  whileInView="animate"
                  viewport={{ once: true }}
                >
                  {[
                    {
                      title: "Remote-First",
                      description:
                        "We believe great work happens anywhere. Our distributed team spans across multiple time zones.",
                    },
                    {
                      title: "Learning & Growth",
                      description:
                        "We invest in our team's growth with learning budgets, conferences, and mentorship programs.",
                    },
                    {
                      title: "Work-Life Balance",
                      description:
                        "We practice what we preach – healthy boundaries and sustainable work practices.",
                    },
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      className="flex items-start space-x-4"
                      variants={cardVariant}
                      whileHover={{ x: 10 }}
                    >
                      <motion.div
                        className="w-2 h-2 bg-emerald-400 rounded-full mt-3 flex-shrink-0 animate-pulse-glow"
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.2 }}
                      />
                      <div>
                        <motion.h3
                          className="text-lg font-semibold text-white mb-2"
                          whileHover={{ color: "#10b981" }}
                        >
                          {item.title}
                        </motion.h3>
                        <p className="text-emerald-100/80">
                          {item.description}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
              <motion.div
                className="grid grid-cols-2 gap-6"
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                {[
                  { icon: Award, number: "50+", label: "Team Members" },
                  { icon: Globe, number: "15+", label: "Countries" },
                  { icon: Zap, number: "24/7", label: "Innovation" },
                  { icon: Heart, number: "100%", label: "Passion" },
                ].map((stat, index) => (
                  <motion.div
                    key={index}
                    className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-emerald-500/20 text-center animate-bounce-in"
                    style={{ animationDelay: `${index * 0.2}s` }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <motion.div
                      whileHover={{ scale: 1.2, rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      <stat.icon className="h-12 w-12 text-emerald-400 mx-auto mb-4 animate-float" />
                    </motion.div>
                    <motion.h3
                      className="text-2xl font-bold text-white mb-2"
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{
                        type: "spring",
                        stiffness: 200,
                        delay: index * 0.1 + 0.5,
                      }}
                    >
                      {stat.number}
                    </motion.h3>
                    <p className="text-emerald-100/80">{stat.label}</p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <motion.div
          className="relative container mx-auto text-center"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <motion.h2
            className="text-5xl md:text-6xl font-bold text-white mb-8 animate-gradient-shift"
            whileHover={{ scale: 1.02 }}
          >
            Ready to Join Our Journey?
          </motion.h2>
          <motion.p
            className="text-xl text-emerald-100 mb-12 max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            Be part of the future of project management. Start your free trial
            today and experience the difference that passionate craftsmanship
            makes.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-6 justify-center"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            <motion.div variants={cardVariant}>
              <Link href="/signup">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-xl hover:shadow-emerald-500/40 transition-all duration-300 group animate-pulse-glow">
                    Get Started Free
                    <motion.div
                      whileHover={{ x: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </motion.div>
                  </Button>
                </motion.div>
              </Link>
            </motion.div>
            <motion.div variants={cardVariant}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="outline"
                  className="px-8 py-4 text-lg font-semibold rounded-xl bg-emerald-950/30 border-emerald-500/30 text-emerald-100 hover:bg-emerald-950/40 hover:border-emerald-400/50 transition-all duration-300 backdrop-blur-sm animate-shimmer"
                >
                  Learn More
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>

          <motion.div
            className="mt-12 text-emerald-100"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6 }}
          >
            <p className="text-sm animate-fade-in">
              ✓ 14-day free trial • ✓ No credit card required • ✓ Cancel anytime
            </p>
          </motion.div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
