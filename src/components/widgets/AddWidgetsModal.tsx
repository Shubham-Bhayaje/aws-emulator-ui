/**
 * AddWidgetsModal.tsx – Modal dialog allowing users to customize and add/remove
 * widgets on the AWS Console Home dashboard.
 * Zero emojis, Cloudscape enterprise design.
 */

"use client";

export interface WidgetVisibility {
  recentlyVisited: boolean;
  costAndUsage: boolean;
  security: boolean;
  awsHealth: boolean;
  welcome: boolean;
}

interface AddWidgetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  visibility: WidgetVisibility;
  onToggleWidget: (key: keyof WidgetVisibility) => void;
  onResetDefaults: () => void;
}

export default function AddWidgetsModal({
  isOpen,
  onClose,
  visibility,
  onToggleWidget,
  onResetDefaults,
}: AddWidgetsModalProps) {
  if (!isOpen) return null;

  const widgetDefinitions: {
    key: keyof WidgetVisibility;
    title: string;
    description: string;
    category: string;
  }[] = [
    {
      key: "recentlyVisited",
      title: "Recently visited",
      description: "Quick 2-column launcher for frequently accessed AWS services and features.",
      category: "Navigation",
    },
    {
      key: "security",
      title: "Security",
      description: "Displays your account's AWS Security Hub score, failed controls, and high/critical findings.",
      category: "Security & Compliance",
    },
    {
      key: "welcome",
      title: "Welcome to AWS",
      description: "Onboarding guides, certification paths, and new AWS announcements.",
      category: "Documentation",
    },
    {
      key: "costAndUsage",
      title: "Cost and usage",
      description: "Month-to-date spending, forecasted costs, stacked service cost trends, and active AWS Budgets.",
      category: "Cost Management",
    },
    {
      key: "awsHealth",
      title: "AWS Health",
      description: "Real-time visibility into AWS service events, operational notifications, and local emulator status.",
      category: "Operations",
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-lg shadow-2xl border border-[#d5dbdb] w-full max-w-[650px] overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#eaeded] flex items-center justify-between bg-white">
          <div>
            <h2 className="text-[17px] font-bold text-[#16191f]">Add widgets to Console Home</h2>
            <p className="text-[12px] text-[#545b64]">Choose widgets to display on your personal console dashboard.</p>
          </div>
          <button
            onClick={onClose}
            className="text-[#879596] hover:text-[#16191f] p-1 rounded hover:bg-[#f2f3f3]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Widget List */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3.5">
          {widgetDefinitions.map((w) => {
            const isAdded = visibility[w.key];
            return (
              <div
                key={w.key}
                className="p-3.5 border border-[#eaeded] rounded-sm hover:border-[#aab7b8] transition-colors flex items-start justify-between gap-4 bg-white"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[13px] text-[#16191f]">{w.title}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#f2f3f3] text-[#545b64] font-medium">
                      {w.category}
                    </span>
                  </div>
                  <p className="text-[12px] text-[#545b64] leading-relaxed">{w.description}</p>
                </div>

                <button
                  type="button"
                  onClick={() => onToggleWidget(w.key)}
                  className={`px-3 py-1 text-[12px] rounded-sm font-medium shrink-0 transition-colors ${
                    isAdded
                      ? "border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3]"
                      : "bg-[#ec7211] text-white hover:bg-[#eb5f07]"
                  }`}
                >
                  {isAdded ? "Remove" : "+ Add widget"}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#eaeded] bg-[#fafafa] flex items-center justify-between">
          <button
            type="button"
            onClick={onResetDefaults}
            className="text-[12px] text-[#0073bb] hover:text-[#ec7211] hover:underline"
          >
            Reset to default layout
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-[13px] bg-[#0073bb] text-white rounded-sm font-medium hover:bg-[#005a9e]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
