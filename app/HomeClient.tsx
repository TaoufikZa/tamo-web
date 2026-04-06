'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Store, MapPinOff, Loader2, RefreshCw } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

type Shop = {
  id: string;
  name: string;
  name_ar?: string;
  name_fr?: string;
};

type LocationState = {
  lat: number | null;
  lng: number | null;
  status: 'idle' | 'loading' | 'granted' | 'denied';
};

export default function HomeClient() {
  const [location, setLocation] = useState<LocationState>({
    lat: null,
    lng: null,
    status: 'idle',
  });
  
  const [shops, setShops] = useState<Shop[]>([]);
  const [isFetchingShops, setIsFetchingShops] = useState(false);
  const supabase = createClient();

  const fetchShops = useCallback(async () => {
    setIsFetchingShops(true);
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('id, name, name_ar, name_fr');
        
      if (!error && data) {
        setShops(data);
      }
    } catch (e) {
      console.error('Failed to fetch shops', e);
    } finally {
      setIsFetchingShops(false);
    }
  }, [supabase]);

  const requestLocation = useCallback(() => {
    setLocation(prev => ({ ...prev, status: 'loading' }));
    
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocation(prev => ({ ...prev, status: 'denied' }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          status: 'granted',
        });
        fetchShops();
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLocation(prev => ({ ...prev, status: 'denied' }));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [fetchShops]);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-[#0b0c10] font-sans pb-10">
      {/* Header aligned with design system */}
      <header className="bg-tamo-green text-white pt-14 pb-5 px-6 rounded-b-[2.5rem] shadow-md z-10 sticky top-0">
        <div className="max-w-md mx-auto w-full flex flex-col items-center gap-1">
          {/* Logo representation */}
          <div className="flex items-end tracking-tighter justify-center font-black text-5xl text-[#a3ff12]">
            tamo
          </div>
          <p className="text-sm font-medium tracking-wide mt-1 text-zinc-100 opacity-90 uppercase text-[10px]">
             أطلبها بصوتك | Just speak it
          </p>
        </div>
      </header>

      <main className="flex-1 w-full max-w-md mx-auto px-5 pt-8 flex flex-col">
        {/* State: Loading Location */}
        {location.status === 'loading' && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin text-tamo-green" size={40} />
            <div className="text-center space-y-1">
              <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-200" dir="rtl">
                جاري تحديد الموقع...
              </h2>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">
                Détection de la position...
              </p>
            </div>
          </div>
        )}

        {/* State: Location Denied / Error */}
        {location.status === 'denied' && (
          <div className="flex flex-col items-center justify-center py-16 gap-6 bg-white dark:bg-[#1a1c23] rounded-3xl p-6 shadow-sm border border-zinc-100">
            <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center text-red-500">
              <MapPinOff size={36} />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 leading-snug px-4" dir="rtl">
                يرجى تفعيل الموقع الجغرافي لعرض المتاجر القريبة منك.
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 font-medium px-4">
                Veuillez activer la localisation pour voir les boutiques à proximité.
              </p>
            </div>
            
            <button 
              onClick={requestLocation}
              className="mt-4 flex items-center gap-2 bg-tamo-green hover:bg-[#013520] transition-colors text-white px-8 py-3.5 rounded-2xl font-bold shadow-md shadow-tamo-green/20"
            >
              <RefreshCw size={18} />
              <span>إعادة المحاولة / Réessayer</span>
            </button>
          </div>
        )}

        {/* State: Location Granted */}
        {location.status === 'granted' && (
          <>
            <div className="mb-5 flex flex-col text-right items-end w-full px-2">
              <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100" dir="rtl">متاجر قريبة</h2>
              <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mt-1">Boutiques à proximité</h2>
            </div>
            
            <div className="flex flex-col gap-4">
              {isFetchingShops ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="animate-spin text-zinc-300" size={32} />
                </div>
              ) : shops.length > 0 ? (
                shops.map((shop) => (
                  <Link 
                    href={`/shop/${shop.id}?lat=${location.lat}&lng=${location.lng}`} 
                    key={shop.id}
                  >
                    <div className="bg-white dark:bg-[#1a1c23] p-5 rounded-xl shadow-sm border border-zinc-100/80 dark:border-zinc-800/50 flex items-center justify-between active:scale-[0.98] transition-all hover:shadow-md">
                      <div className="w-14 h-14 bg-zinc-50/80 dark:bg-zinc-800/50 rounded-xl flex items-center justify-center shrink-0 border border-zinc-100">
                         <Store className="text-tamo-green/70" size={24} />
                      </div>
                      <div className="flex-1 px-4 flex flex-col items-end">
                        <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100" dir="rtl">
                          {shop.name_ar || shop.name}
                        </h3>
                        <h4 className="text-xs font-semibold tracking-wide uppercase text-zinc-400 mt-0.5">
                          {shop.name_fr || shop.name}
                        </h4>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-zinc-200">
                   <p className="text-zinc-500 font-medium pb-1" dir="rtl">لا توجد متاجر حالياً</p>
                   <p className="text-zinc-400 text-sm">Aucune boutique pour le moment</p>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
