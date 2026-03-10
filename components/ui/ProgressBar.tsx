"use client";

interface ProgressBarProps {
  value: number; // 0-100
  className?: string;
}

export function ProgressBar({ value, className = "" }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={`w-full bg-gray-100 rounded-full h-2 overflow-hidden ${className}`}>
      <div
        className="h-2 rounded-full transition-all duration-500 ease-out"
        style={{
          width: `${clamped}%`,
          background: "linear-gradient(90deg, #3b82f6 0%, #60a5fa 40%, #93c5fd 50%, #60a5fa 60%, #3b82f6 100%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 2s infinite linear",
        }}
      />
    </div>
  );
}
