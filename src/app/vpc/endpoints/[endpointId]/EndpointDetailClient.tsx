"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  VpcEndpointItem,
  VpcItem,
  RouteTableItem,
  SubnetItem,
  deleteVpcEndpointsAction,
} from "../../actions";

interface Props {
  endpoint: VpcEndpointItem;
  vpc?: VpcItem;
  routeTables: RouteTableItem[];
  subnets: SubnetItem[];
  allRouteTables: RouteTableItem[];
  allSubnets: SubnetItem[];
}

export default function EndpointDetailClient({
  endpoint: initialEndpoint,
  vpc,
  routeTables,
  subnets,
}: Props) {
  const router = useRouter();

  const [ep] = useState<VpcEndpointItem>(initialEndpoint);
  const [activeTab, setActiveTab] = useState<"details" | "routetables" | "subnets" | "tags">("details");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Actions dropdown
  const [isActionsOpen, setIsActionsOpen] = useState(false);

  // Delete modal
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleDelete = async () => {
    setDeleteLoading(true);
    setMessage(null);
    try {
      const res = await deleteVpcEndpointsAction([ep.VpcEndpointId]);
      if (res.success) {
        setIsDeleteOpen(false);
        router.push("/vpc/endpoints");
      } else {
        setMessage({ type: "error", text: res.error || "Failed to delete VPC endpoint" });
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb Bar */}
      <div className="flex items-center gap-2 text-[12px] text-[#545b64]">
        <Link href="/vpc/vpcs" className="hover:text-[#0073bb]">
          Virtual Private Cloud
        </Link>
        <span>&gt;</span>
        <Link href="/vpc/endpoints" className="hover:text-[#0073bb]">
          Endpoints
        </Link>
        <span>&gt;</span>
        <span className="text-[#16191f] font-mono font-medium">{ep.VpcEndpointId}</span>
      </div>

      {/* Header and Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#eaeded]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[22px] font-bold text-[#16191f]">{ep.ServiceName}</h1>
            <span
              className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${
                ep.State === "available"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-blue-50 text-blue-700 border-blue-200"
              }`}
            >
              {ep.State}
            </span>
          </div>
          <p className="text-[13px] text-[#545b64] mt-1 font-mono">{ep.VpcEndpointId}</p>
        </div>

        <div className="flex items-center gap-2 relative">
          <Link
            href="/vpc/endpoints"
            className="px-3 text-[13px] font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa] transition-colors flex items-center justify-center"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            View all Endpoints
          </Link>

          <div className="relative">
            <button
              onClick={() => setIsActionsOpen(!isActionsOpen)}
              className="px-3 text-[13px] font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa] transition-colors flex items-center gap-1.5"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            >
              <span>Actions</span>
              <span className="text-[10px]">▼</span>
            </button>

            {isActionsOpen && (
              <div
                className="absolute right-0 mt-1 w-56 bg-white border border-[#d5dbdb] rounded shadow-lg z-20 py-1"
                onClick={() => setIsActionsOpen(false)}
              >
                <button
                  onClick={() => setIsDeleteOpen(true)}
                  className="w-full text-left px-4 py-2 text-[13px] text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  Delete VPC endpoint
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`p-3 rounded text-[13px] border ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-[#eaeded]">
        <div className="flex gap-6 -mb-px">
          <button
            onClick={() => setActiveTab("details")}
            className={`pb-2.5 text-[14px] font-medium transition-colors border-b-2 ${
              activeTab === "details"
                ? "border-[#ec7211] text-[#ec7211]"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            Details
          </button>
          {ep.VpcEndpointType === "Gateway" && (
            <button
              onClick={() => setActiveTab("routetables")}
              className={`pb-2.5 text-[14px] font-medium transition-colors border-b-2 ${
                activeTab === "routetables"
                  ? "border-[#ec7211] text-[#ec7211]"
                  : "border-transparent text-[#545b64] hover:text-[#16191f]"
              }`}
            >
              Route tables ({routeTables.length})
            </button>
          )}
          {ep.VpcEndpointType === "Interface" && (
            <button
              onClick={() => setActiveTab("subnets")}
              className={`pb-2.5 text-[14px] font-medium transition-colors border-b-2 ${
                activeTab === "subnets"
                  ? "border-[#ec7211] text-[#ec7211]"
                  : "border-transparent text-[#545b64] hover:text-[#16191f]"
              }`}
            >
              Subnets ({subnets.length})
            </button>
          )}
          <button
            onClick={() => setActiveTab("tags")}
            className={`pb-2.5 text-[14px] font-medium transition-colors border-b-2 ${
              activeTab === "tags"
                ? "border-[#ec7211] text-[#ec7211]"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            Tags ({Object.keys(ep.Tags || {}).length})
          </button>
        </div>
      </div>

      {/* Tab: Details */}
      {activeTab === "details" && (
        <div className="space-y-6">
          <div className="bg-white border border-[#eaeded] rounded p-5">
            <h3 className="text-[15px] font-bold text-[#16191f] mb-4">VPC Endpoint summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-[13px]">
              <div>
                <dt className="text-[#545b64] font-medium">Endpoint ID</dt>
                <dd className="mt-1 font-mono text-[#16191f] font-semibold">{ep.VpcEndpointId}</dd>
              </div>

              <div>
                <dt className="text-[#545b64] font-medium">Service name</dt>
                <dd className="mt-1 font-mono text-[#16191f]">{ep.ServiceName}</dd>
              </div>

              <div>
                <dt className="text-[#545b64] font-medium">Endpoint type</dt>
                <dd className="mt-1 text-[#16191f]">{ep.VpcEndpointType}</dd>
              </div>

              <div>
                <dt className="text-[#545b64] font-medium">VPC</dt>
                <dd className="mt-1">
                  <Link
                    href={`/vpc/vpcs/${ep.VpcId}`}
                    className="text-[#0073bb] hover:underline font-mono"
                  >
                    {vpc?.Name ? `${vpc.Name} (${ep.VpcId})` : ep.VpcId}
                  </Link>
                </dd>
              </div>

              <div>
                <dt className="text-[#545b64] font-medium">Status</dt>
                <dd className="mt-1 font-semibold text-[#16191f]">{ep.State}</dd>
              </div>

              <div>
                <dt className="text-[#545b64] font-medium">Creation time</dt>
                <dd className="mt-1 text-[#16191f]">
                  {ep.CreationTimestamp ? new Date(ep.CreationTimestamp).toLocaleString() : "-"}
                </dd>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Route tables */}
      {activeTab === "routetables" && (
        <div className="bg-white border border-[#eaeded] rounded overflow-hidden">
          <div className="p-4 border-b border-[#eaeded] flex justify-between items-center">
            <h3 className="text-[14px] font-bold text-[#16191f]">Associated Route Tables</h3>
          </div>
          {routeTables.length > 0 ? (
            <table className="min-w-full text-[13px]">
              <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64]">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Route Table ID</th>
                  <th className="px-4 py-2 text-left font-medium">Name</th>
                  <th className="px-4 py-2 text-left font-medium">Main</th>
                  <th className="px-4 py-2 text-left font-medium">Routes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeded]">
                {routeTables.map((rt) => (
                  <tr key={rt.RouteTableId} className="hover:bg-[#f2f8fd]">
                    <td className="px-4 py-2">
                      <Link
                        href={`/vpc/route-tables/${rt.RouteTableId}`}
                        className="text-[#0073bb] hover:underline font-mono"
                      >
                        {rt.RouteTableId}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-[#16191f]">{rt.Name || "-"}</td>
                    <td className="px-4 py-2 text-[#16191f]">{rt.IsMain ? "Yes" : "No"}</td>
                    <td className="px-4 py-2 text-[#16191f]">{rt.Routes?.length || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-6 text-center text-[13px] text-[#545b64]">No route tables associated with this endpoint.</div>
          )}
        </div>
      )}

      {/* Tab: Subnets */}
      {activeTab === "subnets" && (
        <div className="bg-white border border-[#eaeded] rounded overflow-hidden">
          <div className="p-4 border-b border-[#eaeded]">
            <h3 className="text-[14px] font-bold text-[#16191f]">Associated Subnets</h3>
          </div>
          {subnets.length > 0 ? (
            <table className="min-w-full text-[13px]">
              <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64]">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Subnet ID</th>
                  <th className="px-4 py-2 text-left font-medium">Name</th>
                  <th className="px-4 py-2 text-left font-medium">IPv4 CIDR</th>
                  <th className="px-4 py-2 text-left font-medium">Availability Zone</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeded]">
                {subnets.map((sub) => (
                  <tr key={sub.SubnetId} className="hover:bg-[#f2f8fd]">
                    <td className="px-4 py-2">
                      <Link
                        href={`/vpc/subnets/${sub.SubnetId}`}
                        className="text-[#0073bb] hover:underline font-mono"
                      >
                        {sub.SubnetId}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-[#16191f]">{sub.Name || "-"}</td>
                    <td className="px-4 py-2 font-mono text-[#16191f]">{sub.CidrBlock}</td>
                    <td className="px-4 py-2 text-[#16191f]">{sub.AvailabilityZone}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-6 text-center text-[13px] text-[#545b64]">No subnets associated with this endpoint.</div>
          )}
        </div>
      )}

      {/* Tab: Tags */}
      {activeTab === "tags" && (
        <div className="bg-white border border-[#eaeded] rounded overflow-hidden">
          <div className="p-4 border-b border-[#eaeded]">
            <h3 className="text-[14px] font-bold text-[#16191f]">Tags</h3>
          </div>
          {ep.Tags && Object.keys(ep.Tags).length > 0 ? (
            <table className="min-w-full text-[13px]">
              <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64]">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Key</th>
                  <th className="px-4 py-2 text-left font-medium">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeded]">
                {Object.entries(ep.Tags).map(([k, v]) => (
                  <tr key={k}>
                    <td className="px-4 py-2 font-mono text-[#16191f]">{k}</td>
                    <td className="px-4 py-2 text-[#16191f]">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-6 text-center text-[13px] text-[#545b64]">No tags associated with this endpoint.</div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">Delete VPC endpoint?</h3>
            <p className="text-[13px] text-[#545b64]">
              Are you sure you want to delete endpoint{" "}
              <span className="font-mono font-semibold text-[#16191f]">{ep.VpcEndpointId}</span> (
              <span className="text-[#16191f]">{ep.ServiceName}</span>)?
            </p>
            <p className="text-[12px] text-red-600 bg-red-50 p-2.5 rounded border border-red-200">
              This action cannot be undone. Any traffic routed through this endpoint will be interrupted.
            </p>
            <div className="space-y-1">
              <label className="text-[12px] font-medium text-[#16191f]">
                To confirm deletion, type <span className="font-mono font-bold">delete</span>:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="delete"
                className="w-full px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteOpen(false);
                  setDeleteConfirmText("");
                }}
                disabled={deleteLoading}
                className="px-4 text-[13px] font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa]"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteLoading || deleteConfirmText !== "delete"}
                className="px-4 text-[13px] font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
