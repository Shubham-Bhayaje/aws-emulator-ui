/**
 * src/app/ec2/snapshots/page.tsx – EBS Snapshots.
 * Zero emojis, Cloudscape enterprise styling.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { ec2Nav } from "@/components/ec2/EC2Nav";
import EC2PlaceholderView from "@/components/ec2/EC2PlaceholderView";

export default function SnapshotsPage() {
  return (
    <ServiceLayout serviceName="EC2" serviceColor="#EC7211" navItems={ec2Nav}>
      <EC2PlaceholderView
        title="Snapshots"
        description="Amazon EBS snapshots are point-in-time backups of your EBS volumes."
        primaryActionLabel="Create snapshot"
        primaryActionHref="/ec2/volumes"
        columns={["Snapshot ID", "Volume ID", "Size (GiB)", "Description", "Status", "Progress", "Started"]}
        rows={[]}
        emptyTitle="No snapshots found"
        emptyDescription="You have not created any snapshots for your EBS volumes in this region."
      />
    </ServiceLayout>
  );
}
