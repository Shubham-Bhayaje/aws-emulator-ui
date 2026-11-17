/**
 * WelcomeWidget – "Welcome to AWS" card matching the real Console Home.
 * Shows helpful links to documentation/getting started.
 */

export default function WelcomeWidget() {
  return (
    <div className="bg-white border border-[#d5dbdb] rounded awsui-shadow">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#eaeded]">
        <h2 className="text-[14px] font-bold text-[#16191f]">Welcome to AWS</h2>
        <button className="text-[#545b64] hover:text-[#16191f]" title="Widget options">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="5" r="1.5"/>
            <circle cx="12" cy="12" r="1.5"/>
            <circle cx="12" cy="19" r="1.5"/>
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="divide-y divide-[#eaeded]">
        {/* Getting started */}
        <div className="flex items-start gap-3 px-4 py-3">
          <div className="mt-0.5 text-[22px]">📘</div>
          <div>
            <a
              href="https://aws.amazon.com/getting-started/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] font-bold text-[#0073bb] hover:text-[#ec7211] hover:underline"
            >
              Getting started with AWS ↗
            </a>
            <p className="text-[12px] text-[#545b64] mt-0.5">
              Learn the fundamentals and find valuable help to get the most out of AWS.
            </p>
          </div>
        </div>

        {/* Training */}
        <div className="flex items-start gap-3 px-4 py-3">
          <div className="mt-0.5 text-[22px]">🎓</div>
          <div>
            <a
              href="https://aws.amazon.com/training/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] font-bold text-[#0073bb] hover:text-[#ec7211] hover:underline"
            >
              Training and certification ↗
            </a>
            <p className="text-[12px] text-[#545b64] mt-0.5">
              Learn from AWS experts and advance your skills and knowledge.
            </p>
          </div>
        </div>

        {/* What's new */}
        <div className="flex items-start gap-3 px-4 py-3">
          <div className="mt-0.5 text-[22px]">🆕</div>
          <div>
            <a
              href="https://aws.amazon.com/new/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] font-bold text-[#0073bb] hover:text-[#ec7211] hover:underline"
            >
              What&apos;s new with AWS? ↗
            </a>
            <p className="text-[12px] text-[#545b64] mt-0.5">
              Discover new AWS services, features, and Regions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
