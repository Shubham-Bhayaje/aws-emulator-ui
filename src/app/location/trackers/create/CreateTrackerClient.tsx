"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createTrackerAction } from "../../actions";

export default function CreateTrackerClient() {
  const router = useRouter();

  const [trackerName, setTrackerName] = useState("");
  const [description, setDescription] = useState("");
  const [positionFiltering, setPositionFiltering] = useState<"TimeBased" | "DistanceBased" | "AccuracyBased">("TimeBased");
  const [kmsType, setKmsType] = useState<"aws" | "cmk">("aws");
  const [kmsKeyId, setKmsKeyId] = useState("");

  const [tags, setTags] = useState<{ key: string; value: string }[]>([]);
  const [tagKey, setTagKey] = useState("");
  const [tagValue, setTagValue] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAddTag = () => {
    if (!tagKey.trim()) return;
    setTags([...tags, { key: tagKey.trim(), value: tagValue.trim() }]);
    setTagKey("");
    setTagValue("");
  };

  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackerName.trim()) {
      setErrorMsg("Tracker name is required.");
      return;
    }

    const nameRegex = /^[-._a-zA-Z0-9]+$/;
    if (!nameRegex.test(trackerName.trim())) {
      setErrorMsg(
        "Tracker name can contain only alphanumeric characters, dashes (-), underscores (_), and periods (.)."
      );
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    const tagsObj: Record<string, string> = {};
    for (const t of tags) {
      tagsObj[t.key] = t.value;
    }

    try {
      const res = await createTrackerAction({
        trackerName: trackerName.trim(),
        description: description.trim() || undefined,
        positionFiltering,
        kmsKeyId: kmsType === "cmk" && kmsKeyId.trim() ? kmsKeyId.trim() : undefined,
        tags: Object.keys(tagsObj).length > 0 ? tagsObj : undefined,
      });

      if (res.success) {
        router.push(`/location/trackers/${res.trackerName || trackerName.trim()}`);
      } else {
        setErrorMsg(res.error || "Failed to create tracker.");
      }
    } catch {
      setErrorMsg("An unexpected error occurred while creating tracker.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center text-[12px] text-[#545b64]">
        <Link href="/location" className="hover:underline">
          Amazon Location Service
        </Link>
        <span className="mx-1 text-[#879596]">/</span>
        <Link href="/location/trackers" className="hover:underline">
          Trackers
        </Link>
        <span className="mx-1 text-[#879596]">/</span>
        <span className="text-[#16191f] font-medium">Create tracker</span>
      </div>

      {/* Header */}
      <div className="pb-2 border-b border-[#eaeded]">
        <h1 className="text-[20px] font-bold text-[#16191f]">Create tracker</h1>
        <p className="text-[13px] text-[#545b64] mt-0.5">
          Configure a tracker resource to collect, evaluate, and store device position updates from IoT devices and fleet vehicles.
        </p>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-3 bg-[#fdf2f2] border border-[#d13212] rounded text-[13px] text-[#d13212]">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Tracker Details */}
        <div className="bg-white border border-[#d5dbdb] rounded p-5 space-y-4 shadow-sm">
          <h2 className="text-[15px] font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
            Tracker details
          </h2>

          {/* Name */}
          <div>
            <label className="block text-[13px] font-bold text-[#16191f] mb-1">
              Tracker name <span className="text-[#d13212]">*</span>
            </label>
            <input
              type="text"
              required
              value={trackerName}
              onChange={(e) => setTrackerName(e.target.value)}
              placeholder="e.g. FleetTracker-West"
              maxLength={100}
              className="w-full max-w-md px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211]"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
            />
            <p className="text-[11px] text-[#545b64] mt-1">
              Must be unique across your account. Can contain 1 to 100 alphanumeric characters, hyphens, periods, and underscores.
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[13px] font-bold text-[#16191f] mb-1">
              Description <span className="text-[#545b64] font-normal">(optional)</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter a description for this tracker resource"
              maxLength={1000}
              className="w-full max-w-md px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211]"
            />
          </div>
        </div>

        {/* Step 2: Position Filtering */}
        <div className="bg-white border border-[#d5dbdb] rounded p-5 space-y-4 shadow-sm">
          <div>
            <h2 className="text-[15px] font-bold text-[#16191f]">Position filtering</h2>
            <p className="text-[12px] text-[#545b64] mt-0.5">
              Specify how the tracker evaluates incoming position updates to eliminate GPS jitter and reduce storage costs.
            </p>
          </div>

          <div className="space-y-3">
            <label className="flex items-start gap-3 p-3 border rounded cursor-pointer hover:bg-[#fafafa]">
              <input
                type="radio"
                name="filtering"
                value="TimeBased"
                checked={positionFiltering === "TimeBased"}
                onChange={() => setPositionFiltering("TimeBased")}
                className="mt-0.5 accent-[#ec7211]"
              />
              <div>
                <div className="text-[13px] font-bold text-[#16191f]">Time-based filtering (Recommended)</div>
                <div className="text-[12px] text-[#545b64] mt-0.5">
                  Evaluates position updates against configured time intervals. Useful for devices reporting on a fixed heartbeat schedule.
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 border rounded cursor-pointer hover:bg-[#fafafa]">
              <input
                type="radio"
                name="filtering"
                value="DistanceBased"
                checked={positionFiltering === "DistanceBased"}
                onChange={() => setPositionFiltering("DistanceBased")}
                className="mt-0.5 accent-[#ec7211]"
              />
              <div>
                <div className="text-[13px] font-bold text-[#16191f]">Distance-based filtering</div>
                <div className="text-[12px] text-[#545b64] mt-0.5">
                  Filters out positions if the device has not moved more than 30 meters from its previous recorded location.
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 border rounded cursor-pointer hover:bg-[#fafafa]">
              <input
                type="radio"
                name="filtering"
                value="AccuracyBased"
                checked={positionFiltering === "AccuracyBased"}
                onChange={() => setPositionFiltering("AccuracyBased")}
                className="mt-0.5 accent-[#ec7211]"
              />
              <div>
                <div className="text-[13px] font-bold text-[#16191f]">Accuracy-based filtering</div>
                <div className="text-[12px] text-[#545b64] mt-0.5">
                  Filters out position updates that fall outside the estimated device accuracy threshold.
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Step 3: Data Encryption */}
        <div className="bg-white border border-[#d5dbdb] rounded p-5 space-y-4 shadow-sm">
          <div>
            <h2 className="text-[15px] font-bold text-[#16191f]">Data encryption</h2>
            <p className="text-[12px] text-[#545b64] mt-0.5">
              Configure AWS Key Management Service (AWS KMS) encryption for stored position updates.
            </p>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="kmsType"
                checked={kmsType === "aws"}
                onChange={() => setKmsType("aws")}
                className="accent-[#ec7211]"
              />
              <span className="text-[13px] text-[#16191f]">
                AWS owned key (Default - No additional KMS charges)
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="kmsType"
                checked={kmsType === "cmk"}
                onChange={() => setKmsType("cmk")}
                className="accent-[#ec7211]"
              />
              <span className="text-[13px] text-[#16191f]">
                Customer managed key (KMS CMK)
              </span>
            </label>

            {kmsType === "cmk" && (
              <div className="pl-6 pt-2">
                <label className="block text-[12px] font-medium text-[#16191f] mb-1">
                  KMS Key ID or ARN
                </label>
                <input
                  type="text"
                  value={kmsKeyId}
                  onChange={(e) => setKmsKeyId(e.target.value)}
                  placeholder="arn:aws:kms:us-east-1:000000000000:key/..."
                  className="w-full max-w-md px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211]"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Step 4: Tags */}
        <div className="bg-white border border-[#d5dbdb] rounded p-5 space-y-3 shadow-sm">
          <h2 className="text-[15px] font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
            Tags <span className="text-[#545b64] font-normal text-[12px]">({tags.length})</span>
          </h2>
          <div className="flex items-center gap-2 max-w-lg">
            <input
              type="text"
              placeholder="Key"
              value={tagKey}
              onChange={(e) => setTagKey(e.target.value)}
              className="w-1/2 px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211]"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
            />
            <input
              type="text"
              placeholder="Value (optional)"
              value={tagValue}
              onChange={(e) => setTagValue(e.target.value)}
              className="w-1/2 px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211]"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-3 py-1.5 text-[13px] font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa]"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            >
              Add tag
            </button>
          </div>

          {tags.length > 0 && (
            <div className="mt-2 space-y-1">
              {tags.map((t, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-[12px] bg-[#f2f3f3] px-3 py-1 rounded max-w-lg"
                >
                  <span className="font-mono text-[#16191f]">
                    {t.key} = {t.value || "—"}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(idx)}
                    className="text-[#d13212] hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#eaeded]">
          <Link
            href="/location/trackers"
            className="px-4 py-1.5 text-[13px] font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa]"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-1.5 text-[13px] font-bold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded shadow-sm transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            {submitting ? "Creating tracker..." : "Create tracker"}
          </button>
        </div>
      </form>
    </div>
  );
}
