import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Linkedin, Instagram, Facebook } from "lucide-react";
import { TwitterSvg } from "@/components/svg/TwitterSvg";
import { MediumSvg } from "@/components/svg/MediumSvg";

export default function Footer() {
  const [twitterColor, setTwitterColor] = useState("#BDBDBD");

  return (
    <footer className="relative z-10 bg-black/30 backdrop-blur-xl text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <Image
                src="https://vttwakzntflxuylenszu.supabase.co/storage/v1/object/public/images/SprintiQ/sprintiq-logo.png"
                alt="SprintiQ Logo"
                width={150}
                height={40}
                priority // Preload the logo as it's above the fold [^3]
                className="h-auto"
              />
            </Link>

            <p className="text-gray-400 mb-6 text-sm">
              AI-native sprint planning that eliminates busywork and amplifies
              creativity. Made with 🤍 for agile teams everywhere.
            </p>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <a
                  href="mailto:support@sprintiq.ai"
                  className="text-gray-400 hover:text-white text-sm"
                >
                  support@sprintiq.ai
                </a>
              </div>
            </div>

            <div className="space-y-8">
              {/* Social media links removed - placeholder links not functional yet */}
              <div className="space-y-4">
                <h3 className="text-white font-semibold mb-2">Social</h3>
                <div className="flex space-x-4">
                  <a
                    href="https://x.com/SprintiQAI"
                    className="text-gray-400 hover:text-white hover:scale-110 duration-300 transition-all"
                    onMouseEnter={() => setTwitterColor("#fff")}
                    onMouseLeave={() => setTwitterColor("#BDBDBD")}
                  >
                    <div className="w-5 h-5">
                      <TwitterSvg color={twitterColor} />
                    </div>
                    <span className="sr-only">Twitter</span>
                  </a>
                  <a
                    href="https://www.linkedin.com/company/sprintiq-ai"
                    className="text-gray-400 hover:text-white hover:scale-110 duration-300 transition-all"
                  >
                    <Linkedin size={18} />
                    <span className="sr-only">LinkedIn</span>
                  </a>
                  <a
                    href="https://www.facebook.com/SprintiQ/"
                    className="text-gray-400 hover:text-white hover:scale-110 duration-300 transition-all"
                  >
                    <Facebook size={18} />
                    <span className="sr-only">Facebook</span>
                  </a>
                  <a
                    href="https://www.instagram.com/sprintiq.ai/"
                    className="text-gray-400 hover:text-white hover:scale-110 duration-300 transition-all"
                  >
                    <Instagram size={18} />
                    <span className="sr-only">Instagram</span>
                  </a>
                  <a
                    href="https://sprintiq.medium.com"
                    className="text-gray-400 hover:text-white hover:scale-110 duration-300 transition-all"
                  >
                    <div className="w-5 h-5">
                      <MediumSvg color={twitterColor} />
                    </div>
                    <span className="sr-only">Medium</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Product</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/features"
                  className="text-gray-400 hover:text-emerald-400 transition-colors text-sm"
                >
                  Features
                </Link>
              </li>
              <li>
                <a
                  href="https://sprintiq.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-emerald-400 transition-colors text-sm"
                >
                  Learn More
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/contact"
                  className="text-gray-400 hover:text-emerald-400 transition-colors text-sm"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="/terms"
                  className="text-gray-400 hover:text-emerald-400 transition-colors text-sm"
                >
                  Terms of Service
                </a>
              </li>
              <li>
                <a
                  href="/privacy"
                  className="text-gray-400 hover:text-emerald-400 transition-colors text-sm"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="/faq"
                  className="text-gray-400 hover:text-emerald-400 transition-colors text-sm"
                >
                  FAQ
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-400 text-sm">
            Copyright © {new Date().getFullYear()} SprintiQ – All Rights
            Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
