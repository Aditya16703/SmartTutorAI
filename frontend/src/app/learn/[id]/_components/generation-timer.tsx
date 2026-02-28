"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

export default function GenerationTimer({ 
  onStatusChange 
}: { 
  onStatusChange?: (status: 'normal' | 'long' | 'retry') => void 
}) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (seconds === 25 && onStatusChange) {
      onStatusChange('long');
    } else if (seconds === 45 && onStatusChange) {
      onStatusChange('retry');
    }
  }, [seconds, onStatusChange]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getStatusText = (s: number) => {
    if (s >= 45) return "Stuck? You can try triggering it again.";
    if (s >= 25) return "Taking longer than usual... still working!";
    return "Usually takes ~15-20 seconds";
  };

  return (
    <div className="flex flex-col items-center gap-2 mt-4 animate-in fade-in zoom-in duration-500">
      <div className={`flex items-center gap-2 px-4 py-2 rounded-full border shadow-sm transition-colors duration-500 ${
        seconds >= 25 
          ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800" 
          : "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
      }`}>
        <Clock className={`w-4 h-4 ${seconds >= 25 ? "animate-bounce" : "animate-pulse"}`} />
        <span className="font-mono text-lg font-medium tracking-wider">
          {formatTime(seconds)}
        </span>
      </div>
      <p className={`text-xs italic transition-colors duration-500 ${
        seconds >= 25 ? "text-amber-600 dark:text-amber-400" : "text-blue-600/70 dark:text-blue-400/70"
      }`}>
        {getStatusText(seconds)}
      </p>
    </div>
  );
}
