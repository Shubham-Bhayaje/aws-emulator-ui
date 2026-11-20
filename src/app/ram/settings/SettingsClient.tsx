"use client";

import { useState } from "react";

export default function SettingsClient() {
  const [showUnsupportedModal, setShowUnsupportedModal] = useState(false);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#16191f]">Settings</h1>
        <p className="text-sm text-[#545b64] mt-1">
          Configure AWS Resource Access Manager settings for your AWS account.
        </p>
      </div>

      {/* Sharing with AWS Organizations Card */}
      <div className="bg-white border border-[#eaeded] rounded shadow-sm p-6 space-y-6">
        <div className="border-b border-[#eaeded] pb-4">
          <h2 className="text-base font-bold text-[#16191f]">
            Sharing with AWS Organizations
          </h2>
          <p className="text-xs text-[#545b64] mt-1">
            Allow resource sharing with all accounts in your organization or with specific organizational units (OUs).
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#545b64]">Current status:</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#f2f3f3] text-[#545b64] border border-[#d5dbdb]">
              Disabled
            </span>
          </div>

          <div className="bg-[#fafafa] border border-[#eaeded] rounded p-4 text-xs text-[#545b64] space-y-2">
            <h4 className="font-bold text-[#16191f]">Prerequisites for organization sharing:</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>Your account must be the management account of an AWS Organization.</li>
              <li>AWS Organizations all features must be enabled in your organization.</li>
              <li>Principals within your organization will not receive invitation emails; resources become directly accessible.</li>
            </ul>
          </div>

          <div className="pt-2">
            <button
              onClick={() => setShowUnsupportedModal(true)}
              className="bg-[#ec7211] hover:bg-[#eb5f07] text-white font-bold text-[13px] px-4 rounded-[2px] transition-colors shadow-sm"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            >
              Enable sharing with AWS Organizations
            </button>
          </div>
        </div>
      </div>

      {/* Unsupported Notification Modal */}
      {showUnsupportedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#f1faff] border border-[#9fd8f6] flex items-center justify-center text-[#0073bb] font-bold text-sm shrink-0">
                i
              </div>
              <div>
                <h3 className="text-base font-bold text-[#16191f]">
                  Feature not supported by emulator
                </h3>
                <p className="text-xs text-[#545b64] mt-1">
                  <strong>Enable sharing with AWS Organizations</strong> is not supported by the local AWS emulator (API endpoint returns <code className="font-mono bg-[#f2f3f3] px-1 py-0.5 rounded">NotImplemented</code>).
                </p>
                <p className="text-xs text-[#545b64] mt-2">
                  In production AWS, this enables AWS RAM to integrate with AWS Organizations so you can share VPC subnets, KMS keys, and other resources across all member accounts without sending manual invitations.
                </p>
              </div>
            </div>
            <div className="flex justify-end pt-2 border-t border-[#eaeded]">
              <button
                onClick={() => setShowUnsupportedModal(false)}
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
