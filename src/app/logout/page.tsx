"use client";

import { useEffect } from "react";
import { auth } from "@/lib/firebaseConfig";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    signOut(auth).then(() => {
      router.push("/login");
    });
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-600">
      Logging you out…
    </div>
  );
}
