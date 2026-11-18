/**
 * src/app/ec2/auto-scaling-groups/page.tsx – EC2 Auto Scaling Groups.
 * Zero emojis, Cloudscape enterprise styling.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { ec2Nav } from "@/components/ec2/EC2Nav";
import EC2PlaceholderView from "@/components/ec2/EC2PlaceholderView";

export default function AutoScalingGroupsPage() {
  return (
    <ServiceLayout serviceName="EC2" serviceColor="#EC7211" navItems={ec2Nav}>
      <EC2PlaceholderView
        title="Auto Scaling Groups"
        description="Amazon EC2 Auto Scaling contains a collection of EC2 instances that are treated as a logical grouping for automatic scaling and management."
        primaryActionLabel="Create Auto Scaling group"
        columns={["Auto Scaling group name", "Launch template", "Instances", "Desired capacity", "Min", "Max", "Status"]}
        rows={[]}
        emptyTitle="No Auto Scaling groups found"
        emptyDescription="Create an Auto Scaling group to maintain application availability and automatically add or remove instances according to demand."
      />
    </ServiceLayout>
  );
}
