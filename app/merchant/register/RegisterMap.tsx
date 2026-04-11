'use client';

import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { LocateFixed, Loader2 } from 'lucide-react';
import { useState } from 'react';

// Custom Marker Icon for Registeration
const registrationIcon = L.divIcon({
  className: 'custom-icon',
  html: `<div class="flex items-center justify-center translate-x-[-50%] translate-y-[-100%] drop-shadow-xl">
           <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="#062C1E" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3" fill="#a3ff12"/></svg>
         </div>`,
  iconSize: [44, 44],
  iconAnchor: [22, 44],
});

function MapEvents({ onLocationChange }: { onLocationChange: (pos: [number, number]) => void }) {
  useMapEvents({
    click(e) {
      onLocationChange([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

function LocateMeBtn({ setCoords }: { setCoords: (pos: [number, number]) => void }) {
  const map = useMap();
  const [loading, setLoading] = useState(false);

  const findMe = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newCoords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setCoords(newCoords);
        map.flyTo(newCoords, 16);
        setLoading(false);
      },
      () => setLoading(false),
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="absolute top-3 right-3 z-[400]">
      <button 
        onClick={findMe}
        className="w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-md active:scale-95 transition-all text-[#062C1E] border border-zinc-100"
      >
        {loading ? <Loader2 size={20} className="animate-spin" /> : <LocateFixed size={22} />}
      </button>
    </div>
  );
}

export default function RegisterMap({ 
  coords, 
  setCoords 
}: { 
  coords: [number, number], 
  setCoords: (c: [number, number]) => void 
}) {
  return (
    <MapContainer center={coords} zoom={13} scrollWheelZoom={false} className="w-full h-full z-0">
      <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
      <Marker position={coords} icon={registrationIcon} />
      <MapEvents onLocationChange={setCoords} />
      <LocateMeBtn setCoords={setCoords} />
    </MapContainer>
  );
}
