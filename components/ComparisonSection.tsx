export default function ComparisonSection() {
  const competitors = [
    {
      emoji: "😫",
      title: "DIY Video",
      time: "6+ hours",
      cost: "$500+ per video",
      quality: "Hit or miss",
      features: [
        { text: "No competitor analysis", hasIt: false },
        { text: "Manual scripting", hasIt: false },
        { text: "Need equipment", hasIt: false },
      ],
      isBest: false,
    },
    {
      emoji: "😐",
      title: "Other AI Tools",
      time: "30 mins",
      cost: "$100/month",
      quality: "Robotic",
      features: [
        { text: "No competitor research", hasIt: false },
        { text: "AI script (generic)", hasIt: false },
        { text: "No strategy", hasIt: false },
      ],
      isBest: false,
    },
    {
      emoji: "👑",
      title: "SocialGenie",
      time: "3 minutes",
      cost: "From $39/month",
      quality: "Indistinguishable",
      features: [
        { text: "Analyzes top 1%", hasIt: true },
        { text: "Proven viral scripts", hasIt: true },
        { text: "Hyper-realistic clone", hasIt: true },
        { text: "Multi-platform", hasIt: true },
      ],
      isBest: true,
    },
  ];

  return (
    <section
      id="comparison"
      className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-slate-800"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
            Why Competitors
            <br />
            Can&apos;t Keep Up
          </h2>
          <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto">
            Most tools just clone you. We make you{" "}
            <span className="font-semibold text-white">
              better than your best competitors
            </span>
            .
          </p>
        </div>

        {/* Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-12">
          {competitors.map((comp, index) => (
            <div
              key={index}
              className={`relative rounded-2xl p-6 sm:p-8 shadow-lg transition-all hover:scale-[1.02] ${
                comp.isBest
                  ? "bg-gradient-to-br from-purple-100 to-purple-50 border-2 border-purple-500"
                  : "bg-gray-50 border border-gray-200"
              }`}
            >
              {/* BEST Badge */}
              {comp.isBest && (
                <div className="absolute top-4 right-4 bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  BEST
                </div>
              )}

              {/* Emoji */}
              <div className="text-5xl text-center mb-4" aria-hidden>
                {comp.emoji}
              </div>

              {/* Title */}
              <h3
                className={`text-xl sm:text-2xl font-bold text-center mb-6 ${
                  comp.isBest ? "text-purple-600" : "text-gray-900"
                }`}
              >
                {comp.title}
              </h3>

              {/* Stats */}
              <div className="space-y-4 mb-6">
                <div>
                  <div className="text-xs text-gray-600 mb-1">Time:</div>
                  <div
                    className={`text-lg font-semibold ${
                      comp.isBest ? "text-purple-700" : "text-gray-900"
                    }`}
                  >
                    {comp.time}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-1">Cost:</div>
                  <div
                    className={`text-lg font-semibold ${
                      comp.isBest ? "text-purple-700" : "text-gray-900"
                    }`}
                  >
                    {comp.cost}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-1">Quality:</div>
                  <div
                    className={`text-lg font-semibold ${
                      comp.isBest ? "text-purple-700" : "text-gray-900"
                    }`}
                  >
                    {comp.quality}
                  </div>
                </div>
              </div>

              {/* Features List */}
              <ul className="space-y-2">
                {comp.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    {feature.hasIt ? (
                      <svg
                        className="w-5 h-5 text-green-500 flex-shrink-0"
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
                    ) : (
                      <svg
                        className="w-5 h-5 text-red-500 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        aria-hidden
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                    <span
                      className={`text-sm ${
                        comp.isBest ? "text-purple-700" : "text-gray-600"
                      }`}
                    >
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-base sm:text-lg text-slate-300">
            The difference?{" "}
            <span className="font-semibold text-white">
              We don&apos;t just clone you. We make you better.
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
