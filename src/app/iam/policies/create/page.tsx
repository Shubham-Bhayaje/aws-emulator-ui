/**
 * Create IAM Policy page – Server component.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { CreatePolicyForm } from "./CreatePolicyForm";
import { iamNav } from "../../page";

export default function CreatePolicyPage() {
  return (
    <ServiceLayout serviceName="IAM" serviceColor="#BD0816" navItems={iamNav}>
      <div>
        <h1 className="text-[22px] font-bold text-[#16191f] mb-1">Create policy</h1>
        <p className="text-[13px] text-[#545b64] mb-6">
          Create a customer managed policy by defining permissions in JSON format.
        </p>

        <CreatePolicyForm />
      </div>
    </ServiceLayout>
  );
}
