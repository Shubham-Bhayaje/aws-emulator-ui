/**
 * src/app/lambda/page.tsx – AWS Lambda Console Dashboard.
 * Connected to live AWS Emulator via Server Actions.
 * Zero emojis, Cloudscape enterprise styling.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { lambdaNav } from "@/components/lambda/LambdaNav";
import LambdaDashboardClient from "@/components/lambda/LambdaDashboardClient";
import { fetchLiveLambdaFunctions } from "./actions";

export const dynamic = "force-dynamic";

export default async function LambdaPage() {
  const { functions, isLive, error } = await fetchLiveLambdaFunctions();

  return (
    <ServiceLayout serviceName="Lambda" serviceColor="#EC7211" navItems={lambdaNav}>
      <div className="mb-4">
        <h1 className="text-[22px] font-bold text-[#16191f]">Functions</h1>
        <p className="text-[13px] text-[#545b64] mt-0.5">
          Run code without provisioning or managing servers. Pay only for the compute time you consume.
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
