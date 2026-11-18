/**
 * src/app/ec2/global-view/page.tsx – EC2 Global View.
 * Zero emojis, Cloudscape enterprise styling.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { ec2Nav } from "@/components/ec2/EC2Nav";
import EC2PlaceholderView from "@/components/ec2/EC2PlaceholderView";

export default function GlobalViewPage() {
  const globalResources = [
    { "Region": "us-east-1", "Instances": "2", "VPCs": "1", "Security Groups": "1", "Volumes": "1", "Key Pairs": "1" },
  ];

  return (
    <ServiceLayout serviceName="EC2" serviceColor="#EC7211" navItems={ec2Nav}>
      <EC2PlaceholderView
        title="EC2 Global View"
        description="View and manage your Amazon EC2 resources across all AWS Regions from a single pane."
        columns={["Region", "Instances", "VPCs", "Security Groups", "Volumes", "Key Pairs"]}
        rows={globalResources}
      />
    </ServiceLayout>
  );
}
