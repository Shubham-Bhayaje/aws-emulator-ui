/**
 * src/app/lambda/layers/page.tsx – AWS Lambda Layers.
 * Zero emojis, Cloudscape enterprise styling.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { lambdaNav } from "@/components/lambda/LambdaNav";
import Link from "next/link";

export default function LambdaLayersPage() {
  return (
    <ServiceLayout serviceName="Lambda" serviceColor="#EC7211" navItems={lambdaNav}>
      <div className="mb-4">
        <h1 className="text-[22px] font-bold text-[#16191f]">Layers</h1>
        <p className="text-[13px] text-[#545b64] mt-0.5">
          A Lambda layer is a .zip file archive that contains supplementary code or data, such as libraries, custom runtimes, or configuration files.
        </p>
      </div>

      <div className="bg-white border border-[#d5dbdb] rounded-sm p-12 text-center awsui-shadow">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#f2f3f3] text-[#545b64] mb-3">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
        </div>
        <h3 className="text-[16px] font-bold text-[#16191f]">No layers created</h3>
        <p className="text-[13px] text-[#545b64] mt-1 max-w-md mx-auto">
          Layers can be shared across multiple Lambda functions to reduce the size of uploaded deployment packages.
        </p>
        <div className="mt-4">
          <Link
            href="/lambda"
            className="inline-block px-4 py-1.5 bg-[#ec7211] text-white rounded-sm text-[13px] font-medium hover:bg-[#eb5f07]"
          >
            View functions
          </Link>
        </div>
      </div>
    </ServiceLayout>
  );
}
