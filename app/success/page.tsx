import { CheckCircle2, ChevronRight, MapPin, Search } from 'lucide-react'
import Link from 'next/link'

export default async function SuccessPage(props: { searchParams: Promise<{ orderId?: string }> }) {
  const { orderId } = await props.searchParams;
  
  return (
    <div className="flex flex-col flex-1 items-center justify-center p-4 pt-10">
      <main className="bg-white w-full rounded-3xl shadow-sm border border-transparent p-8 flex flex-col items-center text-center gap-8 relative overflow-hidden">
        
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#062C1E]/5 rounded-bl-full -z-0" />
        
        <div className="relative z-10">
           <div className="w-28 h-28 bg-[#062C1E] rounded-full flex items-center justify-center text-[#a3ff12] shadow-xl relative z-10">
             <CheckCircle2 size={64} className="text-[#a3ff12]" />
           </div>
        </div>
        
        <div className="space-y-2 z-10 w-full relative">
          <h1 className="text-2xl font-black text-zinc-900 drop-shadow-sm" dir="rtl">
            تم إرسال طلبك بنجاح!
          </h1>
          <p className="text-sm font-medium text-zinc-500" dir="rtl">
            المرجو تتبع حالة طلبك للحصول على السعر.
          </p>
        </div>

        {/* Dynamic Tracking Link */}
        {orderId && (
          <Link 
            href={`/order/${orderId}`} 
            className="w-full bg-[#a3ff12] hover:bg-[#baff4d] text-[#062C1E] py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-md active:scale-95 transition-all z-10"
          >
            <span dir="rtl">تتبع طلبي / Suivre ma commande</span>
            <Search size={20} />
          </Link>
        )}

        <div className="w-full h-px bg-zinc-100 my-2 z-10" />

        <Link 
          href="/" 
          className="mt-2 bg-[#F0F2F5] hover:bg-[#e4e6e9] text-zinc-700 px-8 py-4 w-full rounded-2xl font-bold flex items-center justify-center gap-3 transition-all active:scale-95 z-10"
        >
          <span dir="rtl">العودة للرئيسية</span>
          <ChevronRight size={20} className="rotate-180" />
        </Link>
      </main>
    </div>
  )
}
