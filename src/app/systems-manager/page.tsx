/**
 * src/app/systems-manager/page.tsx – AWS Systems Manager Operations Hub.
 * Centers around the fully built Parameter Store and provides quick links across Systems Manager tools.
 * Zero emojis, Cloudscape enterprise standard, strict 32px button height standard.
 */

import Link from "next/link";
import { describeParametersAction } from "./parameter-store/actions";

export const dynamic = "force-dynamic";

export default async function SystemsManagerHubPage() {
  const paramRes = await describeParametersAction();
  const totalParams = paramRes.success ? paramRes.parameters.length : 0;
  const secureParams = paramRes.success
    ? paramRes.parameters.filter((p) => p.type === "SecureString").length
    : 0;

  return (
    <div className="space-y-6 max-w-5xl pb-16">
      {/* Header */}
      <div>
        <div className="text-[12px] text-[#545b64] mb-1">AWS Management Console &gt; Systems Manager</div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-[24px] font-bold text-[#16191f]">AWS Systems Manager</h1>
            <p className="text-[14px] text-[#545b64] mt-1">
              Unified operational hub for configuration data management, secure secrets storage, and cloud nodes.
            </p>
          </div>
          <Link
            href="/systems-manager/parameter-store"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center justify-center font-bold text-[13px] bg-[#ec7211] hover:bg-[#eb5f07] text-white px-5 rounded shadow-sm transition-colors"
          >
            Open Parameter Store
          </Link>
        </div>
      </div>

      {/* Main Feature: Parameter Store */}
      <div className="bg-white border-2 border-[#0972d3] rounded-lg p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <h2 className="text-[18px] font-bold text-[#16191f]">Parameter Store</h2>
            <span className="bg-[#e7f4e4] text-[#1d8102] border border-[#a2dca0] px-2.5 py-0.5 rounded text-[11px] font-bold">
              Built &amp; Operational
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/systems-manager/parameter-store/create"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] px-3.5 rounded transition-colors"
            >
              Create parameter
            </Link>
            <Link
              href="/systems-manager/parameter-store"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center justify-center font-bold text-[13px] bg-[#ec7211] hover:bg-[#eb5f07] text-white px-4 rounded shadow-sm transition-colors"
            >
              View parameters ({totalParams})
            </Link>
          </div>
        </div>

        <p className="text-[13px] text-[#545b64]">
          Parameter Store provides secure, hierarchical storage for configuration data management and secrets management. Store database connection strings, passwords, license codes, and API endpoints as parameter values.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="bg-[#fafafa] border border-[#eaeded] rounded p-3 text-center">
            <div className="text-[11px] font-semibold text-[#545b64] uppercase">Total Parameters</div>
            <div className="text-[20px] font-bold text-[#16191f] mt-1">{totalParams}</div>
          </div>
          <div className="bg-[#fafafa] border border-[#eaeded] rounded p-3 text-center">
            <div className="text-[11px] font-semibold text-[#545b64] uppercase">SecureString (KMS)</div>
            <div className="text-[20px] font-bold text-[#16191f] mt-1">{secureParams}</div>
          </div>
          <div className="bg-[#fafafa] border border-[#eaeded] rounded p-3 text-center">
            <div className="text-[11px] font-semibold text-[#545b64] uppercase">Encryption</div>
            <div className="text-[13px] font-bold text-[#1d8102] mt-2">AWS KMS Live</div>
          </div>
          <div className="bg-[#fafafa] border border-[#eaeded] rounded p-3 text-center">
            <div className="text-[11px] font-semibold text-[#545b64] uppercase">History</div>
            <div className="text-[13px] font-bold text-[#0972d3] mt-2">Full Versioning</div>
          </div>
        </div>
      </div>

      {/* Systems Manager Suite Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Session Manager */}
        <div className="bg-white border border-[#eaeded] rounded-lg p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[16px] font-bold text-[#16191f]">Session Manager</h3>
            <span className="bg-[#f2f3f3] text-[#545b64] border border-[#d5dbdb] px-2 py-0.5 rounded text-[11px] font-medium">
              Available
            </span>
          </div>
          <p className="text-[13px] text-[#545b64]">
            Manage EC2 instances and on-premises nodes through an interactive one-click browser-based shell or AWS CLI without bastion hosts.
          </p>
          <div>
            <Link
              href="/systems-manager/session-manager"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] px-3.5 rounded transition-colors"
            >
              Open Session Manager
            </Link>
          </div>
        </div>

        {/* Fleet Manager */}
        <div className="bg-white border border-[#eaeded] rounded-lg p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[16px] font-bold text-[#16191f]">Fleet Manager</h3>
            <span className="bg-[#f2f3f3] text-[#545b64] border border-[#d5dbdb] px-2 py-0.5 rounded text-[11px] font-medium">
              Preview
            </span>
          </div>
          <p className="text-[13px] text-[#545b64]">
            Explore compute instances across AWS Regions and hybrid on-premises environments. View system status and performance metrics.
          </p>
          <div className="text-[12px] text-[#545b64]">
            Node management hub
          </div>
        </div>
      </div>
    </div>
  );
}
