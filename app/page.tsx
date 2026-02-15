"use client"

import Link from "next/link"
import Image from "next/image"
import { useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { 
  ArrowRight, Check, Star, Upload, Video, Zap, Play, Users, Sparkles, 
  Clock, Shield, Globe, Camera, XCircle, HelpCircle, 
  Binoculars, FileText, Mic, Brain, ChevronDown, Flame
} from "lucide-react"
import Navbar from "@/components/navbar"
import NeuralBackground from "@/components/ui/flow-field-background"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Section } from "@/components/ui/section"
import { useState, useEffect } from "react"
import dynamic from "next/dynamic"

const CreativePricing = dynamic(
  () => import("@/components/ui/creative-pricing").then((m) => ({ default: m.CreativePricing })),
  { loading: () => <div className="min-h-[400px] flex items-center justify-center text-gray-400">Loading...</div> }
)

// Activity feed names for CTA
const activityNames = [
  { name: "Sarah", location: "California" },
  { name: "Mike", location: "Texas" },
  { name: "Lisa", location: "New York" },
  { name: "James", location: "Florida" },
  { name: "Emma", location: "London" },
  { name: "David", location: "Toronto" },
  { name: "Ana", location: "Miami" },
  { name: "Chris", location: "Seattle" },
]

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [activityIndex, setActivityIndex] = useState(0)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  })
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95])

  useEffect(() => {
    const interval = setInterval(() => {
      setActivityIndex((prev) => (prev + 1) % activityNames.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const handleWaitlist = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setEmail("")
    setLoading(false)
    alert("🎉 You're on the waitlist! Check your email for confirmation.")
  }

  return (
    <>
      <Navbar />
      <main ref={containerRef} className="relative overflow-x-hidden">
        {/* ═══════════════════════════════════════════════════════════════
            SECTION 1 - DRAFTR-STYLE HERO (Framer Motion)
            NeuralBackground ONLY in hero - NOT in sections below
        ═══════════════════════════════════════════════════════════════ */}
        <div className="relative min-h-screen">
          {/* Animated lines ONLY in hero section */}
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-b from-purple-50/40 via-white to-purple-50/30" />
            <NeuralBackground
              color="#C4B5FD"
              trailOpacity={0.12}
              particleCount={200}
              speed={0.5}
              className="absolute inset-0 opacity-40"
            />
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{ opacity }}
            >
            <div className="absolute top-0 left-1/4 w-[700px] h-[700px] bg-purple-200/20 rounded-full blur-[150px] animate-pulse-slow" />
            <div className="absolute top-0 right-1/4 w-[700px] h-[700px] bg-purple-200/20 rounded-full blur-[150px] animate-pulse-slow animation-delay-1000" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-200/20 rounded-full blur-[120px]" />
            <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-200/20 rounded-full blur-[120px]" />
            </motion.div>
          </div>

          {/* Hero Content with Parallax */}
          <motion.div
            className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 pt-32 pb-20"
            style={{ y, scale }}
          >
          {/* Social Proof Trust Badge with Profile Pictures */}
          <motion.div
            className="mb-10"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-3 px-5 py-3 bg-white/60 backdrop-blur-sm rounded-full border border-purple-200/50 shadow-lg">
              {/* Overlapping Avatar Stack with Images */}
              <div className="flex -space-x-3">
                <Image
                  src="https://i.pravatar.cc/150?img=1"
                  alt="Creator"
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full border-2 border-white object-cover"
                  loading="lazy"
                />
                <Image
                  src="https://i.pravatar.cc/150?img=2"
                  alt="Creator"
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full border-2 border-white object-cover"
                  loading="lazy"
                />
                <Image
                  src="https://i.pravatar.cc/150?img=3"
                  alt="Creator"
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full border-2 border-white object-cover"
                  loading="lazy"
                />
                <Image
                  src="https://i.pravatar.cc/150?img=4"
                  alt="Creator"
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full border-2 border-white object-cover"
                  loading="lazy"
                />
                <Image
                  src="https://i.pravatar.cc/150?img=5"
                  alt="Creator"
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full border-2 border-white object-cover"
                  loading="lazy"
                />
              </div>

              {/* Text */}
              <span className="text-sm font-semibold text-gray-700">
                Join <span className="text-purple-600">10,000+ creators</span> already ahead
              </span>
            </div>
          </motion.div>

          {/* Main Headline - FIXED Animation */}
          <div className="text-center space-y-8 max-w-5xl mx-auto">
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            >
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-gray-900 leading-tight tracking-tight">
                Create Viral Videos
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-violet-600 to-purple-700">
                  in Minutes
                </span>
              </h1>
            </motion.div>

            {/* Subtitle - Framer Animation */}
            <motion.div
              className="max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
            >
              <p className="text-lg sm:text-xl md:text-2xl text-gray-600 font-normal leading-relaxed">
                We research your topic, generate viral scripts, and create professional videos with{" "}
                <span className="text-purple-600 font-semibold">100+ UGC creators</span> or{" "}
                <span className="text-purple-600 font-semibold">your own AI avatar</span>. Go viral on autopilot.
              </p>
            </motion.div>

            {/* CTA Button - Framer Animation */}
            <motion.div
              className="flex justify-center mt-12"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link href="/auth/signup" className="group w-full sm:w-auto flex justify-center">
                <button
                  type="button"
                  className="relative w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white rounded-full font-bold text-lg sm:text-xl transition-all duration-300 shadow-2xl shadow-purple-500/40 hover:shadow-purple-500/60 flex items-center justify-center gap-3"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-violet-600 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-300 pointer-events-none" />
                  <span className="relative flex items-center gap-3">
                    Get Started • It&apos;s Free
                    <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" />
                  </span>
                </button>
              </Link>
            </motion.div>

            {/* Trust Indicators - Updated */}
            <motion.div
              className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 mt-12 text-sm text-gray-600"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.8, ease: "easeOut" }}
            >
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-600" />
                <span className="font-medium">Generate in 3 minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span className="font-medium">500+ AI avatars</span>
              </div>
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-purple-600" />
                <span className="font-medium">100+ UGC creators</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
        </div>

        {/* Sections below hero - NO animated lines, simple backgrounds */}
      {/* ═══════════════════════════════════════════════════════════════
          SECTION 2 - PROBLEM AGITATION
      ═══════════════════════════════════════════════════════════════ */}
      <Section background="dark" className="relative overflow-hidden">
        {/* Grain texture */}
        <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIvPjwvc3ZnPg==')]" />
        
        <div className="relative text-center max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Creating Content Shouldn't Be This Hard
          </h2>
          <p className="text-xl text-gray-400 mb-12">
            But here's what creators waste time on every single day:
          </p>

          <div className="grid sm:grid-cols-3 gap-6 lg:gap-8">
            {/* Pain Point 1 */}
            <Card variant="dark" hover className="text-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-red-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">6+ Hours Per Video</h3>
              <p className="text-gray-400 text-sm">
                Scripting, filming, editing, re-filming because you messed up...
              </p>
            </Card>

            {/* Pain Point 2 */}
            <Card variant="dark" hover className="text-center">
              <div className="w-16 h-16 bg-yellow-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <HelpCircle className="h-8 w-8 text-yellow-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">No Idea What Works</h3>
              <p className="text-gray-400 text-sm">
                Guessing what your audience wants. Posting and praying.
              </p>
            </Card>

            {/* Pain Point 3 */}
            <Card variant="dark" hover className="text-center">
              <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Camera className="h-8 w-8 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Camera Shy = No Content</h3>
              <p className="text-gray-400 text-sm">
                Don't like being on camera? Then you don't create. Simple as that.
              </p>
            </Card>
          </div>

          <p className="mt-12 text-xl">
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent font-semibold">
              Sound familiar? There's a better way ↓
            </span>
          </p>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 3 - HOW IT WORKS (Premium Design)
      ═══════════════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="relative py-24 px-4 sm:px-6 bg-gradient-to-b from-white via-purple-50/30 to-white overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-72 h-72 bg-violet-200/20 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto">
          {/* Section Header */}
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Create viral videos in four simple steps
            </p>
          </motion.div>

          {/* Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Step 1 */}
            <motion.div
              className="group relative"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div className="relative h-full p-8 bg-white rounded-3xl border border-purple-100 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                {/* Step number badge */}
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-purple-600 to-violet-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg rotate-3 group-hover:rotate-6 transition-transform duration-300">
                  1
                </div>

                {/* Icon */}
                <div className="mb-6 w-16 h-16 bg-gradient-to-br from-purple-100 to-violet-100 rounded-2xl flex items-center justify-center">
                  <Binoculars className="w-8 h-8 text-purple-600" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  AI-Powered Research
                </h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Enter your topic. We scan thousands of viral videos in your niche to identify patterns, hooks, and structures that actually work.
                </p>

                {/* Feature list */}
                <ul className="space-y-2 text-sm text-gray-500">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                    Competitor content analysis
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                    Viral pattern detection
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                    Engagement metrics tracking
                  </li>
                </ul>
              </div>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              className="group relative"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="relative h-full p-8 bg-white rounded-3xl border border-purple-100 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                {/* Step number badge */}
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-purple-600 to-violet-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg rotate-3 group-hover:rotate-6 transition-transform duration-300">
                  2
                </div>

                {/* Icon */}
                <div className="mb-6 w-16 h-16 bg-gradient-to-br from-purple-100 to-violet-100 rounded-2xl flex items-center justify-center">
                  <Upload className="w-8 h-8 text-purple-600" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Upload Your Face (Once)
                </h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Upload at least 1 minute video. Our AI learns your face, voice, expressions. This is the only time you&apos;ll ever show your real face.
                </p>

                {/* Feature list */}
                <ul className="space-y-2 text-sm text-gray-500">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                    Simple drag-and-drop upload
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                    AI learns your unique style
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                    Clone ready in minutes
                  </li>
                </ul>
              </div>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              className="group relative"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="relative h-full p-8 bg-white rounded-3xl border border-purple-100 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                {/* Step number badge */}
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-purple-600 to-violet-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg rotate-3 group-hover:rotate-6 transition-transform duration-300">
                  3
                </div>

                {/* Icon */}
                <div className="mb-6 w-16 h-16 bg-gradient-to-br from-purple-100 to-violet-100 rounded-2xl flex items-center justify-center">
                  <Video className="w-8 h-8 text-purple-600" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Your Clone Creates Content
                </h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  We write scripts based on what&apos;s proven to work. Your AI clone records the videos. You just download and post.
                </p>

                {/* Feature list */}
                <ul className="space-y-2 text-sm text-gray-500">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                    Data-backed viral scripts
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                    Perfect lip-sync technology
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                    Download and post anywhere
                  </li>
                </ul>
              </div>
            </motion.div>

            {/* Step 4 */}
            <motion.div
              className="group relative"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <div className="relative h-full p-8 bg-gradient-to-br from-purple-600 to-violet-600 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 text-white">
                {/* Step number badge */}
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-purple-600 font-bold text-xl shadow-lg rotate-3 group-hover:rotate-6 transition-transform duration-300">
                  4
                </div>

                {/* Icon */}
                <div className="mb-6 w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold mb-3">
                  Go Viral on Autopilot
                </h3>
                <p className="leading-relaxed mb-4 text-purple-50">
                  Post consistently. Your clone handles the content. You focus on strategy and growth. Watch your audience explode.
                </p>

                {/* Feature list */}
                <ul className="space-y-2 text-sm text-purple-100">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                    Consistent posting schedule
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                    Multi-platform distribution
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                    Rapid audience growth
                  </li>
                </ul>
              </div>
            </motion.div>
          </div>

          {/* CTA at bottom */}
          <motion.div
            className="text-center mt-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <Link href="/auth/signup">
              <button className="px-10 py-5 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white rounded-full font-bold text-lg shadow-2xl shadow-purple-500/40 hover:shadow-purple-500/60 transition-all duration-300 hover:scale-105 flex items-center gap-3 mx-auto">
                Start Creating Videos
                <ArrowRight className="w-6 h-6" />
              </button>
            </Link>
            <p className="mt-4 text-sm text-gray-500">
              Complete video generation platform
            </p>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 4 - WHY WE'RE DIFFERENT
      ═══════════════════════════════════════════════════════════════ */}
      <Section background="gradient">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Why Competitors Can't Keep Up
          </h2>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Most tools just clone you. We make you better than your best competitors.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-6 lg:gap-8">
          {/* DIY */}
          <Card variant="dark" padding="lg" className="text-center opacity-80">
            <div className="text-4xl mb-4">😫</div>
            <h3 className="text-xl font-bold mb-4">DIY Video</h3>
            <div className="space-y-3 text-sm text-gray-400 mb-6">
              <p><strong className="text-white">Time:</strong> 6+ hours</p>
              <p><strong className="text-white">Cost:</strong> $500+ per video</p>
              <p><strong className="text-white">Quality:</strong> Hit or miss</p>
            </div>
            <div className="space-y-2 text-left text-sm">
              <div className="flex items-center gap-2 text-red-400">
                <XCircle className="h-4 w-4" />
                No competitor analysis
              </div>
              <div className="flex items-center gap-2 text-red-400">
                <XCircle className="h-4 w-4" />
                Manual scripting
              </div>
              <div className="flex items-center gap-2 text-red-400">
                <XCircle className="h-4 w-4" />
                Need equipment
              </div>
            </div>
          </Card>

          {/* Other AI */}
          <Card variant="dark" padding="lg" className="text-center opacity-80">
            <div className="text-4xl mb-4">😐</div>
            <h3 className="text-xl font-bold mb-4">Other AI Tools</h3>
            <div className="space-y-3 text-sm text-gray-400 mb-6">
              <p><strong className="text-white">Time:</strong> 30 mins</p>
              <p><strong className="text-white">Cost:</strong> $100/month</p>
              <p><strong className="text-white">Quality:</strong> Robotic</p>
            </div>
            <div className="space-y-2 text-left text-sm">
              <div className="flex items-center gap-2 text-red-400">
                <XCircle className="h-4 w-4" />
                No competitor research
              </div>
              <div className="flex items-center gap-2 text-success">
                <Check className="h-4 w-4" />
                AI script (generic)
              </div>
              <div className="flex items-center gap-2 text-red-400">
                <XCircle className="h-4 w-4" />
                No strategy
              </div>
            </div>
          </Card>

          {/* SocialGenie */}
          <Card className="text-center relative overflow-hidden bg-white border-2 border-primary shadow-2xl shadow-primary/20">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent" />
            <div className="text-4xl mb-4">👑</div>
            <h3 className="text-xl font-bold text-dark mb-4">SocialGenie</h3>
            <div className="space-y-3 text-sm text-gray-600 mb-6">
              <p><strong className="text-dark">Time:</strong> 3 minutes</p>
              <p><strong className="text-dark">Cost:</strong> From $39/month</p>
              <p><strong className="text-dark">Quality:</strong> Indistinguishable</p>
            </div>
            <div className="space-y-2 text-left text-sm">
              <div className="flex items-center gap-2 text-success">
                <Check className="h-4 w-4" />
                Analyzes top 1%
              </div>
              <div className="flex items-center gap-2 text-success">
                <Check className="h-4 w-4" />
                Proven viral scripts
              </div>
              <div className="flex items-center gap-2 text-success">
                <Check className="h-4 w-4" />
                Hyper-realistic clone
              </div>
              <div className="flex items-center gap-2 text-success">
                <Check className="h-4 w-4" />
                Multi-platform
              </div>
            </div>
          </Card>
        </div>

        <p className="text-center text-2xl font-bold mt-12">
          The difference? We don't just clone you. We make you better.
        </p>
      </Section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 5 - SOCIAL PROOF
      ═══════════════════════════════════════════════════════════════ */}
      <Section id="testimonials" background="white">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-dark mb-4">
            Join{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              10,000+ Creators
            </span>{" "}
            Going Viral Daily
          </h2>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8 mb-16">
          {[
            { value: "10,247", label: "Active Creators" },
            { value: "2.4M", label: "Videos Created" },
            { value: "847M", label: "Total Views" },
            { value: "4.9★", label: "Average Rating" },
          ].map((stat, idx) => (
            <Card key={idx} variant="gradient" padding="md" className="text-center">
              <div className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-1">
                {stat.value}
              </div>
              <div className="text-gray-600 text-sm lg:text-base">{stat.label}</div>
            </Card>
          ))}
        </div>

        {/* Testimonials */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { name: "Sarah Chen", role: "Fitness Coach", quote: "I went from 2K to 150K followers in 90 days using SocialGenie. The competitor analysis is insane!", metric: "+148K followers", avatar: "SC" },
            { name: "Mike Rodriguez", role: "Business Coach", quote: "Made $12K in my first month. The AI scripts are better than what I could write myself.", metric: "$12K revenue", avatar: "MR" },
            { name: "Lisa Park", role: "Tech Reviewer", quote: "4.2M views on one video. Mind blown! This is the future of content creation.", metric: "4.2M views", avatar: "LP" },
          ].map((testimonial, idx) => (
            <Card key={idx} hover glow padding="lg">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 mb-6">"{testimonial.quote}"</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-dark text-sm">{testimonial.name}</div>
                    <div className="text-gray-500 text-xs">{testimonial.role}</div>
                  </div>
                </div>
                <div className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                  {testimonial.metric}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 6 - FEATURES
      ═══════════════════════════════════════════════════════════════ */}
      <Section id="features" background="light">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-dark mb-4">
            Everything You Need to{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Dominate Your Niche
            </span>
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: <FileText className="h-6 w-6" />, title: "AI Script Generation", description: "Generate viral scripts with AI, optimized for TikTok, Instagram Reels, and YouTube Shorts. Perfect hooks, engaging content, viral potential.", badge: "AI-Powered", color: "primary" },
            { icon: <Brain className="h-6 w-6" />, title: "Project Management", description: "Track all your videos in one place. Edit scripts, regenerate videos, and manage your entire content library effortlessly.", badge: "Proven Formulas", color: "secondary" },
            { icon: <Users className="h-6 w-6" />, title: "100+ Realistic AI Avatars", description: "Choose from diverse, professional AI avatars with natural expressions and movements. Create videos without ever being on camera.", badge: "HeyGen Powered", color: "accent" },
            { icon: <Globe className="h-6 w-6" />, title: "Multi-Platform Formats", description: "Optimized for YouTube Shorts (9:16), TikTok, Instagram Reels, and more. Perfect dimensions and formats every time.", badge: "One Click", color: "primary" },
            { icon: <Mic className="h-6 w-6" />, title: "Natural AI Voices", description: "50+ voices in multiple languages with perfect pronunciation. No robotic sound—just natural, engaging narration for your videos.", badge: "Global Reach", color: "secondary" },
            { icon: <Zap className="h-6 w-6" />, title: "Fast Video Generation", description: "Videos ready in 2-3 minutes. Real-time progress tracking so you know exactly when your professional video is ready to download.", badge: "Always Improving", color: "accent" },
          ].map((feature, idx) => (
            <Card key={idx} hover glow padding="lg">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                feature.color === 'primary' ? 'bg-primary/10 text-primary' :
                feature.color === 'secondary' ? 'bg-secondary/10 text-secondary' :
                'bg-accent/10 text-accent'
              }`}>
                {feature.icon}
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-bold text-dark">{feature.title}</h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">{feature.description}</p>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                feature.color === 'primary' ? 'bg-primary/10 text-primary' :
                feature.color === 'secondary' ? 'bg-secondary/10 text-secondary' :
                'bg-accent/10 text-accent'
              }`}>
                {feature.badge}
              </span>
            </Card>
          ))}
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 7 - CREATIVE PRICING (replaces old pricing cards)
      ═══════════════════════════════════════════════════════════════ */}
      <section id="pricing" className="overflow-x-hidden" style={{ background: "radial-gradient(circle at bottom, #764ba215 0%, transparent 70%)", backgroundColor: "#0a0a0a" }}>
        <CreativePricing />

        {/* FAQ */}
        <div className="max-w-2xl mx-auto mt-16 px-4 py-20">
          <h3 className="text-2xl font-bold text-white text-center mb-8">Frequently Asked Questions</h3>
          <div className="space-y-4">
            {[
              { q: "When will SocialGenie launch?", a: "We're launching very soon! Join the waitlist for early access and exclusive pricing." },
              { q: "Can I change plans later?", a: "Yes, you can upgrade or downgrade your plan at any time." },
              { q: "Do I own the videos?", a: "100% yes. All videos you create are completely yours to use however you want." },
              { q: "What's the refund policy?", a: "We offer a 30-day money-back guarantee, no questions asked." },
            ].map((faq, idx) => (
              <div key={idx} className="border border-gray-600 rounded-xl overflow-hidden bg-[#1a1a1a]">
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-4 text-left font-medium text-white hover:bg-white/5 transition-colors"
                >
                  {faq.q}
                  <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${openFaq === idx ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === idx && (
                  <div className="px-4 pb-4 text-gray-400">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 8 - FINAL CTA
      ═══════════════════════════════════════════════════════════════ */}
      <Section background="dark" className="relative overflow-hidden">
        {/* Animated gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20" />
        
        <div className="relative text-center max-w-3xl mx-auto">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-6">
            Ready to{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Go Viral?
            </span>
          </h2>
          <p className="text-xl lg:text-2xl text-gray-300 mb-10">
            Join the waitlist. Be first to clone yourself.
          </p>

          {/* Email Form */}
          <form onSubmit={handleWaitlist} className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto mb-8 w-full">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 w-full min-h-12 h-14 px-6 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-gray-400 focus:outline-none focus:border-primary transition-colors"
              required
            />
            <Button type="submit" size="xl" loading={loading} icon={<ArrowRight className="h-5 w-5" />} iconPosition="right" className="w-full sm:w-auto min-h-12">
              Join Waitlist
            </Button>
          </form>

          {/* Activity Feed */}
          <div className="flex items-center justify-center gap-2 text-gray-400 mb-8">
            <Flame className="h-5 w-5 text-accent" />
            <span className="text-sm">
              <span className="text-white font-medium">{activityNames[activityIndex].name}</span> from {activityNames[activityIndex].location} just joined
            </span>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-success" />
              Launching soon
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-success" />
              Early access pricing
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-success" />
              Exclusive training
            </div>
          </div>

          {/* Waitlist Count */}
          <div className="mt-8 flex items-center justify-center gap-3">
            <div className="flex -space-x-2">
              {['SC', 'MR', 'LP', 'JW', 'ET'].map((initials, idx) => (
                <div key={idx} className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-dark">
                  {initials}
                </div>
              ))}
            </div>
            <span className="text-gray-400 text-sm">
              Join <span className="text-white font-semibold">10,247</span> creators on the waitlist
            </span>
          </div>
        </div>
      </Section>

      <Footer />
      </main>

      {/* Smooth scroll and animation styles */}
      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }
        * {
          scroll-behavior: smooth;
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 0.55; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite;
        }
        .animation-delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </>
  )
}
