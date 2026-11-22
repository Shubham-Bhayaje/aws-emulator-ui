"use client";

import Link from "next/link";
import { useState } from "react";

export default function ApiKeysPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center text-[12px] text-[#545b64]">
        <Link href="/location" className="hover:underline">
          Amazon Location Service
        </Link>
        <span className="mx-1 text-[#879596]">/</span>
        <span className="text-[#16191f] font-medium">API keys</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#eaeded]">
        <div>
          <h1 className="text-[20px] font-bold text-[#16191f]">API keys (0)</h1>
          <p className="text-[13px] text-[#545b64] mt-0.5">
            Create API keys to authenticate front-end web and mobile applications with Maps and Places without requiring AWS IAM credentials.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-1.5 text-[13px] font-bold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded inline-flex items-center justify-center transition-colors shadow-sm"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Create API key
          </button>
        </div>
      </div>

      {/* Emulator Information Banner */}
      <div className="bg-[#f2f8fd] border border-[#a4cbe8] rounded p-4 text-[13px] text-[#545b64] space-y-1">
        <div className="font-bold text-[#16191f]">Emulator Compatibility Notice</div>
        <p>
          The local AWS Emulator has not yet implemented API Key management (operation <code>CreateKey</code> and <code>ListKeys</code> are scaffolded). This interface provides the exact AWS Console layout and will connect seamlessly once the emulator enables API key management.
        </p>
      </div>

      {/* Empty State Table */}
      <div className="border border-[#eaeded] rounded bg-white overflow-hidden shadow-sm">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] font-medium">
            <tr>
              <th className="py-2.5 px-4 font-semibold text-[#16191f]">Key name</th>
              <th className="py-2.5 px-4 font-semibold text-[#16191f]">Description</th>
              <th className="py-2.5 px-4 font-semibold text-[#16191f]">Expiry</th>
              <th className="py-2.5 px-4 font-semibold text-[#16191f]">Allowed referers</th>
              <th className="py-2.5 px-4 font-semibold text-[#16191f]">Created at</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={5} className="py-12 text-center text-[#545b64]">
                <div className="max-w-md mx-auto space-y-2">
                  <div className="font-bold text-[#16191f]">No API keys found</div>
                  <p className="text-[12px]">
                    Create an API key to allow client-side web maps and mobile apps to securely access your location resources.
                  </p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Create Modal Showing Emulator Scaffolded Message */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#d5dbdb] shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-[16px] font-bold text-[#16191f]">Create API key</h3>
            <div className="p-3 bg-[#fff8e6] border border-[#fed688] rounded text-[12px] text-[#b35900]">
              Operation <strong>CreateKey</strong> is scaffolded in this emulator version. Key generation and HTTP referer restrictions will be enabled in a future emulator update.
            </div>
            <p className="text-[13px] text-[#545b64]">
              In production AWS, Location API keys grant access to specific map or place resources and can be restricted by domain origin (e.g. <code>https://example.com/*</code>).
            </p>
            <div className="flex justify-end pt-2 border-t border-[#eaeded]">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-1.5 text-[13px] font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa]"
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
