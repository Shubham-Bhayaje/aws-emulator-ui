/**
 * src/app/ec2/dedicated-hosts/page.tsx – EC2 Dedicated Hosts Page.
 * Zero emojis, Cloudscape enterprise styling.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { ec2Nav } from "@/components/ec2/EC2Nav";
import DedicatedHostsClient from "@/components/ec2/DedicatedHostsClient";
import { fetchLiveDedicatedHosts } from "../actions";

export const dynamic = "force-dynamic";

export default async function DedicatedHostsPage() {
  const { hosts, isLive } = await fetchLiveDedicatedHosts();

  return (
    <ServiceLayout serviceName="EC2" serviceColor="#EC7211" navItems={ec2Nav}>
      <DedicatedHostsClient initialHosts={hosts} isLive={isLive} />
    </ServiceLayout>
  );
}
