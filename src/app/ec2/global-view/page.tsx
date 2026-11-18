/**
 * src/app/ec2/global-view/page.tsx – Amazon EC2 Global View Page.
 * Multi-region resource discovery and monitor connected to live AWS Emulator.
 * Zero emojis, Cloudscape enterprise styling.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { ec2Nav } from "@/components/ec2/EC2Nav";
import GlobalViewClient from "@/components/ec2/GlobalViewClient";
import {
  fetchLiveEC2Instances,
  fetchLiveVolumes,
  fetchLiveSnapshots,
  fetchLiveKeyPairs,
  fetchLiveSecurityGroups,
  fetchLiveElasticIps,
  fetchLiveNetworkInterfaces,
} from "../actions";

export const dynamic = "force-dynamic";

export default async function GlobalViewPage() {
  const [instRes, volRes, snapRes, kpRes, sgRes, eipRes, eniRes] = await Promise.all([
    fetchLiveEC2Instances(),
    fetchLiveVolumes(),
    fetchLiveSnapshots("self"),
    fetchLiveKeyPairs(),
    fetchLiveSecurityGroups(),
    fetchLiveElasticIps(),
    fetchLiveNetworkInterfaces(),
  ]);

  return (
    <ServiceLayout serviceName="EC2" serviceColor="#EC7211" navItems={ec2Nav}>
      <GlobalViewClient
        initialInstances={instRes.instances || []}
        initialVolumes={volRes.volumes || []}
        initialSnapshots={snapRes.snapshots || []}
        initialKeyPairs={kpRes.keyPairs || []}
        initialSecurityGroups={sgRes.securityGroups || []}
        initialElasticIps={eipRes.elasticIps || []}
        initialNetworkInterfaces={eniRes.interfaces || []}
        isLive={instRes.isLive}
      />
    </ServiceLayout>
  );
}
