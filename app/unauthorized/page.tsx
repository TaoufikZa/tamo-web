import { AlertCircle } from 'lucide-react'

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-screen bg-zinc-50 dark:bg-[#0b0c10] font-sans p-6">
      <main className="flex w-full max-w-md flex-col items-center text-center gap-6 p-8 bg-white dark:bg-[#1a1c23] rounded-3xl shadow-md border border-zinc-100 dark:border-zinc-800/50">
        <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center text-red-500 mb-2">
          <AlertCircle size={40} />
        </div>
        
        <div className="space-y-4">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 leading-relaxed" dir="rtl">
            رابط غير صالح أو منتهي الصلاحية. يرجى العودة إلى واتساب لطلب رابط جديد.
          </h1>
          <div className="w-12 h-[1px] bg-zinc-200 dark:bg-zinc-800 mx-auto" />
          <h2 className="text-base font-medium text-zinc-600 dark:text-zinc-400">
            Lien invalide ou expiré. Veuillez retourner sur WhatsApp pour demander un nouveau lien.
          </h2>
        </div>
      </main>
    </div>
  )
}
