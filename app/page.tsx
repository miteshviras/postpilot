"use client";

import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";
import { 
  Send, 
  Users, 
  Activity, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <Navbar
          title="Overview"
          subtitle="TikTok Multi-Account Bulk Publishing Platform"
          action={{
            label: "Open Composer",
            href: "/composer",
            icon: Send,
          }}
        />

        <div className="p-8 max-w-6xl w-full mx-auto space-y-10">
          {/* Hero Welcome Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800 p-8 sm:p-10 shadow-2xl">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-gradient-to-br from-[#fe2c55]/20 to-[#25f4ee]/15 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-2xl relative z-10 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#fe2c55]/10 border border-[#fe2c55]/30 text-[#fe2c55] text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Next.js 16 + Docker Compose Pipeline</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Upload once. Bulk publish to all your TikTok accounts.
              </h2>

              <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
                PostPilot streamlines multi-account creator workflows. Connect several TikTok accounts via OAuth 2.0, fan out background publishing with BullMQ & Redis, schedule drops, and monitor per-account delivery with automatic retries.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href="/composer"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-[#fe2c55] to-[#ff0050] text-white font-bold text-sm px-6 py-3 rounded-xl shadow-lg shadow-[#fe2c55]/25 hover:shadow-xl hover:scale-[1.02] transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>Start Bulk Post</span>
                </Link>

                <Link
                  href="/accounts"
                  className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-sm px-5 py-3 rounded-xl border border-zinc-700/60 transition-colors"
                >
                  <Users className="w-4 h-4" />
                  <span>Manage Accounts</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Core Feature Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              href="/accounts"
              className="bg-zinc-900/50 hover:bg-zinc-800/40 border border-zinc-800/80 hover:border-zinc-700 rounded-2xl p-6 transition-all duration-200 group"
            >
              <div className="w-12 h-12 rounded-xl bg-zinc-800 group-hover:bg-[#fe2c55]/15 text-zinc-300 group-hover:text-[#fe2c55] flex items-center justify-center mb-4 transition-colors">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-1 group-hover:text-[#fe2c55] transition-colors flex items-center justify-between">
                <span>1. Multi-Account OAuth</span>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Connect solo or agency TikTok creator accounts securely. Tokens are stored with AES-256-GCM encryption at rest and auto-refreshed.
              </p>
            </Link>

            <Link
              href="/composer"
              className="bg-zinc-900/50 hover:bg-zinc-800/40 border border-zinc-800/80 hover:border-zinc-700 rounded-2xl p-6 transition-all duration-200 group"
            >
              <div className="w-12 h-12 rounded-xl bg-zinc-800 group-hover:bg-[#25f4ee]/15 text-zinc-300 group-hover:text-[#25f4ee] flex items-center justify-center mb-4 transition-colors">
                <Send className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-1 group-hover:text-[#25f4ee] transition-colors flex items-center justify-between">
                <span>2. Bulk Composer</span>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Drag and drop your video once. Customize hashtags, set schedules, select target profiles, and dispatch in 3 steps or fewer.
              </p>
            </Link>

            <Link
              href="/jobs"
              className="bg-zinc-900/50 hover:bg-zinc-800/40 border border-zinc-800/80 hover:border-zinc-700 rounded-2xl p-6 transition-all duration-200 group"
            >
              <div className="w-12 h-12 rounded-xl bg-zinc-800 group-hover:bg-purple-500/15 text-zinc-300 group-hover:text-purple-400 flex items-center justify-center mb-4 transition-colors">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-1 group-hover:text-purple-400 transition-colors flex items-center justify-between">
                <span>3. Queue & Worker</span>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Powered by Redis BullMQ worker processes. Tracks per-account upload progress and isolates transient errors with retry support.
              </p>
            </Link>
          </div>

          {/* Architecture Checklist Banner */}
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Production Architecture Standards</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs text-zinc-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Next.js 16 App Router</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>PostgreSQL 16 + Prisma</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Redis + BullMQ Queues</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Docker & Docker Compose</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
