/**
 * Create IAM User page – Server component.
 * Loads policies from IAM and renders CreateUserForm.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { iam } from "@/lib/aws";
import { ListPoliciesCommand } from "@aws-sdk/client-iam";
import { CreateUserForm } from "./CreateUserForm";
import { iamNav } from "../../page";

export default async function CreateUserPage() {
  let policies: { name: string; arn: string }[] = [];

  try {
    const res = await iam.send(
      new ListPoliciesCommand({ Scope: "All", MaxItems: 100 })
    );
    policies = (res.Policies ?? [])
      .map((p) => ({
        name: p.PolicyName ?? "",
        arn: p.Arn ?? "",
      }))
      .filter((p) => p.name && p.arn);
  } catch (err) {
    console.error("Error fetching policies for user creation:", err);
  }

  return (
    <ServiceLayout serviceName="IAM" serviceColor="#BD0816" navItems={iamNav}>
      <div>
        <h1 className="text-[22px] font-bold text-[#16191f] mb-1">Add user</h1>
        <p className="text-[13px] text-[#545b64] mb-6">
          Create an IAM user to represent an identity with specific AWS permissions.
        </p>

        <CreateUserForm policies={policies} />
      </div>
    </ServiceLayout>
  );
}
