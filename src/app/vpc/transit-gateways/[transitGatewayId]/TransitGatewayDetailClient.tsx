"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  TransitGatewayItem,
  TransitGatewayAttachmentItem,
  TransitGatewayRouteTableItem,
  deleteTransitGatewayAction,
} from "../../transit-gateway-actions";

interface Props {
  transitGateway: TransitGatewayItem;
  attachments: TransitGatewayAttachmentItem[];
  routeTables: TransitGatewayRouteTableItem[];
}

export default function TransitGatewayDetailClient({
  transitGateway: initialTgw,
  attachments,
  routeTables,
}: Props) {
  const router = useRouter();

  const [tgw] = useState<TransitGatewayItem>(initialTgw);
  const [activeTab, setActiveTab] = useState<"details" | "attachments" | "routetables" | "cidrs" | "tags">("details");
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
      const res = await deleteTransitGatewayAction(tgw.TransitGatewayId);
      if (res.success) {
        setIsDeleteOpen(false);
        router.push("/vpc/transit-gateways");
      } else {
        setMessage({ type: "error", text: res.error || "Failed to delete transit gateway" });
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
        <Link href="/vpc/transit-gateways" className="hover:text-[#0073bb]">
          Transit gateways
        </Link>
        <span>&gt;</span>
        <span className="text-[#16191f] font-mono font-medium">{tgw.TransitGatewayId}</span>
      </div>

      {/* Header and Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#eaeded]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[22px] font-bold text-[#16191f]">{tgw.Name || tgw.TransitGatewayId}</h1>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {tgw.State}
            </span>
          </div>
          <p className="text-[13px] text-[#545b64] mt-1 font-mono">{tgw.TransitGatewayId}</p>
        </div>

        <div className="flex items-center gap-2 relative">
          <Link
            href="/vpc/transit-gateways"
            className="px-3 text-[13px] font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa] transition-colors flex items-center justify-center"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            View all Transit gateways
          </Link>

          <Link
            href={`/vpc/transit-gateway-attachments/create?tgwId=${tgw.TransitGatewayId}`}
            className="px-3 text-[13px] font-medium text-white bg-[#ec7211] rounded hover:bg-[#eb5f07] transition-colors flex items-center justify-center"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Create attachment
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
                <Link
                  href={`/vpc/transit-gateway-attachments/create?tgwId=${tgw.TransitGatewayId}`}
                  className="w-full text-left px-4 py-2 text-[13px] text-[#16191f] hover:bg-[#f2f8fd] flex items-center gap-2"
                >
                  Create attachment
                </Link>
                <Link
                  href={`/vpc/transit-gateway-route-tables/create?tgwId=${tgw.TransitGatewayId}`}
                  className="w-full text-left px-4 py-2 text-[13px] text-[#16191f] hover:bg-[#f2f8fd] flex items-center gap-2"
                >
                  Create route table
                </Link>
                <div className="border-t border-[#eaeded] my-1" />
                <button
                  onClick={() => setIsDeleteOpen(true)}
                  className="w-full text-left px-4 py-2 text-[13px] text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  Delete transit gateway
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
          <button
            onClick={() => setActiveTab("attachments")}
            className={`pb-2.5 text-[14px] font-medium transition-colors border-b-2 ${
              activeTab === "attachments"
                ? "border-[#ec7211] text-[#ec7211]"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            Attachments ({attachments.length})
          </button>
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
          <button
            onClick={() => setActiveTab("cidrs")}
            className={`pb-2.5 text-[14px] font-medium transition-colors border-b-2 ${
              activeTab === "cidrs"
                ? "border-[#ec7211] text-[#ec7211]"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            Transit gateway CIDR blocks ({tgw.TransitGatewayCidrBlocks.length})
          </button>
          <button
            onClick={() => setActiveTab("tags")}
            className={`pb-2.5 text-[14px] font-medium transition-colors border-b-2 ${
              activeTab === "tags"
                ? "border-[#ec7211] text-[#ec7211]"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            Tags ({Object.keys(tgw.Tags || {}).length})
          </button>
        </div>
      </div>

      {/* Tab: Details */}
      {activeTab === "details" && (
        <div className="space-y-6">
          <div className="bg-white border border-[#eaeded] rounded p-5">
            <h3 className="text-[15px] font-bold text-[#16191f] mb-4">Transit gateway summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-[13px]">
              <div>
                <dt className="text-[#545b64] font-medium">Transit gateway ID</dt>
                <dd className="mt-1 font-mono text-[#16191f] font-semibold">{tgw.TransitGatewayId}</dd>
              </div>

              <div>
                <dt className="text-[#545b64] font-medium">Owner ID</dt>
                <dd className="mt-1 font-mono text-[#16191f]">{tgw.OwnerId}</dd>
              </div>

              <div>
                <dt className="text-[#545b64] font-medium">State</dt>
                <dd className="mt-1 font-semibold text-emerald-700">{tgw.State}</dd>
              </div>

              <div>
                <dt className="text-[#545b64] font-medium">Amazon side ASN</dt>
                <dd className="mt-1 font-mono text-[#16191f]">{tgw.AmazonSideAsn}</dd>
              </div>

              <div>
                <dt className="text-[#545b64] font-medium">Description</dt>
                <dd className="mt-1 text-[#16191f]" suppressHydrationWarning>{tgw.Description || "-"}</dd>
              </div>

              <div>
                <dt className="text-[#545b64] font-medium">Auto accept shared attachments</dt>
                <dd className="mt-1 capitalize text-[#16191f]">{tgw.AutoAcceptSharedAttachments}</dd>
              </div>

              <div>
                <dt className="text-[#545b64] font-medium">Default route table association</dt>
                <dd className="mt-1 capitalize text-[#16191f]">{tgw.DefaultRouteTableAssociation}</dd>
              </div>

              <div>
                <dt className="text-[#545b64] font-medium">Default route table propagation</dt>
                <dd className="mt-1 capitalize text-[#16191f]">{tgw.DefaultRouteTablePropagation}</dd>
              </div>

              <div>
                <dt className="text-[#545b64] font-medium">DNS support</dt>
                <dd className="mt-1 capitalize text-[#16191f]">{tgw.DnsSupport}</dd>
              </div>

              <div>
                <dt className="text-[#545b64] font-medium">VPN ECMP support</dt>
                <dd className="mt-1 capitalize text-[#16191f]">{tgw.VpnEcmpSupport}</dd>
              </div>

              <div>
                <dt className="text-[#545b64] font-medium">Multicast support</dt>
                <dd className="mt-1 capitalize text-[#16191f]">{tgw.MulticastSupport}</dd>
              </div>

              <div>
                <dt className="text-[#545b64] font-medium">Creation time</dt>
                <dd className="mt-1 text-[#16191f]" suppressHydrationWarning>
                  {tgw.CreationTime ? new Date(tgw.CreationTime).toLocaleString() : "-"}
                </dd>
              </div>

              {tgw.AssociationDefaultRouteTableId && (
                <div>
                  <dt className="text-[#545b64] font-medium">Association default route table ID</dt>
                  <dd className="mt-1">
                    <Link
                      href={`/vpc/transit-gateway-route-tables/${tgw.AssociationDefaultRouteTableId}`}
                      className="text-[#0073bb] hover:underline font-mono"
                    >
                      {tgw.AssociationDefaultRouteTableId}
                    </Link>
                  </dd>
                </div>
              )}

              {tgw.PropagationDefaultRouteTableId && (
                <div>
                  <dt className="text-[#545b64] font-medium">Propagation default route table ID</dt>
                  <dd className="mt-1">
                    <Link
                      href={`/vpc/transit-gateway-route-tables/${tgw.PropagationDefaultRouteTableId}`}
                      className="text-[#0073bb] hover:underline font-mono"
                    >
                      {tgw.PropagationDefaultRouteTableId}
                    </Link>
                  </dd>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Attachments */}
      {activeTab === "attachments" && (
        <div className="bg-white border border-[#eaeded] rounded overflow-hidden">
          <div className="p-4 border-b border-[#eaeded] flex justify-between items-center">
            <h3 className="text-[14px] font-bold text-[#16191f]">Transit gateway attachments</h3>
            <Link
              href={`/vpc/transit-gateway-attachments/create?tgwId=${tgw.TransitGatewayId}`}
              className="px-3 text-[12px] font-medium text-white bg-[#ec7211] rounded hover:bg-[#eb5f07] flex items-center justify-center"
              style={{ height: "28px" }}
            >
              Create attachment
            </Link>
          </div>
          {attachments.length > 0 ? (
            <table className="min-w-full text-[13px]">
              <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64]">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Attachment ID</th>
                  <th className="px-4 py-2 text-left font-medium">Name</th>
                  <th className="px-4 py-2 text-left font-medium">Resource type</th>
                  <th className="px-4 py-2 text-left font-medium">Resource ID</th>
                  <th className="px-4 py-2 text-left font-medium">State</th>
                  <th className="px-4 py-2 text-left font-medium">Association route table</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeded]">
                {attachments.map((att) => (
                  <tr key={att.TransitGatewayAttachmentId} className="hover:bg-[#f2f8fd]">
                    <td className="px-4 py-2">
                      <Link
                        href={`/vpc/transit-gateway-attachments/${att.TransitGatewayAttachmentId}`}
                        className="text-[#0073bb] hover:underline font-mono"
                      >
                        {att.TransitGatewayAttachmentId}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-[#16191f]">{att.Name || "-"}</td>
                    <td className="px-4 py-2 uppercase text-[#16191f]">{att.ResourceType}</td>
                    <td className="px-4 py-2 font-mono text-[#0073bb]">
                      {att.ResourceType === "vpc" && att.ResourceId ? (
                        <Link href={`/vpc/vpcs/${att.ResourceId}`} className="hover:underline">
                          {att.ResourceId}
                        </Link>
                      ) : (
                        att.ResourceId || "-"
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-50 text-emerald-700">
                        {att.State}
                      </span>
                    </td>
                    <td className="px-4 py-2 font-mono text-[#545b64]">
                      {att.AssociationRouteTableId ? (
                        <Link
                          href={`/vpc/transit-gateway-route-tables/${att.AssociationRouteTableId}`}
                          className="text-[#0073bb] hover:underline"
                        >
                          {att.AssociationRouteTableId}
                        </Link>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-6 text-center text-[13px] text-[#545b64]">
              No attachments found for this transit gateway.
            </div>
          )}
        </div>
      )}

      {/* Tab: Route tables */}
      {activeTab === "routetables" && (
        <div className="bg-white border border-[#eaeded] rounded overflow-hidden">
          <div className="p-4 border-b border-[#eaeded] flex justify-between items-center">
            <h3 className="text-[14px] font-bold text-[#16191f]">Transit gateway route tables</h3>
            <Link
              href={`/vpc/transit-gateway-route-tables/create?tgwId=${tgw.TransitGatewayId}`}
              className="px-3 text-[12px] font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa] flex items-center justify-center"
              style={{ height: "28px" }}
            >
              Create route table
            </Link>
          </div>
          {routeTables.length > 0 ? (
            <table className="min-w-full text-[13px]">
              <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64]">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Route table ID</th>
                  <th className="px-4 py-2 text-left font-medium">Name</th>
                  <th className="px-4 py-2 text-left font-medium">State</th>
                  <th className="px-4 py-2 text-left font-medium">Default association</th>
                  <th className="px-4 py-2 text-left font-medium">Default propagation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeded]">
                {routeTables.map((rtb) => (
                  <tr key={rtb.TransitGatewayRouteTableId} className="hover:bg-[#f2f8fd]">
                    <td className="px-4 py-2">
                      <Link
                        href={`/vpc/transit-gateway-route-tables/${rtb.TransitGatewayRouteTableId}`}
                        className="text-[#0073bb] hover:underline font-mono"
                      >
                        {rtb.TransitGatewayRouteTableId}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-[#16191f]">{rtb.Name || "-"}</td>
                    <td className="px-4 py-2 text-[#16191f]">{rtb.State}</td>
                    <td className="px-4 py-2 text-[#16191f]">
                      {rtb.DefaultAssociationRouteTable ? "Yes" : "No"}
                    </td>
                    <td className="px-4 py-2 text-[#16191f]">
                      {rtb.DefaultPropagationRouteTable ? "Yes" : "No"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-6 text-center text-[13px] text-[#545b64]">
              No route tables found for this transit gateway.
            </div>
          )}
        </div>
      )}

      {/* Tab: CIDR blocks */}
      {activeTab === "cidrs" && (
        <div className="bg-white border border-[#eaeded] rounded overflow-hidden">
          <div className="p-4 border-b border-[#eaeded]">
            <h3 className="text-[14px] font-bold text-[#16191f]">Transit gateway CIDR blocks</h3>
          </div>
          {tgw.TransitGatewayCidrBlocks && tgw.TransitGatewayCidrBlocks.length > 0 ? (
            <table className="min-w-full text-[13px]">
              <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64]">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">CIDR block</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeded]">
                {tgw.TransitGatewayCidrBlocks.map((cidr) => (
                  <tr key={cidr}>
                    <td className="px-4 py-2 font-mono text-[#16191f]">{cidr}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-6 text-center text-[13px] text-[#545b64]">
              No CIDR blocks assigned to this transit gateway.
            </div>
          )}
        </div>
      )}

      {/* Tab: Tags */}
      {activeTab === "tags" && (
        <div className="bg-white border border-[#eaeded] rounded overflow-hidden">
          <div className="p-4 border-b border-[#eaeded]">
            <h3 className="text-[14px] font-bold text-[#16191f]">Tags</h3>
          </div>
          {tgw.Tags && Object.keys(tgw.Tags).length > 0 ? (
            <table className="min-w-full text-[13px]">
              <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64]">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Key</th>
                  <th className="px-4 py-2 text-left font-medium">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeded]">
                {Object.entries(tgw.Tags).map(([k, v]) => (
                  <tr key={k}>
                    <td className="px-4 py-2 font-mono text-[#16191f]">{k}</td>
                    <td className="px-4 py-2 text-[#16191f]">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-6 text-center text-[13px] text-[#545b64]">No tags assigned to this transit gateway.</div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">Delete transit gateway?</h3>
            <p className="text-[13px] text-[#545b64]">
              Are you sure you want to delete transit gateway{" "}
              <span className="font-mono font-semibold text-[#16191f]">{tgw.TransitGatewayId}</span>?
            </p>
            {attachments.length > 0 && (
              <p className="text-[12px] text-red-600 bg-red-50 p-2.5 rounded border border-red-200">
                Warning: This transit gateway currently has {attachments.length} attachment(s). You must delete all attachments first before deleting this hub.
              </p>
            )}
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
