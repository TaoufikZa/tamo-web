'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { CheckCircle2, ChevronLeft, MapPin, Play, Square, X, User, XCircle, Send, Calendar } from 'lucide-react';
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

type TimeFilter = 'today' | 'yesterday' | '7days' | '3months';

export function DashboardClient({ shopId }: { shopId: string }) {
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('today');
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [priceInput, setPriceInput] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  
  const [isSuccess, setIsSuccess] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  
  const supabase = createClient();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const getDateBoundaries = (filter: TimeFilter) => {
    let start = new Date();
    let end = new Date();
  
    switch(filter) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'yesterday':
        start.setDate(start.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        end.setDate(end.getDate() - 1);
        end.setHours(23, 59, 59, 999);
        break;
      case '7days':
        start.setDate(start.getDate() - 7);
        break;
      case '3months':
        start.setDate(start.getDate() - 90);
        break;
    }
    return { startDate: start, endDate: end };
  };

  const fetchOrders = useCallback(async () => {
    setIsFetching(true);
    const { startDate, endDate } = getDateBoundaries(timeFilter);

    const { data, error } = await supabase
      .from('orders')
      .select('*, customers(whatsapp_name)')
      .eq('shop_id', shopId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });

    if (!error && data) {
      setOrders(data as unknown as Order[]);
    }
    setIsFetching(false);
  }, [shopId, supabase, timeFilter]);

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
  }, [fetchOrders, shopId, supabase]);

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

  const formatOrderDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleString('en-GB', { 
      day: '2-digit', 
      month: 'short', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
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
      <div className="flex flex-col font-sans pb-10">
        <header className="bg-white pt-4 pb-4 px-6 shadow-sm z-10 sticky top-[90px] flex items-center justify-between border-b border-zinc-100">
          <button onClick={resetSelection} className="w-10 h-10 bg-[#F0F2F5] rounded-full flex items-center justify-center text-zinc-600">
            <X size={24} />
          </button>
          <div className="flex flex-col items-end">
            <h1 className="text-xl font-black text-zinc-900" dir="rtl">معالجة الطلب</h1>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Traitement de commande</p>
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
    <div className="flex flex-col font-sans">
      <header className="bg-[#062C1E] text-white pt-4 pb-0 px-6 shadow-md z-10 sticky top-[90px] rounded-b-[2rem] border-t border-[#015132]/20">
        <div className="flex items-center justify-end mb-4">
           {/* Top Navigation Dropdown Filter */}
           <div className="relative">
             <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
               <Calendar size={16} className="text-[#062C1E]" />
             </div>
             <select
               value={timeFilter}
               onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
               className="appearance-none bg-lime-400 font-bold text-[#062C1E] rounded-full py-2 pl-4 pr-10 text-sm shadow-sm outline-none w-[170px] text-right"
               dir="rtl"
             >
               <option value="today">اليوم / Auj</option>
               <option value="yesterday">الأمس / Hier</option>
               <option value="7days">آخر 7 أيام / 7 j</option>
               <option value="3months">آخر 3 أشهر / 3 m</option>
             </select>
           </div>
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
        {isFetching ? (
           <div className="flex items-center justify-center py-20 text-zinc-400 animate-pulse">
              <span className="font-bold">جاري التحميل...</span>
           </div>
        ) : displayOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
             <CheckCircle2 size={64} className="opacity-20 mb-4" />
             <p className="font-bold text-center" dir="rtl">لا توجد معاملات لهذه الفترة</p>
             <p className="text-sm">Aucune transaction pour cette période</p>
          </div>
        ) : (
          displayOrders.map((order) => (
            <div 
              key={order.id} 
              onClick={() => activeTab === 'pending' && setSelectedOrder(order)}
              className={`bg-white p-4 rounded-2xl shadow-sm border ${activeTab === 'pending' ? 'border-zinc-200 cursor-pointer active:scale-[0.98]' : 'border-transparent opacity-90'} transition-transform flex items-center gap-4`}
            >
               <button 
                  onClick={(e) => { e.stopPropagation(); handlePlayToggle(order.id, order.audio_url); }}
                  className={`w-14 h-14 rounded-full flex shrink-0 items-center justify-center transition-colors ${playingAudioId === order.id ? 'bg-[#062C1E] text-lime-400' : 'bg-lime-500 text-[#062C1E]'}`}
               >
                 {playingAudioId === order.id ? <Square size={22} className="fill-lime-400" /> : <Play size={24} className="ml-1 fill-[#062C1E]" />}
               </button>

               <div className="flex-1 flex flex-col items-end pr-2 overflow-hidden">
                 <div className="flex items-center justify-between w-full mb-1">
                   <span className="text-[10px] uppercase font-bold tracking-widest text-[#01432A]/70 dark:text-lime-400/70">
                     {formatOrderDate(order.created_at)}
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
