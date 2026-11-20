"use client";

import { useState } from "react";

interface SettingsClientProps {
  initialOptInStatus: string;
}

export default function SettingsClient({ initialOptInStatus }: SettingsClientProps) {
  const [optInStatus] = useState(initialOptInStatus);
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#16191f]">Settings</h1>
        <p className="text-sm text-[#545b64] mt-1">
          Configure automated quota management and preferences for AWS Service Quotas.
        </p>
      </div>

      {/* Automatic Quota Management Card */}
      <div className="bg-white border border-[#eaeded] rounded shadow-sm p-6 space-y-6">
        <div className="border-b border-[#eaeded] pb-4">
          <h2 className="text-base font-bold text-[#16191f]">
            Automatic quota management
          </h2>
          <p className="text-xs text-[#545b64] mt-1">
            Let AWS automatically request quota increases on your behalf as your workloads grow and approach quota limits.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#545b64]">Current status:</span>
            {optInStatus === "ENABLED" ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#ecf7ed] text-[#1d8102] border border-[#a4e7a5]">
                Enabled
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#f2f3f3] text-[#545b64] border border-[#d5dbdb]">
                Disabled
              </span>
            )}
          </div>

          <div className="bg-[#fafafa] border border-[#eaeded] rounded p-4 text-xs text-[#545b64] space-y-2">
            <h4 className="font-bold text-[#16191f]">How automatic quota management works:</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>AWS monitors your usage against supported quotas using CloudWatch usage metrics.</li>
              <li>When usage reaches 80% of your applied limit, a proactive quota increase request is initiated automatically.</li>
              <li>Approved increases take effect without requiring manual intervention or ticket submission.</li>
            </ul>
          </div>

          <div className="pt-2">
            <button
              onClick={() => setShowModal(true)}
              className="bg-[#ec7211] hover:bg-[#eb5f07] text-white font-bold text-[13px] px-4 rounded-[2px] transition-colors shadow-sm"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            >
              {optInStatus === "ENABLED"
                ? "Opt out of automatic management"
                : "Opt in to automatic management"}
            </button>
          </div>
        </div>
      </div>

      {/* Info / Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#f1faff] border border-[#9fd8f6] flex items-center justify-center text-[#0073bb] font-bold text-sm shrink-0">
                i
              </div>
              <div>
                <h3 className="text-base font-bold text-[#16191f]">
                  Automatic quota management
                </h3>
                <p className="text-xs text-[#545b64] mt-1">
                  In production AWS, opting in enables automated CloudWatch alarms and AWS Support case triggers to expand resource headroom before throttling occurs.
                </p>
                <p className="text-xs text-[#545b64] mt-2">
                  In this local emulator environment, auto-management is currently in demonstration mode with status set to <code className="font-mono bg-[#f2f3f3] px-1 py-0.5 rounded">{optInStatus}</code>.
                </p>
              </div>
            </div>
            <div className="flex justify-end pt-2 border-t border-[#eaeded]">
              <button
                onClick={() => setShowModal(false)}
                className="bg-white border border-[#879596] hover:bg-[#f2f3f3] text-[#16191f] font-bold text-[13px] px-4 rounded-[2px] transition-colors"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
