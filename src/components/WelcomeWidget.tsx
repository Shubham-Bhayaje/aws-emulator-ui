/**
 * WelcomeWidget.tsx – "Welcome to AWS" widget matching the real Console Home.
 * Features:
 * - Rocket icon for "Getting started with AWS"
 * - Certificate ribbon icon for "Training and certification"
 * - Lightbulb icon for "What's new with AWS?"
 * - Drag handle, resize handle, and kebab menu options
 * - Zero emojis, Cloudscape enterprise styling.
 */

"use client";

import { useState } from "react";

interface WelcomeWidgetProps {
  onRemove?: () => void;
}

export default function WelcomeWidget({ onRemove }: WelcomeWidgetProps) {
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

          <h2 className="text-[14px] font-bold text-[#16191f]">Welcome to AWS</h2>
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

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-around space-y-4">
        {/* Getting started with Rocket SVG */}
        <div className="flex items-start gap-3">
          <div className="text-[#0073bb] shrink-0 mt-0.5">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
              <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
              <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
              <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
            </svg>
          </div>
          <div>
            <a
              href="https://aws.amazon.com/getting-started/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] font-bold text-[#0073bb] hover:text-[#ec7211] hover:underline"
            >
              Getting started with AWS
            </a>
            <p className="text-[12px] text-[#545b64] mt-0.5 leading-snug">
              Learn the fundamentals and find valuable information to get the most out of AWS.
            </p>
          </div>
        </div>

        {/* Training with Certificate Badge SVG */}
        <div className="flex items-start gap-3 border-t border-[#eaeded] pt-3">
          <div className="text-[#0073bb] shrink-0 mt-0.5">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="6" />
              <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
            </svg>
          </div>
          <div>
            <a
              href="https://aws.amazon.com/training/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] font-bold text-[#0073bb] hover:text-[#ec7211] hover:underline"
            >
              Training and certification
            </a>
            <p className="text-[12px] text-[#545b64] mt-0.5 leading-snug">
              Learn from AWS experts and advance your skills and knowledge.
            </p>
          </div>
        </div>

        {/* What's new with Lightbulb SVG */}
        <div className="flex items-start gap-3 border-t border-[#eaeded] pt-3">
          <div className="text-[#0073bb] shrink-0 mt-0.5">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
              <path d="M9 18h6" />
              <path d="M10 22h4" />
            </svg>
          </div>
          <div>
            <a
              href="https://aws.amazon.com/new/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] font-bold text-[#0073bb] hover:text-[#ec7211] hover:underline"
            >
              What&apos;s new with AWS?
            </a>
            <p className="text-[12px] text-[#545b64] mt-0.5 leading-snug">
              Discover new AWS services, features, and Regions.
            </p>
          </div>
        </div>
      </div>

      {/* Resize handle icon */}
      <div className="absolute right-1 bottom-1 text-[#aab7b8] pointer-events-none">
        <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2">
          <line x1="9" y1="3" x2="3" y2="9" />
          <line x1="9" y1="6" x2="6" y2="9" />
        </svg>
      </div>

      {/* Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#d5dbdb] shadow-2xl max-w-[480px] w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#eaeded] pb-3">
              <h3 className="text-[16px] font-bold text-[#16191f]">About Welcome to AWS</h3>
              <button onClick={() => setShowInfoModal(false)} className="text-[#879596] hover:text-[#16191f]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <p className="text-[13px] text-[#545b64] leading-relaxed">
              Provides direct onboarding documentation, certification preparation pathways, and recent release notes
              for cloud developers.
            </p>
            <div className="flex justify-end pt-2 border-t border-[#eaeded]">
              <button
                onClick={() => setShowInfoModal(false)}
                className="px-4 py-1.5 text-[13px] bg-[#0073bb] text-white rounded-sm font-medium hover:bg-[#005a9e]"
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
