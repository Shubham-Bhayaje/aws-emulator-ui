/**
 * EC2 Dashboard – Authentic AWS EC2 Management Console Dashboard.
 * Connected to live AWS Emulator via Server Actions.
 * Zero emojis, Cloudscape enterprise styling.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { ec2Nav } from "@/components/ec2/EC2Nav";
import EC2DashboardClient from "@/components/ec2/EC2DashboardClient";
import {
  fetchLiveEC2Instances,
  fetchLiveSecurityGroups,
  fetchLiveKeyPairs,
  fetchLiveElasticIps,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function EC2DashboardPage() {
  const [instRes, sgRes, kpRes, eipRes] = await Promise.all([
    fetchLiveEC2Instances(),
    fetchLiveSecurityGroups(),
    fetchLiveKeyPairs(),
    fetchLiveElasticIps(),
  ]);

  return (
    <ServiceLayout serviceName="EC2" serviceColor="#EC7211" navItems={ec2Nav}>
      <EC2DashboardClient
        initialInstances={instRes.instances}
        initialSecurityGroups={sgRes.securityGroups}
        initialKeyPairs={kpRes.keyPairs}
        initialElasticIps={eipRes.elasticIps}
        isLive={instRes.isLive}
        liveError={instRes.error}
      />
    </ServiceLayout>
  );
}
