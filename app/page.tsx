"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  Target,
  Users,
  Zap,
  Shield,
  Layers,
  BarChart2,
  Plus,
} from "lucide-react";
import Navbar from "@/components/landing/layout/navbar";
import Footer from "@/components/landing/layout/footer";
import ScrollToTop from "@/components/ui/scroll-to-top";
import GithubSvg from "@/components/svg/apps/GithubSvg";
import SlackSvg from "@/components/svg/apps/SlackSvg";
import NotionSvg from "@/components/svg/apps/NotionSvg";
import JiraSvg from "@/components/svg/apps/JiraSvg";
import TrelloSvg from "@/components/svg/apps/TrelloSvg";
import AsanaSvg from "@/components/svg/apps/AsanaSvg";
import HeroSection from "@/components/landing/HeroSection";
import { AiBrainSvg } from "@/components/svg/AiBrainSvg";
import { TeamSvg } from "@/components/svg/TeamSvg";
import { BadgeSvg } from "@/components/svg/BadgeSvg";
import { IntegrationSvg } from "@/components/svg/IntegrationSvg";
import { InventiveSvg } from "@/components/svg/InventiveSvg";
import { PlanningSvg } from "@/components/svg/PlanningSvg";

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

export default function HomePage() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 overflow-y-auto custom-scrollbar">
      <Navbar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

      {/* Hero Section */}
      <HeroSection />

      {/* Features Section */}
      <section className="py-24 bg-white/5 backdrop-blur-xl">
        <div className="container mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <motion.h2
              className="text-4xl md:text-5xl font-bold text-white mb-4 animate-gradient-shift"
              whileHover={{ scale: 1.02 }}
            >
              Everything You Need to{" "}
              <span className="text-emerald-600">Succeed</span>
            </motion.h2>
            <motion.p
              className="text-xl text-emerald-100/90 max-w-3xl mx-auto"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              AI-native features designed to streamline your workflow and boost
              team productivity
            </motion.p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {[
              {
                icon: <AiBrainSvg color="#fff" />,
                title: "AI Story Generation",
                description:
                  "Turn scattered feature requests into detailed, actionable user stories with AI trained on real-world project successes and failures.",
              },
              {
                icon: <TeamSvg color="#fff" />,
                title: "Team Collaboration",
                description:
                  "Real-time collaboration tools that keep everyone aligned and productive, no matter where they work.",
              },
              {
                icon: <PlanningSvg color="#fff" />,
                title: "Sprint Planning",
                description:
                  "Intelligent sprint planning with capacity estimation and risk assessment based on team performance.",
              },
              {
                icon: <InventiveSvg color="#fff" />,
                title: "Smart Prioritization",
                description:
                  "AI-powered backlog prioritization that considers business value, complexity, and dependencies.",
              },
              {
                icon: <BadgeSvg color="#fff" />,
                title: "Secure & Reliable",
                description:
                  "Bank-level security with data encryption and compliance with industry standards.",
              },
              {
                icon: <IntegrationSvg color="#fff" />,
                title: "Core Integrations",
                description:
                  "Connect with essential tools like Jira, GitHub, Slack, and more for seamless workflow.",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                variants={cardVariant}
                whileHover={{ scale: 1.05, y: -10 }}
                className="group"
              >
                <Card className="h-full bg-white/10 backdrop-blur-xl border-emerald-500/20 hover:border-emerald-400/40 transition-all duration-300 hover:shadow-emerald-500/20 hover:shadow-xl animate-bounce-in">
                  <CardContent className="p-8">
                    <motion.div
                      className="w-16 h-16 p-3 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300"
                      variants={iconVariant}
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      {feature.icon}
                    </motion.div>
                    <motion.h3
                      className="text-xl font-bold text-white mb-4 group-hover:text-emerald-400 transition-colors"
                      whileHover={{ x: 5 }}
                    >
                      {feature.title}
                    </motion.h3>
                    <p className="text-emerald-100/80 leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Integrations Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <motion.h2
              className="text-4xl md:text-5xl font-bold text-white mb-4 animate-gradient-shift"
              whileHover={{ scale: 1.02 }}
            >
              Seamless <span className="text-emerald-600">Integrations</span>
            </motion.h2>
            <motion.p
              className="text-xl text-emerald-100/90 max-w-3xl mx-auto"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              Connect SprintiQ with essential tools and streamline your workflow
            </motion.p>
          </motion.div>

          <motion.div
            className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8 max-w-6xl mx-auto"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {[
              { icon: <GithubSvg />, name: "Github" },
              { icon: <SlackSvg />, name: "Slack" },
              { icon: <JiraSvg />, name: "Jira" },
              { icon: <TrelloSvg />, name: "Trello" },
              { icon: <AsanaSvg />, name: "Asana" },
              { icon: <NotionSvg />, name: "Notion" },
            ].map((IconComponent, index) => (
              <motion.div
                key={index}
                variants={cardVariant}
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="flex items-center justify-center p-6 bg-white/10 backdrop-blur-xl rounded-2xl border border-emerald-500/20 hover:border-emerald-400/40 transition-all duration-300 hover:shadow-emerald-500/20 hover:shadow-lg animate-bounce-in group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <motion.div
                  whileHover={{ y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="flex items-center justify-center flex-col gap-3"
                >
                  <div className="w-12 h-12 flex items-center justify-center">
                    {IconComponent.icon}
                  </div>
                  <span className="text-sm text-emerald-100/80">
                    {IconComponent.name}
                  </span>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <motion.h2
              className="text-4xl md:text-5xl font-bold text-white mb-4 animate-gradient-shift"
              whileHover={{ scale: 1.02 }}
            >
              Frequently Asked{" "}
              <span className="text-emerald-600">Questions</span>
            </motion.h2>
            <motion.p
              className="text-xl text-emerald-100/90 max-w-3xl mx-auto"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              Everything you need to know about SprintiQ and our services
            </motion.p>
          </motion.div>

          <motion.div
            className="max-w-3xl mx-auto space-y-4"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {[
              {
                question: "How does the Beta access work?",
                answer:
                  "Our Beta program gives you early access to all features of SprintiQ. Sign up now to get exclusive access and help shape the future of sprint planning. No credit card required.",
              },
              {
                question: "What features are included in the Beta?",
                answer:
                  "Beta users get access to core features including AI-powered story generation, sprint planning, team collaboration, and integrations with essential tools like Jira, GitHub, and Slack. We're constantly adding new features based on user feedback.",
              },
              {
                question: "Is there a limit to how many projects I can create?",
                answer:
                  "No, Beta users can create unlimited projects, tasks, and sprints to manage their work effectively.",
              },
              {
                question: "How secure is my data with SprintiQ?",
                answer:
                  "We take security very seriously. SprintiQ uses bank-level encryption for all data, both in transit and at rest. We're SOC 2 compliant and regularly undergo security audits.",
              },
              {
                question:
                  "Can I import data from other project management tools?",
                answer:
                  "Yes, SprintiQ supports importing data from popular tools like Jira, Asana, and Trello. Our import wizard makes it easy to bring over your projects, tasks, and team members with just a few clicks.",
              },
              {
                question: "What kind of support do you offer during Beta?",
                answer:
                  "Beta users get priority access to our support team and direct communication channels with our product team. We value your feedback and are committed to helping you succeed with SprintiQ.",
              },
            ].map((faq, index) => (
              <motion.div
                key={index}
                variants={cardVariant}
                whileHover={{ scale: 1.02 }}
                className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 overflow-hidden group hover:border-white/20 transition-all duration-300 animate-bounce-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <motion.button
                  onClick={() => toggleFaq(index)}
                  className="w-full text-left p-6 flex justify-between items-center"
                  whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}
                >
                  <motion.h3
                    className="text-xl font-medium text-white"
                    whileHover={{ color: "#10b981" }}
                  >
                    {faq.question}
                  </motion.h3>
                  <motion.div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    animate={{
                      rotate: openFaqIndex === index ? 45 : 0,
                      backgroundColor:
                        openFaqIndex === index ? "#10b981" : "transparent",
                    }}
                    transition={{ duration: 0.3 }}
                    whileHover={{ scale: 1.1 }}
                  >
                    <Plus className="w-5 h-5 text-white" />
                  </motion.div>
                </motion.button>
                <motion.div
                  initial={false}
                  animate={{
                    height: openFaqIndex === index ? "auto" : 0,
                    opacity: openFaqIndex === index ? 1 : 0,
                  }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <motion.div
                    className="px-6 pb-4 text-white/70"
                    initial={{ y: -10 }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="text-lg">{faq.answer}</p>
                  </motion.div>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>

          {/* View Documentation Link */}
          <motion.div
            className="text-center mt-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            <a
              href="https://sprintiq.ai/insights"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 text-emerald-300 hover:text-emerald-200 border border-emerald-400/30 hover:border-emerald-400 rounded-lg transition-all duration-300 group hover:bg-emerald-500/10"
            >
              <span>View Complete Documentation</span>
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </motion.div>
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
            Ready to Sprint Ahead?
          </motion.h2>
          <motion.p
            className="text-xl text-emerald-100 mb-12 max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            From idea to sprint-ready stories in seconds, not hours.
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
                  <Button className="bg-white text-emerald-600 hover:bg-gray-50 px-8 py-4 text-lg font-semibold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 group animate-pulse-glow">
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

            {/* Learn More First Link */}
            <motion.div variants={cardVariant}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <a
                  href="https://sprintiq.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button className="bg-transparent border border-emerald-500 text-emerald-500 hover:bg-gray-50 px-8 py-4 text-lg font-semibold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 group">
                    <span>Learn More First</span>
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
        </motion.div>
      </section>

      <Footer />

      <ScrollToTop isMenuOpen={isMenuOpen} />
    </div>
  );
}
