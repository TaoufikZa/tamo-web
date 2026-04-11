'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Store, Loader2, MapPin, Navigation, Star } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import dynamic from 'next/dynamic';

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
  
  const [coords, setCoords] = useState<[number, number]>([33.5731, -7.5898]);
  const [addressName, setAddressName] = useState('...');
  
  const [shops, setShops] = useState<Shop[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isFetchingShops, setIsFetchingShops] = useState(false);
  
  const initialized = useRef(false);
  const supabase = createClient();

  useEffect(() => {
    // Load favorites from local storage
    try {
      const storedFavs = localStorage.getItem('tamo_favorites');
      if (storedFavs) {
        setFavorites(JSON.parse(storedFavs));
      }
    } catch(e) {}
  }, []);

  const toggleFavorite = (e: React.MouseEvent, shopId: string) => {
    e.preventDefault(); // Prevent Link navigation
    e.stopPropagation();
    
    setFavorites(prev => {
      const newFavs = prev.includes(shopId) 
        ? prev.filter(id => id !== shopId) 
        : [...prev, shopId];
      
      localStorage.setItem('tamo_favorites', JSON.stringify(newFavs));
      return newFavs;
    });
  };

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

    // 2. Default to map
    setCurrentView('map');
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords([position.coords.latitude, position.coords.longitude]);
        },
        () => {},
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
      );
    }
  }, [fetchShops]);

  const confirmLocation = (lat: number, lng: number) => {
    setCoords([lat, lng]);
    localStorage.setItem('tamo_location', JSON.stringify({ lat, lng }));
    reverseGeocode(lat, lng);
    fetchShops();
    setCurrentView('shops');
  };

  if (currentView === 'loading') {
    return <div className="min-h-screen bg-[#F0F2F5]" />;
  }

  // Derived state for shops
  const favoriteShops = shops.filter(s => favorites.includes(s.id));
  const normalShops = shops.filter(s => !favorites.includes(s.id));

  return (
    <>
      {currentView === 'map' ? (
        <div className="absolute inset-x-0 top-[90px] bottom-0 z-0">
           <DynamicMap 
             initialLat={coords[0]} 
             initialLng={coords[1]} 
             onConfirm={confirmLocation} 
           />
        </div>
      ) : (
        <div className="flex flex-col w-full px-4 pt-4 relative">
          
          {/* Sub-Header Location Edit */}
          <div className="mb-8 bg-white p-4 rounded-2xl shadow-sm flex items-center justify-between">
             <button 
               onClick={() => setCurrentView('map')}
               className="text-xs font-bold bg-[#F0F2F5] px-4 py-2 rounded-xl text-zinc-600 active:scale-95 transition-transform uppercase tracking-wider"
             >
               Modifier
             </button>
             <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                   <span className="font-bold text-sm text-[#062C1E] max-w-[150px] truncate" dir="rtl">{addressName}</span>
                   <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-widest mt-0.5">Adresse de livraison</span>
                </div>
                <div className="w-10 h-10 bg-[#062C1E] rounded-full flex items-center justify-center text-[#a3ff12] shadow-sm">
                   <MapPin size={20} />
                </div>
             </div>
          </div>
          
          <div className="w-full text-right mb-4 pr-1">
            <h2 className="text-xl font-bold text-zinc-800" dir="rtl">متاجر قريبة / Boutiques à proximité</h2>
          </div>
          
          <div className="w-full relative min-h-[300px]">
            {isFetchingShops ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="animate-spin text-[#062C1E]" size={36} />
              </div>
            ) : shops.length > 0 ? (
              <div className="space-y-6">
                 
                 {/* Favorites Row */}
                 {favoriteShops.length > 0 && (
                   <div className="grid grid-cols-2 gap-4">
                     {favoriteShops.map((shop) => (
                       <Link href={`/shop/${shop.id}?lat=${coords[0]}&lng=${coords[1]}`} key={shop.id}>
                         <div className="bg-white rounded-2xl shadow-sm border border-transparent overflow-hidden active:scale-[0.98] transition-transform flex flex-col h-40 relative group">
                           
                           {/* Fav Star Absolute */}
                           <button onClick={(e) => toggleFavorite(e, shop.id)} className="absolute top-2 right-2 z-10 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-sm">
                              <Star size={18} className="fill-amber-400 text-amber-400" />
                           </button>

                           {/* Image Top Half */}
                           <div className="h-20 w-full bg-zinc-100 flex items-center justify-center relative overflow-hidden shrink-0">
                              {shop.image_url ? (
                                <img src={shop.image_url} alt={shop.shop_name} className="w-full h-full object-cover" />
                              ) : (
                                <Store className="text-zinc-300" size={32} />
                              )}
                           </div>
                           
                           {/* Content Bottom Half */}
                           <div className="flex flex-col p-3 flex-1 justify-center bg-white">
                             <h3 className="font-bold text-base text-zinc-900 truncate" dir="rtl">
                               {shop.shop_name}
                             </h3>
                             <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-widest mt-1">Epicerie</p>
                           </div>
                         </div>
                       </Link>
                     ))}
                   </div>
                 )}

                 {/* Divider if both exist */}
                 {favoriteShops.length > 0 && normalShops.length > 0 && (
                   <div className="w-full h-px bg-zinc-200 rounded-full my-2 opacity-50" />
                 )}

                 {/* Normal Row */}
                 <div className="grid grid-cols-2 gap-4">
                   {normalShops.map((shop) => (
                     <Link href={`/shop/${shop.id}?lat=${coords[0]}&lng=${coords[1]}`} key={shop.id}>
                       <div className="bg-white rounded-2xl shadow-sm border border-transparent overflow-hidden active:scale-[0.98] transition-transform flex flex-col h-40 relative group">
                         
                         <button onClick={(e) => toggleFavorite(e, shop.id)} className="absolute top-2 right-2 z-10 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                            <Star size={16} className="text-zinc-400" />
                         </button>

                         <div className="h-20 w-full bg-zinc-100 flex items-center justify-center relative overflow-hidden shrink-0">
                            {shop.image_url ? (
                              <img src={shop.image_url} alt={shop.shop_name} className="w-full h-full object-cover" />
                            ) : (
                              <Store className="text-zinc-300" size={32} />
                            )}
                         </div>
                         
                         <div className="flex flex-col p-3 flex-1 justify-center bg-white">
                           <h3 className="font-bold text-base text-zinc-900 truncate" dir="rtl">
                             {shop.shop_name}
                           </h3>
                           <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-widest mt-1">Epicerie</p>
                         </div>
                       </div>
                     </Link>
                   ))}
                 </div>

              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-2xl shadow-sm mt-2">
                 <p className="text-zinc-500 font-bold text-lg pb-1" dir="rtl">لا توجد متاجر نشطة</p>
                 <p className="text-zinc-400 text-sm font-medium">Boutiques indisponibles</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
