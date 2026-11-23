"use client";

import React from "react";
import Link from "next/link";

interface Props {
  endpoint?: string;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
}

export function formatEmulatorErrorMessage(error?: string | null): string {
  if (!error) return "The AWS Emulator is unreachable.";
  const lower = error.toLowerCase();
  if (lower.includes("econnrefused")) {
    return "Emulator is not running. Please start it with ./start.sh or start.bat.";
  }
  if (lower.includes("etimedout") || lower.includes("timeout") || lower.includes("timed out")) {
    return "Emulator is starting, stuck, or WSL networking is broken. Check WSL networkingMode (ensure 'nat') or restart WSL.";
  }
  return error;
}

export default function EmulatorOfflineBanner({
  endpoint = "https://127.0.0.1:9297",
  error,
  onRetry,
  className = "",
}: Props) {
  const message = formatEmulatorErrorMessage(error);

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  return (
    <div
      role="alert"
      className={`p-4 bg-[#fdf3f1] border border-[#f5b8b0] rounded-sm text-[#16191f] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${className}`}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#d13212] shrink-0" />
          <span className="font-bold text-[#d13212] text-[13px] sm:text-[14px]">
            Emulator not reachable at {endpoint}
          </span>
        </div>
        <p className="text-[12px] text-[#545b64]">
          {message}
        </p>
        <p className="text-[11px] text-[#545b64]">
          Need help? Consult the{" "}
          <Link
            href="/docs/troubleshooting.md"
            className="text-[#0073bb] underline hover:text-[#005276]"
            target="_blank"
            rel="noopener noreferrer"
          >
            troubleshooting guide
          </Link>
          .
        </p>
      </div>

      <button
        type="button"
        onClick={handleRetry}
        style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
        className="px-4 bg-white border border-[#aab7b8] text-[#16191f] text-[12px] font-bold rounded-sm hover:bg-[#f2f3f3] transition-colors self-start sm:self-auto cursor-pointer"
      >
        Retry
      </button>
    </div>
  );
}
