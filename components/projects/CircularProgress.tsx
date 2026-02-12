"use client";

import { motion } from "framer-motion";

interface CircularProgressProps {
  progress: number;
  size?: number;
  className?: string;
}

export function CircularProgress({ progress, size = 100, className = "" }: CircularProgressProps) {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`}>
      <svg width={size} height={size} className="-rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={strokeWidth} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00d9ff" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="mb-1">
          <svg width={32} height={32} viewBox="0 0 24 24" fill="none" className="opacity-90">
            <defs>
              <linearGradient id="gemGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00d9ff" />
                <stop offset="50%" stopColor="#ec4899" />
                <stop offset="100%" stopColor="#22c55e" />
              </linearGradient>
            </defs>
            <path d="M12 2L2 7l10 15 10-15L12 2z" fill="url(#gemGradient)" />
          </svg>
        </motion.div>
        <span className="text-sm font-semibold text-white">{Math.round(progress)}%</span>
      </div>
    </div>
  );
}
