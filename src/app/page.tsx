/**
 * Console Home – Matches the real AWS Console Home layout exactly.
 *
 * Title "Console Home" with "Reset to default layout" and "+ Add widgets" buttons.
 * Two widgets side by side: "Recently visited" and "Welcome to AWS".
 * No fake data cards (no Cost, Health, Security).
 */

import RecentlyVisited from "@/components/RecentlyVisited";
import WelcomeWidget from "@/components/WelcomeWidget";

export default function HomePage() {
  return (
    <div className="max-w-[1200px] mx-auto p-6">
      {/* Page header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-[22px] font-bold text-[#16191f]">Console Home</h1>
        <div className="flex items-center gap-2">
          <button className="px-3 py-[5px] text-[13px] border border-[#545b64] rounded-sm text-[#545b64] hover:bg-[#fafafa] hover:border-[#16191f]">
            Reset to default layout
          </button>
          <button className="px-3 py-[5px] text-[13px] bg-[#ec7211] text-white rounded-sm hover:bg-[#eb5f07] font-medium">
            + Add widgets
          </button>
        </div>
      </div>

      {/* Widgets row */}
      <div className="grid grid-cols-[1fr_300px] gap-4">
        {/* Recently visited – takes up most of the width */}
        <RecentlyVisited />

        {/* Welcome to AWS – narrower right column */}
        <WelcomeWidget />
      </div>
    </div>
  );
}
