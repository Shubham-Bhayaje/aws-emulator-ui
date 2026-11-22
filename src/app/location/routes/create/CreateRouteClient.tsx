"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createRouteCalculatorAction } from "../../actions";

export default function CreateRouteClient() {
  const router = useRouter();

  const [calculatorName, setCalculatorName] = useState("");
  const [dataSource, setDataSource] = useState("Esri");
  const [description, setDescription] = useState("");

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
    if (!calculatorName.trim()) {
      setErrorMsg("Calculator name is required.");
      return;
    }

    const nameRegex = /^[-._a-zA-Z0-9]+$/;
    if (!nameRegex.test(calculatorName.trim())) {
      setErrorMsg(
        "Calculator name can contain only alphanumeric characters, dashes (-), underscores (_), and periods (.)."
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
      const res = await createRouteCalculatorAction({
        calculatorName: calculatorName.trim(),
        dataSource,
        description: description.trim() || undefined,
        tags: Object.keys(tagsObj).length > 0 ? tagsObj : undefined,
      });

      if (res.success) {
        router.push(`/location/routes/${res.calculatorName || calculatorName.trim()}`);
      } else {
        setErrorMsg(res.error || "Failed to create route calculator.");
      }
    } catch {
      setErrorMsg("An unexpected error occurred while creating route calculator.");
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
        <Link href="/location/routes" className="hover:underline">
          Route calculators
        </Link>
        <span className="mx-1 text-[#879596]">/</span>
        <span className="text-[#16191f] font-medium">Create calculator</span>
      </div>

      {/* Header */}
      <div className="pb-2 border-b border-[#eaeded]">
        <h1 className="text-[20px] font-bold text-[#16191f]">Create route calculator</h1>
        <p className="text-[13px] text-[#545b64] mt-0.5">
          Select a data provider to compute accurate road routes, estimated travel durations, and distance matrix lookups.
        </p>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-3 bg-[#fdf2f2] border border-[#d13212] rounded text-[13px] text-[#d13212]">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Configuration */}
        <div className="bg-white border border-[#d5dbdb] rounded p-5 space-y-4 shadow-sm">
          <h2 className="text-[15px] font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
            Route calculator configuration
          </h2>

          {/* Name */}
          <div>
            <label className="block text-[13px] font-bold text-[#16191f] mb-1">
              Calculator name <span className="text-[#d13212]">*</span>
            </label>
            <input
              type="text"
              required
              value={calculatorName}
              onChange={(e) => setCalculatorName(e.target.value)}
              placeholder="e.g. RegionalDeliveryRoutes"
              maxLength={100}
              className="w-full max-w-md px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211]"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
            />
            <p className="text-[11px] text-[#545b64] mt-1">
              Must be unique across your account. Can contain 1 to 100 alphanumeric characters, hyphens, periods, and underscores.
            </p>
          </div>

          {/* Data Provider */}
          <div>
            <label className="block text-[13px] font-bold text-[#16191f] mb-1">
              Data provider <span className="text-[#d13212]">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
              <label
                className={`p-3 border rounded cursor-pointer transition-colors ${
                  dataSource === "Esri" ? "border-[#0073bb] bg-[#f2f8fd]" : "border-[#d5dbdb] hover:bg-[#fafafa]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#16191f] text-[13px]">Esri</span>
                  <input
                    type="radio"
                    name="dataSource"
                    value="Esri"
                    checked={dataSource === "Esri"}
                    onChange={() => setDataSource("Esri")}
                    className="accent-[#0073bb]"
                  />
                </div>
                <p className="text-[11px] text-[#545b64] mt-1">
                  Global street and highway routing data with live traffic awareness and turn-by-turn navigation.
                </p>
              </label>

              <label
                className={`p-3 border rounded cursor-pointer transition-colors ${
                  dataSource === "HERE" ? "border-[#0073bb] bg-[#f2f8fd]" : "border-[#d5dbdb] hover:bg-[#fafafa]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#16191f] text-[13px]">HERE Technologies</span>
                  <input
                    type="radio"
                    name="dataSource"
                    value="HERE"
                    checked={dataSource === "HERE"}
                    onChange={() => setDataSource("HERE")}
                    className="accent-[#0073bb]"
                  />
                </div>
                <p className="text-[11px] text-[#545b64] mt-1">
                  Specialized fleet routing data including truck height, weight, axle count, and hazmat regulations.
                </p>
              </label>
            </div>
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
              placeholder="Enter a description for this route calculator"
              maxLength={1000}
              className="w-full max-w-md px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211]"
            />
          </div>
        </div>

        {/* Step 2: Pricing and terms */}
        <div className="bg-[#fafafa] border border-[#eaeded] rounded p-4 text-[12px] text-[#545b64] space-y-1">
          <div className="font-bold text-[#16191f]">Pricing and terms</div>
          <p>
            Route calculations are billed under the <strong>Request-Based Usage</strong> pricing plan per route and per departure-destination pair.
          </p>
        </div>

        {/* Step 3: Tags */}
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
            href="/location/routes"
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
            {submitting ? "Creating calculator..." : "Create calculator"}
          </button>
        </div>
      </form>
    </div>
  );
}
