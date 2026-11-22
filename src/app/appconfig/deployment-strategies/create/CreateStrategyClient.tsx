"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createDeploymentStrategyAction } from "../../actions";

export default function CreateStrategyClient() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("10");
  const [growthType, setGrowthType] = useState<"LINEAR" | "EXPONENTIAL">("LINEAR");
  const [growthFactor, setGrowthFactor] = useState("20");
  const [bakeTime, setBakeTime] = useState("5");
  const [replicateTo, setReplicateTo] = useState<"NONE" | "SSM_DOCUMENT">("NONE");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Strategy name is required.");
      return;
    }

    const durNum = parseInt(duration, 10);
    const growthNum = parseFloat(growthFactor);
    const bakeNum = parseInt(bakeTime, 10);

    if (isNaN(durNum) || durNum < 0) {
      setError("Duration must be a positive integer.");
      return;
    }
    if (isNaN(growthNum) || growthNum <= 0 || growthNum > 100) {
      setError("Growth factor must be between 1 and 100.");
      return;
    }
    if (isNaN(bakeNum) || bakeNum < 0) {
      setError("Bake time must be a non-negative integer.");
      return;
    }

    setLoading(true);
    setError(null);

    const res = await createDeploymentStrategyAction(
      name.trim(),
      durNum,
      growthNum,
      growthType,
      bakeNum,
      replicateTo,
      description.trim() || undefined
    );

    setLoading(false);

    if (res.success) {
      router.push("/appconfig/deployment-strategies");
    } else {
      setError(res.error || "Failed to create deployment strategy.");
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Breadcrumbs */}
      <nav className="text-[12px] text-[#545b64] flex items-center gap-1.5">
        <Link href="/appconfig/deployment-strategies" className="hover:text-[#0073bb]">
          Deployment strategies
        </Link>
        <span>&rsaquo;</span>
        <span className="text-[#16191f]">Create deployment strategy</span>
      </nav>

      {/* Header */}
      <div>
        <h1 className="text-[22px] font-bold text-[#16191f]">Create deployment strategy</h1>
        <p className="text-[13px] text-[#545b64] mt-1">
          A deployment strategy determines how fast a configuration version is rolled out and what bake time is monitored for alarms.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-[#fdf2f2] border border-[#d13212] rounded text-[13px] text-[#d13212]">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Strategy Details */}
        <div className="bg-white border border-[#eaeded] rounded p-6 shadow-xs space-y-4">
          <h2 className="text-[16px] font-bold text-[#16191f]">Strategy details</h2>

          <div>
            <label className="block text-[13px] font-bold text-[#16191f] mb-1">
              Name <span className="text-[#d13212]">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Canary20Percent10Minutes"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full max-w-md px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded focus:outline-none focus:border-[#0073bb] bg-white"
            />
          </div>

          <div>
            <label className="block text-[13px] font-bold text-[#16191f] mb-1">
              Description <span className="text-[12px] font-normal text-[#545b64]">- optional</span>
            </label>
            <textarea
              rows={2}
              placeholder="e.g. 20% linear progression over 10 minutes with 5 minutes bake time"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full max-w-lg px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded"
            />
          </div>
        </div>

        {/* Growth & Velocity */}
        <div className="bg-white border border-[#eaeded] rounded p-6 shadow-xs space-y-4">
          <h2 className="text-[16px] font-bold text-[#16191f]">Velocity and deployment progression</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
            <div>
              <label className="block text-[13px] font-bold text-[#16191f] mb-1">
                Deployment duration (minutes) <span className="text-[#d13212]">*</span>
              </label>
              <input
                type="number"
                min="0"
                max="1440"
                required
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded"
              />
            </div>

            <div>
              <label className="block text-[13px] font-bold text-[#16191f] mb-1">
                Final bake time (minutes) <span className="text-[#d13212]">*</span>
              </label>
              <input
                type="number"
                min="0"
                max="1440"
                required
                value={bakeTime}
                onChange={(e) => setBakeTime(e.target.value)}
                className="w-full px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded"
              />
            </div>

            <div>
              <label className="block text-[13px] font-bold text-[#16191f] mb-1">
                Growth type <span className="text-[#d13212]">*</span>
              </label>
              <select
                value={growthType}
                onChange={(e) => setGrowthType(e.target.value as any)}
                className="w-full px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded bg-white"
              >
                <option value="LINEAR">Linear</option>
                <option value="EXPONENTIAL">Exponential</option>
              </select>
            </div>

            <div>
              <label className="block text-[13px] font-bold text-[#16191f] mb-1">
                Growth factor (percentage) <span className="text-[#d13212]">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="100"
                step="any"
                required
                value={growthFactor}
                onChange={(e) => setGrowthFactor(e.target.value)}
                className="w-full px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded"
              />
            </div>
          </div>
        </div>

        {/* Replication target */}
        <div className="bg-white border border-[#eaeded] rounded p-6 shadow-xs space-y-4">
          <h2 className="text-[16px] font-bold text-[#16191f]">Replication target</h2>
          <p className="text-[12px] text-[#545b64]">
            Save a copy of the configuration in Systems Manager (SSM) document store when deploying.
          </p>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[13px] cursor-pointer">
              <input
                type="radio"
                name="replicate-to"
                checked={replicateTo === "NONE"}
                onChange={() => setReplicateTo("NONE")}
                className="text-[#0073bb]"
              />
              <span className="text-[#16191f] font-medium">None</span>
            </label>
            <label className="flex items-center gap-2 text-[13px] cursor-pointer">
              <input
                type="radio"
                name="replicate-to"
                checked={replicateTo === "SSM_DOCUMENT"}
                onChange={() => setReplicateTo("SSM_DOCUMENT")}
                className="text-[#0073bb]"
              />
              <span className="text-[#16191f] font-medium">SSM document</span>
            </label>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/appconfig/deployment-strategies"
            className="px-4 text-[13px] font-medium text-[#16191f] bg-white border border-[#aab7b8] rounded hover:bg-[#fafafa] flex items-center justify-center"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="px-5 text-[13px] font-semibold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded disabled:opacity-40 flex items-center justify-center transition-colors shadow-xs"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            {loading ? "Creating..." : "Create deployment strategy"}
          </button>
        </div>
      </form>
    </div>
  );
}
