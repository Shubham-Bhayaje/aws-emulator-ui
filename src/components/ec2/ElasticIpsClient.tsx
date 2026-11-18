/**
 * ElasticIpsClient.tsx – Interactive Elastic IPs allocation, association, and release.
 * Zero emojis, Cloudscape enterprise styling.
 */

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  DEFAULT_ELASTIC_IPS,
  DEFAULT_INSTANCES,
  ElasticIp,
  EC2Instance,
} from "@/lib/ec2-data";
import { allocateLiveElasticIp, releaseLiveElasticIp, fetchLiveElasticIps } from "@/app/ec2/actions";

interface ElasticIpsClientProps {
  initialElasticIps?: ElasticIp[];
  isLive?: boolean;
  liveError?: string;
}

export default function ElasticIpsClient({
  initialElasticIps = DEFAULT_ELASTIC_IPS,
  isLive = true,
  liveError,
}: ElasticIpsClientProps) {
  const [elasticIps, setElasticIps] = useState<ElasticIp[]>(initialElasticIps);
  const [instances, setInstances] = useState<EC2Instance[]>(DEFAULT_INSTANCES);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAssociateModal, setShowAssociateModal] = useState(false);
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [associateInstanceId, setAssociateInstanceId] = useState("");
  const [isPending, startTransition] = useTransition();

  const selectedEip = elasticIps.find((e) => e.allocationId === selectedId) || null;

  function saveElasticIps(next: ElasticIp[]) {
    setElasticIps(next);
    try {
      localStorage.setItem("aws_ec2_elastic_ips", JSON.stringify(next));
    } catch { /* ignore */ }
  }

  function handleAllocateIp() {
    startTransition(async () => {
      const res = await allocateLiveElasticIp();
      if (res.success && res.elasticIp) {
        saveElasticIps([res.elasticIp, ...elasticIps]);
      } else {
        const fresh = await fetchLiveElasticIps();
        if (fresh.isLive) saveElasticIps(fresh.elasticIps);
      }
    });
  }

  function handleReleaseIp() {
    if (!selectedEip) return;
    const targetId = selectedEip.allocationId;
    saveElasticIps(elasticIps.filter((e) => e.allocationId !== targetId));
    setSelectedId(null);
    setShowReleaseModal(false);

    startTransition(async () => {
      await releaseLiveElasticIp(targetId);
      const fresh = await fetchLiveElasticIps();
      if (fresh.isLive) saveElasticIps(fresh.elasticIps);
    });
  }

  function handleAssociateIp(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedEip || !associateInstanceId) return;

    const targetInst = instances.find((i) => i.id === associateInstanceId);
    if (!targetInst) return;

    const updated = elasticIps.map((eip) =>
      eip.allocationId === selectedEip.allocationId
        ? {
            ...eip,
            associatedInstanceId: targetInst.id,
            associatedInstanceName: targetInst.name,
            networkInterfaceId: "eni-" + targetInst.id.substring(2),
          }
        : eip
    );
    saveElasticIps(updated);

    // Update instance's public IP
    const updatedInsts = instances.map((inst) =>
      inst.id === targetInst.id
        ? {
            ...inst,
            publicIp: selectedEip.publicIp,
            publicDns: `ec2-${selectedEip.publicIp.replace(/\./g, "-")}.compute-1.amazonaws.com`,
          }
        : inst
    );
    setInstances(updatedInsts);
    try {
      localStorage.setItem("aws_ec2_instances", JSON.stringify(updatedInsts));
    } catch { /* ignore */ }

    setShowAssociateModal(false);
  }

  function handleDisassociateIp() {
    if (!selectedEip) return;
    const updated = elasticIps.map((eip) =>
      eip.allocationId === selectedEip.allocationId
        ? {
            allocationId: eip.allocationId,
            publicIp: eip.publicIp,
            domain: eip.domain,
          }
        : eip
    );
    saveElasticIps(updated);
  }

  return (
    <div className="space-y-4 max-w-[1400px]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#16191f]">Elastic IP addresses ({elasticIps.length})</h1>
          <p className="text-[13px] text-[#545b64]">
            Static IPv4 addresses designed for dynamic cloud computing that can be associated with any EC2 instance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedEip && selectedEip.associatedInstanceId ? (
            <button
              onClick={handleDisassociateIp}
              className="px-3 py-1.5 text-[13px] border border-[#545b64] rounded-sm text-[#16191f] hover:bg-[#f2f3f3]"
            >
              Disassociate Elastic IP
            </button>
          ) : (
            <button
              onClick={() => {
                setAssociateInstanceId(instances[0]?.id || "");
                setShowAssociateModal(true);
              }}
              disabled={!selectedEip}
              className={`px-3 py-1.5 text-[13px] rounded-sm font-medium border transition-colors ${
                selectedEip
                  ? "border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3]"
                  : "border-[#d5dbdb] text-[#aab7b8] cursor-not-allowed bg-white"
              }`}
            >
              Associate Elastic IP
            </button>
          )}

          <button
            onClick={() => setShowReleaseModal(true)}
            disabled={!selectedEip}
            className={`px-3 py-1.5 text-[13px] rounded-sm font-medium border transition-colors ${
              selectedEip
                ? "border-[#d5dbdb] text-[#d13212] hover:bg-[#fdf3f1]"
                : "border-[#d5dbdb] text-[#aab7b8] cursor-not-allowed bg-white"
            }`}
          >
            Release Elastic IP
          </button>

          <button
            onClick={handleAllocateIp}
            className="px-4 py-1.5 text-[13px] bg-[#ec7211] text-white rounded-sm hover:bg-[#eb5f07] font-medium transition-colors"
          >
            Allocate Elastic IP address
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#d5dbdb] rounded-sm awsui-shadow overflow-x-auto">
        <table className="w-full text-[13px] text-left border-collapse">
          <thead className="bg-[#f2f3f3] text-[#545b64] font-semibold border-b border-[#eaeded]">
            <tr>
              <th className="py-2.5 px-3 w-8">
                <input
                  type="checkbox"
                  checked={selectedId !== null && elasticIps.length > 0}
                  onChange={(e) => {
                    if (e.target.checked && elasticIps.length > 0) {
                      setSelectedId(elasticIps[0].allocationId);
                    } else {
                      setSelectedId(null);
                    }
                  }}
                  className="rounded-xs"
                />
              </th>
              <th className="py-2.5 px-3">Allocated IPv4 address</th>
              <th className="py-2.5 px-3">Allocation ID</th>
              <th className="py-2.5 px-3">Associated instance</th>
              <th className="py-2.5 px-3">Network interface ID</th>
              <th className="py-2.5 px-3">Scope</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eaeded]">
            {elasticIps.map((eip) => {
              const isSelected = selectedId === eip.allocationId;
              return (
                <tr
                  key={eip.allocationId}
                  onClick={() => setSelectedId(isSelected ? null : eip.allocationId)}
                  className={`cursor-pointer transition-colors ${
                    isSelected ? "bg-[#f2f8fd]" : "hover:bg-[#fafafa]"
                  }`}
                >
                  <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => setSelectedId(isSelected ? null : eip.allocationId)}
                      className="rounded-xs"
                    />
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-[#0073bb]">{eip.publicIp}</td>
                  <td className="py-2.5 px-3 font-mono text-[12px] text-[#545b64]">{eip.allocationId}</td>
                  <td className="py-2.5 px-3 text-[12px]">
                    {eip.associatedInstanceId ? (
                      <Link
                        href={`/ec2/instances/${eip.associatedInstanceId}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-[#0073bb] hover:underline"
                      >
                        {eip.associatedInstanceName} ({eip.associatedInstanceId})
                      </Link>
                    ) : (
                      <span className="text-[#879596] italic">Unassociated</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[12px] text-[#879596]">
                    {eip.networkInterfaceId || "—"}
                  </td>
                  <td className="py-2.5 px-3 uppercase text-[11px] font-mono text-[#545b64]">
                    {eip.domain}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Associate IP Modal */}
      {showAssociateModal && selectedEip && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleAssociateIp}
            className="bg-white rounded border border-[#d5dbdb] shadow-2xl max-w-[500px] w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#eaeded] pb-3">
              <h3 className="text-[17px] font-bold text-[#16191f]">Associate Elastic IP address</h3>
              <button type="button" onClick={() => setShowAssociateModal(false)} className="text-[#879596] hover:text-[#16191f]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="space-y-4 text-[13px]">
              <div>
                <span className="text-[#545b64] block mb-0.5">Elastic IP</span>
                <span className="font-mono font-bold text-[#16191f]">{selectedEip.publicIp}</span>
              </div>

              <div>
                <label className="block font-medium text-[#16191f] mb-1">Instance</label>
                <select
                  value={associateInstanceId}
                  onChange={(e) => setAssociateInstanceId(e.target.value)}
                  className="w-full px-3 py-1.5 border border-[#aab7b8] rounded text-[#16191f] bg-white outline-hidden"
                >
                  {instances.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name} ({inst.id}) &mdash; {inst.state}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowAssociateModal(false)}
                className="px-4 py-1.5 text-[13px] border border-[#545b64] text-[#16191f] rounded hover:bg-[#f2f3f3]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-[13px] bg-[#ec7211] text-white rounded font-medium hover:bg-[#eb5f07]"
              >
                Associate
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Release Confirmation Modal */}
      {showReleaseModal && selectedEip && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#d5dbdb] shadow-2xl max-w-[460px] w-full p-6 space-y-4">
            <h3 className="text-[16px] font-bold text-[#d13212]">Release Elastic IP address</h3>
            <p className="text-[13px] text-[#545b64]">
              Are you sure you want to release <strong className="font-mono text-[#16191f]">{selectedEip.publicIp}</strong> ({selectedEip.allocationId})?
              Once released, this IP address is returned to the AWS public IPv4 pool.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#eaeded]">
              <button
                onClick={() => setShowReleaseModal(false)}
                className="px-4 py-1.5 text-[13px] border border-[#545b64] text-[#16191f] rounded hover:bg-[#f2f3f3]"
              >
                Cancel
              </button>
              <button
                onClick={handleReleaseIp}
                className="px-4 py-1.5 text-[13px] bg-[#d13212] text-white rounded font-medium hover:bg-[#a82a0f]"
              >
                Release
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
