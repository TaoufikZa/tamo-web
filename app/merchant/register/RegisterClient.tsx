'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Store, 
  User, 
  Phone, 
  Image as ImageIcon, 
  MapPin, 
  Navigation, 
  Loader2, 
  CheckCircle2, 
  X,
  LocateFixed
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import 'leaflet/dist/leaflet.css';

// 1. Create a specialized Map component that handles all Leaflet logic internal to the client
// We must dynamic import this entire thing to avoid SSR issues
const DynamicRegisterMap = dynamic(() => import('./RegisterMap'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-64 bg-[#F0F2F5] rounded-xl flex items-center justify-center animate-pulse">
      <Loader2 className="animate-spin text-zinc-300" size={32} />
    </div>
  )
});

export default function RegisterClient() {
  const [step, setStep] = useState<'form' | 'success' | 'loading'>('form');
  const [formData, setFormData] = useState({
    shopName: '',
    ownerName: '',
    whatsappNumber: '',
  });
  const [coords, setCoords] = useState<[number, number]>([33.5731, -7.5898]); // Casablanca default
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  
  const supabase = createClient();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.shopName || !formData.whatsappNumber) {
      setErrorMsg('Veuillez remplir les champs obligatoires.');
      return;
    }

    setStep('loading');
    setErrorMsg('');

    try {
      let finalImageUrl = '';

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('shop-images')
          .upload(fileName, imageFile);

        if (uploadError) throw new Error("Erreur lors de l'envoi de l'image.");

        const { data: publicURLData } = supabase.storage
          .from('shop-images')
          .getPublicUrl(fileName);
        
        finalImageUrl = publicURLData.publicUrl;
      }

      const webhookUrl = process.env.NEXT_PUBLIC_N8N_SHOP_WEBHOOK || '';
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop_name: formData.shopName,
          owner_name: formData.ownerName,
          whatsapp_number: formData.whatsappNumber,
          lat: coords[0],
          lng: coords[1],
          image_url: finalImageUrl,
          registered_at: new Date().toISOString()
        })
      });

      if (!response.ok) throw new Error("Service d'enregistrement indisponible.");

      setStep('success');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Une erreur est survenue.');
      setStep('form');
    }
  };

  if (step === 'success') {
    return (
      <div className="flex flex-col flex-1 items-center justify-center p-6 text-center animate-fade-in">
        <div className="w-24 h-24 bg-[#062C1E] rounded-full flex items-center justify-center text-[#a3ff12] mb-8 shadow-xl">
          <CheckCircle2 size={56} />
        </div>
        <h1 className="text-2xl font-black text-zinc-900 mb-4" dir="rtl">تم تسجيل المتجر بنجاح!</h1>
        <p className="text-zinc-600 mb-2" dir="rtl">أرسلنا تأكيداً إلى الواتساب الخاص بك.</p>
        <div className="w-16 h-px bg-zinc-200 my-6" />
        <h2 className="text-xl font-bold text-zinc-800">Shop Registered Successfully!</h2>
        <p className="text-zinc-500 mb-10">We sent a confirmation to your WhatsApp.</p>
        <Link href="/" className="w-full max-w-xs bg-[#062C1E] text-white py-4 rounded-2xl font-bold shadow-md active:scale-95 transition-transform">
          Retour à l&apos;accueil
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 pb-12 w-full max-w-md mx-auto">
      <header className="bg-white px-6 py-4 shadow-sm z-10 flex items-center justify-between mb-6">
        <Link href="/" className="w-10 h-10 bg-[#F0F2F5] rounded-full flex items-center justify-center">
            <X size={20} className="text-zinc-500" />
        </Link>
        <div className="flex flex-col items-end">
          <h1 className="text-lg font-bold text-[#062C1E]" dir="rtl">تسجيل متجر جديد</h1>
          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Nouvelle Boutique</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="px-5 space-y-6">
        {errorMsg && (
          <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-sm font-bold" dir="rtl">
            {errorMsg}
          </div>
        )}

        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-transparent focus-within:border-[#062C1E]/20 transition-all">
            <label className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Shop Name</span>
              <span className="text-sm font-bold text-[#062C1E]" dir="rtl">اسم المتجر *</span>
            </label>
            <div className="flex items-center gap-3">
              <Store size={20} className="text-zinc-400" />
              <input 
                required
                type="text" 
                value={formData.shopName}
                onChange={(e) => setFormData({...formData, shopName: e.target.value})}
                placeholder="..." 
                className="flex-1 bg-transparent outline-none font-bold text-zinc-900"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-transparent focus-within:border-[#062C1E]/20 transition-all">
            <label className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Owner Name</span>
              <span className="text-sm font-bold text-[#062C1E]" dir="rtl">اسم المالك</span>
            </label>
            <div className="flex items-center gap-3">
              <User size={20} className="text-zinc-400" />
              <input 
                type="text" 
                value={formData.ownerName}
                onChange={(e) => setFormData({...formData, ownerName: e.target.value})}
                placeholder="..." 
                className="flex-1 bg-transparent outline-none font-bold text-zinc-900"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-transparent focus-within:border-[#062C1E]/20 transition-all">
            <label className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">WhatsApp</span>
              <span className="text-sm font-bold text-[#062C1E]" dir="rtl">رقم الواتساب *</span>
            </label>
            <div className="flex items-center gap-3">
              <Phone size={20} className="text-zinc-400" />
              <input 
                required
                type="tel" 
                value={formData.whatsappNumber}
                onChange={(e) => setFormData({...formData, whatsappNumber: e.target.value})}
                placeholder="06..." 
                className="flex-1 bg-transparent outline-none font-bold text-zinc-900"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-transparent">
          <label className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Shop Photo</span>
            <span className="text-sm font-bold text-[#062C1E]" dir="rtl">صورة المتجر</span>
          </label>
          <div className="relative group flex flex-col items-center">
             <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
             <div className="w-full h-32 rounded-xl bg-[#F0F2F5] border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center gap-2 overflow-hidden">
                {imagePreview ? (
                  <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                ) : (
                  <>
                    <ImageIcon size={32} className="text-zinc-300" />
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Cliquez pour ajouter</span>
                  </>
                )}
             </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-transparent">
          <label className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Location</span>
            <span className="text-sm font-bold text-[#062C1E]" dir="rtl">موقع المتجر</span>
          </label>
          <div className="w-full h-64 rounded-xl overflow-hidden relative border border-zinc-100 shadow-inner">
             <DynamicRegisterMap coords={coords} setCoords={setCoords} />
          </div>
        </div>

        <button 
          type="submit"
          disabled={step === 'loading'}
          className="w-full h-[72px] bg-[#062C1E] text-white rounded-2xl font-bold shadow-lg shadow-[#062C1E]/20 transition-all active:scale-[0.98] flex items-center justify-center flex-col gap-0.5 relative"
        >
          {step === 'loading' ? (
            <Loader2 className="animate-spin" size={28} />
          ) : (
            <>
              <span className="text-xl" dir="rtl">تسجيل المتجر</span>
              <span className="text-[10px] font-bold text-[#a3ff12] uppercase tracking-[0.1em]">Enregistrer la boutique</span>
              <Navigation size={20} className="absolute right-6 fill-[#a3ff12] text-[#a3ff12] rotate-45" />
            </>
          )}
        </button>

      </form>
    </div>
  );
}
