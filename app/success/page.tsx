import { CheckCircle2, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export default function SuccessPage() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-screen bg-[#01432A] text-white font-sans p-6">
      <main className="flex w-full max-w-md flex-col items-center text-center gap-10">
        
        <div className="relative">
           <div className="absolute inset-0 bg-white/20 rounded-full animate-ping scale-[1.5]" />
           <div className="w-40 h-40 bg-white rounded-full flex items-center justify-center text-[#01432A] shadow-2xl relative z-10">
             <CheckCircle2 size={96} className="text-[#01432A]" />
           </div>
        </div>
        
        <div className="space-y-4">
          <h1 className="text-3xl font-black drop-shadow-sm" dir="rtl">
            تم إرسال طلبك بنجاح!
          </h1>
          <p className="text-lg font-medium text-white/80" dir="rtl">
            سيتم إعلامك بالتكلفة قريباً.
          </p>
        </div>

        <div className="w-16 h-px bg-white/20" />

        <div className="space-y-4">
          <h2 className="text-2xl font-bold">
            Votre commande a été envoyée avec succès !
          </h2>
          <p className="text-base text-white/80">
            Vous serez bientôt informé du coût.
          </p>
        </div>

        <Link 
          href="/" 
          className="mt-8 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-8 py-4 rounded-full font-bold flex items-center gap-3 transition-all active:scale-95"
        >
          <span dir="rtl">العودة للرئيسية</span>
          <ChevronRight size={20} className="rotate-180" />
        </Link>
      </main>
    </div>
  )
}
