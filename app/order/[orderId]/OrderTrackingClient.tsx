'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { 
  CheckCircle2, 
  Clock, 
  Store, 
  Play, 
  Square, 
  Loader2, 
  XCircle, 
  DollarSign, 
  MapPin, 
  Check, 
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import Link from 'next/link';

type Order = {
  id: string;
  status: 'pending' | 'quoted' | 'confirmed' | 'declined' | 'expired';
  total_price: number | null;
  audio_url: string;
  shop_id: string;
  shops: {
    shop_name: string;
  };
};

export default function OrderTrackingClient({ initialOrder }: { initialOrder: Order }) {
  const [order, setOrder] = useState<Order>(initialOrder);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio] = useState(typeof window !== 'undefined' ? new Audio(initialOrder.audio_url) : null);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const supabase = createClient();

  useEffect(() => {
    // Real-time subscription to THIS specific order
    const channel = supabase
      .channel(`order-tracking-${order.id}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'orders', 
        filter: `id=eq.${order.id}` 
      }, (payload) => {
        console.log('Order status update detected!', payload);
        // Map payload back to our order object
        setOrder(prev => ({ 
          ...prev, 
          status: payload.new.status, 
          total_price: payload.new.total_price 
        }));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (audio) {
        audio.pause();
      }
    };
  }, [order.id, supabase, audio]);

  const togglePlayback = () => {
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  if (audio) {
    audio.onended = () => setIsPlaying(false);
  }

  const handlePriceAction = async (newStatus: 'confirmed' | 'declined') => {
    setIsUpdating(true);
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', order.id);

    if (error) {
      console.error('Action failed:', error);
      alert('Error updating order');
      setIsUpdating(false);
    } else {
      // Real-time will eventually pick it up, but let's update local state instantly
      setOrder(prev => ({ ...prev, status: newStatus }));
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 pb-12">
      {/* Header */}
      <header className="bg-white pt-4 pb-4 px-6 shadow-sm z-10 sticky top-[90px] border-b border-zinc-100">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <Link href="/" className="w-10 h-10 bg-[#F0F2F5] rounded-full flex items-center justify-center text-zinc-600 hover:bg-zinc-200 transition-colors">
             <ChevronLeft size={24} className="mr-0.5" />
          </Link>
          <div className="flex flex-col items-end">
            <h1 className="text-xl font-black text-[#062C1E]" dir="rtl">تتبع الطلب</h1>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Suivi de commande</p>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-md mx-auto px-6 pt-8 flex flex-col">
        
        {/* Shop Info Card */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-transparent flex items-center gap-4 mb-6 relative overflow-hidden">
           <div className="w-14 h-14 bg-zinc-50 rounded-2xl flex items-center justify-center border border-zinc-100 text-zinc-400">
              <Store size={28} className="text-[#062C1E]/50" />
           </div>
           <div className="flex-1 flex flex-col items-end">
             <span className="text-[10px] bg-[#062C1E]/10 text-[#062C1E] px-2 py-0.5 rounded-full font-bold mb-1">المتجر / Boutique</span>
             <h3 className="font-bold text-lg text-zinc-900" dir="rtl">
               {order.shops?.shop_name || 'Boutique'}
             </h3>
           </div>
        </div>

        {/* Audio Content Review (Card) */}
        <div className="bg-[#062C1E] rounded-2xl p-6 text-white shadow-xl shadow-[#062C1E]/20 relative overflow-hidden mb-8">
           <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full -z-0" />
           
           <div className="relative z-10 flex flex-col items-center gap-5">
              <div className="w-full flex justify-between items-center px-2">
                 <div className="w-10 h-[1.5px] bg-white/20" />
                 <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">Votre demande vocale</span>
                 <div className="w-10 h-[1.5px] bg-white/20" />
              </div>

              <button 
                onClick={togglePlayback}
                className="w-20 h-20 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/20 active:scale-95 transition-all shadow-xl"
              >
                {isPlaying ? <Square size={32} className="fill-white" /> : <Play size={36} className="ml-1.5 fill-white" />}
              </button>
           </div>
        </div>

        {/* Status Section */}
        <div className="flex-1 flex flex-col items-center justify-center pt-2">
           
           {/* Case 1: PENDING */}
           {order.status === 'pending' && (
              <div className="flex flex-col items-center text-center animate-fade-in">
                <div className="w-24 h-24 rounded-full bg-zinc-100 dark:bg-zinc-800 border-4 border-[#a3ff12]/20 flex items-center justify-center relative mb-8">
                   <div className="absolute inset-0 border-4 border-[#a3ff12] rounded-full border-t-transparent animate-spin" />
                   <Clock size={40} className="text-[#a3ff12]" />
                </div>
                
                <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mb-2" dir="rtl">جاري تتبع طلبك</h2>
                <p className="text-zinc-500 font-medium px-10">
                   Le commerçant examine votre demande. Un prix sera proposé bientôt.
                </p>
              </div>
           )}

           {/* Case 2: QUOTED (THE PRICE IS REVEALED!) */}
           {order.status === 'quoted' && (
              <div className="flex flex-col items-center text-center w-full animate-bounce-in">
                 <div className="w-full bg-[#a3ff12]/10 p-8 rounded-[2.5rem] border-2 border-dashed border-[#a3ff12] mb-10">
                    <span className="text-xs font-black text-[#01432A] uppercase tracking-widest bg-[#a3ff12] px-3 py-1 rounded-full mb-6 inline-block">Prix Proposé</span>
                    <div className="text-7xl font-black text-[#01432A] tracking-tighter mb-1">
                      {order.total_price}
                      <span className="text-xl align-top ml-2">MAD</span>
                    </div>
                 </div>

                 <div className="flex w-full gap-4">
                    <button 
                      onClick={() => handlePriceAction('declined')}
                      disabled={isUpdating}
                      className="flex-1 flex flex-col items-center justify-center gap-2 bg-white border border-zinc-200 hover:bg-red-50 text-red-600 font-bold min-h-[56px] rounded-2xl active:scale-95 transition-all shadow-sm"
                    >
                      <XCircle size={24} />
                      <span className="text-[10px] uppercase tracking-widest">إلغاء</span>
                    </button>
                    
                    <button 
                      onClick={() => handlePriceAction('confirmed')}
                      disabled={isUpdating}
                      className="flex-[2] flex flex-col items-center justify-center gap-2 bg-[#062C1E] hover:bg-[#093c2a] text-white min-h-[56px] rounded-2xl shadow-md active:scale-95 transition-all relative overflow-hidden"
                    >
                       {isUpdating ? (
                         <Loader2 size={24} className="animate-spin" />
                       ) : (
                         <div className="flex items-center gap-3">
                           <span className="text-lg font-black" dir="rtl">تأكيد الطلب</span>
                           <CheckCircle2 size={20} className="text-[#a3ff12] ml-1" />
                         </div>
                       )}
                    </button>
                 </div>
              </div>
           )}

           {/* Case 3: CONFIRMED */}
           {order.status === 'confirmed' && (
              <div className="flex flex-col items-center text-center animate-fade-in">
                 <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center text-[#a3ff12] mb-8 shadow-2xl relative">
                    <div className="absolute inset-0 bg-[#a3ff12]/20 rounded-full animate-ping" />
                    <CheckCircle2 size={56} className="relative z-10" />
                 </div>
                 
                 <h2 className="text-3xl font-black text-zinc-900 dark:text-zinc-100 mb-2 underline decoration-[#a3ff12] decoration-4 underline-offset-8" dir="rtl">طلب مؤكد</h2>
                 <p className="text-zinc-500 font-medium px-8 mt-4 leading-relaxed">
                   Votre commande est en cours de préparation. Le livreur est informé !
                 </p>

                 <Link href="/" className="mt-12 flex items-center gap-2 text-[#01432A] font-black border-2 border-[#01432A] px-10 py-4 rounded-full active:scale-95 transition-all">
                    <span dir="rtl">العودة للرئيسية</span>
                    <ChevronRight size={20} className="rotate-180" />
                 </Link>
              </div>
           )}

           {/* Case 4: DECLINED */}
           {order.status === 'declined' && (
              <div className="flex flex-col items-center text-center animate-fade-in opacity-80 mt-10">
                 <XCircle size={80} className="text-red-500 mb-6" />
                 <h2 className="text-2xl font-black text-zinc-900 mb-2" dir="rtl">تم رفض الطلب</h2>
                 <p className="text-zinc-400">Cette commande a été annulée.</p>
                 <Link href="/" className="mt-8 text-zinc-600 font-bold underline">Retourner au menu</Link>
              </div>
           )}

        </div>

      </main>
    </div>
  );
}
