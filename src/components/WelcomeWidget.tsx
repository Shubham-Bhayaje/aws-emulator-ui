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
          <div className="mt-1 w-7 h-7 rounded bg-[#f2f8fd] border border-[#a4cae8] flex items-center justify-center text-[#0073bb] shrink-0">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
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
            <p className="text-[12px] text-[#545b64] mt-0.5">
              Learn the fundamentals and find valuable help to get the most out of AWS.
            </p>
          </div>
        </div>

        {/* Training */}
        <div className="flex items-start gap-3 px-4 py-3">
          <div className="mt-1 w-7 h-7 rounded bg-[#fbf5ed] border border-[#fbd89a] flex items-center justify-center text-[#ec7211] shrink-0">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c3 3 9 3 12 0v-5" />
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
            <p className="text-[12px] text-[#545b64] mt-0.5">
              Learn from AWS experts and advance your skills and knowledge.
            </p>
          </div>
        </div>

        {/* What's new */}
        <div className="flex items-start gap-3 px-4 py-3">
          <div className="mt-1 w-7 h-7 rounded bg-[#f2f3f3] border border-[#d5dbdb] flex items-center justify-center text-[#545b64] shrink-0">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
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
            <p className="text-[12px] text-[#545b64] mt-0.5">
              Discover new AWS services, features, and Regions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
