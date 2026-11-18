/**
 * src/app/lambda/applications/page.tsx – AWS Lambda Applications.
 * Zero emojis, Cloudscape enterprise styling.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { lambdaNav } from "@/components/lambda/LambdaNav";
import Link from "next/link";

export default function LambdaApplicationsPage() {
  return (
    <ServiceLayout serviceName="Lambda" serviceColor="#EC7211" navItems={lambdaNav}>
      <div className="mb-4">
        <h1 className="text-[22px] font-bold text-[#16191f]">Applications</h1>
        <p className="text-[13px] text-[#545b64] mt-0.5">
          Manage collections of AWS resources and serverless applications defined with AWS SAM or CloudFormation.
        </p>
      </div>

      <div className="bg-white border border-[#d5dbdb] rounded-sm p-12 text-center awsui-shadow">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#f2f3f3] text-[#545b64] mb-3">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
        </div>
        <h3 className="text-[16px] font-bold text-[#16191f]">No applications deployed</h3>
        <p className="text-[13px] text-[#545b64] mt-1 max-w-md mx-auto">
          Deploy serverless applications using AWS SAM templates or AWS CloudFormation stacks on your local emulator.
        </p>
        <div className="mt-4">
          <Link
            href="/lambda/create"
            className="inline-block px-4 py-1.5 bg-[#ec7211] text-white rounded-sm text-[13px] font-medium hover:bg-[#eb5f07]"
          >
            Create function instead
          </Link>
        </div>
      </div>
    </ServiceLayout>
  );
}
