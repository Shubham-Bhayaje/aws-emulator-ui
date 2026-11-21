/**
 * src/app/systems-manager/session-manager/page.tsx – AWS Systems Manager Session Manager.
 * Exact replica of AWS Console Session Manager interface.
 * Zero emojis, Cloudscape enterprise standard, strict 32px button height standard.
 */

"use client";

import { useState } from "react";
import Link from "next/link";

export default function SessionManagerPage() {
  const [activeTab, setActiveTab] = useState<"sessions" | "history" | "preferences">("sessions");
  const [showStartModal, setShowStartModal] = useState(false);

  return (
    <div className="space-y-6 max-w-5xl pb-16">
      {/* Title & Top Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-[12px] text-[#545b64] mb-1">
            <Link href="/systems-manager" className="text-[#0972d3] hover:underline">
              Systems Manager
            </Link>{" "}
            &gt; Session Manager
          </div>
          <h1 className="text-[22px] font-bold text-[#16191f]">Session Manager</h1>
          <p className="text-[14px] text-[#545b64] mt-1">
            Secure, auditable node management without the need to open inbound ports, maintain bastion hosts, or manage SSH keys.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/systems-manager/parameter-store"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] px-3.5 rounded transition-colors"
          >
            Go to Parameter Store
          </Link>
          <button
            type="button"
            onClick={() => setShowStartModal(true)}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center justify-center font-bold text-[13px] bg-[#ec7211] hover:bg-[#eb5f07] text-white px-4 rounded shadow-sm transition-colors"
          >
            Start session
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
          <div className="text-[12px] font-semibold text-[#545b64] uppercase tracking-wider">
            Active Sessions
          </div>
          <div className="text-[24px] font-bold text-[#16191f] mt-1">0</div>
        </div>

        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
          <div className="text-[12px] font-semibold text-[#545b64] uppercase tracking-wider">
            Managed Nodes
          </div>
          <div className="text-[24px] font-bold text-[#16191f] mt-1">0</div>
        </div>

        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
          <div className="text-[12px] font-semibold text-[#545b64] uppercase tracking-wider">
            KMS Encryption
          </div>
          <div className="text-[14px] font-bold text-[#1d8102] mt-2">Enabled (alias/aws/ssm)</div>
        </div>

        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
          <div className="text-[12px] font-semibold text-[#545b64] uppercase tracking-wider">
            Audit Logging
          </div>
          <div className="text-[14px] font-bold text-[#16191f] mt-2">CloudWatch Logs</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#eaeded]">
        <nav className="flex space-x-8">
          <button
            type="button"
            onClick={() => setActiveTab("sessions")}
            className={`pb-3 text-[14px] font-bold border-b-2 transition-colors ${
              activeTab === "sessions"
                ? "border-[#ec7211] text-[#ec7211]"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            Sessions
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`pb-3 text-[14px] font-bold border-b-2 transition-colors ${
              activeTab === "history"
                ? "border-[#ec7211] text-[#ec7211]"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            Session history
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("preferences")}
            className={`pb-3 text-[14px] font-bold border-b-2 transition-colors ${
              activeTab === "preferences"
                ? "border-[#ec7211] text-[#ec7211]"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            Preferences
          </button>
        </nav>
      </div>

      {/* Tab: Sessions */}
      {activeTab === "sessions" && (
        <div className="bg-white border border-[#eaeded] rounded shadow-sm">
          <div className="p-4 border-b border-[#eaeded] flex items-center justify-between">
            <h2 className="text-[16px] font-bold text-[#16191f]">Active sessions</h2>
            <button
              type="button"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] px-3 rounded transition-colors"
            >
              Refresh
            </button>
          </div>

          <div className="p-12 text-center">
            <h3 className="text-[16px] font-bold text-[#16191f] mb-1">No active sessions</h3>
            <p className="text-[13px] text-[#545b64] max-w-md mx-auto mb-4">
              There are currently no active interactive terminal sessions connected to compute nodes in this Region.
            </p>
            <button
              type="button"
              onClick={() => setShowStartModal(true)}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center justify-center font-bold text-[13px] bg-[#ec7211] hover:bg-[#eb5f07] text-white px-4 rounded shadow-sm transition-colors"
            >
              Start session
            </button>
          </div>
        </div>
      )}

      {/* Tab: History */}
      {activeTab === "history" && (
        <div className="bg-white border border-[#eaeded] rounded shadow-sm">
          <div className="p-4 border-b border-[#eaeded]">
            <h2 className="text-[16px] font-bold text-[#16191f]">Session history</h2>
            <p className="text-[12px] text-[#545b64] mt-0.5">
              Auditable record of all closed and terminated session connections.
            </p>
          </div>
          <div className="p-12 text-center text-[13px] text-[#545b64]">
            No previous sessions recorded in this AWS Region.
          </div>
        </div>
      )}

      {/* Tab: Preferences */}
      {activeTab === "preferences" && (
        <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-6">
          <h2 className="text-[16px] font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
            Session Manager preferences
          </h2>

          <div className="space-y-4 max-w-xl text-[13px]">
            <div>
              <span className="font-bold text-[#16191f] block">KMS Encryption</span>
              <p className="text-[#545b64] text-[12px] mt-0.5">
                Encrypt session data traffic using an AWS Key Management Service (KMS) key.
              </p>
              <div className="mt-2 font-mono text-[12px] bg-[#fafafa] border border-[#eaeded] rounded p-2 text-[#16191f]">
                alias/aws/ssm (Default AWS managed key)
              </div>
            </div>

            <div>
              <span className="font-bold text-[#16191f] block">CloudWatch Logging</span>
              <p className="text-[#545b64] text-[12px] mt-0.5">
                Stream session terminal inputs and command execution logs to CloudWatch Logs log group.
              </p>
              <div className="mt-2 font-mono text-[12px] bg-[#fafafa] border border-[#eaeded] rounded p-2 text-[#16191f]">
                /aws/ssm/session-logs (Enabled)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Start Session Modal */}
      {showStartModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">Start a new session</h3>
            <p className="text-[13px] text-[#545b64]">
              To connect via Session Manager, target EC2 instances must be running the SSM Agent and have the{" "}
              <code className="bg-[#f2f3f3] px-1 rounded font-mono">AmazonSSMManagedInstanceCore</code> IAM role policy attached.
            </p>

            <div className="bg-[#fafafa] border border-[#eaeded] rounded p-3 text-[12px] text-[#545b64] text-center">
              No managed instances currently registered in this Region.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowStartModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] px-4 rounded transition-colors"
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
