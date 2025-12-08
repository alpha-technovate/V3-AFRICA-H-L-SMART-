// src/app/(whatever)/SidebarLayout.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Menu, Bell, Search } from "lucide-react";

import SmartBridgeAssistant from "@/components/SmartBridgeAssistant";
import { navItems, doctors } from "@/lib/data";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

export default function SidebarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const currentUser = doctors[0];

  return (
    <>
      {/* MAIN 2-COLUMN LAYOUT */}
      <div className="grid min-h-screen w-full md:grid-cols-[240px_1fr] bg-[#eafbf9]">
        {/* ===================================================== */}
        {/* DESKTOP SIDEBAR                                      */}
        {/* ===================================================== */}
        <aside className="hidden md:flex flex-col border-r bg-white shadow-sm">
          {/* Logo row */}
          <div className="h-14 px-5 flex items-center border-b">
            <Link
              href="/"
              className="font-bold text-xl text-teal-700 font-headline"
            >
              SmartBridge
            </Link>

            <Button
              variant="outline"
              size="icon"
              className="ml-auto h-8 w-8 rounded-full"
            >
              <Bell className="w-4 h-4 text-teal-600" />
              <span className="sr-only">Notifications</span>
            </Button>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 text-sm space-y-1">
            <TooltipProvider delayDuration={100}>
              {navItems.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);

                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition
                          ${
                            active
                              ? "bg-teal-100 text-teal-700 font-semibold"
                              : "text-gray-700 hover:bg-teal-50"
                          }`}
                      >
                        <item.icon className="w-5 h-5" />
                        <span className="font-medium">{item.label}</span>

                        {item.badge && (
                          <Badge className="ml-auto bg-teal-600 text-white h-6 w-6 flex items-center justify-center rounded-full">
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </TooltipProvider>
          </nav>

          {/* Upgrade box */}
          <div className="p-4 border-t">
            <div className="bg-teal-50 rounded-xl p-4 shadow-sm">
              <p className="font-semibold text-teal-800 font-headline">
                Upgrade to Pro
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Unlock more powerful EMR + AI tools.
              </p>

              <Button className="w-full mt-3 bg-teal-600 text-white hover:bg-teal-700">
                Upgrade
              </Button>
            </div>
          </div>
        </aside>

        {/* ===================================================== */}
        {/* RIGHT COLUMN: HEADER(S) + MAIN CONTENT               */}
        {/* ===================================================== */}
        <div className="flex flex-col min-h-screen">
          {/* ---------- MOBILE TOP BAR ---------- */}
          <header className="md:hidden flex items-center h-14 px-4 border-b bg-white shadow-sm">
            {/* Mobile menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="w-5 h-5" />
                  <span className="sr-only">Open navigation</span>
                </Button>
              </SheetTrigger>

              <SheetContent side="left" className="w-[240px] bg-white p-0">
                {/* 👇 THIS PART ADDED / CHANGED */}
                <SheetHeader className="border-b">
                  <SheetTitle className="h-14 flex items-center px-5 font-bold text-xl text-teal-700 font-headline">
                    SmartBridge
                  </SheetTitle>
                </SheetHeader>

                <nav className="p-4 space-y-1 text-sm">
                  {navItems.map((item) => {
                    const active =
                      item.href === "/"
                        ? pathname === "/"
                        : pathname.startsWith(item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg
                          ${
                            active
                              ? "bg-teal-100 text-teal-700 font-semibold"
                              : "text-gray-700 hover:bg-teal-50"
                          }`}
                      >
                        <item.icon className="w-5 h-5" />
                        {item.label}
                        {item.badge && (
                          <Badge className="ml-auto bg-teal-600 text-white h-6 w-6 flex items-center justify-center rounded-full">
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </SheetContent>
            </Sheet>

            {/* Mobile search */}
            <div className="flex-1 mx-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-gray-400" />
                <Input
                  placeholder="Search patients..."
                  className="pl-8 bg-teal-50 h-9"
                />
              </div>
            </div>

            {/* Mobile avatar */}
            <Avatar className="border border-gray-300 h-8 w-8">
              <AvatarImage src={currentUser.avatar} />
              <AvatarFallback>{currentUser.name[0]}</AvatarFallback>
            </Avatar>
          </header>

          {/* ---------- DESKTOP TOP BAR ---------- */}
          <header className="hidden md:flex items-center h-14 px-6 border-b bg-white shadow-sm">
            <div className="relative w-full max-w-xl">
              <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-gray-400" />
              <Input
                placeholder="Search patients, consultations..."
                className="pl-8 h-9"
              />
            </div>

            <div className="ml-auto flex items-center gap-3">
              <Avatar className="border border-gray-300 h-9 w-9">
                <AvatarImage src={currentUser.avatar} />
                <AvatarFallback>{currentUser.name[0]}</AvatarFallback>
              </Avatar>
            </div>
          </header>

          {/* ---------- MAIN CONTENT AREA ---------- */}
          <main
            className="
              flex-1 
              min-h-[calc(100vh-56px)]
              overflow-y-auto 
              p-6 
              scroll-smooth
              [scrollbar-width:none]
              [&::-webkit-scrollbar]:w-1
              [&::-webkit-scrollbar-track]:bg-transparent
              [&::-webkit-scrollbar-thumb]:bg-teal-300
              [&::-webkit-scrollbar-thumb]:rounded-full
            "
          >
            {children}
          </main>
        </div>
      </div>

      {/* Floating global assistant */}
      <SmartBridgeAssistant />
    </>
  );
}
