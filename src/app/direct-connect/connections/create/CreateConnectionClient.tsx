"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DxLocationItem,
  createConnectionAction,
} from "../../dx-actions";

interface Props {
  locations: DxLocationItem[];
}

export default function CreateConnectionClient({ locations }: Props) {
  const router = useRouter();

  const [connectionName, setConnectionName] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(
    locations.length > 0 ? locations[0].locationCode : "EqDC2"
  );
  const [bandwidth, setBandwidth] = useState("1Gbps");
  const [requestMacSec, setRequestMacSec] = useState(false);
  const [tags, setTags] = useState<{ key: string; value: string }[]>([
    { key: "", value: "" },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentLocation = locations.find((l) => l.locationCode === selectedLocation);
  const portSpeeds = currentLocation?.availablePortSpeeds || ["1Gbps", "10Gbps"];

  const handleAddTag = () => {
    setTags([...tags, { key: "", value: "" }]);
  };

  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleTagChange = (index: number, field: "key" | "value", val: string) => {
    const updated = [...tags];
    updated[index][field] = val;
    setTags(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!connectionName.trim()) {
      setError("Please specify a connection name.");
      return;
    }

    if (!selectedLocation) {
      setError("Please select an AWS Direct Connect location.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await createConnectionAction({
        connectionName: connectionName.trim(),
        location: selectedLocation,
        bandwidth,
        requestMacSec,
        tags: tags.filter((t) => t.key.trim()),
      });

      if (res.success && res.connectionId) {
        router.push(`/direct-connect/connections/${res.connectionId}`);
      } else {
        setError(res.error || "Failed to create Direct Connect connection");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6 pb-12">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-[12px] text-[#545b64]">
        <Link href="/direct-connect" className="hover:text-[#0073bb]">
          AWS Direct Connect
        </Link>
        <span>&gt;</span>
        <Link href="/direct-connect/connections" className="hover:text-[#0073bb]">
          Connections
        </Link>
        <span>&gt;</span>
        <span className="text-[#16191f] font-medium">Create connection</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-[22px] font-bold text-[#16191f]">Create connection</h1>
        <p className="text-[13px] text-[#545b64] mt-0.5">
          Order a dedicated, physical network port at an AWS Direct Connect colocation facility to connect your router directly to the AWS backbone.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-[#fdf2f2] border border-[#d13212] rounded text-[13px] text-[#d13212] flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-gray-400 hover:text-gray-600 font-bold ml-4">
            x
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Connection Settings Card */}
        <div className="bg-white border border-[#eaeded] rounded-xl shadow-sm p-6 space-y-5">
          <h2 className="text-[16px] font-bold text-[#16191f] border-b pb-2">
            Connection settings
          </h2>

          {/* Connection Name */}
          <div>
            <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
              Connection name <span className="text-red-500">*</span>
            </label>
            <p className="text-[12px] text-[#545b64] mb-2">
              The name of the dedicated connection.
            </p>
            <input
              type="text"
              required
              placeholder="dc-to-aws-primary"
              value={connectionName}
              onChange={(e) => setConnectionName(e.target.value)}
              className="w-full max-w-lg border border-gray-300 rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211]"
              style={{ height: "32px" }}
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
              Location <span className="text-red-500">*</span>
            </label>
            <p className="text-[12px] text-[#545b64] mb-2">
              Select the colocation data center facility where your network equipment or provider is located.
            </p>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              required
              className="w-full max-w-lg border border-gray-300 rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211] bg-white"
              style={{ height: "32px" }}
            >
              {locations.length === 0 ? (
                <option value="EqDC2">Equinix DC2, Ashburn, VA (EqDC2)</option>
              ) : (
                locations.map((loc) => (
                  <option key={loc.locationCode} value={loc.locationCode}>
                    {loc.locationName} ({loc.locationCode})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Port Speed */}
          <div>
            <label className="block text-[13px] font-semibold text-[#16191f] mb-2">
              Port speed <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="portSpeed"
                  value="1Gbps"
                  checked={bandwidth === "1Gbps" || bandwidth === "1G"}
                  onChange={() => setBandwidth("1Gbps")}
                  className="text-[#ec7211] focus:ring-[#ec7211]"
                />
                <span className="text-[13px] font-medium text-[#16191f]">
                  1 Gbps - 1000BASE-LX single-mode fiber
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="portSpeed"
                  value="10Gbps"
                  checked={bandwidth === "10Gbps" || bandwidth === "10G"}
                  onChange={() => setBandwidth("10Gbps")}
                  className="text-[#ec7211] focus:ring-[#ec7211]"
                />
                <span className="text-[13px] font-medium text-[#16191f]">
                  10 Gbps - 10GBASE-LR single-mode fiber
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="portSpeed"
                  value="100Gbps"
                  checked={bandwidth === "100Gbps" || bandwidth === "100G"}
                  onChange={() => setBandwidth("100Gbps")}
                  className="text-[#ec7211] focus:ring-[#ec7211]"
                />
                <span className="text-[13px] font-medium text-[#16191f]">
                  100 Gbps - 100GBASE-LR4 single-mode fiber
                </span>
              </label>
            </div>
          </div>

          {/* MACsec encryption */}
          <div className="pt-2 border-t border-gray-100">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={requestMacSec}
                onChange={(e) => setRequestMacSec(e.target.checked)}
                className="text-[#ec7211] focus:ring-[#ec7211]"
              />
              <span className="text-[13px] font-semibold text-[#16191f]">
                Request MACsec encryption
              </span>
            </label>
            <p className="text-[12px] text-[#545b64] pl-6 mt-0.5">
              IEEE 802.1AE MACsec provides hardware point-to-point layer 2 encryption between your router and the AWS device. Supported on 10 Gbps and 100 Gbps ports.
            </p>
          </div>
        </div>

        {/* Section: Tags */}
        <div className="bg-white border border-[#eaeded] rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h2 className="text-[16px] font-bold text-[#16191f]">Tags</h2>
            <button
              type="button"
              onClick={handleAddTag}
              className="px-3 text-xs font-semibold text-[#0073bb] bg-white border border-[#0073bb] rounded hover:bg-blue-50 transition-colors shadow-sm"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            >
              Add tag
            </button>
          </div>
          <p className="text-[12px] text-[#545b64]">
            A tag is a label that you assign to an AWS resource. Each tag consists of a key and an optional value.
          </p>

          <div className="space-y-3">
            {tags.map((t, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Key"
                  value={t.key}
                  onChange={(e) => handleTagChange(idx, "key", e.target.value)}
                  className="w-1/3 border border-gray-300 rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211]"
                  style={{ height: "32px" }}
                />
                <input
                  type="text"
                  placeholder="Value"
                  value={t.value}
                  onChange={(e) => handleTagChange(idx, "value", e.target.value)}
                  className="w-1/3 border border-gray-300 rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211]"
                  style={{ height: "32px" }}
                />
                {tags.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(idx)}
                    className="text-xs text-red-600 hover:underline font-medium"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Link
            href="/direct-connect/connections"
            className="px-4 text-xs font-semibold text-[#16191f] bg-white border border-[#d5dbdb] rounded hover:bg-gray-50 transition-colors flex items-center justify-center shadow-sm"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className={`px-4 text-xs font-semibold text-white rounded transition-colors shadow-sm ${
              loading ? "bg-gray-400 cursor-not-allowed" : "bg-[#ec7211] hover:bg-[#eb5f07]"
            }`}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            {loading ? "Creating..." : "Create connection"}
          </button>
        </div>
      </form>
    </div>
  );
}
