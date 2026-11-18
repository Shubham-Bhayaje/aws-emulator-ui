/**
 * src/app/ec2/dedicated-hosts/page.tsx – EC2 Dedicated Hosts.
 * Zero emojis, Cloudscape enterprise styling.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { ec2Nav } from "@/components/ec2/EC2Nav";
import EC2PlaceholderView from "@/components/ec2/EC2PlaceholderView";

export default function DedicatedHostsPage() {
  return (
    <ServiceLayout serviceName="EC2" serviceColor="#EC7211" navItems={ec2Nav}>
      <EC2PlaceholderView
        title="Dedicated Hosts"
        description="An Amazon EC2 Dedicated Host is a physical server with EC2 instance capacity fully dedicated to your use."
        primaryActionLabel="Allocate Dedicated Host"
        columns={["Host ID", "Instance family", "State", "Cores", "Sockets", "Availability Zone", "Instances"]}
        rows={[]}
        emptyTitle="No Dedicated Hosts allocated"
        emptyDescription="Allocate a Dedicated Host to use your existing per-socket, per-core, or per-VM software licenses."
      />
    </ServiceLayout>
  );
}
