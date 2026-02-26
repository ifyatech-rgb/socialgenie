import Link from "next/link";

export default function HowItWorksSection() {
  const steps = [
    {
      number: 1,
      icon: "🔍",
      title: "AI-Powered Research",
      description:
        "Enter your niche topic and let our AI scan thousands of top-performing videos to find the exact patterns, hooks, and content structures that drive real engagement and views.",
      features: [
        "Competitor content analysis",
        "Viral hook and pattern detection",
        "Engagement and retention metrics",
      ],
      isPurple: false,
    },
    {
      number: 2,
      icon: "🎭",
      title: "Upload Your Face Once",
      description:
        "Record a single 1-minute video. Our AI studies your face, voice, and expressions to build your personal digital clone. You never have to appear on camera again.",
      features: [],
      isPurple: true,
    },
    {
      number: 3,
      icon: "🤖",
      title: "Your AI Clone Records Everything",
      description:
        "We generate data-backed scripts and your AI clone records professional videos automatically. Just review, download, and post to your channels.",
      features: [],
      isPurple: false,
    },
    {
      number: 4,
      icon: "🚀",
      title: "Go Viral on Autopilot",
      description:
        "Post consistently without lifting a finger. Your clone handles all content creation while you stay focused on strategy and brand growth.",
      features: [
        "Consistent daily posting schedule",
        "Multi-platform content distribution",
        "Rapid and compounding audience growth",
      ],
      isPurple: true,
    },
  ];

  return (
    <section
      id="how-it-works"
      className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gray-50"
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16 lg:mb-20">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
            How It Works
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Create viral videos in four simple steps and grow your audience on
            autopilot
          </p>
        </div>

        {/* Steps - vertical stack with connecting lines */}
        <div className="space-y-8 lg:space-y-12">
          {steps.map((step) => (
            <div key={step.number} className="relative">
              {/* Step Card */}
              <div
                className={`relative rounded-2xl p-8 lg:p-10 transition-all ${
                  step.isPurple
                    ? "bg-gradient-to-br from-purple-600 via-purple-600 to-purple-700 text-white shadow-2xl shadow-purple-200/50"
                    : "bg-white border border-gray-200 shadow-lg hover:shadow-xl"
                }`}
              >
                {/* Step Number Badge */}
                <div className="absolute -top-5 -left-5 w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center shadow-lg border-4 border-white z-10">
                  <span className="text-xl font-bold text-white">
                    {step.number}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  {/* Icon Container - larger */}
                  <div
                    className={`flex-shrink-0 w-20 h-20 rounded-2xl flex items-center justify-center shadow-md ${
                      step.isPurple
                        ? "bg-white/20 backdrop-blur-sm"
                        : "bg-purple-100"
                    }`}
                    aria-hidden
                  >
                    <span className="text-5xl">{step.icon}</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3
                      className={`text-2xl sm:text-3xl font-bold mb-4 leading-tight ${
                        step.isPurple ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {step.title}
                    </h3>

                    <p
                      className={`text-base sm:text-lg leading-relaxed mb-6 ${
                        step.isPurple ? "text-purple-100" : "text-gray-600"
                      }`}
                    >
                      {step.description}
                    </p>

                    {/* Features List */}
                    {step.features.length > 0 && (
                      <ul className="space-y-3">
                        {step.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <svg
                              className={`w-6 h-6 flex-shrink-0 mt-0.5 ${
                                step.isPurple
                                  ? "text-green-300"
                                  : "text-green-500"
                              }`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                              aria-hidden
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span
                              className={`text-sm sm:text-base ${
                                step.isPurple
                                  ? "text-purple-100"
                                  : "text-gray-700"
                              }`}
                            >
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>

              {/* Connecting line between steps */}
              {step.number < 4 && (
                <div className="flex justify-center py-4">
                  <div
                    className="w-0.5 h-8 bg-gradient-to-b from-purple-400 to-purple-200 rounded-full"
                    aria-hidden
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div className="text-center mt-16 lg:mt-20">
            <Link
            href="/auth/signup"
            className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white text-base sm:text-lg font-semibold rounded-full shadow-xl hover:shadow-2xl transition-all hover:scale-105"
          >
            <span>Start Creating Videos</span>
            <svg
              className="w-5 h-5 group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
