/**
 * EC2 Instances Page – Main instances listing and lifecycle control.
 * Connected to live AWS Emulator via Server Actions.
 * Zero emojis, Cloudscape enterprise styling.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { ec2Nav } from "@/components/ec2/EC2Nav";
import InstancesClient from "@/components/ec2/InstancesClient";
import { fetchLiveEC2Instances } from "../actions";

export const dynamic = "force-dynamic";

export default async function InstancesPage() {
  const { instances, isLive, error } = await fetchLiveEC2Instances();

  return (
    <ServiceLayout serviceName="EC2" serviceColor="#EC7211" navItems={ec2Nav}>
      <InstancesClient initialInstances={instances} isLive={isLive} liveError={error} />
    </ServiceLayout>
  );
}
