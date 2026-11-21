"use client";

import React, { useState } from "react";

export function SettingsClient() {
  const [lifecycleEventsActive, setLifecycleEventsActive] = useState(false);
  const [banner, setBanner] = useState<{ type: "success" | "info"; message: string } | null>(null);

  const toggleLifecycleEvents = () => {
    const nextState = !lifecycleEventsActive;
    setLifecycleEventsActive(nextState);
    setBanner({
      type: "success",
      message: `Group lifecycle events have been turned ${nextState ? "on" : "off"}.`,
    });
  };

  return (
    <div className="p-6 max-w-[1200px] mx-auto text-[#16191f]">
      {/* Banner */}
      {banner && (
        <div className="mb-4 p-4 rounded text-sm flex items-start justify-between border bg-[#f2fcf3] border-[#037f0c] text-[#037f0c]">
          <div>{banner.message}</div>
          <button
            onClick={() => setBanner(null)}
            className="text-xs font-bold hover:opacity-80 ml-4"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="pb-4 border-b border-[#eaeded] mb-6">
        <h1 className="text-xl font-bold text-[#16191f]">Resource Groups settings</h1>
        <p className="text-xs text-[#545b64] mt-1">
          Manage configuration and event notification settings for AWS Resource Groups.
        </p>
      </div>

      {/* Lifecycle events card */}
      <div className="bg-white border border-[#eaeded] rounded shadow-sm p-5 max-w-2xl">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold text-[#16191f]">Group lifecycle events</h2>
            <p className="text-xs text-[#545b64] mt-1">
              Resource group lifecycle events enable notifications in Amazon EventBridge when resources are added or
              removed from a group.
            </p>
          </div>
          <span
            className={`px-2 py-0.5 text-[11px] font-semibold border rounded ${
              lifecycleEventsActive
                ? "bg-[#f2fcf3] text-[#037f0c] border-[#a1dfa5]"
                : "bg-[#f2f3f3] text-[#545b64] border-[#eaeded]"
            }`}
          >
            {lifecycleEventsActive ? "Active" : "Inactive"}
          </span>
        </div>

        <div className="pt-4 border-t border-[#eaeded] flex justify-end">
          <button
            type="button"
            onClick={toggleLifecycleEvents}
            className={`px-4 text-xs font-semibold rounded ${
              lifecycleEventsActive
                ? "bg-white border border-[#aab7b8] text-[#16191f] hover:bg-[#f2f3f3]"
                : "bg-[#ec7211] text-white hover:bg-[#eb5f07]"
            }`}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            {lifecycleEventsActive ? "Turn off" : "Turn on"}
          </button>
        </div>
      </div>
    </div>
  );
}
