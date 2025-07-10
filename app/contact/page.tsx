"use client";

import { motion } from "framer-motion";
import Navbar from "@/components/landing/layout/navbar";
import Footer from "@/components/landing/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Mail,
  Clock,
  MessageCircle,
  Send,
  User,
  Building,
  MailOpen,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState } from "react";

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const formFieldVariant = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: "easeOut" },
};

export default function ContactPage() {
  const router = useRouter();
  // Add state for form fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Submit handler
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSuccess("");
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          company,
          subject,
          message,
        }),
      });
      if (res.ok) {
        setSuccess("Your message has been sent! We'll get back to you soon.");
        setFirstName("");
        setLastName("");
        setEmail("");
        setCompany("");
        setSubject("");
        setMessage("");
      } else {
        const data = await res.json();
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900">
      <Navbar isMenuOpen={false} setIsMenuOpen={() => {}} />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center px-6 py-3 bg-emerald-500/10 backdrop-blur-sm border border-emerald-500/20 text-emerald-300 rounded-full text-sm font-medium mb-8 animate-pulse-glow"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            We're here to help
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight"
          >
            Get in
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-green-500 to-teal-600">
              {" "}
              Touch
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-xl text-white/50 mb-12 max-w-3xl mx-auto leading-relaxed"
          >
            Have questions about SprintiQ? We'd love to hear from you. Send us a
            message and we'll respond as soon as possible.
            <br />
            <span className="text-emerald-600 font-medium">
              Average response time: 2 hours
            </span>
          </motion.p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Contact Form */}
            <div className="flex flex-col gap-6">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                whileHover={{ scale: 1.02 }}
                className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 lg:p-10 border border-emerald-500/20 hover:border-emerald-500/30 transition-all duration-300 hover:shadow-emerald-500/10"
              >
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-white mb-4">
                    Send us a message
                  </h2>
                  <p className="text-white/50">
                    Fill out the form below and we'll get back to you within 24
                    hours.
                  </p>
                </div>

                <motion.form
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                  className="space-y-6"
                  onSubmit={handleSubmit}
                >
                  <div className="grid md:grid-cols-2 gap-6">
                    <motion.div variants={formFieldVariant}>
                      <label
                        htmlFor="firstName"
                        className="block text-sm font-semibold text-white mb-3"
                      >
                        First Name
                      </label>
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-emerald-300 group-focus-within:text-emerald-400 transition-colors duration-200" />
                        <motion.div whileFocus={{ scale: 1.02 }}>
                          <Input
                            id="firstName"
                            type="text"
                            placeholder="John"
                            className="pl-12 pr-12 h-14 bg-emerald-950/30 border-emerald-500/30 text-white placeholder:text-emerald-200/70 rounded-xl focus:border-emerald-400 focus:ring-emerald-400/30 transition-all duration-200 hover:bg-emerald-950/40 hover:border-emerald-400/50"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            required
                          />
                        </motion.div>
                      </div>
                    </motion.div>

                    <motion.div variants={formFieldVariant}>
                      <label
                        htmlFor="lastName"
                        className="block text-sm font-semibold text-white mb-3"
                      >
                        Last Name
                      </label>
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-emerald-300 group-focus-within:text-emerald-400 transition-colors duration-200" />
                        <motion.div whileFocus={{ scale: 1.02 }}>
                          <Input
                            id="lastName"
                            type="text"
                            placeholder="Doe"
                            className="pl-12 pr-12 h-14 bg-emerald-950/30 border-emerald-500/30 text-white placeholder:text-emerald-200/70 rounded-xl focus:border-emerald-400 focus:ring-emerald-400/30 transition-all duration-200 hover:bg-emerald-950/40 hover:border-emerald-400/50"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            required
                          />
                        </motion.div>
                      </div>
                    </motion.div>
                  </div>

                  <motion.div variants={formFieldVariant}>
                    <label
                      htmlFor="email"
                      className="block text-sm font-semibold text-white mb-3"
                    >
                      Email Address
                    </label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-emerald-300 group-focus-within:text-emerald-400 transition-colors duration-200" />
                      <motion.div whileFocus={{ scale: 1.02 }}>
                        <Input
                          id="email"
                          type="email"
                          placeholder="john@example.com"
                          className="pl-12 pr-12 h-14 bg-emerald-950/30 border-emerald-500/30 text-white placeholder:text-emerald-200/70 rounded-xl focus:border-emerald-400 focus:ring-emerald-400/30 transition-all duration-200 hover:bg-emerald-950/40 hover:border-emerald-400/50"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </motion.div>
                    </div>
                  </motion.div>

                  <motion.div variants={formFieldVariant}>
                    <label
                      htmlFor="company"
                      className="block text-sm font-semibold text-white mb-3"
                    >
                      Company
                    </label>
                    <div className="relative group">
                      <Building className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-emerald-300 group-focus-within:text-emerald-400 transition-colors duration-200" />
                      <motion.div whileFocus={{ scale: 1.02 }}>
                        <Input
                          id="company"
                          type="text"
                          placeholder="Your Company"
                          className="pl-12 pr-12 h-14 bg-emerald-950/30 border-emerald-500/30 text-white placeholder:text-emerald-200/70 rounded-xl focus:border-emerald-400 focus:ring-emerald-400/30 transition-all duration-200 hover:bg-emerald-950/40 hover:border-emerald-400/50"
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                        />
                      </motion.div>
                    </div>
                  </motion.div>

                  <motion.div variants={formFieldVariant}>
                    <label
                      htmlFor="subject"
                      className="block text-sm font-semibold text-white mb-3"
                    >
                      Subject
                    </label>
                    <div className="relative group">
                      <MailOpen className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-emerald-300 group-focus-within:text-emerald-400 transition-colors duration-200" />
                      <motion.div whileFocus={{ scale: 1.02 }}>
                        <Input
                          id="subject"
                          type="text"
                          placeholder="How can we help?"
                          className="pl-12 pr-12 h-14 bg-emerald-950/30 border-emerald-500/30 text-white placeholder:text-emerald-200/70 rounded-xl focus:border-emerald-400 focus:ring-emerald-400/30 transition-all duration-200 hover:bg-emerald-950/40 hover:border-emerald-400/50"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          required
                        />
                      </motion.div>
                    </div>
                  </motion.div>

                  <motion.div variants={formFieldVariant}>
                    <label
                      htmlFor="message"
                      className="block text-sm font-semibold text-white mb-3"
                    >
                      Message
                    </label>
                    <motion.div whileFocus={{ scale: 1.02 }}>
                      <Textarea
                        id="message"
                        placeholder="Tell us more about your needs..."
                        rows={6}
                        className="h-14 bg-emerald-950/30 border-emerald-500/30 text-white placeholder:text-emerald-200/70 rounded-xl focus:border-emerald-400 focus:ring-emerald-400/30 transition-all duration-200 hover:bg-emerald-950/40 hover:border-emerald-400/50 resize-none"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        required
                      />
                    </motion.div>
                  </motion.div>
                  {success && (
                    <div className="text-green-400 font-semibold text-center">
                      {success}
                    </div>
                  )}
                  {error && (
                    <div className="text-red-400 font-semibold text-center">
                      {error}
                    </div>
                  )}
                  <motion.div variants={formFieldVariant}>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white py-4 text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group"
                        type="submit"
                        disabled={loading}
                      >
                        <motion.div
                          className="flex items-center justify-center"
                          whileHover={{ x: 4 }}
                        >
                          <Send className="w-5 h-5 mr-2" />
                          {loading ? "Sending..." : "Send Message"}
                        </motion.div>
                      </Button>
                    </motion.div>
                  </motion.div>
                </motion.form>
              </motion.div>
              {/* FAQ Link */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.4 }}
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-emerald-600 to-green-600 rounded-3xl p-4 lg:p-6 text-white relative overflow-hidden group"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "100%" }}
                  transition={{ duration: 1 }}
                />
                <h3 className="text-xl font-bold text-white mb-3 relative z-10">
                  Frequently Asked Questions
                </h3>
                <p className="text-white/50 mb-6 leading-relaxed relative z-10">
                  Check out our FAQ section for quick answers to common
                  questions about SprintiQ.
                </p>
                <motion.div whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={() => {
                      router.push("/faq");
                    }}
                    className=" bg-gradient-to-r from-white to-white hover:from-emerald-700 hover:to-green-700 hover:text-white hover:scale-105 text-emerald-500 py-4 text-md font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group"
                  >
                    View FAQ
                  </Button>
                </motion.div>
              </motion.div>
            </div>
            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="space-y-8"
            >
              <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="space-y-6"
              >
                <motion.div
                  variants={formFieldVariant}
                  whileHover={{ scale: 1.02 }}
                  className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-4 lg:p-6 border border-emerald-500/20 hover:border-emerald-500/30 transition-all duration-300 hover:shadow-emerald-500/10 group"
                >
                  <Image
                    src="/images/consultant.png"
                    alt="consultant"
                    width={100}
                    height={100}
                    className="w-full h-full rounded-3xl"
                  />
                </motion.div>
                <motion.div
                  variants={formFieldVariant}
                  whileHover={{ scale: 1.02 }}
                  className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-4 lg:p-6 border border-emerald-500/20 hover:border-emerald-500/30 transition-all duration-300 hover:shadow-emerald-500/10 group"
                >
                  <div className="flex items-start space-x-4">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl flex items-center justify-center flex-shrink-0"
                    >
                      <Mail className="h-6 w-6 text-white" />
                    </motion.div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">
                        Email
                      </h3>
                      <motion.a
                        href="mailto:support@sprintiq.ai"
                        whileHover={{ color: "#10b981" }}
                        className="text-white/50 font-medium cursor-pointer hover:text-emerald-400"
                      >
                        support@sprintiq.ai
                      </motion.a>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  variants={formFieldVariant}
                  whileHover={{ scale: 1.02 }}
                  className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-4 lg:p-6 border border-emerald-500/20 hover:border-emerald-500/30 transition-all duration-300 hover:shadow-emerald-500/10 group"
                >
                  <div className="flex items-start space-x-4">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl flex items-center justify-center flex-shrink-0"
                    >
                      <Clock className="h-6 w-6 text-white" />
                    </motion.div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">
                        Business Hours
                      </h3>
                      <p className="text-white/50 font-medium">
                        Monday - Friday: 9:00 AM - 6:00 PM PST
                      </p>
                      <p className="text-white/50 font-medium">
                        Saturday - Sunday: Closed
                      </p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
