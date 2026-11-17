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
        <div className="text-[40px] mb-3">🚧</div>
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
