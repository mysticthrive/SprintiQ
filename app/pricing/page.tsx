"use client";

import { useState } from "react";

import Navbar from "@/components/landing/layout/navbar";
import Footer from "@/components/landing/layout/footer";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  CircleCheck,
  Lock,
  Phone,
  Plus,
  Star,
  X,
} from "lucide-react";
import Link from "next/link";

export const plans = [
  {
    name: "Starter",
    price: "Free",
    period: "forever",
    description: "Perfect for small teams getting started",
    features: [
      "Up to 5 team members",
      "3 projects",
      "Basic sprint planning",
      "Standard support",
      "Mobile app access",
    ],
    notIncluded: [
      "Advanced analytics",
      "AI-powered insights",
      "Custom integrations",
      "Priority support",
    ],
    popular: false,
    cta: "Get Started Free",
  },
  {
    name: "Professional",
    price: "$12",
    period: "per user/month",
    description: "Ideal for growing teams and businesses",
    features: [
      "Unlimited team members",
      "Unlimited projects",
      "Advanced sprint planning",
      "AI-powered insights",
      "Advanced analytics",
      "Priority support",
      "Custom integrations",
      "Time tracking",
    ],
    notIncluded: ["White-label solution", "Dedicated account manager"],
    popular: true,
    cta: "Start Free Trial",
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "contact us",
    description: "For large organizations with specific needs",
    features: [
      "Everything in Professional",
      "White-label solution",
      "Dedicated account manager",
      "Custom development",
      "On-premise deployment",
      "Advanced security features",
      "SLA guarantee",
      "Training & onboarding",
    ],
    notIncluded: [],
    popular: false,
    cta: "Contact Us",
  },
];

