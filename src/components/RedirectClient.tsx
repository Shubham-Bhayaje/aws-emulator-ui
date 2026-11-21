"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface RedirectClientProps {
  to: string;
}

export default function RedirectClient({ to }: RedirectClientProps) {
  const router = useRouter();

  useEffect(() => {
    // Perform client-side redirect cleanly without throwing RSC aborts
    if (typeof window !== "undefined") {
      router.replace(to);
    }
  }, [router, to]);

  return (
    <div className="max-w-[1200px] mx-auto p-6">
      <div className="bg-white border border-[#eaeded] rounded p-8 text-center space-y-3 max-w-md mx-auto mt-12 shadow-sm">
        <div className="w-6 h-6 border-2 border-[#ec7211] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-[13px] text-[#545b64]">
          Redirecting to{" "}
          <a href={to} className="text-[#0073bb] hover:underline font-semibold">
            {to}
          </a>
          ...
        </p>
      </div>
    </div>
  );
}
