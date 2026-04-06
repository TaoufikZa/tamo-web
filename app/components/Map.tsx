'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { createRoot } from 'react-dom/client';
import { MapPin } from 'lucide-react';

// Bulletproof trick: Create a custom Leaflet DivIcon using a React Component (Lucide MapPin)
const createCustomIcon = () => {
  const div = document.createElement('div');
  div.className = 'text-red-500 drop-shadow-md flex items-center justify-center translate-x-[-50%] translate-y-[-100%]';
  // Avoid using large dependencies dynamically, we quickly brute force the raw SVG or just use ReactDOM
  // Since we rely on standard DOM, we can set innerHTML
  div.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="currentColor" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3" fill="white"/></svg>`;
  
  return L.divIcon({
    className: 'custom-icon',
    html: div,
    iconSize: [36, 36],
    iconAnchor: [18, 36], // Bottom center
  });
};

function LocationMarker({ position, setPosition }: { position: [number, number], setPosition: (pos: [number, number]) => void }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position ? <Marker position={position} icon={createCustomIcon()} /> : null;
}

export default function Map({ 
  initialLat, 
  initialLng,
  onConfirm,
  onCancel 
}: { 
  initialLat: number, 
  initialLng: number,
  onConfirm: (lat: number, lng: number) => void,
  onCancel: () => void 
}) {
  const [position, setPosition] = useState<[number, number]>([initialLat, initialLng]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#1a1c23] rounded-t-3xl overflow-hidden shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
      <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center text-zinc-900 dark:text-white">
         <button onClick={onCancel} className="text-sm font-bold text-zinc-500 hover:text-red-500 transition-colors">إلغاء / Annuler</button>
         <h2 className="font-bold">تحديد الموقع / Choisir la position</h2>
         <button onClick={() => onConfirm(position[0], position[1])} className="text-sm font-bold text-[#01432A] hover:text-[#015132] transition-colors">تأكيد / Confirmer</button>
      </div>
      
      <div className="flex-1 w-full relative z-0">
        <MapContainer 
           center={position} 
           zoom={16} 
           scrollWheelZoom={true} 
           style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          <LocationMarker position={position} setPosition={setPosition} />
        </MapContainer>
        
        {/* Instruction overlay */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[400] bg-zinc-900/80 text-white backdrop-blur-md px-6 py-3 rounded-full text-sm font-bold shadow-lg pointer-events-none whitespace-nowrap">
           اضغط على الخريطة لتغيير الموقع
        </div>
      </div>
    </div>
  );
}
