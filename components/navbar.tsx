"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/logo";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Change navbar style after scrolling
      setIsScrolled(currentScrollY > 20);

      // Hide navbar on scroll down, show on scroll up
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false); // Scrolling down
      } else {
        setIsVisible(true); // Scrolling up
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const navLinks = [
    { name: "Features", href: "#features" },
    { name: "How It Works", href: "#how-it-works" },
    { name: "Testimonials", href: "#testimonials" },
    { name: "Pricing", href: "#pricing" },
  ];

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out overflow-x-hidden max-w-[100vw] ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      } ${
        isScrolled
          ? "bg-white/80 backdrop-blur-xl border-b border-purple-100/50 shadow-lg shadow-purple-100/20"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 min-w-0 w-full">
        <div className="flex items-center justify-between h-20 min-h-[56px] min-w-0 gap-2">
          {/* Logo - size 44 on desktop; mobile overflow constrained via max-w (md:max-w-none restores desktop) */}
          <Logo size={44} showText={true} href="/" className="flex-shrink-0 min-w-0 max-w-[calc(100vw-120px)] md:max-w-none" />

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-10">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={(e) => scrollToSection(e, link.href)}
                className="text-gray-700 hover:text-purple-600 font-medium transition-colors duration-200 relative group"
              >
                {link.name}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-600 to-violet-600 group-hover:w-full transition-all duration-300"></span>
              </Link>
            ))}
          </div>

          {/* ONLY Sign In Button - NO "Get Started Free" */}
          <div className="hidden md:flex items-center">
            <Link
              href="/auth/signin"
              className="px-6 py-2.5 bg-white border-2 border-gray-200 hover:border-purple-300 text-gray-700 hover:text-purple-600 rounded-full font-semibold transition-all duration-300 hover:shadow-lg"
            >
              Sign In
            </Link>
          </div>

          {/* Mobile Menu Button - min 48px tap target */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-3 min-h-[48px] min-w-[48px] rounded-xl hover:bg-purple-50 transition-colors duration-200 flex items-center justify-center"
            aria-expanded={isMobileMenuOpen}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6 text-gray-700" />
            ) : (
              <Menu className="w-6 h-6 text-gray-700" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu - slide down with CSS transition */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-out ${
          isMobileMenuOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0 pointer-events-none"
        }`}
      >
        <div className="bg-white/95 backdrop-blur-xl border-t border-purple-100/50 shadow-xl px-4 sm:px-6 py-6">
          <div className="space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={(e) => scrollToSection(e, link.href)}
                className="block py-3 px-2 min-h-[48px] flex items-center text-gray-700 hover:text-purple-600 font-medium transition-colors duration-200 rounded-lg hover:bg-purple-50/50"
              >
                {link.name}
              </Link>
            ))}
            <div className="pt-4 mt-2 border-t border-purple-100">
              <Link
                href="/auth/signin"
                className="flex items-center justify-center w-full min-h-[48px] py-3 px-4 border-2 border-gray-200 text-gray-700 rounded-2xl font-semibold hover:border-purple-300 hover:bg-purple-50/50 transition-all duration-200"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
