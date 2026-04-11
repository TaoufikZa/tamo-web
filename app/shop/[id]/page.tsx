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

  let shopName = 'المتجر / Boutique'
  
  try {
    const { data } = await supabase.from('shops').select('shop_name').eq('id', id).single()
    if (data && data.shop_name) {
      shopName = data.shop_name
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
    <div className="flex flex-col flex-1 pb-10">
      <header className="bg-white px-4 py-4 shadow-sm z-10 flex items-center justify-between mb-8">
        <Link href="/" className="w-10 h-10 bg-[#F0F2F5] text-zinc-700 hover:bg-zinc-200 rounded-full flex items-center justify-center active:scale-95 transition-transform">
          <ChevronLeft size={24} className="mr-0.5" />
        </Link>
        <div className="flex flex-col items-center flex-1 pr-10">
          <h1 className="text-lg font-bold text-[#062C1E] line-clamp-1 text-center" dir="rtl">{shopName}</h1>
        </div>
      </header>
      
      <main className="flex-1 w-full flex flex-col justify-center px-4">
        <div className="flex flex-col text-center w-full mb-10 text-zinc-500">
           <h2 className="text-xl font-black text-zinc-800 mb-2" dir="rtl">اضغط للتحدث</h2>
           <p className="text-sm uppercase tracking-widest font-bold">Appuyez pour parler</p>
        </div>
        <VoiceRecorder shopId={id} customerId={customerId} />
      </main>
    </div>
  )
}
