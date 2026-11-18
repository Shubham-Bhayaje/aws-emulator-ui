/**
 * src/app/lambda/functions/page.tsx – Dedicated Functions list page.
 * Zero emojis, Cloudscape enterprise styling.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { lambdaNav } from "@/components/lambda/LambdaNav";
import LambdaDashboardClient from "@/components/lambda/LambdaDashboardClient";
import { fetchLiveLambdaFunctions } from "../actions";

export const dynamic = "force-dynamic";

export default async function LambdaFunctionsPage() {
  const { functions, isLive, error } = await fetchLiveLambdaFunctions();

  return (
    <ServiceLayout serviceName="Lambda" serviceColor="#EC7211" navItems={lambdaNav}>
      <div className="mb-4">
        <h1 className="text-[22px] font-bold text-[#16191f]">Functions</h1>
        <p className="text-[13px] text-[#545b64] mt-0.5">
          View and manage all serverless functions in region us-east-1.
        </p>
      </div>

      <LambdaDashboardClient
        initialFunctions={functions}
        isLive={isLive}
        liveError={error}
      />
    </ServiceLayout>
  );
}
