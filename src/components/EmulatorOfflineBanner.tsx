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
  const isAccessDenied = Boolean(
    error && (error.includes("AccessDenied") || error.toLowerCase().includes("not authorized"))
  );

  const message = formatEmulatorErrorMessage(error);

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  if (isAccessDenied) {
    return (
      <div
        role="alert"
        className={`p-4 bg-[#fdf3f1] border-l-4 border-l-[#d13212] border-y border-r border-[#f5b8b0] rounded-sm text-[#16191f] shadow-xs ${className}`}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 w-4 h-4 rounded-full bg-[#d13212] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
            !
          </div>
          <div className="space-y-1.5 flex-1">
            <div className="font-bold text-[#d13212] text-[14px]">
              Access Denied (AccessDeniedException)
            </div>
            <p className="text-[12px] font-mono text-[#545b64] bg-white/70 p-2 rounded border border-[#eaeded] break-all">
              {error}
            </p>
            <div className="text-[12px] text-[#545b64] space-y-1">
              <p>
                The active identity does not have permission to execute this operation. To resolve this:
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-[#545b64]">
                <li>
                  Attach an IAM policy (e.g. <span className="font-mono text-[#16191f]">AmazonEC2FullAccess</span> or <span className="font-mono text-[#16191f]">AdministratorAccess</span>) directly to this user in{" "}
                  <Link href="/iam/users" className="text-[#0073bb] underline hover:text-[#005276]">
                    IAM Users
                  </Link>
                  .
                </li>
                <li>
                  Add this user to an IAM user group that has the required policies in{" "}
                  <Link href="/iam/user-groups" className="text-[#0073bb] underline hover:text-[#005276]">
                    IAM User Groups
                  </Link>
                  .
                </li>
                <li>
                  Or switch back to the Administrator (<span className="font-mono text-[#16191f]">emulator</span>) identity via the user menu in the top navigation bar.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
