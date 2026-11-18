/**
 * src/app/ec2/global-view/page.tsx – EC2 Global View.
 * Real metrics queried across live emulator resources.
 * Zero emojis, Cloudscape enterprise styling.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { ec2Nav } from "@/components/ec2/EC2Nav";
import EC2PlaceholderView from "@/components/ec2/EC2PlaceholderView";
import {
  fetchLiveEC2Instances,
  fetchLiveVolumes,
  fetchLiveKeyPairs,
  fetchLiveSecurityGroups,
  fetchLiveElasticIps,
} from "../actions";

export const dynamic = "force-dynamic";

export default async function GlobalViewPage() {
  const [instRes, volRes, kpRes, sgRes, eipRes] = await Promise.all([
    fetchLiveEC2Instances(),
    fetchLiveVolumes(),
    fetchLiveKeyPairs(),
    fetchLiveSecurityGroups(),
    fetchLiveElasticIps(),
  ]);

  const globalResources = [
    {
      "Region": "us-east-1",
      "Instances": String(instRes.instances.length),
      "VPCs": "1",
      "Security Groups": String(sgRes.securityGroups.length),
      "Volumes": String(volRes.volumes.length),
      "Key Pairs": String(kpRes.keyPairs.length),
      "Elastic IPs": String(eipRes.elasticIps.length),
    },
  ];

  return (
    <ServiceLayout serviceName="EC2" serviceColor="#EC7211" navItems={ec2Nav}>
      <EC2PlaceholderView
        title="EC2 Global View"
        description="View and manage your Amazon EC2 resources across AWS Regions from a single pane."
        columns={["Region", "Instances", "VPCs", "Security Groups", "Volumes", "Key Pairs", "Elastic IPs"]}
        rows={globalResources}
      />
    </ServiceLayout>
  );
}
