"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createMapAction } from "../../actions";

interface MapStyleOption {
  styleId: string;
  provider: "Esri" | "HERE" | "Open Data";
  name: string;
  description: string;
  theme: "light" | "dark" | "imagery" | "terrain";
  previewBg: string;
  previewBorder: string;
}

const MAP_STYLES: MapStyleOption[] = [
  // Esri
  {
    styleId: "VectorEsriStreets",
    provider: "Esri",
    name: "Esri Streets",
    description: "Detailed street map for comprehensive navigation, road labeling, and city exploration.",
    theme: "light",
    previewBg: "bg-[#e8ece9]",
    previewBorder: "border-[#b5c7ba]",
  },
  {
    styleId: "VectorEsriTopographic",
    provider: "Esri",
    name: "Esri Topographic",
    description: "Topographic basemap with elevation contours, landforms, mountain shading, and water bodies.",
    theme: "terrain",
    previewBg: "bg-[#e2e8d8]",
    previewBorder: "border-[#a8bc94]",
  },
  {
    styleId: "VectorEsriNavigation",
    provider: "Esri",
    name: "Esri Navigation",
    description: "High-contrast road network optimized for turn-by-turn routing and transport logistics.",
    theme: "light",
    previewBg: "bg-[#fff9e6]",
    previewBorder: "border-[#edd382]",
  },
  {
    styleId: "VectorEsriLightGray",
    provider: "Esri",
    name: "Esri Light Gray Canvas",
    description: "Minimalist neutral basemap designed to highlight custom data overlays and markers.",
    theme: "light",
    previewBg: "bg-[#f2f2f2]",
    previewBorder: "border-[#d0d0d0]",
  },
  {
    styleId: "VectorEsriDarkGray",
    provider: "Esri",
    name: "Esri Dark Gray Canvas",
    description: "Dark-themed backdrop that emphasizes bright geospatial overlays and data visualizations.",
    theme: "dark",
    previewBg: "bg-[#2b2b2b]",
    previewBorder: "border-[#404040]",
  },
  {
    styleId: "RasterEsriImagery",
    provider: "Esri",
    name: "Esri Imagery",
    description: "High-resolution satellite and aerial photography with worldwide coverage.",
    theme: "imagery",
    previewBg: "bg-[#293d2e]",
    previewBorder: "border-[#1e2e22]",
  },

  // HERE
  {
    styleId: "VectorHereExplore",
    provider: "HERE",
    name: "HERE Explore",
    description: "High quality vector map optimized for global search, discovery, and navigation.",
    theme: "light",
    previewBg: "bg-[#f4f7f6]",
    previewBorder: "border-[#c4d6d1]",
  },
  {
    styleId: "VectorHereExploreTruck",
    provider: "HERE",
    name: "HERE Explore Truck",
    description: "Truck and fleet map styling showing vehicle height, weight, and hazmat restrictions.",
    theme: "light",
    previewBg: "bg-[#eef2f5]",
    previewBorder: "border-[#becdd9]",
  },

  // Open Data
  {
    styleId: "VectorOpenDataStandardLight",
    provider: "Open Data",
    name: "Open Data Standard Light",
    description: "Basemap powered by OpenStreetMap data, styled with clear roads, boundaries, and points of interest.",
    theme: "light",
    previewBg: "bg-[#f0f4f8]",
    previewBorder: "border-[#c3d1de]",
  },
  {
    styleId: "VectorOpenDataStandardDark",
    provider: "Open Data",
    name: "Open Data Standard Dark",
    description: "Dark rendition of OpenStreetMap data with muted roads and prominent water bodies.",
    theme: "dark",
    previewBg: "bg-[#1f2937]",
    previewBorder: "border-[#374151]",
  },
];

