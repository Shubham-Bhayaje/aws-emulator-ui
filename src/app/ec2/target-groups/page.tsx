/**
 * src/app/ec2/target-groups/page.tsx – Elastic Load Balancing Target Groups.
 * Zero emojis, Cloudscape enterprise styling.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { ec2Nav } from "@/components/ec2/EC2Nav";
import EC2PlaceholderView from "@/components/ec2/EC2PlaceholderView";

export default function TargetGroupsPage() {
  return (
    <ServiceLayout serviceName="EC2" serviceColor="#EC7211" navItems={ec2Nav}>
      <EC2PlaceholderView
        title="Target Groups"
        description="Target groups route requests to individual registered targets, such as EC2 instances, using the specified protocol and port."
        primaryActionLabel="Create target group"
        columns={["Name", "Target type", "Protocol", "Port", "VPC ID", "Health check path", "Registered targets"]}
        rows={[]}
        emptyTitle="No target groups found"
        emptyDescription="Create a target group and register your EC2 instances to receive load-balanced traffic."
      />
    </ServiceLayout>
  );
}
