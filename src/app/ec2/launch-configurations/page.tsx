/**
 * src/app/ec2/launch-configurations/page.tsx – EC2 Launch Configurations.
 * Zero emojis, Cloudscape enterprise styling.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { ec2Nav } from "@/components/ec2/EC2Nav";
import EC2PlaceholderView from "@/components/ec2/EC2PlaceholderView";

export default function LaunchConfigurationsPage() {
  return (
    <ServiceLayout serviceName="EC2" serviceColor="#EC7211" navItems={ec2Nav}>
      <EC2PlaceholderView
        title="Launch Configurations"
        description="A launch configuration is an instance configuration template that an Auto Scaling group uses to launch EC2 instances."
        columns={["Name", "AMI ID", "Instance type", "Created time", "Security groups"]}
        rows={[]}
        emptyTitle="No launch configurations found"
        emptyDescription="AWS recommends using Launch Templates instead of Launch Configurations for new Auto Scaling groups."
      />
    </ServiceLayout>
  );
}
