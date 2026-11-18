/**
 * src/app/ec2/placement-groups/page.tsx – EC2 Placement Groups.
 * Zero emojis, Cloudscape enterprise styling.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { ec2Nav } from "@/components/ec2/EC2Nav";
import EC2PlaceholderView from "@/components/ec2/EC2PlaceholderView";

export default function PlacementGroupsPage() {
  return (
    <ServiceLayout serviceName="EC2" serviceColor="#EC7211" navItems={ec2Nav}>
      <EC2PlaceholderView
        title="Placement Groups"
        description="Placement groups determine how instances are placed on underlying hardware to reduce latency or isolate failures."
        primaryActionLabel="Create placement group"
        columns={["Group name", "Placement strategy", "Spread level", "Partition count", "ARN"]}
        rows={[]}
        emptyTitle="No placement groups found"
        emptyDescription="Create a placement group (Cluster, Spread, or Partition) to optimize network performance or hardware redundancy."
      />
    </ServiceLayout>
  );
}
