/**
 * src/app/ec2/reserved-instances/page.tsx – EC2 Reserved Instances.
 * Connected to live AWS Emulator via fetchLiveReservedInstances action.
 * Zero emojis, Cloudscape enterprise styling.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { ec2Nav } from "@/components/ec2/EC2Nav";
import EC2PlaceholderView from "@/components/ec2/EC2PlaceholderView";
import { fetchLiveReservedInstances } from "../actions";

export const dynamic = "force-dynamic";

export default async function ReservedInstancesPage() {
  const { reservedInstances } = await fetchLiveReservedInstances();

  const rows = reservedInstances.map((ri) => ({
    "Reservation ID": ri.id,
    "Instance type": ri.instanceType,
    "Availability Zone": ri.availabilityZone,
    "State": ri.state,
    "Count": String(ri.instanceCount),
    "Duration (days)": String(Math.floor(ri.duration / 86400)),
  }));

  return (
    <ServiceLayout serviceName="EC2" serviceColor="#EC7211" navItems={ec2Nav}>
      <EC2PlaceholderView
        title="Reserved Instances"
        description="Amazon EC2 Reserved Instances (RI) provide significant discounts compared to On-Demand instance pricing."
        primaryActionLabel="Purchase Reserved Instances"
        columns={["Reservation ID", "Instance type", "Availability Zone", "State", "Count", "Duration (days)"]}
        rows={rows}
        emptyTitle="No Reserved Instances found"
        emptyDescription="There are no Reserved Instances purchased in region us-east-1 on this emulator."
      />
    </ServiceLayout>
  );
}
