"use client";

import { motion, useScroll, useTransform, useInView } from "framer-motion";
import Navbar from "@/components/landing/layout/navbar";
import Footer from "@/components/landing/layout/footer";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  Zap,
  Users,
  BarChart3,
  Target,
  Clock,
  Shield,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import SlackSvg from "@/components/svg/apps/SlackSvg";
import FigmaSvg from "@/components/svg/apps/FigmaSvg";
import JiraSvg from "@/components/svg/apps/JiraSvg";
import ZoomSvg from "@/components/svg/apps/ZoomSvg";
import NotionSvg from "@/components/svg/apps/NotionSvg";
import GithubSvg from "@/components/svg/apps/GithubSvg";
import AsanaSvg from "@/components/svg/apps/AsanaSvg";
import { ClickUpSvg } from "@/components/svg/apps/ClickUpSvg";
import TrelloSvg from "@/components/svg/apps/TrelloSvg";
import { MondaySvg } from "@/components/svg/apps/MondaySvg";
import { AirtableSvg } from "@/components/svg/apps/AirtableSvg";
import { useState } from "react";

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

export default function FeaturesPage() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const features = [
    {
      icon: Sparkles,
      title: "AI-Native Story Generation",
      description:
        "Turn scattered feature requests into detailed, actionable user stories with AI trained on real-world project successes and failures.",
      benefits: [
        "Professional agile format (As a/I want/So that)",
        "Detailed acceptance criteria generation",
        "Multiple story variations per feature",
        "Persona-based story customization",
      ],
    },
    {
      icon: Target,
      title: "Intelligent Prioritization",
      description:
        "Let your data drive your backlog. Our AI analyzes business value, complexity, dependencies, and risk to recommend optimal story ordering and backlog prioritization.",
      benefits: [
        "Multi-factor weighted scoring",
        "Dynamic priority updates",
        "Dependency-aware sequencing",
        "Value vs. effort optimization",
      ],
    },
    {
      icon: Shield,
      title: "Sprint Risk Intelligence",
      description:
        "Identify and mitigate sprint risks before they impact delivery. Our AI analyzes patterns to predict potential bottlenecks and suggests preventative actions.",
      benefits: [
        "Early risk detection algorithms",
        "AI-powered mitigation strategies",
        "Sprint health dashboards",
        "Velocity-based predictions",
      ],
    },
    {
      icon: Zap,
      title: "AI-Powered Sprint Planning",
      description:
        "Intelligent recommendations for sprint capacity, task estimation, and resource allocation based on your historical data, team performance, and our AI Agent's analysis of real-world projects with 87-89% completion rates and failure prevention patterns.",
      benefits: [
        "Automated story point estimation",
        "Capacity planning",
        "Risk assessment",
        "Performance predictions",
      ],
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description:
        "Comprehensive reporting and analytics dashboard with customizable metrics, burndown charts, and performance insights.",
      benefits: [
        "Custom dashboards",
        "Burndown charts",
        "Velocity tracking",
        "Team performance metrics",
      ],
    },
    {
      icon: Clock,
      title: "Time Management",
      description:
        "Built-in time tracking, automated timesheets, and productivity insights to optimize your team's workflow.",
      benefits: [
        "Time tracking",
        "Automated timesheets",
        "Productivity insights",
        "Billing integration",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900">
      <Navbar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

      {/* Animated Background Elements */}
      <motion.div
        className="fixed inset-0 overflow-hidden pointer-events-none"
        style={{ y }}
      >
        <motion.div
          className="absolute top-20 left-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />
      </motion.div>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center px-6 py-3 bg-emerald-500/10 backdrop-blur-sm border border-emerald-500/20 text-emerald-300 rounded-full text-sm font-medium mb-8 animate-pulse-glow"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            AI-Native Features
          </motion.div>

          <motion.h1
            className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight animate-gradient-shift"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            whileHover={{ scale: 1.02 }}
          >
            Everything you need to
            <motion.span
              className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-green-500 to-teal-600"
              animate={{ backgroundPosition: ["0%", "100%", "0%"] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              {" "}
              build amazing products
            </motion.span>
          </motion.h1>

          <motion.p
            className="text-xl text-white/50 mb-12 max-w-4xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            Discover how SprintiQ's cutting-edge features can transform your
            project management workflow and boost your team's productivity.
            <br />
            <motion.span
              className="text-emerald-600 font-medium"
              whileHover={{ color: "#10b981" }}
            >
              Built for modern teams that move fast.
            </motion.span>
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
                  <Button className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white px-8 py-4 text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group animate-pulse-glow">
                    Get Beta Access
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
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="grid lg:grid-cols-2 gap-12"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={cardVariant}
                whileHover={{ scale: 1.02, y: -5 }}
                className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 lg:p-10 border border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-300 group animate-bounce-in"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className="flex items-start space-x-6">
                  <motion.div
                    className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:shadow-lg group-hover:shadow-emerald-500/30 transition-all duration-300"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    variants={iconVariant}
                  >
                    <feature.icon className="h-8 w-8 text-white animate-float" />
                  </motion.div>
                  <div className="flex-1">
                    <motion.h3
                      className="text-2xl font-bold text-white mb-4 group-hover:text-emerald-300 transition-colors duration-300"
                      whileHover={{ x: 5 }}
                    >
                      {feature.title}
                    </motion.h3>
                    <motion.p
                      className="text-white/50 mb-6 leading-relaxed"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 + 0.3 }}
                    >
                      {feature.description}
                    </motion.p>
                    <motion.ul
                      className="space-y-3"
                      variants={staggerContainer}
                      initial="initial"
                      whileInView="animate"
                      viewport={{ once: true }}
                    >
                      {feature.benefits.map((benefit, benefitIndex) => (
                        <motion.li
                          key={benefitIndex}
                          variants={cardVariant}
                          className="flex items-center space-x-3 group/item"
                        >
                          <motion.div
                            whileHover={{ scale: 1.2 }}
                            className="animate-check-bounce"
                            style={{ animationDelay: `${benefitIndex * 0.1}s` }}
                          >
                            <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                          </motion.div>
                          <motion.span
                            className="text-white/50 group-hover/item:text-white/70 transition-colors duration-200"
                            whileHover={{ x: 3 }}
                          >
                            {benefit}
                          </motion.span>
                        </motion.li>
                      ))}
                    </motion.ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Integration Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            className="mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <motion.h2
              className="text-4xl md:text-5xl font-bold text-white mb-6 animate-gradient-shift"
              whileHover={{ scale: 1.02 }}
            >
              Seamless
              <motion.span
                className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-600"
                animate={{ backgroundPosition: ["0%", "100%", "0%"] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                {" "}
                integrations
              </motion.span>
            </motion.h2>
            <motion.p
              className="text-xl text-white/50 mb-8 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              Connect SprintiQ with your favorite tools and platforms for a
              unified workflow experience. No more context switching.
            </motion.p>
          </motion.div>

          <motion.div
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {[
              { name: "ClickUp", icon: <ClickUpSvg /> },
              { name: "Jira", icon: <JiraSvg /> },
              { name: "Asana", icon: <AsanaSvg /> },
              { name: "Trello", icon: <TrelloSvg /> },
              { name: "Monday.com", icon: <MondaySvg /> },
              { name: "Airtable", icon: <AirtableSvg /> },
            ].map((tool, index) => (
              <motion.div
                key={tool.name}
                variants={cardVariant}
                whileHover={{ scale: 1.1, y: -10 }}
                className="group bg-transparent backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-emerald-500/20 hover:border-emerald-400/40 animate-bounce-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <motion.div
                  className="h-12 w-12 mx-auto rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 animate-float"
                  whileHover={{ scale: 1.2, rotate: 10 }}
                  style={{ animationDelay: `${index * 0.2}s` }}
                >
                  {tool.icon}
                </motion.div>
                <motion.h3
                  className="font-semibold text-white text-sm group-hover:text-emerald-300 transition-colors duration-200"
                  whileHover={{ y: -2 }}
                >
                  {tool.name}
                </motion.h3>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            className="mt-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6 }}
          >
            <motion.p
              className="text-white/50 mb-6"
              whileHover={{ color: "#ffffff80" }}
            >
              100+ integrations available for professionals
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white/5 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <motion.h2
              className="text-4xl md:text-5xl font-bold text-white mb-6 animate-gradient-shift"
              whileHover={{ scale: 1.02 }}
            >
              Discover the Future of
              <motion.span
                className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-600"
                animate={{ backgroundPosition: ["0%", "100%", "0%"] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                {" "}
                Agile Planning
              </motion.span>
            </motion.h2>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-4 gap-8"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {[
              { number: "75%", label: "Time Saved on Planning " },
              { number: "5x", label: "Faster Backlog Creation" },
              { number: "99.9%", label: "Uptime" },
              { number: "24/7", label: "Support" },
            ].map((stat, index) => (
              <motion.div
                key={index}
                className="text-center animate-bounce-in"
                style={{ animationDelay: `${index * 0.2}s` }}
                variants={cardVariant}
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <motion.div
                  className="text-4xl md:text-5xl font-bold text-white mb-2 animate-float"
                  style={{ animationDelay: `${index * 0.3}s` }}
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
                </motion.div>
                <motion.div
                  className="text-white/50 font-medium"
                  whileHover={{ color: "#ffffff80" }}
                >
                  {stat.label}
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            className="bg-gradient-to-br from-emerald-600 to-green-600 rounded-3xl p-12 lg:p-16 text-white relative overflow-hidden"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            whileHover={{ scale: 1.02 }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"
              animate={{
                background: [
                  "linear-gradient(45deg, rgba(255,255,255,0.1) 0%, transparent 100%)",
                  "linear-gradient(225deg, rgba(255,255,255,0.1) 0%, transparent 100%)",
                  "linear-gradient(45deg, rgba(255,255,255,0.1) 0%, transparent 100%)",
                ],
              }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            <div className="relative z-10">
              <motion.h2
                className="text-4xl md:text-5xl font-bold mb-6 animate-gradient-shift"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                Ready to transform your workflow?
              </motion.h2>
              <motion.p
                className="text-xl mb-8 text-emerald-50 max-w-2xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
              >
                Be among the first to experience AI-native agile planning with
                intelligent user story creation, automatic acceptance criteria,
                and persona-based customization.
              </motion.p>
              <motion.div
                className="flex flex-col sm:flex-row gap-4 justify-center"
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
                      <Button className="bg-white text-emerald-600 hover:bg-gray-50 px-8 py-4 text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 animate-pulse-glow">
                        Request Early Access
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
                  <Link href="/contact">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        variant="outline"
                        className="bg-transparent border-2 border-white hover:border-white text-white hover:bg-white/10 px-8 py-4 text-lg font-semibold rounded-2xl transition-all duration-300 animate-shimmer"
                      >
                        Contact Us
                      </Button>
                    </motion.div>
                  </Link>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
