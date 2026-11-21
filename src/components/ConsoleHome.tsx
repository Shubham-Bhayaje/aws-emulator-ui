/**
 * ConsoleHome.tsx – Interactive Console Home Dashboard matching the official AWS Management Console.
 * Manages widget positioning, visibility, reset to default layout, and "+ Add widgets" modal.
 * Zero emojis, Cloudscape enterprise styling.
 * Strict 32px button height standard.
 */

"use client";

import { useState, useEffect } from "react";
import RecentlyVisited from "./RecentlyVisited";
import SecurityWidget from "./widgets/SecurityWidget";
import WelcomeWidget from "./WelcomeWidget";
import CostAndUsageWidget from "./widgets/CostAndUsageWidget";
import HealthWidget from "./widgets/HealthWidget";
import BuildASolutionWidget from "./widgets/BuildASolutionWidget";
import ExploreAwsWidget from "./widgets/ExploreAwsWidget";
import AddWidgetsModal, { WidgetVisibility } from "./widgets/AddWidgetsModal";

const DEFAULT_VISIBILITY: WidgetVisibility = {
  recentlyVisited: true,
  security: true,
  welcome: true,
  costAndUsage: true,
  awsHealth: true,
  buildASolution: true,
  exploreAws: true,
};

export default function ConsoleHome() {
  const [visibility, setVisibility] = useState<WidgetVisibility>(DEFAULT_VISIBILITY);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showConsoleInfoModal, setShowConsoleInfoModal] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("aws_console_home_widgets");
      if (saved) {
        setVisibility({ ...DEFAULT_VISIBILITY, ...JSON.parse(saved) });
      }
    } catch { /* ignore */ }
  }, []);

  function handleToggleWidget(key: keyof WidgetVisibility) {
    const updated = { ...visibility, [key]: !visibility[key] };
    setVisibility(updated);
    try {
      localStorage.setItem("aws_console_home_widgets", JSON.stringify(updated));
    } catch { /* ignore */ }
  }

  function handleRemoveWidget(key: keyof WidgetVisibility) {
    const updated = { ...visibility, [key]: false };
    setVisibility(updated);
    try {
      localStorage.setItem("aws_console_home_widgets", JSON.stringify(updated));
    } catch { /* ignore */ }
  }

  function handleResetDefaults() {
    setVisibility(DEFAULT_VISIBILITY);
    try {
      localStorage.setItem("aws_console_home_widgets", JSON.stringify(DEFAULT_VISIBILITY));
    } catch { /* ignore */ }
  }

  return (
    <div className="max-w-[1440px] mx-auto p-4 sm:p-6 space-y-4">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-2">
          <h1 className="text-[22px] font-bold text-[#16191f]">Console Home</h1>
          <button
            onClick={() => setShowConsoleInfoModal(true)}
            className="text-[12px] text-[#0073bb] hover:text-[#ec7211] hover:underline cursor-pointer"
          >
            Info
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Info & History Icons */}
          <div className="hidden sm:flex items-center gap-2 text-[#545b64] mr-1">
            <button
              onClick={() => setShowConsoleInfoModal(true)}
              className="p-1 hover:text-[#16191f] rounded hover:bg-[#f2f3f3]"
              title="Dashboard info"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </button>
            <button
              onClick={handleResetDefaults}
              className="p-1 hover:text-[#16191f] rounded hover:bg-[#f2f3f3]"
              title="Reset layout"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </button>
          </div>

          <button
            type="button"
            onClick={handleResetDefaults}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center justify-center px-3.5 text-[13px] border border-[#545b64] rounded-sm text-[#16191f] bg-white hover:bg-[#f2f3f3] font-normal transition-colors"
          >
            Reset to default layout
          </button>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center justify-center px-3.5 text-[13px] bg-[#ec7211] text-white rounded-sm hover:bg-[#eb5f07] font-bold transition-colors"
          >
            + Add widgets
          </button>
        </div>
      </div>

      {/* Top Row Grid: Recently Visited (5/12) | Security (3.5/12) | Welcome to AWS (3.5/12) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {visibility.recentlyVisited && (
          <div className={`${visibility.security && visibility.welcome ? "lg:col-span-5" : "lg:col-span-6"} col-span-12`}>
            <RecentlyVisited onRemove={() => handleRemoveWidget("recentlyVisited")} />
          </div>
        )}

        {visibility.security && (
          <div className={`${visibility.recentlyVisited && visibility.welcome ? "lg:col-span-3" : "lg:col-span-6"} col-span-12`}>
            <SecurityWidget onRemove={() => handleRemoveWidget("security")} />
          </div>
        )}

        {visibility.welcome && (
          <div className={`${visibility.recentlyVisited && visibility.security ? "lg:col-span-4" : "lg:col-span-6"} col-span-12`}>
            <WelcomeWidget onRemove={() => handleRemoveWidget("welcome")} />
          </div>
        )}
      </div>

      {/* Middle Row Grid: Cost and usage (7/12) | AWS Health (5/12) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {visibility.costAndUsage && (
          <div className={`${visibility.awsHealth ? "lg:col-span-7" : "lg:col-span-12"} col-span-12`}>
            <CostAndUsageWidget onRemove={() => handleRemoveWidget("costAndUsage")} />
          </div>
        )}

        {visibility.awsHealth && (
          <div className={`${visibility.costAndUsage ? "lg:col-span-5" : "lg:col-span-12"} col-span-12`}>
            <HealthWidget onRemove={() => handleRemoveWidget("awsHealth")} />
          </div>
        )}
      </div>

      {/* Bottom Row Grid: Build a solution (7/12) | Explore AWS (5/12) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {visibility.buildASolution && (
          <div className={`${visibility.exploreAws ? "lg:col-span-7" : "lg:col-span-12"} col-span-12`}>
            <BuildASolutionWidget onRemove={() => handleRemoveWidget("buildASolution")} />
          </div>
        )}

        {visibility.exploreAws && (
          <div className={`${visibility.buildASolution ? "lg:col-span-5" : "lg:col-span-12"} col-span-12`}>
            <ExploreAwsWidget onRemove={() => handleRemoveWidget("exploreAws")} />
          </div>
        )}
      </div>

      {/* Add Widgets Customization Modal */}
      <AddWidgetsModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        visibility={visibility}
        onToggleWidget={handleToggleWidget}
        onResetDefaults={handleResetDefaults}
      />

      {/* Console Home Info Modal */}
      {showConsoleInfoModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#d5dbdb] shadow-2xl max-w-[500px] w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#eaeded] pb-3">
              <h3 className="text-[16px] font-bold text-[#16191f]">About Console Home</h3>
              <button onClick={() => setShowConsoleInfoModal(false)} className="text-[#879596] hover:text-[#16191f]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="text-[13px] text-[#545b64] space-y-2 leading-relaxed">
              <p>
                <strong>Console Home</strong> is your personalized dashboard for the AWS Management Console.
                You can customize widgets, monitor costs and budgets, evaluate security posture, explore architectural
                guidance, and monitor live service health.
              </p>
              <p>
                Click <strong>+ Add widgets</strong> to enable or disable widgets, or <strong>Reset to default layout</strong>
                to return to the authentic AWS layout.
              </p>
            </div>
            <div className="flex justify-end pt-2 border-t border-[#eaeded]">
              <button
                onClick={() => setShowConsoleInfoModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
