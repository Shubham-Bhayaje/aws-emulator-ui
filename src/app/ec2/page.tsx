/**
 * src/app/ec2/page.tsx – EC2 Dashboard Page.
 * Authentic AWS EC2 Management Console Dashboard.
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
  fetchLiveVolumes,
  fetchLiveSnapshots,
  fetchLivePlacementGroups,
  fetchLiveDedicatedHosts,
  fetchLiveLoadBalancers,
  fetchLiveTargetGroups,
  fetchLiveAutoScalingGroups,
  fetchLiveNetworkInterfaces,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function EC2DashboardPage() {
  const [
    instRes,
    sgRes,
    kpRes,
    eipRes,
    volRes,
    snapRes,
    pgRes,
    dhRes,
    lbRes,
    tgRes,
    asgRes,
    eniRes,
  ] = await Promise.all([
    fetchLiveEC2Instances(),
    fetchLiveSecurityGroups(),
    fetchLiveKeyPairs(),
    fetchLiveElasticIps(),
    fetchLiveVolumes(),
    fetchLiveSnapshots("self"),
    fetchLivePlacementGroups(),
    fetchLiveDedicatedHosts(),
    fetchLiveLoadBalancers(),
    fetchLiveTargetGroups(),
    fetchLiveAutoScalingGroups(),
    fetchLiveNetworkInterfaces(),
  ]);

  return (
    <ServiceLayout serviceName="EC2" serviceColor="#EC7211" navItems={ec2Nav}>
      <EC2DashboardClient
        initialInstances={instRes.instances || []}
        initialSecurityGroups={sgRes.securityGroups || []}
        initialKeyPairs={kpRes.keyPairs || []}
        initialElasticIps={eipRes.elasticIps || []}
        initialVolumes={volRes.volumes || []}
        initialSnapshots={snapRes.snapshots || []}
        initialPlacementGroups={pgRes.placementGroups || []}
        initialDedicatedHosts={dhRes.hosts || []}
        initialLoadBalancers={lbRes.loadBalancers || []}
        initialTargetGroups={tgRes.targetGroups || []}
        initialAutoScalingGroups={asgRes.autoScalingGroups || []}
        initialNetworkInterfaces={eniRes.interfaces || []}
        isLive={instRes.isLive}
        liveError={instRes.error}
      />
    </ServiceLayout>
  );
}
