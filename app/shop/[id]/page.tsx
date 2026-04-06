import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { VoiceRecorder } from './VoiceRecorder'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

// Opt out of caching
export const dynamic = 'force-dynamic'

export default async function ShopPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const supabase = await createClient()

  // Safe fetch for shop name
  let shopNameAr = 'المتجر'
  let shopNameFr = 'Boutique'
  
  try {
    const { data } = await supabase.from('shops').select('name, name_ar, name_fr').eq('id', id).single()
    if (data) {
      shopNameAr = data.name_ar || data.name
      shopNameFr = data.name_fr || data.name
    }
  } catch (e) {
    // fallback if table is missing or RLS blocks
  }

  // Get customer_id from cookie & Enforce Auth Gate
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('tamo_session')
  
  if (!sessionCookie?.value) {
    import('next/navigation').then(m => m.redirect('/unauthorized'));
    return null; // unreachable due to redirect
  }

  let customerId = null
  try {
    customerId = JSON.parse(sessionCookie.value).customer_id
  } catch (e) {}

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-[#0b0c10] font-sans pb-10">
      <header className="bg-[#01432A] text-white pt-16 pb-6 px-4 rounded-b-[2.5rem] shadow-md z-10 sticky top-0 border-b border-[#015132]/50 flex items-center justify-between">
        <Link href="/" className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm active:scale-95 transition-transform">
          <ChevronLeft size={28} className="mr-1" />
        </Link>
        <div className="flex flex-col items-center flex-1 pr-12">
          <h1 className="text-2xl font-black drop-shadow-sm" dir="rtl">{shopNameAr}</h1>
          <h2 className="text-sm font-medium opacity-80 mt-1">{shopNameFr}</h2>
        </div>
      </header>
      
      <main className="flex-1 w-full max-w-md mx-auto p-6 flex flex-col justify-center">
        <div className="flex flex-col text-center w-full mb-10 text-zinc-500 dark:text-zinc-400">
           <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 mb-2" dir="rtl">اضغط للتحدث</h2>
           <p className="text-sm">Appuyez pour parler</p>
        </div>
        <VoiceRecorder shopId={id} customerId={customerId} />
      </main>
    </div>
  )
}
