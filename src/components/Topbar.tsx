"use client";

import { Menu, Bell, Search, Mic, Sparkles } from "lucide-react";

export default function Topbar() {
  return (
    <header
      className="
        w-full h-16
        flex items-center justify-between
        px-4 sm:px-6
        sticky top-0 z-30
        bg-white/80 backdrop-blur-xl
        border-b border-teal-100
        shadow-[0_4px_18px_rgba(15,118,110,0.12)]
      "
    >
      {/* LEFT — BRAND + MOBILE MENU */}
      <div className="flex items-center gap-3">
        <button className="md:hidden inline-flex items-center justify-center rounded-full border border-teal-100 bg-white/80 p-1.5 text-teal-700 hover:bg-teal-50 transition">
          <Menu className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 text-sm font-semibold text-white shadow-md">
            SB
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-slate-900">
              SmartBridge Studio
            </span>
            <span className="text-[11px] text-slate-500">
              Patient cockpit · Kokstad hub
            </span>
          </div>
        </div>
      </div>

      {/* CENTER — SEARCH */}
      <div className="flex-1 flex justify-center px-2">
        <div
          className="
            hidden md:flex
            items-center gap-2
            bg-white/80
            border border-teal-100
            rounded-xl
            px-3.5 py-2
            shadow-sm
            max-w-md w-full
            transition-all duration-200
            focus-within:ring-2 focus-within:ring-teal-500/70 focus-within:border-teal-300
          "
        >
          <Search className="w-4 h-4 text-teal-600/80" />
          <input
            placeholder="Search patients, notes, or tasks…"
            className="
              flex-1 bg-transparent outline-none
              text-xs sm:text-sm text-slate-800 placeholder:text-slate-400
            "
          />
          <span className="hidden lg:inline-flex items-center rounded-md bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 border border-slate-200/70">
            ⌘K
          </span>
        </div>
      </div>

      {/* RIGHT — ACTIONS */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Quick AI button */}
        <button
          className="
            hidden sm:inline-flex items-center gap-1.5
            rounded-full bg-teal-600 text-white
            px-3 py-1.5 text-[11px] font-medium
            shadow-sm hover:bg-teal-700
            transition
          "
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Dr Bot</span>
        </button>

        {/* Voice capture (global mic) */}
        <button
          className="
            inline-flex items-center justify-center
            h-8 w-8 rounded-full
            border border-teal-100 bg-white
            text-teal-700 hover:bg-teal-50
            transition
          "
        >
          <Mic className="w-4 h-4" />
        </button>

        {/* Notifications */}
        <button
          className="
            relative inline-flex items-center justify-center
            h-8 w-8 rounded-full
            border border-teal-100 bg-white
            text-teal-700 hover:bg-teal-50
            transition
          "
        >
          <Bell className="w-4 h-4" />
          <span className="absolute -top-0.5 -right-0.5 inline-flex h-3.5 min-w-[0.9rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-semibold text-white shadow-sm">
            3
          </span>
        </button>

        {/* USER PILL */}
        <button
          className="
            flex items-center gap-2
            rounded-full bg-white
            border border-teal-100
            px-2.5 py-1.5
            shadow-sm
            hover:bg-teal-50
            transition
          "
        >
          <div
            className="
              flex h-8 w-8 items-center justify-center
              rounded-full bg-gradient-to-br from-teal-400 to-teal-600
              text-xs font-semibold text-white
              shadow
            "
          >
            JB
          </div>
          <div className="hidden sm:flex flex-col text-left leading-tight">
            <span className="text-xs font-semibold text-slate-900">
              Johnathan Bernard
            </span>
            <span className="text-[10px] text-slate-500">
              Coordinator · SmartBridge
            </span>
          </div>
        </button>
      </div>
    </header>
  );
}
