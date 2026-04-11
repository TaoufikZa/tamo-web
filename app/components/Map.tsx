'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin, Navigation, LocateFixed, Loader2 } from 'lucide-react';

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

function LocateMeBtn({ setPosition }: { setPosition: (pos: [number, number]) => void }) {
  const map = useMap();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLocate = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    setErrorMsg('');
    
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setErrorMsg('Location API not supported.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latlng: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setPosition(latlng);
        // Smoothly pan to new location
        map.flyTo(latlng, 16, { animate: true, duration: 1.5 });
        setLoading(false);
      },
      (err) => {
        setErrorMsg('Location permission denied. Please drag the pin manually.');
        setLoading(false);
        setTimeout(() => setErrorMsg(''), 5000);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="absolute bottom-[110px] right-5 z-[500] flex flex-col items-end gap-2 pointer-events-none">
      {errorMsg && (
        <div className="bg-red-50 text-red-600 px-3 py-2 rounded-lg text-xs font-bold shadow-md border border-red-100 max-w-[200px] text-right pointer-events-auto transition-opacity" dir="rtl">
          {errorMsg}
        </div>
      )}
      <button 
        onClick={handleLocate}
        className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-[#01432A] shadow-xl hover:bg-zinc-50 active:scale-95 transition-all outline-none border border-zinc-100 pointer-events-auto"
      >
        {loading ? <Loader2 className="animate-spin text-[#01432A]" size={24} /> : <LocateFixed size={26} />}
      </button>
    </div>
  );
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
        <LocateMeBtn setPosition={setPosition} />
      </MapContainer>
      
      {/* Absolute Header Overlay Hint */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] pointer-events-none w-full flex justify-center px-4">
         <div className="bg-white px-6 py-4 rounded-3xl shadow-md border border-zinc-100 flex items-center justify-center min-w-[280px]">
           <span className="text-zinc-900 font-bold text-sm text-center">اختر موقعك | Choisissez votre position</span>
         </div>
      </div>

      {/* Massive Bottom Sticky CTA */}
      <div className="absolute bottom-0 left-0 right-0 z-[400] pb-8 pt-10 px-5 bg-gradient-to-t from-zinc-900/40 to-transparent pointer-events-none flex justify-center">
         <button 
           onClick={() => onConfirm(position[0], position[1])}
           className="relative w-full max-w-sm h-[72px] bg-[#062C1E] hover:bg-[#093c2a] shadow-2xl text-white rounded-full flex items-center justify-center active:scale-95 transition-transform pointer-events-auto"
         >
           <div className="flex flex-col items-center justify-center leading-tight">
             <span className="font-bold text-[19px]" dir="rtl">تأكيد موقع التوصيل</span>
             <span className="text-[10px] font-bold text-[#a3ff12] uppercase tracking-[0.1em] mt-0.5">Confirmer la position</span>
           </div>
           <div className="absolute right-6 flex items-center justify-center">
             <Navigation size={22} className="fill-[#a3ff12] text-[#a3ff12] rotate-45" />
           </div>
         </button>
      </div>
    </div>
  );
}
