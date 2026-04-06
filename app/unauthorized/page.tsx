import { AlertCircle } from 'lucide-react'

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-screen bg-zinc-50 dark:bg-[#0b0c10] font-sans p-6">
      <main className="flex w-full max-w-md flex-col items-center text-center gap-6 p-8 bg-white dark:bg-[#1a1c23] rounded-3xl shadow-xl">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 mb-2">
          <AlertCircle size={32} />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100" dir="rtl">
            الرابط غير صالح أو منتهي الصلاحية
          </h1>
          <h2 className="text-lg font-medium text-zinc-600 dark:text-zinc-400">
            Lien invalide ou expiré
          </h2>
        </div>

        <div className="space-y-3 px-4">
          <p className="text-sm text-zinc-500 dark:text-zinc-500" dir="rtl">
            يرجى طلب رابط دخول جديد عبر واتساب للمتابعة.
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-500">
            Veuillez demander un nouveau lien d'accès via WhatsApp pour continuer.
          </p>
        </div>
      </main>
    </div>
  )
}
