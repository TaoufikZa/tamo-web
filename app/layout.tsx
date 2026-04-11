import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Tamo | أطلبها بصوتك',
  description: 'Voice-based grocery delivery in Morocco',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" className={`${inter.className} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#F0F2F5] text-zinc-900 selection:bg-lime-400/30 font-sans">
        
        {/* Global Persistent Header */}
        <header className="fixed top-0 inset-x-0 h-[90px] bg-[#062C1E] text-white shadow-md z-[9999] flex flex-col items-center justify-center border-b border-[#015132]/50">
           <Link href="/">
             <div className="flex flex-col items-center gap-1 transform active:scale-95 transition-transform">
               <div className="font-black text-4xl text-[#a3ff12] tracking-tighter leading-none mt-1">
                 tamo
               </div>
               <p className="text-[10px] font-bold tracking-widest text-white uppercase leading-tight font-sans">
                 JUST SPEAK IT | أطلبها بصوتك
               </p>
             </div>
           </Link>
        </header>

        {/* Constrained App Container */}
        <main className="flex-1 w-full max-w-md mx-auto pt-[90px] pb-20 relative">
          {children}
        </main>
        
      </body>
    </html>
  );
}
