'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, Square, Loader2, Send } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../../utils/supabase/client'

export function VoiceRecorder({ shopId, customerId }: { shopId: string, customerId: any }) {
  const [isRecording, setIsRecording] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    let interval: any
    if (isRecording) {
      interval = setInterval(() => setRecordingTime(t => t + 1), 1000)
    } else {
      setRecordingTime(0)
    }
    return () => clearInterval(interval)
  }, [isRecording])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
        chunksRef.current = []
        stream.getTracks().forEach(track => track.stop())
        await handleUpload(audioBlob)
      }

      chunksRef.current = []
      recorder.start()
      mediaRecorderRef.current = recorder
      setIsRecording(true)
    } catch (err) {
      console.error('Error accessing microphone', err)
      alert("يرجى السماح بالوصول إلى الميكروفون\\nVeuillez autoriser l'accès au microphone")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsUploading(true)
    }
  }

  const handleUpload = async (blob: Blob) => {
    try {
      // 1. Get Location
      let location = null
      const locString = localStorage.getItem('tamo_location')
      if (locString) {
        try { location = JSON.parse(locString) } catch (e) {}
      }

      // 2. Upload to storage
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.webm`
      const { error: uploadError } = await supabase.storage
        .from('orders')
        .upload(fileName, blob, { contentType: 'audio/webm' })

      if (uploadError) {
        console.warn("Storage upload failed, trying to continue for scaffold", uploadError)
        // If it fails because bucket doesn't exist, we can still try to insert for testing
      }

      const { data: publicUrlData } = supabase.storage
        .from('orders')
        .getPublicUrl(fileName)

      // 3. Insert into orders
      const { error: insertError } = await supabase
        .from('orders')
        .insert({
          customer_id: customerId,
          shop_id: shopId,
          audio_url: publicUrlData.publicUrl,
          status: 'pending',
          lat: location?.lat || null,
          lng: location?.lng || null
        })

      if (insertError) {
        console.warn("DB Insert failed", insertError)
      }

      // 4. Redirect to success
      router.push('/success')
    } catch (error) {
      console.error("Upload process error", error)
      setIsUploading(false)
      alert("حدث خطأ أثناء الإرسال. الرجاء المحاولة مرة أخرى.\\nUne erreur s'est produite. Veuillez réessayer.")
    }
  }

  if (isUploading) {
    return (
      <div className="flex flex-col items-center justify-center gap-6">
         <div className="w-32 h-32 bg-[#01432A]/10 dark:bg-[#2db37b]/20 rounded-full flex items-center justify-center animate-pulse">
            <Loader2 size={48} className="text-[#01432A] dark:text-[#2db37b] animate-spin" />
         </div>
         <div className="text-center font-medium text-zinc-600 dark:text-zinc-400">
           <p dir="rtl" className="font-bold text-lg text-zinc-900 dark:text-zinc-100 mb-1">جاري إرسال طلبك...</p>
           <p>Envoi de votre commande...</p>
         </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center w-full">
      {/* Dynamic Pulse Ring when recording */}
      <div className="relative">
        {isRecording && (
          <>
            <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping scale-[1.5]" />
            <div className="absolute inset-0 bg-red-500/10 rounded-full animate-pulse scale-[1.8] delay-75" />
          </>
        )}
        
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`relative w-40 h-40 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl z-10 ${
            isRecording 
              ? 'bg-red-500 hover:bg-red-600 scale-[1.05]' 
              : 'bg-[#01432A] hover:bg-[#015132] active:scale-95'
          }`}
        >
          {isRecording ? (
             <div className="flex flex-col items-center gap-2">
               <Square size={40} className="text-white fill-white" />
             </div>
          ) : (
             <Mic size={64} className="text-white" />
          )}
        </button>
      </div>

      <div className="mt-12 h-10">
        {isRecording && (
          <div className="flex flex-col items-center animate-fade-in">
             <div className="text-3xl font-mono text-red-500 font-bold drop-shadow-sm min-w-[100px] text-center">
               {formatTime(recordingTime)}
             </div>
             <div className="mt-4 flex items-center gap-2 text-zinc-500 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-red-500 block" />
                <span className="text-sm font-medium">Recording</span>
             </div>
          </div>
        )}
      </div>
      
      {isRecording && (
         <button 
           onClick={stopRecording}
           className="mt-10 flex items-center gap-3 bg-zinc-900 dark:bg-white text-white dark:text-black px-8 py-4 rounded-full font-bold shadow-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 active:scale-95 transition-transform"
         >
           <span dir="rtl">إرسال الطلب</span>
           <Send size={18} />
         </button>
      )}
    </div>
  )
}
