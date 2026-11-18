/**
 * src/app/lambda/functions/[name]/page.tsx – AWS Lambda Function Inspector.
 * Zero emojis, Cloudscape enterprise styling.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { lambdaNav } from "@/components/lambda/LambdaNav";
import FunctionDetailClient from "@/components/lambda/FunctionDetailClient";
import { fetchLiveFunctionDetail } from "../../actions";
import { DEFAULT_LAMBDA_FUNCTIONS, LAMBDA_RUNTIMES } from "@/lib/lambda-data";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ name: string }>;
};

export default async function FunctionDetailPage(props: Props) {
  const { name } = await props.params;
  const { fn, codeString, isLive } = await fetchLiveFunctionDetail(name);

  const fallbackFn = fn || {
    ...DEFAULT_LAMBDA_FUNCTIONS[0],
    name,
    arn: `arn:aws:lambda:us-east-1:000000000000:function:${name}`,
  };

  return (
    <ServiceLayout serviceName="Lambda" serviceColor="#EC7211" navItems={lambdaNav}>
      <FunctionDetailClient
        initialFunction={fallbackFn}
        initialCode={codeString || LAMBDA_RUNTIMES[0].starterCode}
        isLive={isLive}
      />
    </ServiceLayout>
  );
}
