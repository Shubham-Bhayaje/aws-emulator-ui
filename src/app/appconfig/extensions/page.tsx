"use client";

import Link from "next/link";

export default function ExtensionsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-[#eaeded]">
        <div>
          <h1 className="text-[22px] font-bold text-[#16191f]">Extensions</h1>
          <p className="text-[13px] text-[#545b64]">
            An extension augments your configuration workflows by invoking targets (such as AWS Lambda, Amazon SNS, or Amazon SQS) at specific points during deployment or version creation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            disabled
            title="Available after Lambda is built"
            className="px-4 text-[13px] font-semibold text-white bg-[#879596] rounded opacity-60 cursor-not-allowed flex items-center justify-center shadow-xs"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Create extension
          </button>
        </div>
      </div>

      {/* Dependency Notice Alert */}
      <div className="p-4 bg-[#f2f8fd] border border-[#0073bb] text-[#16191f] rounded text-[13px] flex items-start gap-3">
        <div className="text-[#0073bb] font-bold mt-0.5">Note:</div>
        <div>
          <div className="font-semibold text-[#0073bb]">AWS Lambda extension execution</div>
          <p className="text-[12px] text-[#545b64] mt-0.5">
            Creating custom extensions with Lambda invocation action points is currently disabled.{" "}
            <strong>Available after Lambda is built</strong>. Predefined AppConfig extensions (such as AppConfig Feature Flags Helper) are operating natively in the emulator.
          </p>
        </div>
      </div>

      {/* Predefined Extensions Table */}
      <div className="bg-white border border-[#eaeded] rounded shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#eaeded]">
          <h3 className="text-[14px] font-bold text-[#16191f]">Predefined AWS extensions</h3>
          <p className="text-[12px] text-[#545b64]">Built-in extensions managed by AWS and active in your emulator account.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-[#eaeded] bg-[#fafafa] text-[#545b64] text-[11px] font-semibold uppercase tracking-wider">
                <th className="py-2.5 px-4">Name</th>
                <th className="py-2.5 px-4">Description</th>
                <th className="py-2.5 px-4">Action points</th>
                <th className="py-2.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded]">
              <tr className="hover:bg-[#fafafa]">
                <td className="py-3 px-4 font-bold text-[#16191f]">
                  AppConfig Feature Flags Helper
                </td>
                <td className="py-3 px-4 text-[#545b64]">
                  Validates feature flag schema and attributes during version creation and deployment.
                </td>
                <td className="py-3 px-4 font-mono text-[12px] text-[#545b64]">
                  PRE_CREATE_HOSTED_CONFIGURATION_VERSION, PRE_START_DEPLOYMENT
                </td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#e6f4ea] text-[#137333]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#137333]" />
                    Active
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-[#fafafa]">
                <td className="py-3 px-4 font-bold text-[#16191f]">
                  AppConfig Deployment Events to Amazon EventBridge
                </td>
                <td className="py-3 px-4 text-[#545b64]">
                  Sends state changes for deployments to default EventBridge bus.
                </td>
                <td className="py-3 px-4 font-mono text-[12px] text-[#545b64]">
                  ON_DEPLOYMENT_STEP, ON_DEPLOYMENT_COMPLETE
                </td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#e6f4ea] text-[#137333]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#137333]" />
                    Active
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
