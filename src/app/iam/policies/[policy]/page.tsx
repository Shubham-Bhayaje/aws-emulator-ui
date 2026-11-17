/**
 * IAM Policy inspection page – Server component.
 * Loads policy metadata and version document using inspectPolicy action.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { inspectPolicy } from "../../actions";
import { PolicyDetail, PolicyMetadata } from "./PolicyDetail";
import { iamNav } from "../../page";

interface PageProps {
  params: Promise<{ policy: string }>;
}

export default async function PolicyDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const policyParam = decodeURIComponent(resolvedParams.policy);

  // If the parameter is an ARN or just a policy name, format as ARN if needed
  let policyArn = policyParam;
  if (!policyArn.startsWith("arn:aws:iam::")) {
    policyArn = `arn:aws:iam::aws:policy/${policyParam}`;
  }

  const res = await inspectPolicy(policyArn);

  const policyMeta: PolicyMetadata | null = res.policy
    ? {
        name: res.policy.name,
        arn: res.policy.arn,
        description: res.policy.description,
        defaultVersionId: res.policy.defaultVersionId,
        createDate: res.policy.createDate,
        updateDate: res.policy.updateDate,
        attachmentCount: res.policy.attachmentCount,
        isAttachable: res.policy.isAttachable,
        document: res.document,
      }
    : null;

  return (
    <ServiceLayout serviceName="IAM" serviceColor="#BD0816" navItems={iamNav}>
      {res.error ? (
        <div className="bg-[#fdf3f1] border border-[#d13212] rounded p-4 text-[13px] text-[#d13212]">
          Error: {res.error}
        </div>
      ) : policyMeta ? (
        <PolicyDetail policy={policyMeta} />
      ) : (
        <div className="text-[13px] text-[#545b64]">Policy not found.</div>
      )}
    </ServiceLayout>
  );
}