export default function CreateMapClient() {
  const router = useRouter();

  const [mapName, setMapName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("VectorEsriStreets");
  const [providerFilter, setProviderFilter] = useState<"All" | "Esri" | "HERE" | "Open Data">("All");

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
    if (!mapName.trim()) {
      setErrorMsg("Map name is required.");
      return;
    }

    const nameRegex = /^[-._a-zA-Z0-9]+$/;
    if (!nameRegex.test(mapName.trim())) {
      setErrorMsg(
        "Map name can contain only alphanumeric characters, dashes (-), underscores (_), and periods (.)."
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
      const res = await createMapAction({
        mapName: mapName.trim(),
        style: selectedStyle,
        description: description.trim() || undefined,
        tags: Object.keys(tagsObj).length > 0 ? tagsObj : undefined,
      });

      if (res.success) {
        router.push(`/location/maps/${res.mapName || mapName.trim()}`);
      } else {
        setErrorMsg(res.error || "Failed to create map.");
      }
    } catch {
      setErrorMsg("An unexpected error occurred while creating map.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredStyles = MAP_STYLES.filter((s) => providerFilter === "All" || s.provider === providerFilter);

  return (
    <div className="max-w-4xl space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center text-[12px] text-[#545b64]">
        <Link href="/location" className="hover:underline">
          Amazon Location Service
        </Link>
        <span className="mx-1 text-[#879596]">/</span>
        <Link href="/location/maps" className="hover:underline">
          Maps
        </Link>
        <span className="mx-1 text-[#879596]">/</span>
        <span className="text-[#16191f] font-medium">Create map</span>
      </div>

      {/* Header */}
      <div className="pb-2 border-b border-[#eaeded]">
        <h1 className="text-[20px] font-bold text-[#16191f]">Create map</h1>
        <p className="text-[13px] text-[#545b64] mt-0.5">
          Choose a data provider and visual map style. The map resource can then be embedded using MapLibre GL JS or Mapbox GL.
        </p>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-3 bg-[#fdf2f2] border border-[#d13212] rounded text-[13px] text-[#d13212]">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Map Configuration */}
        <div className="bg-white border border-[#d5dbdb] rounded p-5 space-y-4 shadow-sm">
          <h2 className="text-[15px] font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
            Map configuration
          </h2>

          {/* Name */}
          <div>
            <label className="block text-[13px] font-bold text-[#16191f] mb-1">
              Name <span className="text-[#d13212]">*</span>
            </label>
            <input
              type="text"
              required
              value={mapName}
              onChange={(e) => setMapName(e.target.value)}
              placeholder="e.g. MyDeliveryMap"
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
              placeholder="Enter a description for this map resource"
              maxLength={1000}
              className="w-full max-w-md px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211]"
            />
          </div>
        </div>

        {/* Step 2: Choose Map Style */}
        <div className="bg-white border border-[#d5dbdb] rounded p-5 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#eaeded] pb-2">
            <div>
              <h2 className="text-[15px] font-bold text-[#16191f]">Map style</h2>
              <p className="text-[12px] text-[#545b64]">
                Select the basemap styling and visual layers for your application.
              </p>
            </div>

            {/* Provider Filter Tabs */}
            <div className="flex items-center gap-1">
              {(["All", "Esri", "HERE", "Open Data"] as const).map((prov) => (
                <button
                  key={prov}
                  type="button"
                  onClick={() => setProviderFilter(prov)}
                  className={`px-2.5 py-1 text-[12px] rounded font-medium transition-colors ${
                    providerFilter === prov
                      ? "bg-[#0073bb] text-white"
                      : "bg-[#f2f3f3] text-[#545b64] hover:text-[#16191f]"
                  }`}
                  style={{ height: "28px" }}
                >
                  {prov}
                </button>
              ))}
            </div>
          </div>

          {/* Style Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {filteredStyles.map((style) => {
              const isSelected = selectedStyle === style.styleId;
              return (
                <div
                  key={style.styleId}
                  onClick={() => setSelectedStyle(style.styleId)}
                  className={`border-2 rounded p-3.5 cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? "border-[#0073bb] bg-[#f2f8fd] shadow"
                      : "border-[#d5dbdb] hover:border-[#aab7b8] bg-white"
                  }`}
                >
                  <div>
                    {/* Visual Preview Swatch */}
                    <div
                      className={`h-16 w-full rounded border ${style.previewBg} ${style.previewBorder} flex items-center justify-center relative overflow-hidden mb-2.5`}
                    >
                      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:12px_12px]"></div>
                      <span
                        className={`text-[11px] font-mono px-2 py-0.5 rounded shadow-sm ${
                          style.theme === "dark" || style.theme === "imagery"
                            ? "bg-black/60 text-white"
                            : "bg-white/80 text-[#16191f]"
                        }`}
                      >
                        {style.name}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-bold text-[#16191f]">{style.name}</span>
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#f2f3f3] text-[#545b64]">
                        {style.provider}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#545b64] mt-1.5 leading-snug">
                      {style.description}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-[#eaeded] flex items-center justify-between text-[11px]">
                    <span className="font-mono text-[#879596] truncate mr-2">{style.styleId}</span>
                    <input
                      type="radio"
                      name="mapStyle"
                      checked={isSelected}
                      onChange={() => setSelectedStyle(style.styleId)}
                      className="accent-[#0073bb]"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 3: Pricing Plan & Data Terms */}
        <div className="bg-[#fafafa] border border-[#eaeded] rounded p-4 text-[12px] text-[#545b64] space-y-2">
          <div className="font-bold text-[#16191f]">Pricing and terms</div>
          <p>
            By creating this map, you agree that your use of the map data is subject to the terms of your chosen data provider. Map tile requests are billed under the <strong>Request-Based Usage</strong> pricing plan.
          </p>
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
            href="/location/maps"
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
            {submitting ? "Creating map..." : "Create map"}
          </button>
        </div>
      </form>
    </div>
  );
}
