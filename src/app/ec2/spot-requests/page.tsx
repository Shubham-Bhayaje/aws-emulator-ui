/**
 * src/app/ec2/spot-requests/page.tsx – EC2 Spot Requests.
 * Zero emojis, Cloudscape enterprise styling.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { ec2Nav } from "@/components/ec2/EC2Nav";
import EC2PlaceholderView from "@/components/ec2/EC2PlaceholderView";

export default function SpotRequestsPage() {
  return (
    <ServiceLayout serviceName="EC2" serviceColor="#EC7211" navItems={ec2Nav}>
      <EC2PlaceholderView
        title="Spot Requests"
        description="Amazon EC2 Spot Instances let you take advantage of unused EC2 capacity in the AWS cloud at steep discounts."
        primaryActionLabel="Request Spot Instances"
        columns={["Request ID", "Type", "Status", "Instance type", "vCPUs", "Target capacity", "Allocated capacity"]}
        rows={[]}
        emptyTitle="No Spot requests found"
        emptyDescription="Submit a Spot request to run interruptible workloads at significant cost savings."
      />
    </ServiceLayout>
  );
}
