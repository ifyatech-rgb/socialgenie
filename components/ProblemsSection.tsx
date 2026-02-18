export default function ProblemsSection() {
  const problems = [
    {
      emoji: "😫",
      title: "6+ Hours Per Video",
      description:
        "Scripting, filming, editing, re-filming because you messed up...",
    },
    {
      emoji: "😕",
      title: "No Idea What Works",
      description:
        "Guessing what your audience wants. Posting and praying.",
    },
    {
      emoji: "📷",
      title: "Camera Shy = No Content",
      description:
        "Don't like being on camera? Then you don't create. Simple as that.",
    },
  ];

  return (
    <section
      id="problems"
      className="relative py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-slate-800"
    >
      <div className="max-w-7xl mx-auto">
        {/* Heading - Two Colors */}
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-4 sm:mb-6">
            <span className="block text-white">Creating Content</span>
            <span className="block text-slate-400">
              Shouldn&apos;t Be This Hard
            </span>
          </h2>

          <p className="text-lg lg:text-xl text-slate-300 max-w-2xl mx-auto">
            But here&apos;s what creators waste time on every single day:
          </p>
        </div>

        {/* Problem Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-10 sm:mb-12">
          {problems.map((problem, index) => (
            <div
              key={index}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 transition-all hover:bg-white/10 hover:scale-[1.02]"
            >
              <div className="text-5xl mb-4" aria-hidden>
                {problem.emoji}
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-100 leading-snug mb-3">
                {problem.title}
              </h3>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                {problem.description}
              </p>
            </div>
          ))}
        </div>

        {/* Footer Text */}
        <div className="text-center mt-10 sm:mt-12">
          <p className="text-base sm:text-lg text-slate-300">
            Sound familiar?{" "}
            <span className="font-semibold text-slate-100">
              There&apos;s a better way ↓
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
