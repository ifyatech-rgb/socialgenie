"use client"

import Link from "next/link"
import { 
  ArrowRight, Check, Star, Upload, Sparkles, Video, Zap, Play, Users, 
  TrendingUp, Clock, Shield, Globe, Camera, XCircle, HelpCircle, 
  Binoculars, FileText, Mic, Brain, ChevronDown, Flame
} from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Section } from "@/components/ui/section"
import { useState, useEffect } from "react"

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
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [activityIndex, setActivityIndex] = useState(0)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

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
    <div className="min-h-screen bg-light">
      <Navbar />

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 1 - HERO
      ═══════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen pt-28 lg:pt-32 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-white to-accent/5" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full filter blur-3xl animate-pulse" />
        <div className="absolute top-40 right-10 w-96 h-96 bg-accent/10 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-secondary/10 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center py-12 lg:py-20 w-full">
            {/* Left - Content */}
            <div className="text-center lg:text-left">
              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-dark leading-[1.1] tracking-tight mb-6">
                Your Partner to{" "}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Go Viral
                </span>
              </h1>

              {/* Subheadline */}
              <h2 className="text-xl lg:text-2xl text-gray-600 font-medium mb-4">
                Complete AI video generation platform.
              </h2>

              {/* Description */}
              <p className="text-lg text-gray-500 mb-8 max-w-xl mx-auto lg:mx-0">
                Create viral scripts, choose realistic avatars, add natural voices, and generate professional videos for YouTube Shorts, TikTok, and Instagram Reels in minutes.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
                <Link href="/auth/signin">
                  <Button size="xl" icon={<ArrowRight className="h-5 w-5" />} iconPosition="right">
                    Get Started
                  </Button>
                </Link>
                <Button variant="secondary" size="xl" icon={<Play className="h-5 w-5 text-primary" />}>
                  Watch Demo
                </Button>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-col sm:flex-row flex-wrap gap-4 sm:gap-6 justify-center lg:justify-start text-sm text-gray-500">
                <div className="flex items-center gap-2 justify-center lg:justify-start">
                  <Check className="h-5 w-5 text-success" />
                  Complete video generation
                </div>
                <div className="flex items-center gap-2 justify-center lg:justify-start">
                  <Check className="h-5 w-5 text-success" />
                  100+ AI avatars • 2-minute videos
                </div>
                <div className="flex items-center gap-2 justify-center lg:justify-start">
                  <Check className="h-5 w-5 text-success" />
                  4.9★ from 3,247 creators
                </div>
              </div>

              {/* Social Proof Badge */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <div className="flex items-center gap-4 justify-center lg:justify-start">
                  <div className="flex -space-x-3">
                    {["SC", "MR", "JT", "AL", "KP"].map((initials, i) => (
                      <div 
                        key={i}
                        className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold border-2 border-white"
                      >
                        {initials}
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold text-dark">10,000+</span> creators trust SocialGenie
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right - Visual */}
            <div className="relative hidden lg:block">
              {/* Main Card */}
              <div className="relative bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 transform rotate-1">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 h-80 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-primary to-accent rounded-full mx-auto mb-4 flex items-center justify-center">
                      <Video className="h-12 w-12 text-white" />
                    </div>
                    <p className="text-gray-600 font-medium">Your AI Clone is Ready</p>
                    <p className="text-gray-400 text-sm">Creating video #247...</p>
                  </div>
                </div>
              </div>

              {/* Floating Cards */}
              <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl p-4 border border-gray-100 animate-bounce" style={{ animationDuration: "3s" }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <div className="font-bold text-dark">2.4M views</div>
                    <div className="text-xs text-gray-500">This week</div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl p-4 border border-gray-100 animate-bounce" style={{ animationDuration: "4s" }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <div className="font-bold text-dark">+50K followers</div>
                    <div className="text-xs text-gray-500">Last 30 days</div>
                  </div>
                </div>
              </div>

              <div className="absolute top-1/2 -right-8 bg-gradient-to-r from-primary to-accent text-white rounded-full px-4 py-2 text-sm font-bold shadow-lg">
                Top 1% in niche
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce hidden lg:block">
          <ChevronDown className="h-8 w-8 text-gray-400" />
        </div>
      </section>

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
          SECTION 3 - SOLUTION (HOW IT WORKS)
      ═══════════════════════════════════════════════════════════════ */}
      <Section id="how-it-works" background="white">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-dark mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-600">
            Create viral videos in four simple steps.
          </p>
        </div>

        <div className="space-y-16 lg:space-y-24">
          {/* Step 1 */}
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-primary/25">
                  1
                </div>
                <span className="text-sm font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
                  AI-Powered Research
                </span>
              </div>
              <h3 className="text-2xl lg:text-3xl font-bold text-dark mb-4">
                We Analyze Your Niche
              </h3>
              <p className="text-lg text-gray-600 mb-6">
                Enter your topic. We scan thousands of viral videos in your niche, identify patterns, hooks, and structures that actually work.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-gray-600">
                  <Check className="h-5 w-5 text-success" />
                  Competitor content analysis
                </li>
                <li className="flex items-center gap-3 text-gray-600">
                  <Check className="h-5 w-5 text-success" />
                  Viral pattern detection
                </li>
                <li className="flex items-center gap-3 text-gray-600">
                  <Check className="h-5 w-5 text-success" />
                  Engagement metrics tracking
                </li>
              </ul>
            </div>
            <div className="order-1 lg:order-2">
              <Card variant="gradient" padding="lg" className="text-center">
                <Binoculars className="h-16 w-16 text-primary mx-auto mb-4" />
                <p className="text-gray-600">Analyzing 10,000+ viral videos...</p>
              </Card>
            </div>
          </div>

          {/* Step 2 */}
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div className="order-1">
              <Card variant="gradient" padding="lg" className="text-center">
                <Upload className="h-16 w-16 text-secondary mx-auto mb-4" />
                <p className="text-gray-600">Upload your 10-second video...</p>
              </Card>
            </div>
            <div className="order-2">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-secondary to-secondary/80 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-secondary/25">
                  2
                </div>
                <span className="text-sm font-semibold text-secondary bg-secondary/10 px-3 py-1 rounded-full">
                  One-Time Setup
                </span>
              </div>
              <h3 className="text-2xl lg:text-3xl font-bold text-dark mb-4">
                Upload Your Face (Once)
              </h3>
              <p className="text-lg text-gray-600 mb-6">
                Take a 10-second selfie video. Our AI learns your face, voice, expressions. This is the only time you'll ever show your real face.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-gray-600">
                  <Check className="h-5 w-5 text-success" />
                  Simple drag-and-drop upload
                </li>
                <li className="flex items-center gap-3 text-gray-600">
                  <Check className="h-5 w-5 text-success" />
                  AI learns your unique style
                </li>
                <li className="flex items-center gap-3 text-gray-600">
                  <Check className="h-5 w-5 text-success" />
                  Clone ready in 2 minutes
                </li>
              </ul>
            </div>
          </div>

          {/* Step 3 */}
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-accent to-accent/80 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-accent/25">
                  3
                </div>
                <span className="text-sm font-semibold text-accent bg-accent/10 px-3 py-1 rounded-full">
                  Fully Automated
                </span>
              </div>
              <h3 className="text-2xl lg:text-3xl font-bold text-dark mb-4">
                Your Clone Creates Content
              </h3>
              <p className="text-lg text-gray-600 mb-6">
                We write scripts based on what's proven to work. Your AI clone records the videos. You just download and post.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-gray-600">
                  <Check className="h-5 w-5 text-success" />
                  Data-backed viral scripts
                </li>
                <li className="flex items-center gap-3 text-gray-600">
                  <Check className="h-5 w-5 text-success" />
                  Perfect lip-sync technology
                </li>
                <li className="flex items-center gap-3 text-gray-600">
                  <Check className="h-5 w-5 text-success" />
                  Download and post anywhere
                </li>
              </ul>
            </div>
            <div className="order-1 lg:order-2">
              <Card variant="gradient" padding="lg" className="text-center">
                <Video className="h-16 w-16 text-accent mx-auto mb-4" />
                <p className="text-gray-600">Generating video #1,247...</p>
              </Card>
            </div>
          </div>
        </div>

        <div className="text-center mt-16">
          <Link href="/auth/signin">
            <Button size="xl" icon={<ArrowRight className="h-5 w-5" />} iconPosition="right">
              Start Creating Videos
            </Button>
          </Link>
          <p className="mt-4 text-gray-500">
            Complete video generation platform
          </p>
        </div>
      </Section>

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
              <p><strong className="text-dark">Cost:</strong> $99/month</p>
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
          SECTION 7 - PRICING
      ═══════════════════════════════════════════════════════════════ */}
      <Section id="pricing" background="white">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-dark mb-4">
            Choose Your Plan
          </h2>
          <p className="text-xl text-gray-600">
            All plans include competitor analysis and viral script generation
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {/* Free Trial */}
          <Card hover padding="lg" className="relative">
            <div className="text-sm font-semibold text-gray-500 mb-2">Test Drive</div>
            <div className="text-5xl font-bold text-dark mb-2">$0</div>
            <p className="text-gray-600 mb-6">Perfect for testing</p>
            <ul className="space-y-3 mb-8">
              {["5 AI scripts", "2 AI videos", "Competitor analysis", "All platforms", "7-day access"].map((feature, idx) => (
                <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                  <Check className="h-4 w-4 text-success" />
                  {feature}
                </li>
              ))}
            </ul>
            <Button variant="outline" fullWidth>
              Join Waitlist
            </Button>
            <p className="text-xs text-gray-500 text-center mt-3">Complete video platform</p>
          </Card>

          {/* Creator */}
          <Card hover glow padding="lg" className="relative border-2 border-primary">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-accent text-white text-xs font-bold px-3 py-1 rounded-full">
              ⭐ MOST POPULAR
            </div>
            <div className="absolute top-4 right-4 bg-accent/10 text-accent text-xs font-bold px-2 py-1 rounded">
              COMING SOON
            </div>
            <div className="text-sm font-semibold text-primary mb-2">Creator</div>
            <div className="text-5xl font-bold text-dark mb-2">$99<span className="text-lg text-gray-500">/mo</span></div>
            <p className="text-gray-600 mb-6">For serious creators</p>
            <ul className="space-y-3 mb-8">
              {["200 AI scripts/month", "50 AI videos/month", "Competitor spy mode", "Voice cloning (140+ languages)", "Multi-platform export", "Priority support"].map((feature, idx) => (
                <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                  <Check className="h-4 w-4 text-success" />
                  {feature}
                </li>
              ))}
            </ul>
            <Button fullWidth>
              Join Waitlist
            </Button>
            <p className="text-xs text-gray-500 text-center mt-3">Join 7,000+ creators</p>
          </Card>

          {/* Pro */}
          <Card hover padding="lg" className="relative">
            <div className="text-sm font-semibold text-gray-500 mb-2">Maximum Power</div>
            <div className="text-5xl font-bold text-dark mb-2">$199<span className="text-lg text-gray-500">/mo</span></div>
            <p className="text-gray-600 mb-6">For agencies & teams</p>
            <ul className="space-y-3 mb-8">
              {["Unlimited scripts", "200 videos/month", "Premium avatars", "API access", "White-label option", "Dedicated manager"].map((feature, idx) => (
                <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                  <Check className="h-4 w-4 text-success" />
                  {feature}
                </li>
              ))}
            </ul>
            <Button variant="outline" fullWidth>
              Join Waitlist
            </Button>
            <p className="text-xs text-gray-500 text-center mt-3">Enterprise-grade</p>
          </Card>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto mt-16">
          <h3 className="text-2xl font-bold text-dark text-center mb-8">Frequently Asked Questions</h3>
          <div className="space-y-4">
            {[
              { q: "When will SocialGenie launch?", a: "We're launching very soon! Join the waitlist for early access and exclusive pricing." },
              { q: "Can I change plans later?", a: "Yes, you can upgrade or downgrade your plan at any time." },
              { q: "Do I own the videos?", a: "100% yes. All videos you create are completely yours to use however you want." },
              { q: "What's the refund policy?", a: "We offer a 30-day money-back guarantee, no questions asked." },
            ].map((faq, idx) => (
              <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-4 text-left font-medium text-dark hover:bg-gray-50 transition-colors"
                >
                  {faq.q}
                  <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${openFaq === idx ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === idx && (
                  <div className="px-4 pb-4 text-gray-600">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </Section>

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
          <form onSubmit={handleWaitlist} className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto mb-8">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 h-14 px-6 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-gray-400 focus:outline-none focus:border-primary transition-colors"
              required
            />
            <Button type="submit" size="xl" loading={loading} icon={<ArrowRight className="h-5 w-5" />} iconPosition="right">
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
    </div>
  )
}
