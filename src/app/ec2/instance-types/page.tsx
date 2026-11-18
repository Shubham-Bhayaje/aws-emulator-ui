/**
 * src/app/ec2/instance-types/page.tsx – EC2 Instance Types Catalog.
 * Zero emojis, Cloudscape enterprise styling.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { ec2Nav } from "@/components/ec2/EC2Nav";
import InstanceTypesClient from "@/components/ec2/InstanceTypesClient";
import { fetchLiveInstanceTypes } from "../actions";

export const dynamic = "force-dynamic";

export default async function EC2InstanceTypesPage() {
  const { types, isLive } = await fetchLiveInstanceTypes();

  return (
    <ServiceLayout serviceName="EC2" serviceColor="#EC7211" navItems={ec2Nav}>
      <InstanceTypesClient types={types} isLive={isLive} />
    </ServiceLayout>
  );
}
