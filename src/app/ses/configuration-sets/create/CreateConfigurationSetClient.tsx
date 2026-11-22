"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createConfigurationSetAction } from "../../actions";

export default function CreateConfigurationSetClient() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [reputationMetrics, setReputationMetrics] = useState(true);
  const [sendingEnabled, setSendingEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Configuration set name is required.");
      return;
    }

    setLoading(true);
    setError(null);

    const res = await createConfigurationSetAction(trimmed);
    setLoading(false);

    if (res.success) {
      router.push("/ses/configuration-sets");
    } else {
      setError(res.error || "Failed to create configuration set.");
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <div className="text-[12px] text-[#545b64] mb-1">
          <Link href="/ses/configuration-sets" className="hover:underline">
            Configuration sets
          </Link>{" "}
          &gt; <span>Create configuration set</span>
        </div>
        <h1 className="text-[22px] font-bold text-[#16191f]">Create configuration set</h1>
        <p className="text-[13px] text-[#545b64]">
          A configuration set is a group of rules that you can apply to your emails to track events.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-[#fdf2f2] border-l-4 border-l-[#d13212] rounded text-[13px] text-[#d13212]">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="p-5 bg-white border border-[#eaeded] rounded-md shadow-sm space-y-4">
          <h2 className="text-[15px] font-bold text-[#16191f]">General details</h2>

          <div>
            <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
              Configuration set name <span className="text-[#d13212]">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. transactional-emails"
              className="w-full px-3 py-1.5 border border-[#aab7b8] rounded text-[13px]"
              required
            />
            <p className="text-[11px] text-[#545b64] mt-1">
              Can contain up to 64 letters, numbers, hyphens (-), and underscores (_).
            </p>
          </div>

          <div className="pt-2 border-t border-[#eaeded] space-y-3 text-[13px]">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={reputationMetrics}
                onChange={(e) => setReputationMetrics(e.target.checked)}
                className="accent-[#ec7211]"
              />
              <span className="font-medium text-[#16191f]">
                Track reputation metrics for this configuration set
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={sendingEnabled}
                onChange={(e) => setSendingEnabled(e.target.checked)}
                className="accent-[#ec7211]"
              />
              <span className="font-medium text-[#16191f]">
                Sending enabled
              </span>
            </label>
          </div>
        </div>

        <div className="p-4 bg-white border border-[#eaeded] rounded-md flex items-center justify-end gap-3 shadow-sm">
          <Link
            href="/ses/configuration-sets"
            className="px-4 text-[13px] font-medium text-[#16191f] border border-[#aab7b8] rounded hover:bg-[#eaeded] flex items-center"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-5 text-[13px] font-semibold text-white bg-[#ec7211] hover:bg-[#eb5f07] disabled:opacity-50 rounded transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            {loading ? "Creating..." : "Create configuration set"}
          </button>
        </div>
      </form>
    </div>
  );
}
