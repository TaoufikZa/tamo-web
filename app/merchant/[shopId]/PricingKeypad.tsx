'use client';

import { useState } from 'react';
import { Delete } from 'lucide-react';

export function PricingKeypad({ value, onChange }: { value: string, onChange: (val: string) => void }) {
  
  const handlePress = (key: string) => {
    if (key === 'clear') {
      onChange('');
      return;
    }
    
    // Prevent multiple decimals
    if (key === '.' && value.includes('.')) return;
    
    // Prevent leading zero unless followed by decimal
    if (value === '0' && key !== '.') {
      onChange(key);
      return;
    }

    // Limit length to avoid overflow
    if (value.length >= 7) return;

    onChange(value + key);
  };

  const keys = [
    '1', '2', '3',
    '4', '5', '6',
    '7', '8', '9',
    '.', '0', 'clear'
  ];

  return (
    <div className="grid grid-cols-3 gap-3 w-full max-w-[300px] mx-auto mt-6">
      {keys.map((k) => (
        <button
          key={k}
          onClick={() => handlePress(k)}
          className="h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 font-bold text-2xl flex items-center justify-center active:scale-95 transition-transform"
        >
          {k === 'clear' ? <Delete className="text-zinc-500" size={28} /> : k}
        </button>
      ))}
    </div>
  );
}
