'use client';

import React from 'react';
import Link from 'next/link';
import { QrCode, LogIn, UtensilsCrossed, Compass, Sparkles } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-between text-white relative overflow-hidden">
      {/* Background Graphic elements */}
      <div className="absolute top-0 right-0 h-96 w-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 h-96 w-96 bg-amber-500/10 rounded-full blur-3xl" />

      {/* Header logo */}
      <header className="max-w-5xl mx-auto w-full px-6 py-6 flex justify-between items-center relative z-10">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center font-extrabold text-white">
            G
          </div>
          <span className="font-bold tracking-tight text-zinc-100">Gourmet Haven</span>
        </div>
        <Link
          href="/login"
          className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-white transition-colors bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5"
        >
          <LogIn className="h-3.5 w-3.5" /> Staff LogIn
        </Link>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto w-full px-6 text-center space-y-8 py-12 relative z-10">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-extrabold tracking-wider uppercase animate-pulse">
            <Sparkles className="h-3 w-3" /> QR-Code Table Ordering
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-zinc-50 via-zinc-100 to-zinc-450 leading-tight">
            Order premium dining directly from your table
          </h1>
          <p className="text-sm sm:text-base text-zinc-450 max-w-lg mx-auto leading-relaxed">
            Scan the table QR code to browse, customize dishes, and order instantly. No login required. Track your order's kitchen status live!
          </p>
        </div>

        {/* Demo Table Simulator Buttons */}
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
            Simulate Scanning a QR Code
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              href="/menu?table=1"
              className="flex items-center justify-between p-4 bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-800 rounded-2xl transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-3 text-left">
                <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                  <QrCode className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-zinc-200">Table 1 Menu</h4>
                  <p className="text-[10px] text-zinc-500 font-medium">Capacity: 2 Guests</p>
                </div>
              </div>
              <Compass className="h-4.5 w-4.5 text-zinc-650 group-hover:text-primary transition-colors" />
            </Link>

            <Link
              href="/menu?table=3"
              className="flex items-center justify-between p-4 bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-800 rounded-2xl transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-3 text-left">
                <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                  <QrCode className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-zinc-200">Table 3 Menu</h4>
                  <p className="text-[10px] text-zinc-500 font-medium">Capacity: 4 Guests</p>
                </div>
              </div>
              <Compass className="h-4.5 w-4.5 text-zinc-650 group-hover:text-primary transition-colors" />
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto w-full px-6 py-6 border-t border-zinc-900/50 text-center relative z-10">
        <p className="text-[11px] text-zinc-600 font-medium">
          Gourmet Haven © 2026. Built with Next.js, Socket.io, and Prisma.
        </p>
      </footer>
    </div>
  );
}
