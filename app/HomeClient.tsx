'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Store, MapPinOff, Loader2, RefreshCw, MapPin } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { MapModal } from './components/MapModal';

type Shop = {
  id: string;
  shop_name: string;
  lat: number | null;
  lng: number | null;
  image_url: string | null;
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
  
  const [addressName, setAddressName] = useState('...');
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [shops, setShops] = useState<Shop[]>([]);
  const [isFetchingShops, setIsFetchingShops] = useState(false);
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);
  
  const initialized = useRef(false);
  const supabase = createClient();

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

  const reverseGeocode = async (lat: number, lng: number) => {
    setAddressName('جاري البحث...');
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      const simpleAddress = data?.address?.road || data?.address?.suburb || data?.address?.city || 'موقع غير معروف';
      setAddressName(simpleAddress);
    } catch (e) {
      setAddressName('موقع غير معروف');
    }
  };

  const requestLocation = useCallback((showButtonSpinner = false) => {
    if (showButtonSpinner) {
      setIsRequestingLocation(true);
    } else {
      setLocation(prev => ({ ...prev, status: 'loading' }));
    }
    
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocation(prev => ({ ...prev, status: 'denied' }));
      setIsRequestingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLocation({ lat, lng, status: 'granted' });
        localStorage.setItem('tamo_location', JSON.stringify({ lat, lng }));
        reverseGeocode(lat, lng);
        fetchShops();
        setIsRequestingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLocation(prev => ({ ...prev, status: 'denied' }));
        setIsRequestingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [fetchShops]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Check persistence first
    const cachedLoc = localStorage.getItem('tamo_location');
    if (cachedLoc) {
      try {
        const { lat, lng } = JSON.parse(cachedLoc);
        setLocation({ lat, lng, status: 'granted' });
        reverseGeocode(lat, lng);
        fetchShops();
      } catch (e) {
        requestLocation();
      }
    } else {
      requestLocation();
    }
  }, [requestLocation, fetchShops]);

  const handleManualLocationConfirm = (lat: number, lng: number) => {
    setIsMapOpen(false);
    setLocation({ lat, lng, status: 'granted' });
    localStorage.setItem('tamo_location', JSON.stringify({ lat, lng }));
    reverseGeocode(lat, lng);
    fetchShops(); 
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-[#0b0c10] font-sans pb-10">
      {/* Header aligned with design system */}
      <header className="bg-[#01432A] text-white pt-14 pb-5 px-6 rounded-b-[2.5rem] shadow-md z-10 sticky top-0 border-b border-[#015132]/50">
        <div className="max-w-md mx-auto w-full flex flex-col items-center gap-1">
          <div className="flex items-end tracking-tighter justify-center font-black text-5xl text-[#a3ff12]">
            tamo
          </div>
          <p className="text-sm font-medium tracking-wide mt-1 text-zinc-100 opacity-90 uppercase text-[10px]">
             أطلبها بصوتك | Just speak it
          </p>
        </div>
      </header>

      <main className="flex-1 w-full max-w-md mx-auto px-5 pt-6 flex flex-col relative">
        
        {/* Dynamic Location Bar */}
        {location.status === 'granted' && (
          <div className="mb-6 bg-white dark:bg-[#1a1c23] p-4 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <button 
               onClick={() => setIsMapOpen(true)}
               className="text-xs font-bold bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-full text-zinc-600 dark:text-zinc-300 active:scale-95 transition-transform"
            >
              تغيير / Modifier
            </button>
            <div className="flex items-center gap-3">
               <div className="flex flex-col items-end">
                  <span className="text-[10px] uppercase font-bold text-zinc-400">الموقع الحالي</span>
                  <span className="font-bold text-sm text-[#01432A] dark:text-[#2db37b] max-w-[150px] truncate" dir="rtl">{addressName}</span>
               </div>
               <div className="w-10 h-10 bg-[#01432A]/10 dark:bg-[#2db37b]/20 rounded-full flex items-center justify-center text-[#01432A] dark:text-[#2db37b]">
                  <MapPin size={20} />
               </div>
            </div>
          </div>
        )}

        {/* State: Loading Location */}
        {location.status === 'loading' && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 mt-10">
            <Loader2 className="animate-spin text-[#01432A]" size={40} />
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
          <div className="flex flex-col items-center justify-center py-16 gap-6 bg-white dark:bg-[#1a1c23] rounded-3xl p-6 shadow-sm border border-zinc-100 dark:border-zinc-800/50 mt-10">
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

            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-xl p-3 text-center">
               <p className="text-xs text-amber-800 dark:text-amber-400 font-bold" dir="rtl">
                 💡 تلميح: انقر على أيقونة القفل 🔒 في شريط العنوان أعلى المتصفح، ثم اسمح بالوصول إلى الموقع (Location).
               </p>
               <p className="text-[10px] text-amber-700/80 dark:text-amber-500/80 mt-1">
                 Astuce : Cliquez sur l'icône de cadenas 🔒 dans la barre d'URL et autorisez la localisation.
               </p>
            </div>
            
            <button 
              onClick={() => requestLocation(true)}
              disabled={isRequestingLocation}
              className="mt-4 flex items-center justify-center min-w-[200px] gap-2 bg-[#01432A] hover:bg-[#013520] transition-colors text-white px-8 py-4 rounded-2xl font-bold shadow-md shadow-[#01432A]/20 disabled:opacity-80 active:scale-95"
            >
              {isRequestingLocation ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span dir="rtl">جاري تحديد الموقع...</span>
                </>
              ) : (
                <>
                  <RefreshCw size={18} />
                  <span>إعادة المحاولة / Réessayer</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* State: Location Granted */}
        {location.status === 'granted' && (
          <>
            <div className="mb-4 flex flex-col text-right items-end w-full px-2">
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
                    <div className="bg-white dark:bg-[#1a1c23] p-4 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 flex items-center justify-between active:scale-[0.98] transition-all hover:shadow-md h-24">
                      
                      {/* Image or Fallback Store Icon */}
                      <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-800/80 rounded-xl flex items-center justify-center shrink-0 border border-zinc-100 dark:border-zinc-800 overflow-hidden shadow-inner">
                         {shop.image_url ? (
                           <img src={shop.image_url} alt={shop.shop_name} className="w-full h-full object-cover" />
                         ) : (
                           <Store className="text-[#01432A]/50 dark:text-[#2db37b]/50" size={28} />
                         )}
                      </div>

                      <div className="flex-1 px-4 flex flex-col items-end justify-center h-full">
                        <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-tight" dir="rtl">
                          {shop.shop_name}
                        </h3>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-10 bg-white dark:bg-[#1a1c23] rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 mt-2">
                   <p className="text-zinc-500 font-medium pb-1" dir="rtl">لا توجد متاجر نشطة حالياً</p>
                   <p className="text-zinc-400 text-sm">Aucune boutique pour le moment</p>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      <MapModal 
        isOpen={isMapOpen} 
        initialLat={location.lat} 
        initialLng={location.lng} 
        onConfirm={handleManualLocationConfirm} 
        onCancel={() => setIsMapOpen(false)} 
      />
    </div>
  );
}
