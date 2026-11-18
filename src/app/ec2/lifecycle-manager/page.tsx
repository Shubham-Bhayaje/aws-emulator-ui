/**
 * src/app/ec2/lifecycle-manager/page.tsx – Amazon Data Lifecycle Manager (DLM).
 * Zero emojis, Cloudscape enterprise styling.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { ec2Nav } from "@/components/ec2/EC2Nav";
import LifecycleManagerClient from "@/components/ec2/LifecycleManagerClient";
import { fetchLiveLifecyclePolicies } from "../actions";

export const dynamic = "force-dynamic";

export default async function LifecycleManagerPage() {
  const { policies, isLive } = await fetchLiveLifecyclePolicies();

  return (
    <ServiceLayout serviceName="EC2" serviceColor="#EC7211" navItems={ec2Nav}>
      <LifecycleManagerClient initialPolicies={policies} isLive={isLive} />
    </ServiceLayout>
  );
}
