/**
 * src/app/ec2/spot-requests/page.tsx – EC2 Spot Requests.
 * Connected to live AWS Emulator via fetchLiveSpotRequests action.
 * Zero emojis, Cloudscape enterprise styling.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { ec2Nav } from "@/components/ec2/EC2Nav";
import EC2PlaceholderView from "@/components/ec2/EC2PlaceholderView";
import { fetchLiveSpotRequests } from "../actions";

export const dynamic = "force-dynamic";

export default async function SpotRequestsPage() {
  const { spotRequests } = await fetchLiveSpotRequests();

  const rows = spotRequests.map((sr) => ({
    "Request ID": sr.id,
    "Type": sr.type,
    "Status": sr.status,
    "Instance type": sr.instanceType,
    "Created time": sr.createTime,
  }));

  return (
    <ServiceLayout serviceName="EC2" serviceColor="#EC7211" navItems={ec2Nav}>
      <EC2PlaceholderView
        title="Spot Requests"
        description="Amazon EC2 Spot Instances let you take advantage of unused EC2 capacity in the AWS cloud at steep discounts."
        primaryActionLabel="Request Spot Instances"
        columns={["Request ID", "Type", "Status", "Instance type", "Created time"]}
        rows={rows}
        emptyTitle="No Spot requests found"
        emptyDescription="There are currently no active Spot instance requests in region us-east-1 on the emulator."
      />
    </ServiceLayout>
  );
}
