/**
 * ExploreAwsWidget.tsx – Authentic AWS Console "Explore AWS" widget.
 * Features:
 * - Direct learning cards for Hands-on Tutorials, Free Tier, Architecture Center, and Skill Builder
 * - Strict 32px button height standard
 * - Kebab menu actions (Widget info, Remove widget)
 * - Zero emojis, Cloudscape enterprise design.
 */

"use client";

import { useState } from "react";
import Link from "next/link";

interface ExploreAwsWidgetProps {
  onRemove?: () => void;
}

interface ExploreItem {
  id: string;
  title: string;
  tag: string;
  description: string;
  actionLabel: string;
  href: string;
}

const EXPLORE_ITEMS: ExploreItem[] = [
  {
    id: "explore-tutorials",
    title: "Hands-on Tutorials",
    tag: "Hands-on",
    description: "Learn AWS by building real applications with vetted step-by-step 10-minute tutorials.",
    actionLabel: "Browse tutorials",
    href: "https://aws.amazon.com/getting-started/hands-on-tutorials/",
  },
  {
    id: "explore-freetier",
    title: "AWS Free Tier",
    tag: "Offers",
    description: "Explore 100+ AWS products and gain hands-on experience with always-free, 12-month free, and trials.",
    actionLabel: "View Free Tier",
    href: "https://aws.amazon.com/free/",
  },
  {
    id: "explore-architecture",
    title: "Architecture Center",
    tag: "Reference",
    description: "Reference architecture diagrams, vetted technical blueprints, and AWS Well-Architected guidance.",
    actionLabel: "Explore architectures",
    href: "https://aws.amazon.com/architecture/",
  },
  {
    id: "explore-skillbuilder",
    title: "AWS Skill Builder",
    tag: "Training",
    description: "Build in-demand cloud skills with 600+ free digital courses and certification preparation paths.",
    actionLabel: "Start learning",
    href: "https://explore.skillbuilder.aws/",
  },
];

export default function ExploreAwsWidget({ onRemove }: ExploreAwsWidgetProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  return (
    <div className="relative bg-white border border-[#d5dbdb] rounded-sm awsui-shadow flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#eaeded] bg-white">
        <div className="flex items-center gap-2">
          {/* Drag Handle Icon */}
          <div className="text-[#879596] cursor-grab active:cursor-grabbing p-0.5" title="Move widget">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="9" cy="6" r="1.5" fill="currentColor" />
              <circle cx="15" cy="6" r="1.5" fill="currentColor" />
              <circle cx="9" cy="12" r="1.5" fill="currentColor" />
              <circle cx="15" cy="12" r="1.5" fill="currentColor" />
              <circle cx="9" cy="18" r="1.5" fill="currentColor" />
              <circle cx="15" cy="18" r="1.5" fill="currentColor" />
            </svg>
          </div>

          <h2 className="text-[14px] font-bold text-[#16191f]">Explore AWS</h2>
          <button
            onClick={() => setShowInfoModal(true)}
            className="text-[12px] text-[#0073bb] hover:text-[#ec7211] hover:underline cursor-pointer"
          >
            Info
          </button>
        </div>

        {/* Kebab Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 text-[#545b64] hover:text-[#16191f] rounded hover:bg-[#f2f3f3]"
            title="Widget actions"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="1.8" />
              <circle cx="12" cy="12" r="1.8" />
              <circle cx="12" cy="19" r="1.8" />
            </svg>
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-[#d5dbdb] rounded shadow-lg py-1 z-30 text-[13px]">
              <button
                onClick={() => {
                  setShowInfoModal(true);
                  setShowMenu(false);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#f2f8fd] text-[#16191f]"
              >
                Widget info
              </button>
              {onRemove && (
                <button
                  onClick={() => {
                    onRemove();
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#fdf3f1] text-[#d13212] border-t border-[#eaeded]"
                >
                  Remove widget
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Widget Body */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <p className="text-[13px] text-[#545b64] mb-3">
            Expand your cloud architecture expertise with official technical guides, reference architectures, and training.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {EXPLORE_ITEMS.map((item) => (
              <div
                key={item.id}
                className="p-3 border border-[#eaeded] rounded bg-white hover:border-[#aab7b8] transition-colors flex flex-col justify-between space-y-2"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[13px] font-bold text-[#16191f]">{item.title}</h3>
                    <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-[#f2f3f3] text-[#545b64] border border-[#eaeded]">
                      {item.tag}
                    </span>
                  </div>
                  <p className="text-[12px] text-[#545b64] leading-relaxed line-clamp-2">
                    {item.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#f2f3f3]">
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                    className="w-full inline-flex items-center justify-center font-bold text-[12px] px-3 rounded bg-white text-[#16191f] border border-[#545b64] hover:bg-[#f2f3f3] transition-colors"
                  >
                    <span>{item.actionLabel}</span>
                    <svg className="ml-1 w-3 h-3 text-[#545b64]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2 border-t border-[#eaeded] flex items-center justify-between text-[12px] text-[#545b64]">
          <span>Looking for certification practice?</span>
          <a
            href="https://aws.amazon.com/certification/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#0073bb] hover:underline font-medium inline-flex items-center gap-1"
          >
            AWS Certification Portal &rarr;
          </a>
        </div>
      </div>

      {/* Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#d5dbdb] shadow-2xl max-w-[450px] w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#eaeded] pb-3">
              <h3 className="text-[16px] font-bold text-[#16191f]">About Explore AWS</h3>
              <button onClick={() => setShowInfoModal(false)} className="text-[#879596] hover:text-[#16191f]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="text-[13px] text-[#545b64] space-y-2 leading-relaxed">
              <p>
                The <strong>Explore AWS</strong> widget surfaces official AWS training materials, free tier limits,
                and architectural best practices to help teams learn and build efficiently.
              </p>
            </div>
            <div className="flex justify-end pt-2 border-t border-[#eaeded]">
              <button
                onClick={() => setShowInfoModal(false)}
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
