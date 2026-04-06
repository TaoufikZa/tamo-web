'use client';

import { useEffect, useState, useRef } from 'react';
import { CheckCircle2, ChevronLeft, MapPin, Play, Square, X, User, XCircle, Send } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { PricingKeypad } from './PricingKeypad';

type Order = {
  id: string;
  shop_id: string;
  customer_id: string;
  audio_url: string;
  status: 'pending' | 'quoted' | 'declined' | 'expired';
  customer_lat: number | null;
  customer_lng: number | null;
  created_at: string;
  total_price: number | null;
  customers: {
    whatsapp_name: string;
  };
};

export function DashboardClient({ shopId }: { shopId: string }) {
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [priceInput, setPriceInput] = useState('');
  
  const [isSuccess, setIsSuccess] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  
  const supabase = createClient();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetchOrders();

    // Setup Realtime Subscription
    const channel = supabase
      .channel('orders-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `shop_id=eq.${shopId}` }, (payload) => {
        console.log('Realtime Order Update!', payload);
        fetchOrders(); // Fast refresh to catch the join data cleanly
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [shopId, supabase]);

  const fetchOrders = async () => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('orders')
      .select('*, customers(whatsapp_name)')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setOrders(data as unknown as Order[]);
    }
  };

  const handlePlayToggle = (orderId: string, audioUrl: string) => {
    if (playingAudioId === orderId && audioRef.current) {
      audioRef.current.pause();
      setPlayingAudioId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    const newAudio = new Audio(audioUrl);
    newAudio.onended = () => setPlayingAudioId(null);
    newAudio.play();
    audioRef.current = newAudio;
    setPlayingAudioId(orderId);
  };

  const executeAction = async (status: 'quoted' | 'declined') => {
    if (!selectedOrder) return;
    
    const price = parseFloat(priceInput);
    if (status === 'quoted' && (isNaN(price) || price <= 0)) return;

    const { error } = await supabase
      .from('orders')
      .update({
        status: status,
        total_price: status === 'quoted' ? price : null
      })
      .eq('id', selectedOrder.id);

    if (!error) {
      if (status === 'quoted') {
        setIsSuccess(true);
      } else {
        resetSelection();
        fetchOrders();
      }
    } else {
      alert("Erreur réseau");
    }
  };

  const resetSelection = () => {
    setSelectedOrder(null);
    setPriceInput('');
    if (audioRef.current) audioRef.current.pause();
    setPlayingAudioId(null);
  };

  // SUCCESS OVERLAY
  if (isSuccess) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center min-h-screen bg-[#062C1E] text-white font-sans p-6 z-[9999] fixed inset-0 animate-fade-in">
        <div className="w-40 h-40 bg-white rounded-full flex items-center justify-center text-[#062C1E] shadow-2xl mb-10">
          <CheckCircle2 size={96} />
        </div>
        
        <h1 className="text-3xl font-black drop-shadow-sm text-center mb-2" dir="rtl">
          تم إرسال السعر بنجاح
        </h1>
        <p className="text-lime-400 font-bold mb-8 text-center" dir="rtl">
          سيتم إخطار الزبون.
        </p>

        <div className="w-16 h-px bg-white/20 mb-8" />

        <h2 className="text-2xl font-bold text-center mb-1">
          Prix envoyé avec succès
        </h2>
        <p className="text-lime-400 text-center mb-12">
          Le client sera notifié.
        </p>

        <button 
          onClick={() => { setIsSuccess(false); resetSelection(); fetchOrders(); }}
          className="bg-lime-500 hover:bg-lime-400 text-[#062C1E] px-10 py-5 rounded-full font-black text-xl shadow-lg active:scale-95 transition-all w-full max-w-sm"
        >
          العودة / Retour
        </button>
      </div>
    );
  }

  // PRICING / ORDER TAKEDOWN MODAL VIEW
  if (selectedOrder) {
    const isReady = parseFloat(priceInput) > 0;
    
    return (
      <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-[#0b0c10] font-sans pb-10">
        <header className="bg-white dark:bg-[#1a1c23] pt-14 pb-5 px-6 shadow-sm z-10 sticky top-0 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800">
          <button onClick={resetSelection} className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center text-zinc-600 dark:text-zinc-300">
            <X size={28} />
          </button>
          <div className="flex flex-col items-end">
            <h1 className="text-xl font-black text-zinc-900 dark:text-zinc-100" dir="rtl">معالجة الطلب</h1>
            <p className="text-xs text-zinc-500 font-bold">Traitement de commande</p>
          </div>
        </header>

        <main className="flex-1 w-full max-w-md mx-auto px-5 pt-8 flex flex-col items-center">
          
          <div className="w-full bg-[#062C1E] rounded-3xl p-6 text-white shadow-xl relative overflow-hidden mb-8">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full -z-0" />
            <div className="relative z-10 flex justify-between items-start">
              
              <button 
                onClick={() => handlePlayToggle(selectedOrder.id, selectedOrder.audio_url)}
                className="w-16 h-16 rounded-full bg-lime-500 flex items-center justify-center text-[#062C1E] shadow-lime-500/20 shadow-lg active:scale-95 transition-transform"
              >
                {playingAudioId === selectedOrder.id ? <Square size={26} className="fill-[#062C1E]" /> : <Play size={30} className="ml-1 fill-[#062C1E]" />}
              </button>

              <div className="flex flex-col items-end text-right flex-1 pl-4">
                <span className="text-sm text-lime-400 font-bold tracking-widest uppercase mb-1">الزبون</span>
                <span className="text-2xl font-black truncate w-full text-right">{selectedOrder.customers?.whatsapp_name || 'Client'}</span>
                
                <div className="flex items-center gap-1.5 mt-2 opacity-80 justify-end w-full">
                  <span className="text-xs truncate max-w-[150px]">{selectedOrder.customer_lat ? 'الخريطة مفعلة' : 'بدون موقع'}</span>
                  <MapPin size={12} />
                </div>
              </div>

            </div>
          </div>

          <div className="text-center w-full mt-4 mb-2">
            <div className="text-zinc-400 text-sm font-bold uppercase tracking-widest mb-2">Total (MAD)</div>
            <div className="text-6xl font-black text-zinc-900 dark:text-white tracking-tighter h-20 flex items-center justify-center">
              {priceInput || '0.00'}
            </div>
          </div>

          <PricingKeypad value={priceInput} onChange={setPriceInput} />

          <div className="flex gap-4 w-full mt-10">
            <button 
               onClick={() => executeAction('declined')}
               className="flex-1 max-w-[80px] flex items-center justify-center bg-red-100 dark:bg-red-900/30 text-red-600 rounded-3xl active:scale-95 transition-transform"
            >
              <XCircle size={32} />
            </button>

            <button 
              onClick={() => executeAction('quoted')}
              disabled={!isReady}
              className={`flex-[3] h-16 rounded-3xl flex items-center justify-center gap-3 font-black text-xl transition-all ${
                isReady ? 'bg-lime-500 text-[#062C1E] active:scale-[0.98] shadow-lg shadow-lime-500/20' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
              }`}
            >
              <Send size={24} />
              <span>إرسال السعر</span>
            </button>
          </div>
        </main>
      </div>
    );
  }

  // MAIN DASHBOARD VIEW
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const historyOrders = orders.filter(o => o.status !== 'pending');
  
  const displayOrders = activeTab === 'pending' ? pendingOrders : historyOrders;

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-[#0b0c10] font-sans">
      <header className="bg-[#062C1E] text-white pt-16 pb-0 px-6 shadow-md z-10 sticky top-0 rounded-b-[2rem]">
        <div className="flex items-center justify-between mb-8">
           <div className="text-xs font-bold text-lime-400 bg-lime-400/10 px-3 py-1.5 rounded-full tracking-widest uppercase">Hanout Dashboard</div>
           <div className="text-xl font-black tracking-tighter">tamo</div>
        </div>

        <div className="flex w-full">
          <button 
             onClick={() => setActiveTab('pending')}
             className={`flex-1 pb-4 font-bold text-center border-b-4 transition-colors ${activeTab === 'pending' ? 'border-lime-500 text-lime-500' : 'border-transparent text-white/50'}`}
          >
             <span dir="rtl">الطلبات ({pendingOrders.length})</span>
          </button>
          <button 
             onClick={() => setActiveTab('history')}
             className={`flex-1 pb-4 font-bold text-center border-b-4 transition-colors ${activeTab === 'history' ? 'border-lime-500 text-lime-500' : 'border-transparent text-white/50'}`}
          >
             <span dir="rtl">السجل</span>
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-md mx-auto p-4 flex flex-col gap-4 mt-4">
        {displayOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
             <CheckCircle2 size={64} className="opacity-20 mb-4" />
             <p className="font-bold">لا يوجد أي شيء هنا</p>
             <p className="text-sm">Tout est à jour</p>
          </div>
        ) : (
          displayOrders.map((order) => (
            <div 
              key={order.id} 
              onClick={() => activeTab === 'pending' && setSelectedOrder(order)}
              className={`bg-white dark:bg-[#1a1c23] p-4 rounded-3xl shadow-sm border ${activeTab === 'pending' ? 'border-zinc-200 dark:border-zinc-800 cursor-pointer active:scale-[0.98]' : 'border-transparent opacity-80'} transition-transform flex items-center gap-4`}
            >
               <button 
                  onClick={(e) => { e.stopPropagation(); handlePlayToggle(order.id, order.audio_url); }}
                  className={`w-14 h-14 rounded-full flex shrink-0 items-center justify-center transition-colors ${playingAudioId === order.id ? 'bg-[#062C1E] text-lime-400' : 'bg-lime-500 text-[#062C1E]'}`}
               >
                 {playingAudioId === order.id ? <Square size={22} className="fill-lime-400" /> : <Play size={24} className="ml-1 fill-[#062C1E]" />}
               </button>

               <div className="flex-1 flex flex-col items-end pr-2 overflow-hidden">
                 <div className="flex items-center justify-between w-full mb-1">
                   <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">
                     {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                   </span>
                   <span className="font-black text-lg text-zinc-900 dark:text-zinc-100 truncate w-[140px] text-right" dir="rtl">
                     {order.customers?.whatsapp_name}
                   </span>
                 </div>
                 
                 {activeTab === 'history' ? (
                   <div className="w-full text-right mt-1">
                     <span className={`text-xs font-bold px-2 py-1 rounded-full ${order.status === 'quoted' ? 'bg-lime-100 text-lime-700' : 'bg-red-100 text-red-700'}`}>
                       {order.status === 'quoted' ? `${order.total_price} MAD` : 'Declined'}
                     </span>
                   </div>
                 ) : (
                    <div className="flex items-center gap-1.5 text-zinc-500 w-full justify-end">
                      <span className="text-xs truncate">{order.customer_lat ? 'Geolocation active' : 'Audio only'}</span>
                      <MapPin size={12} />
                    </div>
                 )}
               </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
}
