/**
 * src/app/ec2/launch-templates/page.tsx – EC2 Launch Templates.
 * Zero emojis, Cloudscape enterprise styling.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { ec2Nav } from "@/components/ec2/EC2Nav";
import EC2PlaceholderView from "@/components/ec2/EC2PlaceholderView";

export default function LaunchTemplatesPage() {
  return (
    <ServiceLayout serviceName="EC2" serviceColor="#EC7211" navItems={ec2Nav}>
      <EC2PlaceholderView
        title="Launch Templates"
        description="A launch template contains instance configuration parameters to save and reuse when launching EC2 instances."
        primaryActionLabel="Create launch template"
        primaryActionHref="/ec2/launch"
        columns={["Template ID", "Template name", "Default version", "Latest version", "Created by", "Creation time"]}
        rows={[]}
        emptyTitle="No launch templates found"
        emptyDescription="Create a launch template to streamline instance launches with pre-saved configuration settings."
      />
    </ServiceLayout>
  );
}
