'use client';
import { useRef } from 'react';
import { HALTE_LIST, getDensityLevel, getDensityColor } from '@/utils/halte-data';

export default function HalteSelector({ selectedHalteId, onSelect, halteStates }) {
  const scrollRef = useRef(null);

  return (
    <div className="relative mb-6">
      <div 
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto pb-2 halte-scroll scroll-smooth"
      >
        <button
          onClick={() => onSelect('all')}
          className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
            selectedHalteId === 'all' 
              ? 'bg-[var(--color-bg-elevated)] border-gray-600 text-[var(--color-text-primary)] shadow-sm' 
              : 'bg-[var(--color-bg-card)] border-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          Semua Halte
        </button>

        {HALTE_LIST.map((halte) => {
          const state = halteStates[halte.id];
          const level = state ? getDensityLevel(state.total_saat_ini) : 'unknown';
          const { bg } = getDensityColor(level); // Assuming getDensityColor returns { fill, stroke, glow, tw }

          return (
            <button
              key={halte.id}
              onClick={() => onSelect(halte.id)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                selectedHalteId === halte.id
                  ? 'bg-[var(--color-bg-elevated)] border-gray-600 text-[var(--color-text-primary)] shadow-sm' 
                  : 'bg-[var(--color-bg-card)] border-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
              }`}
            >
              <span 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: state ? getDensityColor(level).fill : '#6b7280' }}
              ></span>
              {halte.name.replace('Halte ', '')}
            </button>
          );
        })}
      </div>
    </div>
  );
}
