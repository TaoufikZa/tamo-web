'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, Square, Loader2, Send, Trash2, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export function VoiceRecorder({ shopId, customerId }: { shopId: string, customerId: any }) {
  // State Machine
  const [isRecording, setIsRecording] = useState(false)
  const [isReviewing, setIsReviewing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  
  const router = useRouter()
  const supabase = createClient()

  // Timer logic
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

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        chunksRef.current = []
        stream.getTracks().forEach(track => track.stop())
        
        // Enter Review State
        const url = URL.createObjectURL(blob)
        setAudioBlob(blob)
        setAudioUrl(url)
        setIsReviewing(true)
      }

      chunksRef.current = []
      recorder.start()
      mediaRecorderRef.current = recorder
      setIsRecording(true)
      setIsReviewing(false)
      setAudioBlob(null)
      setAudioUrl(null)
    } catch (err) {
      console.error('Error accessing microphone', err)
      alert("يرجى السماح بالوصول إلى الميكروفون\\nVeuillez autoriser l'accès au microphone")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const handleDelete = () => {
    setIsReviewing(false)
    setAudioBlob(null)
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
      setAudioUrl(null)
    }
  }

  const confirmAndUpload = async () => {
    if (!audioBlob) return;
    
    setIsUploading(true)
    setIsReviewing(false)

    try {
      // 1. Get Location
      let location = null
      const locString = localStorage.getItem('tamo_location')
      if (locString) {
        try { location = JSON.parse(locString) } catch (e) {}
      }

      // 2. Upload to storage (orders-audio)
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.webm`
      const { error: uploadError } = await supabase.storage
        .from('orders-audio')
        .upload(fileName, audioBlob, { contentType: 'audio/webm' })

      console.log('Upload Result:', uploadError); // User requested logging

      if (uploadError) {
        console.warn("Storage upload failed", uploadError)
        setIsUploading(false)
        alert("حدث خطأ أثناء رفع التسجيل..\\nUne erreur s'est produite lors du téléchargement.")
        return;
      }

      // Generate public URL using the explicit orders-audio bucket
      const { data: publicUrlData } = supabase.storage
        .from('orders-audio')
        .getPublicUrl(fileName)

      // 3. Insert into orders and get the ID
      const { data: newOrder, error: insertError } = await supabase
        .from('orders')
        .insert({
          customer_id: customerId,
          shop_id: shopId,
          audio_url: publicUrlData.publicUrl,
          status: 'pending',
          customer_lat: location?.lat || null,
          customer_lng: location?.lng || null
        })
        .select('id')
        .single()

      if (insertError || !newOrder) {
        console.warn("DB Insert failed", insertError)
        setIsUploading(false)
        alert("حدث خطأ أثناء الحفظ في قاعدة البيانات.\\nErreur de base de données.")
        return;
      }

      // 4. Redirect to success with the orderId
      router.push(`/success?orderId=${newOrder.id}`)
    } catch (error) {
      console.error("Upload process error", error)
      setIsUploading(false)
      alert("حدث خطأ أثناء الإرسال. الرجاء المحاولة مرة أخرى.\\nUne erreur s'est produite. Veuillez réessayer.")
    }
  }

  // UI STATE: UPLOADING
  if (isUploading) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 mt-10">
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

  // UI STATE: REVIEWING
  if (isReviewing && audioUrl) {
    return (
      <div className="flex flex-col items-center justify-center w-full mt-8 animate-fade-in">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-6 drop-shadow-sm" dir="rtl">
          مراجعة الطلب
        </h2>
        
        <div className="w-full bg-white dark:bg-[#1a1c23] p-4 rounded-3xl shadow-sm border border-zinc-200/80 dark:border-zinc-800 mb-10">
           <audio src={audioUrl} controls className="w-full outline-none" />
        </div>

        <div className="flex w-full gap-4 px-2">
           <button 
             onClick={handleDelete}
             className="flex-1 flex flex-col items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/40 py-5 rounded-3xl transition-all active:scale-95 border border-red-100 dark:border-red-900/30"
           >
             <Trash2 size={28} />
             <span className="font-bold text-sm">إلغاء</span>
           </button>
           <button 
             onClick={confirmAndUpload}
             className="flex-[2] flex flex-col items-center justify-center gap-2 bg-[#01432A] hover:bg-[#015132] text-white py-5 rounded-3xl transition-all shadow-lg active:scale-[0.98]"
           >
             <div className="flex items-center gap-2">
               <span className="font-bold text-lg" dir="rtl">تأكيد وإرسال</span>
               <Send size={24} className="ml-1" />
             </div>
           </button>
        </div>
      </div>
    )
  }

  // UI STATE: IDLE / RECORDING
  return (
    <div className="flex flex-col items-center justify-center w-full mt-4">
      <div className="relative">
        {isRecording && (
          <>
            <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping scale-[1.5]" />
            <div className="absolute inset-0 bg-red-500/10 rounded-full animate-pulse scale-[1.8] delay-75" />
          </>
        )}
        
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`relative w-44 h-44 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl z-10 ${
            isRecording 
              ? 'bg-red-500 hover:bg-red-600 scale-[1.05]' 
              : 'bg-[#01432A] hover:bg-[#015132] active:scale-95 shrink-0'
          }`}
        >
          {isRecording ? (
             <Square size={48} className="text-white fill-white" />
          ) : (
             <div className="flex flex-col items-center justify-center gap-2">
                <Mic size={64} className="text-white" />
             </div>
          )}
        </button>
      </div>

      <div className="mt-14 h-12 flex flex-col items-center justify-center">
        {isRecording ? (
          <div className="flex flex-col items-center animate-fade-in">
             <div className="text-4xl font-mono text-red-500 font-black drop-shadow-sm min-w-[120px] text-center tracking-wider">
               {formatTime(recordingTime)}
             </div>
             <div className="mt-4 flex items-center gap-2 text-zinc-500 animate-pulse">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 block" />
                <span className="text-sm font-bold uppercase tracking-widest">Enregistrement</span>
             </div>
          </div>
        ) : (
          <div className="text-center font-medium text-zinc-500 dark:text-zinc-400">
             اضغط للبدء
          </div>
        )}
      </div>
    </div>
  )
}
