"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function GlacierSettingsClient() {
  const [strategy, setStrategy] = useState<"FreeTier" | "MaxRetrievalRate" | "None">("None");
  const [rateLimit, setRateLimit] = useState<string>("100");
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSavedMessage(
      "Data retrieval policy saved locally. Note: In this emulator environment, retrieval policies are display-only and not enforced."
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-[22px] font-bold text-[#16191f]">Settings</h1>
        <p className="text-[13px] text-[#545b64] mt-0.5">
          Manage account-level settings and data retrieval policies for Amazon S3 Glacier in this Region.
        </p>
      </div>

      {savedMessage && (
        <div className="bg-[#f2f8f0] border border-[#1d8102] rounded p-3 text-[13px] text-[#1d8102] flex items-center justify-between">
          <span>{savedMessage}</span>
          <button
            onClick={() => setSavedMessage(null)}
            className="text-[#1d8102] hover:underline font-semibold ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Data Retrieval Policies Card */}
      <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-6">
        <div className="border-b border-[#eaeded] pb-3">
          <h2 className="text-[16px] font-bold text-[#16191f]">Data retrieval policies</h2>
          <p className="text-[13px] text-[#545b64] mt-0.5">
            Configure account-level retrieval limits to control data retrieval costs or prevent
            unexpected charges.
          </p>
        </div>

        <div className="bg-[#f2f8f8] border-l-4 border-[#0073bb] p-3 text-[12px] text-[#545b64]">
          <span className="font-semibold text-[#0073bb]">Emulator Notice:</span> In the local
          emulator, the <code className="bg-[#e9f3f4] px-1 py-0.5 rounded font-mono">GetDataRetrievalPolicy</code>{" "}
          and <code className="bg-[#e9f3f4] px-1 py-0.5 rounded font-mono">SetDataRetrievalPolicy</code>{" "}
          APIs return <code className="font-mono">NotImplemented</code>. The policy controls below reflect
          the official AWS Management Console experience.
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer p-3 border border-[#eaeded] rounded hover:bg-[#fafafa] transition-colors">
              <input
                type="radio"
                name="strategy"
                value="FreeTier"
                checked={strategy === "FreeTier"}
                onChange={() => setStrategy("FreeTier")}
                className="text-[#ec7211] focus:ring-[#ec7211] mt-0.5"
              />
              <div>
                <div className="text-[13px] font-semibold text-[#16191f]">Free Tier only</div>
                <div className="text-[12px] text-[#545b64] mt-0.5">
                  Allows retrievals only within the daily free tier retrieval allowance. Any retrieval
                  request exceeding the free allowance is rejected.
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer p-3 border border-[#eaeded] rounded hover:bg-[#fafafa] transition-colors">
              <input
                type="radio"
                name="strategy"
                value="MaxRetrievalRate"
                checked={strategy === "MaxRetrievalRate"}
                onChange={() => setStrategy("MaxRetrievalRate")}
                className="text-[#ec7211] focus:ring-[#ec7211] mt-0.5"
              />
              <div className="w-full">
                <div className="text-[13px] font-semibold text-[#16191f]">Max retrieval rate</div>
                <div className="text-[12px] text-[#545b64] mt-0.5">
                  Limits the peak retrieval rate across all jobs in your account in this Region.
                </div>
                {strategy === "MaxRetrievalRate" && (
                  <div className="mt-3 max-w-xs flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      value={rateLimit}
                      onChange={(e) => setRateLimit(e.target.value)}
                      className="border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211] focus:ring-1 focus:ring-[#ec7211] w-28"
                    />
                    <span className="text-[13px] text-[#545b64] font-medium">MB / hour</span>
                  </div>
                )}
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer p-3 border border-[#eaeded] rounded hover:bg-[#fafafa] transition-colors">
              <input
                type="radio"
                name="strategy"
                value="None"
                checked={strategy === "None"}
                onChange={() => setStrategy("None")}
                className="text-[#ec7211] focus:ring-[#ec7211] mt-0.5"
              />
              <div>
                <div className="text-[13px] font-semibold text-[#16191f]">No retrieval limit (Default)</div>
                <div className="text-[12px] text-[#545b64] mt-0.5">
                  Allows all retrieval requests without any account-level rate or volume limits.
                </div>
              </div>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#eaeded]">
            <Link
              href="/glacier"
              style={{
                height: "32px",
                minHeight: "32px",
                maxHeight: "32px",
                whiteSpace: "nowrap",
              }}
              className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#545b64] text-[#16191f] bg-white hover:bg-[#fafafa] transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              style={{
                height: "32px",
                minHeight: "32px",
                maxHeight: "32px",
                whiteSpace: "nowrap",
              }}
              className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] transition-colors"
            >
              Save changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