export default function PricingPage() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900">
      <Navbar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center px-6 py-3 bg-emerald-500/10 backdrop-blur-sm border border-emerald-500/20 text-emerald-300 rounded-full text-sm font-medium mb-8 animate-fade-in animate-bounce-in">
            Simple & Transparent Pricing
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight animate-slide-up-delayed">
            Plans that scale
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-green-500 to-teal-600 animate-gradient-shift">
              {" "}
              with your team
            </span>
          </h1>
          <p className="text-xl text-white mb-12 max-w-3xl mx-auto leading-relaxed animate-slide-up-delayed-2">
            Start free, upgrade when you're ready. No hidden fees, no surprises.
            <br />
            <span className="text-emerald-600 font-medium">
              14-day free trial on all paid plans.
            </span>
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8 lg:gap-6">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`relative bg-white/70 backdrop-blur-sm rounded-3xl border transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 group animate-fade-in-up ${
                  plan.popular
                    ? "border-emerald-200 shadow-xl shadow-emerald-100/50 bg-gradient-to-br from-white to-emerald-50/30 animate-pulse-glow"
                    : "border-slate-200 shadow-lg hover:border-emerald-200"
                }`}
                style={{ animationDelay: `${index * 200}ms` }}
              >
                {plan.popular && (
                  <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 z-10">
                    <div className="inline-flex items-center bg-gradient-to-r from-emerald-600 to-green-600 text-white px-6 py-2.5 rounded-full text-sm font-semibold shadow-lg ">
                      <Star className="w-4 h-4 mr-2 animate-spin-slow" />
                      Most Popular
                    </div>
                  </div>
                )}

                <div className="p-8 lg:p-10">
                  <div className="mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                      {plan.name}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {plan.description}
                    </p>
                  </div>

                  <div className="mb-8">
                    <div className="flex items-baseline">
                      <span className="text-5xl font-bold text-gray-900">
                        {plan.price}
                      </span>
                      {plan.period && (
                        <span className="text-gray-500 ml-2 text-lg">
                          /{plan.period}
                        </span>
                      )}
                    </div>
                  </div>

                  <Link
                    href={plan.name === "Enterprise" ? "/contact" : "/signup"}
                    className="block mb-8"
                  >
                    <Button
                      className={`w-full py-4 text-lg font-semibold rounded-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                        plan.popular
                          ? "bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg hover:shadow-xl animate-gradient-shift"
                          : "bg-gray-900 hover:bg-gray-800 text-white border-2 border-transparent hover:border-emerald-500"
                      }`}
                    >
                      {plan.cta}
                    </Button>
                  </Link>

                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-4 text-lg">
                        Everything included:
                      </h4>
                      <ul className="space-y-4">
                        {plan.features.map((feature, featureIndex) => (
                          <li
                            key={featureIndex}
                            className="flex items-start space-x-4 animate-slide-in-left"
                            style={{
                              animationDelay: `${
                                index * 200 + featureIndex * 100
                              }ms`,
                            }}
                          >
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center mt-0.5 group-hover:scale-110 transition-transform duration-300">
                              <CheckCircle className="h-4 w-4 text-emerald-600 animate-check-bounce" />
                            </div>
                            <span className="text-gray-700 leading-relaxed">
                              {feature}
                            </span>
                          </li>
                        ))}
                        {plan.notIncluded.map((feature, featureIndex) => (
                          <li
                            key={featureIndex}
                            className="flex items-start space-x-4 opacity-60 animate-slide-in-left"
                            style={{
                              animationDelay: `${
                                index * 200 +
                                (plan.features.length + featureIndex) * 100
                              }ms`,
                            }}
                          >
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center mt-0.5">
                              <X className="h-4 w-4 text-gray-400" />
                            </div>
                            <span className="text-gray-500 leading-relaxed">
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white/5 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto text-center">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Lock,
                title: "Secure & Compliant",
                desc: "Enterprise-grade security with SOC 2 compliance",
              },
              {
                icon: Phone,
                title: "24/7 Support",
                desc: "Get help when you need it from our expert team",
              },
              {
                icon: CircleCheck,
                title: "Money-back Guarantee",
                desc: "30-day money-back guarantee on all plans",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="flex flex-col items-center group animate-fade-in-up"
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300 animate-float">
                  <item.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-semibold text-white mb-2 group-hover:text-emerald-300 transition-colors duration-300">
                  {item.title}
                </h3>
                <p className="text-white/50 group-hover:text-white/70 transition-colors duration-300">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Got questions?
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-600 animate-gradient-shift">
                {" "}
                We've got answers
              </span>
            </h2>
            <p className="text-xl text-white/50">
              Everything you need to know about our pricing and plans
            </p>
          </div>

          <div className="grid gap-6">
            {[
              {
                question: "Can I change my plan anytime?",
                answer:
                  "Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.",
              },
              {
                question: "Is there a free trial?",
                answer:
                  "Yes, we offer a 14-day free trial for our Professional plan. No credit card required.",
              },
              {
                question: "What payment methods do you accept?",
                answer:
                  "We accept all major credit cards, PayPal, and bank transfers for Enterprise customers.",
              },
              {
                question: "Can I cancel anytime?",
                answer:
                  "Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.",
              },
            ].map((faq, index) => (
              <div
                key={index}
                className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 overflow-hidden group hover:border-white/20 transition-all duration-300 animate-fade-in-up hover:bg-white/10"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full text-left p-6 flex justify-between items-center group-hover:bg-white/5 transition-colors duration-300"
                >
                  <h3 className="text-xl font-medium text-white group-hover:text-emerald-300 transition-colors duration-300">
                    {faq.question}
                  </h3>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 group-hover:bg-emerald-500/20 ${
                      openFaqIndex === index
                        ? "rotate-45 bg-emerald-500/20"
                        : "rotate-0"
                    }`}
                  >
                    <Plus className="w-5 h-5 text-white transition-colors duration-300 group-hover:text-emerald-300" />
                  </div>
                </button>
                <div
                  className={`transition-all duration-500 ease-in-out overflow-hidden ${
                    openFaqIndex === index
                      ? "max-h-96 opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="px-6 pb-4 text-white/70 animate-slide-down">
                    <p className="text-lg">{faq.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
