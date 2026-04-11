'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Store, Loader2, MapPin } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import dynamic from 'next/dynamic';

// Dynamic import the Map to bypass SSR
const DynamicMap = dynamic(() => import('./components/Map'), { 
  ssr: false,
  loading: () => (
    <div className="flex flex-col flex-1 items-center justify-center min-h-[50vh]">
       <Loader2 size={48} className="animate-spin text-[#01432A] mb-4" />
       <p className="font-bold text-zinc-500" dir="rtl">جاري تحميل الخريطة...</p>
    </div>
  )
});

type Shop = {
  id: string;
  shop_name: string;
  lat: number | null;
  lng: number | null;
  image_url: string | null;
};

export default function HomeClient() {
  const [currentView, setCurrentView] = useState<'map' | 'shops' | 'loading'>('loading');
  
  // Coordinates (default to Casablanca if nothing works)
  const [coords, setCoords] = useState<[number, number]>([33.5731, -7.5898]);
  const [addressName, setAddressName] = useState('...');
  
  const [shops, setShops] = useState<Shop[]>([]);
  const [isFetchingShops, setIsFetchingShops] = useState(false);
  
  const initialized = useRef(false);
  const supabase = createClient();

  const reverseGeocode = async (lat: number, lng: number) => {
    setAddressName('جاري البحث...');
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      const simpleAddress = data?.address?.road || data?.address?.suburb || data?.address?.city || 'موقع محدد';
      setAddressName(simpleAddress);
    } catch (e) {
      setAddressName('موقع محدد');
    }
  };

  const fetchShops = useCallback(async () => {
    setIsFetchingShops(true);
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('id, shop_name, lat, lng, image_url')
        .eq('status', 'active');
        
      if (!error && data) {
        setShops(data);
      }
    } catch (e) {
      console.error('Failed to fetch shops', e);
    } finally {
      setIsFetchingShops(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // 1. Check LocalStorage
    const cachedLoc = localStorage.getItem('tamo_location');
    if (cachedLoc) {
      try {
        const { lat, lng } = JSON.parse(cachedLoc);
        setCoords([lat, lng]);
        reverseGeocode(lat, lng);
        fetchShops();
        setCurrentView('shops');
        return;
      } catch (e) {}
    }

    // 2. If nothing cached, try a silent geolocation snap just in case permissions are already granted
    setCurrentView('map');
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords([position.coords.latitude, position.coords.longitude]);
        },
        () => {
          // Silent failure. We just leave it at Casablanca default.
        },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
      );
    }
  }, [fetchShops]);

  // When the user hits the primary sticky CTA on the map
  const confirmLocation = (lat: number, lng: number) => {
    setCoords([lat, lng]);
    localStorage.setItem('tamo_location', JSON.stringify({ lat, lng }));
    reverseGeocode(lat, lng);
    fetchShops();
    setCurrentView('shops');
  };

  if (currentView === 'loading') {
    return <div className="min-h-screen bg-zinc-50 dark:bg-[#0b0c10]" />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-[#0b0c10] font-sans">
      {/* Header */}
      {currentView === 'shops' ? (
        <header className="bg-[#01432A] text-white pt-14 pb-5 px-6 rounded-b-[2rem] shadow-md z-10 sticky top-0 flex items-center justify-between border-b border-[#015132]/50">
           
           <button 
             onClick={() => setCurrentView('map')}
             className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors shadow-inner backdrop-blur-sm"
           >
             <MapPin size={24} className="text-[#a3ff12]" />
           </button>

           <div className="flex flex-col items-end">
             <div className="text-xl font-black tracking-tighter" dir="rtl">تأكيد الموقع</div>
             <p className="text-[10px] font-bold tracking-widest uppercase text-white/70">Delivery Location</p>
           </div>

        </header>
      ) : (
        <header className="bg-[#01432A] text-white pt-14 pb-5 px-6 shadow-md z-10 sticky top-0 flex items-center justify-between">
          <div className="text-xl font-black tracking-tighter text-[#a3ff12]">tamo</div>
          <p className="text-sm font-bold tracking-wide text-zinc-100" dir="rtl">
            حدد موقعك
          </p>
        </header>
      )}

      {/* Main View Area */}
      {currentView === 'map' ? (
        <main className="flex flex-col flex-1 relative w-full h-[calc(100vh-100px)]">
           <DynamicMap 
             initialLat={coords[0]} 
             initialLng={coords[1]} 
             onConfirm={confirmLocation} 
           />
        </main>
      ) : (
        <main className="flex-1 w-full max-w-md mx-auto px-5 pt-6 flex flex-col pb-10 relative">
          
          <div className="mb-6 bg-white dark:bg-[#1a1c23] p-4 rounded-3xl shadow-sm border border-zinc-100 dark:border-zinc-800 flex items-center justify-between relative overflow-hidden">
             {/* Decorative Background */}
             <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#a3ff12]/5 to-transparent pointer-events-none" />
             
             <div className="flex-1 px-2 overflow-hidden">
                <span className="text-[10px] uppercase font-bold text-zinc-400">Position confirmée</span>
                <p className="font-bold text-lg text-zinc-900 dark:text-zinc-100 truncate" dir="auto">{addressName}</p>
             </div>
          </div>
          
          <div className="mb-4 flex flex-col text-right items-end w-full px-2">
            <h2 className="text-3xl font-black text-zinc-900 dark:text-zinc-100 underline decoration-[#a3ff12] decoration-4 underline-offset-4" dir="rtl">متاجر قريبة</h2>
            <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mt-2">Boutiques à proximité</h2>
          </div>
          
          <div className="flex flex-col gap-4 mt-2">
            {isFetchingShops ? (
              <div className="flex justify-center py-10">
                <Loader2 className="animate-spin text-[#01432A]" size={36} />
              </div>
            ) : shops.length > 0 ? (
              shops.map((shop) => (
                <Link 
                  href={`/shop/${shop.id}?lat=${coords[0]}&lng=${coords[1]}`} 
                  key={shop.id}
                >
                  <div className="bg-white dark:bg-[#1a1c23] p-4 rounded-3xl shadow-sm border border-zinc-100 dark:border-zinc-800 flex items-center justify-between active:scale-[0.98] transition-all hover:shadow-md h-[100px]">
                    
                    <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-800/80 rounded-2xl flex items-center justify-center shrink-0 border border-zinc-100 dark:border-zinc-800 overflow-hidden shadow-inner">
                       {shop.image_url ? (
                         <img src={shop.image_url} alt={shop.shop_name} className="w-full h-full object-cover" />
                       ) : (
                         <Store className="text-[#01432A]/50 dark:text-[#2db37b]/50" size={28} />
                       )}
                    </div>

                    <div className="flex-1 px-4 flex flex-col items-end justify-center h-full">
                      <h3 className="font-black text-xl text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-tight" dir="rtl">
                        {shop.shop_name}
                      </h3>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-14 bg-white dark:bg-[#1a1c23] rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800 mt-2">
                 <p className="text-zinc-500 font-bold text-lg pb-1" dir="rtl">لا توجد متاجر نشطة حالياً</p>
                 <p className="text-zinc-400 text-sm font-medium">Aucune boutique pour le moment</p>
              </div>
            )}
          </div>
        </main>
      )}
    </div>
  );
}
