/**
 * src/app/organizations/settings/SettingsClient.tsx – Settings client component.
 * Zero emojis, Cloudscape enterprise standard.
 */

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { OrgHierarchyData, toggleTrustedServiceAction } from "../actions";

interface SettingsClientProps {
  data: OrgHierarchyData;
}

export function SettingsClient({ data }: SettingsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState<string | null>(null);

  const org = data.organization;

  const handleToggle = (principal: string, enable: boolean) => {
    setSuccess(null);
    startTransition(async () => {
      await toggleTrustedServiceAction(principal, enable);
      setSuccess(`Trusted access for ${principal} updated to ${enable ? "Enabled" : "Disabled"}.`);
      router.refresh();
    });
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Alert */}
      {success && (
        <div className="bg-[#f2f8f0] border border-[#1d8102] rounded p-3 text-[13px] text-[#1d8102] flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess(null)} className="text-[#545b64] font-bold text-sm ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* Card 1: Organization Details */}
      <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm">
        <h2 className="text-[16px] font-bold text-[#16191f] mb-4">Organization details</h2>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-[13px]">
          <div>
            <dt className="text-[12px] font-semibold text-[#545b64]">Organization ID</dt>
            <dd className="font-mono text-[13px] text-[#16191f] font-semibold mt-1">
              {org?.id || "o-8sh3tqaaaa"}
            </dd>
          </div>
          <div>
            <dt className="text-[12px] font-semibold text-[#545b64]">Organization ARN</dt>
            <dd className="font-mono text-[12px] text-[#16191f] mt-1 break-all">
              {org?.arn || "arn:aws:organizations::000000000000:organization/o-8sh3tqaaaa"}
            </dd>
          </div>
          <div>
            <dt className="text-[12px] font-semibold text-[#545b64]">Management account ID</dt>
            <dd className="font-mono text-[13px] text-[#16191f] font-semibold mt-1">
              {org?.masterAccountId || "000000000000"}
            </dd>
          </div>
          <div>
            <dt className="text-[12px] font-semibold text-[#545b64]">Management account email</dt>
            <dd className="text-[#16191f] mt-1">{org?.masterAccountEmail || "000000000000@example.com"}</dd>
          </div>
          <div>
            <dt className="text-[12px] font-semibold text-[#545b64]">Feature set</dt>
            <dd className="mt-1">
              <span className="inline-block bg-[#f2f8f0] text-[#1d8102] text-[11px] font-semibold px-2 py-0.5 rounded">
                All features enabled
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-[12px] font-semibold text-[#545b64]">Available policy types</dt>
            <dd className="text-[#16191f] mt-1">
              {org?.availablePolicyTypes?.map((pt) => pt.type).join(", ") || "SERVICE_CONTROL_POLICY (Enabled)"}
            </dd>
          </div>
        </dl>
      </div>

      {/* Card 2: Trusted Services */}
      <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-[16px] font-bold text-[#16191f]">AWS services with trusted access</h2>
          <p className="text-[12px] text-[#545b64]">
            Enabling trusted access grants other AWS services permissions to perform tasks across all accounts in
            your organization.
          </p>
        </div>

        <div className="border border-[#eaeded] rounded overflow-hidden">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-[#f8f9fa] border-b border-[#eaeded] font-semibold text-[#545b64] text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Service name</th>
                <th className="py-2.5 px-4">Service principal</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded]">
              {data.trustedServices.map((svc) => (
                <tr key={svc.servicePrincipal} className="hover:bg-[#f2f8fc]">
                  <td className="py-3 px-4 font-semibold text-[#16191f]">{svc.serviceName}</td>
                  <td className="py-3 px-4 font-mono text-[12px] text-[#545b64]">{svc.servicePrincipal}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded ${
                        svc.status === "ENABLED"
                          ? "bg-[#f2f8f0] text-[#1d8102]"
                          : "bg-[#f2f3f3] text-[#545b64]"
                      }`}
                    >
                      {svc.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      disabled={isPending}
                      onClick={() => handleToggle(svc.servicePrincipal, svc.status !== "ENABLED")}
                      className={`text-[12px] font-semibold hover:underline ${
                        svc.status === "ENABLED" ? "text-[#d13212]" : "text-[#0972d3]"
                      }`}
                    >
                      {svc.status === "ENABLED" ? "Disable access" : "Enable access"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Card 3: Delete Organization */}
      <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm">
        <h2 className="text-[16px] font-bold text-[#d13212] mb-2">Delete organization</h2>
        <p className="text-[13px] text-[#545b64] mb-4">
          Permanently delete this organization. You can only delete an organization if it contains no member accounts
          and no child organizational units.
        </p>
        <button
          disabled={data.stats.totalAccounts > 1 || data.stats.totalOUs > 0}
          style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#d13212] text-[#d13212] px-4 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Delete organization
        </button>
        {(data.stats.totalAccounts > 1 || data.stats.totalOUs > 0) && (
          <p className="text-[11px] text-[#545b64] mt-2">
            Button disabled because organization currently has {data.stats.totalAccounts} account(s) and{" "}
            {data.stats.totalOUs} OU(s).
          </p>
        )}
      </div>
    </div>
  );
}
