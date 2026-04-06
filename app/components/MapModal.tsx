'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// SSR must be disabled for Leaflet to work in Next.js
const DynamicMap = dynamic(() => import('./Map'), { 
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center h-full bg-white dark:bg-[#1a1c23] rounded-t-3xl">
       <Loader2 size={40} className="animate-spin text-[#01432A] mb-4" />
       <p className="font-bold text-zinc-500" dir="rtl">جاري تحميل الخريطة...</p>
    </div>
  )
});

export function MapModal({ 
  isOpen, 
  initialLat, 
  initialLng,
  onConfirm,
  onCancel 
}: { 
  isOpen: boolean,
  initialLat: number | null, 
  initialLng: number | null,
  onConfirm: (lat: number, lng: number) => void,
  onCancel: () => void 
}) {
  
  if (!isOpen || initialLat === null || initialLng === null) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] transition-opacity"
        onClick={onCancel}
      />
      <div className="fixed inset-x-0 bottom-0 top-[20%] z-[9999] transition-transform duration-300">
        <DynamicMap 
           initialLat={initialLat} 
           initialLng={initialLng} 
           onConfirm={onConfirm} 
           onCancel={onCancel} 
        />
      </div>
    </>
  );
}
