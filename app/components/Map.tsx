'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin, Navigation } from 'lucide-react';

const createCustomIcon = () => {
  const div = document.createElement('div');
  div.className = 'flex items-center justify-center drop-shadow-2xl translate-x-[-50%] translate-y-[-100%]';
  div.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="#01432A" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3" fill="#a3ff12"/></svg>`;
  
  return L.divIcon({
    className: 'custom-icon',
    html: div,
    iconSize: [48, 48],
    iconAnchor: [24, 48], 
  });
};

function LocationMarker({ position, setPosition }: { position: [number, number], setPosition: (pos: [number, number]) => void }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
    drag(e) {
      // Optional: keep marker mapped to center
    }
  });

  return position ? <Marker position={position} icon={createCustomIcon()} /> : null;
}

export default function Map({ 
  initialLat, 
  initialLng,
  onConfirm
}: { 
  initialLat: number, 
  initialLng: number,
  onConfirm: (lat: number, lng: number) => void
}) {
  const [position, setPosition] = useState<[number, number]>([initialLat, initialLng]);

  return (
    <div className="flex flex-col h-full w-full relative z-0">
      <MapContainer 
         center={position} 
         zoom={14} 
         scrollWheelZoom={true} 
         className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <LocationMarker position={position} setPosition={setPosition} />
      </MapContainer>
      
      {/* Absolute Header Overlay Hint */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] pointer-events-none">
         <div className="bg-white/90 backdrop-blur-md px-6 py-3 rounded-full shadow-lg border border-zinc-100 flex items-center gap-2">
           <span className="text-zinc-800 font-black text-sm" dir="rtl">اضغط على الخريطة لتغيير الموقع</span>
         </div>
      </div>

      {/* Massive Bottom Sticky CTA */}
      <div className="absolute bottom-0 left-0 right-0 z-[400] pb-8 pt-10 px-5 bg-gradient-to-t from-zinc-900/40 to-transparent pointer-events-none">
         <button 
           onClick={() => onConfirm(position[0], position[1])}
           className="w-full h-16 bg-[#01432A] hover:bg-[#015132] shadow-2xl text-white rounded-3xl font-black text-xl flex items-center justify-center gap-3 active:scale-95 transition-all pointer-events-auto border-2 border-white/10"
         >
           <span dir="rtl">تأكيد موقع التوصيل</span>
           <Navigation size={24} className="fill-[#a3ff12] text-[#a3ff12]" />
         </button>
      </div>
    </div>
  );
}
