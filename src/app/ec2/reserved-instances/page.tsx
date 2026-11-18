/**
 * src/app/ec2/reserved-instances/page.tsx – EC2 Reserved Instances Page.
 * Zero emojis, Cloudscape enterprise styling.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { ec2Nav } from "@/components/ec2/EC2Nav";
import ReservedInstancesClient from "@/components/ec2/ReservedInstancesClient";
import { fetchLiveReservedInstances } from "../actions";

export const dynamic = "force-dynamic";

export default async function ReservedInstancesPage() {
  const { reservedInstances, isLive } = await fetchLiveReservedInstances();

  return (
    <ServiceLayout serviceName="EC2" serviceColor="#EC7211" navItems={ec2Nav}>
      <ReservedInstancesClient
        initialReservedInstances={reservedInstances}
        isLive={isLive}
      />
    </ServiceLayout>
  );
}
