/**
 * src/app/s3/settings/AccountSettingsClient.tsx – S3 Block Public Access Account Settings.
 * Zero emojis, Cloudscape enterprise standard, strict 32px button height standard.
 */

"use client";

import { useState } from "react";

export function AccountSettingsClient() {
  const [showEditModal, setShowEditModal] = useState(false);
  const [blockAll, setBlockAll] = useState(true);
  const [blockNewAcls, setBlockNewAcls] = useState(true);
  const [ignoreAcls, setIgnoreAcls] = useState(true);
  const [blockNewPolicies, setBlockNewPolicies] = useState(true);
  const [restrictBuckets, setRestrictBuckets] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSave = () => {
    setShowEditModal(false);
    setFeedback("Account-level Block Public Access settings successfully updated.");
    setTimeout(() => setFeedback(null), 4000);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#16191f] tracking-tight">
            Block Public Access (account settings)
          </h1>
          <p className="text-[13px] text-[#545b64] mt-1 max-w-4xl">
            Block Public Access settings apply to all Amazon S3 buckets and access points in this
            account, present and future. These settings override any bucket-specific policies or
            ACLs.
          </p>
        </div>
        <div>
          <button
            onClick={() => setShowEditModal(true)}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd] transition-colors shadow-sm"
          >
            Edit
          </button>
        </div>
      </div>

      {feedback && (
        <div className="bg-[#edfbf0] border-l-4 border-[#1d8102] p-3 text-[13px] text-[#1d8102]">
          {feedback}
        </div>
      )}

      {/* Main Settings Card */}
      <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-[#eaeded] pb-4">
          <div>
            <div className="text-[15px] font-bold text-[#16191f]">
              Block all public access
            </div>
            <p className="text-[12px] text-[#545b64] mt-0.5">
              Turning on this setting enables all four Block Public Access settings below.
            </p>
          </div>
          <div>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded text-[12px] font-bold ${
                blockAll
                  ? "bg-[#edfbf0] text-[#1d8102] border border-[#a4e2b0]"
                  : "bg-[#fbeeed] text-[#d13212] border border-[#f5b8ad]"
              }`}
            >
              {blockAll ? "On" : "Off"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[13px]">
          <div className="p-4 bg-[#fafafa] border border-[#eaeded] rounded space-y-1">
            <div className="font-semibold text-[#16191f]">
              Block public access to buckets and objects granted through new ACLs
            </div>
            <div className="text-[12px] text-[#545b64]">
              Status: <span className="font-bold text-[#16191f]">{blockAll || blockNewAcls ? "On" : "Off"}</span>
            </div>
          </div>

          <div className="p-4 bg-[#fafafa] border border-[#eaeded] rounded space-y-1">
            <div className="font-semibold text-[#16191f]">
              Block public access to buckets and objects granted through any ACLs
            </div>
            <div className="text-[12px] text-[#545b64]">
              Status: <span className="font-bold text-[#16191f]">{blockAll || ignoreAcls ? "On" : "Off"}</span>
            </div>
          </div>

          <div className="p-4 bg-[#fafafa] border border-[#eaeded] rounded space-y-1">
            <div className="font-semibold text-[#16191f]">
              Block public access to buckets and objects granted through new public policies
            </div>
            <div className="text-[12px] text-[#545b64]">
              Status: <span className="font-bold text-[#16191f]">{blockAll || blockNewPolicies ? "On" : "Off"}</span>
            </div>
          </div>

          <div className="p-4 bg-[#fafafa] border border-[#eaeded] rounded space-y-1">
            <div className="font-semibold text-[#16191f]">
              Block public and cross-account access to buckets and objects with public policies
            </div>
            <div className="text-[12px] text-[#545b64]">
              Status: <span className="font-bold text-[#16191f]">{blockAll || restrictBuckets ? "On" : "Off"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-2xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">
              Edit Block Public Access (account settings)
            </h3>

            <div className="space-y-3">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={blockAll}
                  onChange={(e) => {
                    setBlockAll(e.target.checked);
                    if (e.target.checked) {
                      setBlockNewAcls(true);
                      setIgnoreAcls(true);
                      setBlockNewPolicies(true);
                      setRestrictBuckets(true);
                    }
                  }}
                  className="mt-0.5 text-[#0972d3] rounded"
                />
                <div>
                  <div className="font-bold text-[13px] text-[#16191f]">Block all public access</div>
                  <div className="text-[12px] text-[#545b64]">
                    Turning on this setting enables all four settings below.
                  </div>
                </div>
              </label>

              <div className="border-t border-[#eaeded] pt-3 space-y-2 ml-5">
                <label className="flex items-center gap-2 cursor-pointer text-[12px]">
                  <input
                    type="checkbox"
                    checked={blockNewAcls}
                    onChange={(e) => setBlockNewAcls(e.target.checked)}
                    disabled={blockAll}
                    className="text-[#0972d3] rounded"
                  />
                  <span>Block public access granted through new ACLs</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-[12px]">
                  <input
                    type="checkbox"
                    checked={ignoreAcls}
                    onChange={(e) => setIgnoreAcls(e.target.checked)}
                    disabled={blockAll}
                    className="text-[#0972d3] rounded"
                  />
                  <span>Block public access granted through any ACLs</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-[12px]">
                  <input
                    type="checkbox"
                    checked={blockNewPolicies}
                    onChange={(e) => setBlockNewPolicies(e.target.checked)}
                    disabled={blockAll}
                    className="text-[#0972d3] rounded"
                  />
                  <span>Block public access granted through new public policies</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-[12px]">
                  <input
                    type="checkbox"
                    checked={restrictBuckets}
                    onChange={(e) => setRestrictBuckets(e.target.checked)}
                    disabled={blockAll}
                    className="text-[#0972d3] rounded"
                  />
                  <span>Block public access with public policies</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
