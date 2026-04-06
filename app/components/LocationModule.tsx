'use client'

import { useState } from 'react'
import { MapPin, Navigation2 } from 'lucide-react'

export function LocationModule() {
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const requestLocation = () => {
    setStatus('loading')
    if (!navigator.geolocation) {
      setStatus('error')
      return
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
        setStatus('success')
        // Store in localStorage so the Ordering Room can use it
        localStorage.setItem('tamo_location', JSON.stringify({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }))
      },
      (error) => {
        console.error(error)
        setStatus('error')
      }
    )
  }

  return (
    <div className="bg-white dark:bg-[#1a1c23] rounded-2xl p-5 shadow-sm border border-zinc-100 dark:border-zinc-800/50 mb-6 w-full relative overflow-hidden">
      {status === 'success' ? (
        <div className="flex items-center justify-between gap-4 text-[#01432A] dark:text-[#2db37b]">
          <div className="w-12 h-12 bg-[#01432A]/10 dark:bg-[#2db37b]/20 rounded-full flex items-center justify-center shrink-0">
            <MapPin size={24} />
          </div>
          <div className="flex-1 flex flex-col items-end">
            <p className="font-bold text-lg" dir="rtl">تم تحديد الموقع بنجاح</p>
            <p className="text-sm font-medium opacity-80">Localisation capturée</p>
          </div>
        </div>
      ) : (
        <button 
          onClick={requestLocation}
          disabled={status === 'loading'}
          className="w-full flex items-center justify-between gap-4 text-left group"
        >
          <div className="w-12 h-12 bg-zinc-100 dark:bg-[#2a2d39] rounded-full flex items-center justify-center shrink-0 group-hover:bg-[#01432A]/10 dark:group-hover:bg-[#2db37b]/20 transition-colors">
            {status === 'loading' ? (
               <div className="w-5 h-5 border-2 border-[#01432A] dark:border-[#2db37b] border-t-transparent rounded-full animate-spin" />
            ) : (
               <Navigation2 size={20} className="text-[#01432A] dark:text-[#2db37b]" />
            )}
          </div>
          <div className="flex-1 flex flex-col items-end space-y-1">
             <span className="font-bold text-lg text-[#01432A] dark:text-[#2db37b]" dir="rtl">مشاركة موقعي</span>
             <span className="text-sm font-medium text-[#01432A] dark:text-[#2db37b]">Partager ma position</span>
          </div>
        </button>
      )}
      {status === 'error' && (
        <div className="mt-3 text-red-500 text-xs text-right" dir="rtl">
          فشل في تحديد الموقع. يرجى تفعيل إعدادات الموقع.
          <br/>
          <span className="text-left block mt-1" dir="ltr">Échec de la localisation. Veuillez activer les paramètres de localisation.</span>
        </div>
      )}
    </div>
  )
}
