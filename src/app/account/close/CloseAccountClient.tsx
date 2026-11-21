"use client";

import React, { useState } from "react";
import Link from "next/link";
import { closeAccountAction } from "../actions";

interface CloseAccountClientProps {
  accountId: string;
  accountName: string;
}

export function CloseAccountClient({ accountId, accountName }: CloseAccountClientProps) {
  const [check1, setCheck1] = useState(false);
  const [check2, setCheck2] = useState(false);
  const [check3, setCheck3] = useState(false);
  const [confirmId, setConfirmId] = useState("");
  const [closing, setClosing] = useState(false);
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleClose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmId !== accountId) return;
    setClosing(true);
    setBanner(null);
    try {
      const res = await closeAccountAction(confirmId);
      if (res.success) {
        setBanner({
          type: "success",
          message: "Account closure initiated. A 90-day post-closure period has started.",
        });
      } else {
        setBanner({ type: "error", message: res.error || "Failed to close account." });
      }
    } catch (err: any) {
      setBanner({ type: "error", message: err.message || "An error occurred." });
    } finally {
      setClosing(false);
    }
  };

  return (
    <div className="p-6 max-w-[1000px] mx-auto text-[#16191f]">
      {/* Breadcrumb */}
      <div className="text-xs text-[#545b64] mb-3">
        <Link href="/account" className="text-[#0073bb] hover:underline">
          Account settings
        </Link>{" "}
        / Close account
      </div>

      {/* Banner */}
      {banner && (
        <div
          className={`mb-5 p-4 rounded text-sm flex items-start justify-between border ${
            banner.type === "success"
              ? "bg-[#f2fcf3] border-[#037f0c] text-[#037f0c]"
              : "bg-[#fdf3f2] border-[#d13212] text-[#d13212]"
          }`}
        >
          <div>{banner.message}</div>
          <button
            onClick={() => setBanner(null)}
            className="text-xs font-bold hover:opacity-80 ml-4"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="pb-4 border-b border-[#eaeded] mb-6">
        <h1 className="text-xl font-bold text-[#d13212]">Close account</h1>
        <p className="text-xs text-[#545b64] mt-1">
          Review prerequisites and requirements before permanently closing your AWS account.
        </p>
      </div>

      {/* Warning Card */}
      <div className="bg-[#fdf3f2] border border-[#d13212] rounded p-5 mb-6 text-xs text-[#16191f]">
        <h2 className="text-sm font-bold text-[#d13212] mb-2">Important account closure information</h2>
        <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#545b64]">
          <li>
            Closing account <strong>{accountName} ({accountId})</strong> will permanently terminate all running EC2
            instances, ECS tasks, and Lambda functions.
          </li>
          <li>
            All Amazon S3 buckets, DynamoDB tables, RDS databases, and KMS keys will become inaccessible and be
            scheduled for deletion.
          </li>
          <li>
            Any outstanding fees or active Reserved Instance commitments incurred prior to closure will still be billed
            to your payment method.
          </li>
          <li>
            You can reopen your account during the 90-day post-closure period by contacting AWS Support. After 90 days,
            all data is permanently deleted.
          </li>
        </ul>
      </div>

      {/* Form */}
      <form onSubmit={handleClose} className="bg-white border border-[#eaeded] rounded shadow-sm p-6 space-y-5">
        <h3 className="text-sm font-bold text-[#16191f] pb-2 border-b border-[#eaeded]">
          Closure acknowledgments
        </h3>

        <div className="space-y-3 text-xs">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={check1}
              onChange={(e) => setCheck1(e.target.checked)}
              className="mt-0.5 accent-[#d13212]"
            />
            <span>
              I understand that closing my account will permanently delete all resources and data across all AWS services.
            </span>
          </label>

          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={check2}
              onChange={(e) => setCheck2(e.target.checked)}
              className="mt-0.5 accent-[#d13212]"
            />
            <span>
              I understand that any outstanding billable charges incurred will still be charged to my payment method.
            </span>
          </label>

          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={check3}
              onChange={(e) => setCheck3(e.target.checked)}
              className="mt-0.5 accent-[#d13212]"
            />
            <span>
              I understand that a 90-day post-closure window applies before irreversible permanent data deletion.
            </span>
          </label>
        </div>

        <div className="pt-4 border-t border-[#eaeded]">
          <label className="block text-xs font-bold text-[#16191f] mb-1">
            Confirm account ID to close <span className="text-[#d13212]">*</span>
          </label>
          <input
            type="text"
            placeholder={`Type "${accountId}" to confirm`}
            value={confirmId}
            onChange={(e) => setConfirmId(e.target.value)}
            className="w-full max-w-sm border border-[#aab7b8] rounded px-3 text-xs focus:outline-none focus:border-[#d13212]"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
            required
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-[#eaeded]">
          <Link
            href="/account"
            className="px-4 text-xs font-semibold text-[#16191f] bg-white border border-[#aab7b8] rounded hover:bg-[#f2f3f3] flex items-center justify-center"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={!check1 || !check2 || !check3 || confirmId !== accountId || closing}
            className={`px-5 text-xs font-semibold rounded text-white ${
              check1 && check2 && check3 && confirmId === accountId
                ? "bg-[#d13212] hover:bg-[#b02a0f]"
                : "bg-[#aab7b8] cursor-not-allowed"
            }`}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            {closing ? "Closing account..." : "Close account"}
          </button>
        </div>
      </form>
    </div>
  );
}
