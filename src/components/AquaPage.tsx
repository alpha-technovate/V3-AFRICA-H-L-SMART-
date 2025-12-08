"use client";

export function AquaPage({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="
        w-full 
        max-w-6xl 
        mx-auto 
        px-6 
        py-8
        min-h-screen

        transition-all duration-500 ease-[[cubic-bezier(0.25,0.1,0.25,1)]]

        /* Aqua smooth reveal */
        animate-[fadeIn_0.6s_ease-out]

        /* Prevent layout jitter */
        [scrollbar-width:none]
        [&::-webkit-scrollbar]:hidden
      "
    >
      {children}
    </div>
  );
}
