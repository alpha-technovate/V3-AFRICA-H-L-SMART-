import "./globals.css";
import { Inter } from "next/font/google";

import SidebarLayout from "@/components/SidebarLayout"; // NEW CLIENT WRAPPER

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "SmartBridge 2.0",
  description: "AI-powered medical assistant and EMR system",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={
          inter.className +
          " bg-[#eafbf9] text-gray-900 antialiased transition-colors duration-300"
        }
      >
        {/* Wrap entire app in client sidebar layout */}
        <SidebarLayout>
          {children}
        </SidebarLayout>
      </body>
    </html>
  );
}
