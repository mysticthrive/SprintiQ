"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronRight, AlignRight } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTrigger,
  SheetTitle,
  SheetClose,
  SheetFooter,
} from "@/components/ui/sheet";

export default function Navbar({
  isMenuOpen,
  setIsMenuOpen,
}: {
  isMenuOpen: boolean;
  setIsMenuOpen: (isOpen: boolean) => void;
}) {
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Features", href: "/features" },
    { label: "Contact", href: "/contact" },
    { label: "FAQ", href: "/faq" },
  ];

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-40 transition-all duration-300",
        isScrolled
          ? "bg-white/10 backdrop-blur-xl border-b border-white/10 shadow-lg"
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <Image
              src="https://vttwakzntflxuylenszu.supabase.co/storage/v1/object/public/images/SprintiQ/sprintiq-logo.png"
              alt="SprintiQ Logo"
              width={150}
              height={40}
              priority
              className="h-auto w-[120px] transition-transform duration-200 group-hover:scale-105 lg:w-[150px]"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            <div className="flex items-center space-x-6">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "relative px-3 py-2 transition-all duration-300 text-base font-medium flex items-center group",
                      isActive
                        ? "text-emerald-400 font-semibold"
                        : "text-white/90 hover:text-emerald-300"
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {link.label}
                    <div
                      className={cn(
                        "absolute left-1/2 -translate-x-1/2 bottom-0 h-0.5 bg-gradient-to-r from-emerald-400 to-green-400 transition-all duration-300",
                        isActive
                          ? "w-full opacity-100"
                          : "w-0 opacity-0 group-hover:w-full group-hover:opacity-100"
                      )}
                    />
                  </Link>
                );
              })}
            </div>

            {/* Desktop Auth Buttons */}
            <div className="flex items-center space-x-6">
              <Link
                href="/signin"
                className={cn(
                  "transition-all duration-300 text-base font-medium px-4 py-2 rounded-lg hover:bg-white/10",
                  pathname === "/signin"
                    ? "text-emerald-400 font-semibold bg-white/5"
                    : "text-white/90 hover:text-emerald-300"
                )}
              >
                Sign In
              </Link>
              <Link href="/signup">
                <Button className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/25">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative p-1 hover:bg-white/10 transition-all duration-300"
                  aria-label="Toggle mobile menu"
                >
                  <AlignRight className="h-12 w-12 text-white" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[300px] sm:w-[400px] p-0 bg-white [&>button]:hidden"
              >
                <SheetHeader className="p-3 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <Image
                      src="https://vttwakzntflxuylenszu.supabase.co/storage/v1/object/public/images/SprintiQ/logo1.png"
                      alt="SprintiQ Logo"
                      width={150}
                      height={40}
                      priority
                      className="h-auto transition-transform duration-200"
                    />
                    <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                    <SheetClose asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-9 h-9 p-0 rounded-full hover:bg-gray-200 text-gray-600 hover:text-gray-800"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </SheetClose>
                  </div>
                </SheetHeader>

                {/* Links */}
                <div className="grid flex-1 auto-rows-min gap-3 p-3">
                  <div className="space-y-3">
                    {navLinks.map((link) => {
                      const isActive = pathname === link.href;
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          className={cn(
                            "flex items-center justify-between w-full p-3 rounded-xl transition-all duration-200 group text-lg",
                            isActive
                              ? "bg-emerald-100 text-emerald-700 font-bold"
                              : "text-gray-800 hover:bg-gray-100 hover:text-emerald-700"
                          )}
                          aria-current={isActive ? "page" : undefined}
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <span>{link.label}</span>
                          <ChevronRight
                            className={cn(
                              "h-5 w-5 transition-all duration-200",
                              isActive
                                ? "text-emerald-600"
                                : "text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1"
                            )}
                          />
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {/* Auth buttons */}
                <SheetFooter className="p-3 flex flex-col gap-3 absolute bottom-0 left-0 right-0">
                  <Link href="/signin" onClick={() => setIsMenuOpen(false)}>
                    <Button
                      variant="default"
                      className="w-full py-4 text-base bg-gray-900 hover:bg-black text-white"
                    >
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/signup" onClick={() => setIsMenuOpen(false)}>
                    <Button className="w-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white py-4 text-base font-medium">
                      Get Started
                    </Button>
                  </Link>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
