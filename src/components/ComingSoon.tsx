/**
 * ComingSoon – Placeholder content for services not yet implemented.
 * Matches the real AWS Console style with a friendly message.
 */

type ComingSoonProps = {
  serviceName: string;
  description: string;
};

export default function ComingSoon({ serviceName, description }: ComingSoonProps) {
  return (
    <div className="bg-white border border-[#d5dbdb] rounded awsui-shadow">
      <div className="px-4 py-3 border-b border-[#eaeded]">
        <h2 className="text-[14px] font-bold text-[#16191f]">{serviceName}</h2>
      </div>
      <div className="p-8 text-center">
        <div className="flex justify-center mb-3">
          <div className="w-12 h-12 rounded-lg bg-[#f2f3f3] border border-[#d5dbdb] flex items-center justify-center text-[#545b64]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </div>
        </div>
        <h3 className="text-[16px] font-bold text-[#16191f] mb-2">Coming Soon</h3>
        <p className="text-[13px] text-[#545b64] max-w-md mx-auto mb-4">
          {description}
        </p>
        <p className="text-[12px] text-[#aab7b8]">
          This service will be available in a future update.
        </p>
      </div>
    </div>
  );
}
