/**
 * src/app/ec2/lifecycle-manager/page.tsx – Amazon Data Lifecycle Manager (DLM).
 * Zero emojis, Cloudscape enterprise styling.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { ec2Nav } from "@/components/ec2/EC2Nav";
import EC2PlaceholderView from "@/components/ec2/EC2PlaceholderView";

export default function LifecycleManagerPage() {
  return (
    <ServiceLayout serviceName="EC2" serviceColor="#EC7211" navItems={ec2Nav}>
      <EC2PlaceholderView
        title="Lifecycle Manager"
        description="Amazon Data Lifecycle Manager (Amazon DLM) automates the creation, retention, and deletion of EBS snapshots and EBS-backed AMIs."
        primaryActionLabel="Create lifecycle policy"
        columns={["Policy ID", "Description", "Policy type", "Resource types", "Target tags", "State"]}
        rows={[]}
        emptyTitle="No lifecycle policies found"
        emptyDescription="Create an EBS-backed snapshot policy to automate scheduled backups for your EC2 instances and volumes."
      />
    </ServiceLayout>
  );
}
