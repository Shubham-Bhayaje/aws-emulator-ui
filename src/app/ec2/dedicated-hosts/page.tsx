/**
 * src/app/ec2/dedicated-hosts/page.tsx – EC2 Dedicated Hosts.
 * Connected to live AWS Emulator via fetchLiveDedicatedHosts action.
 * Zero emojis, Cloudscape enterprise styling.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { ec2Nav } from "@/components/ec2/EC2Nav";
import EC2PlaceholderView from "@/components/ec2/EC2PlaceholderView";
import { fetchLiveDedicatedHosts } from "../actions";

export const dynamic = "force-dynamic";

export default async function DedicatedHostsPage() {
  const { hosts } = await fetchLiveDedicatedHosts();

  const rows = hosts.map((h) => ({
    "Host ID": h.hostId,
    "Instance family": h.instanceType,
    "State": h.state,
    "Cores": String(h.cores),
    "Total vCPUs": String(h.totalVCpus),
    "Availability Zone": h.availabilityZone,
  }));

  return (
    <ServiceLayout serviceName="EC2" serviceColor="#EC7211" navItems={ec2Nav}>
      <EC2PlaceholderView
        title="Dedicated Hosts"
        description="An Amazon EC2 Dedicated Host is a physical server with EC2 instance capacity fully dedicated to your use."
        primaryActionLabel="Allocate Dedicated Host"
        columns={["Host ID", "Instance family", "State", "Cores", "Total vCPUs", "Availability Zone"]}
        rows={rows}
        emptyTitle="No Dedicated Hosts allocated"
        emptyDescription="There are no Dedicated Hosts currently allocated in region us-east-1 on the emulator."
      />
    </ServiceLayout>
  );
}
