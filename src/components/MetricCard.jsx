'use client';
import { useEffect, useState, useRef } from 'react';

export default function MetricCard({ title, value, icon, variant }) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isPulsing, setIsPulsing] = useState(false);
  const prevValueRef = useRef(value);

  // Gradient definitions based on variant
  const gradients = {
    green: 'from-green-500 to-green-400',
    yellow: 'from-yellow-500 to-yellow-400',
    red: 'from-red-500 to-red-400',
  };

  const bgColors = {
    green: 'bg-green-500/10 text-green-400',
    yellow: 'bg-yellow-500/10 text-yellow-400',
    red: 'bg-red-500/10 text-red-400',
  };

  useEffect(() => {
    if (value !== prevValueRef.current) {
      // Trigger pulse animation
      setIsPulsing(false);
      // Force reflow
      void document.body.offsetWidth;
      setIsPulsing(true);

      // Simple count up animation (simplified for React)
      setDisplayValue(value);
      prevValueRef.current = value;
      
      const timer = setTimeout(() => setIsPulsing(false), 700);
      return () => clearTimeout(timer);
    }
  }, [value]);

  return (
    <div className={`relative bg-[var(--color-bg-card)] rounded-xl p-6 shadow-sm hover:-translate-y-0.5 transition-transform duration-300 ease-out border border-[rgba(255,255,255,0.06)] overflow-hidden ${isPulsing ? 'animate-card-pulse' : ''}`}>
      {/* Top color bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradients[variant] || gradients.green}`}></div>
      
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${bgColors[variant] || bgColors.green}`}>
          {icon}
        </div>
        <div>
          <div className="text-[2.5rem] font-serif leading-tight text-[var(--color-text-primary)]">
            {displayValue.toLocaleString('id-ID')}
          </div>
          <div className="text-xs uppercase tracking-wider text-[var(--color-text-muted)] font-medium mt-1">
            {title}
          </div>
        </div>
      </div>
    </div>
  );
}
