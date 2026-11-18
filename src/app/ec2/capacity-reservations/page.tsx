/**
 * src/app/ec2/capacity-reservations/page.tsx – EC2 On-Demand Capacity Reservations.
 * Connected to live AWS Emulator via fetchLiveCapacityReservations action.
 * Zero emojis, Cloudscape enterprise styling.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { ec2Nav } from "@/components/ec2/EC2Nav";
import EC2PlaceholderView from "@/components/ec2/EC2PlaceholderView";
import { fetchLiveCapacityReservations } from "../actions";

export const dynamic = "force-dynamic";

export default async function CapacityReservationsPage() {
  const { reservations } = await fetchLiveCapacityReservations();

  const rows = reservations.map((r) => ({
    "Reservation ID": r.id,
    "Instance type": r.instanceType,
    "Availability Zone": r.availabilityZone,
    "Total count": String(r.totalInstanceCount),
    "Available count": String(r.availableInstanceCount),
    "State": r.state,
  }));

  return (
    <ServiceLayout serviceName="EC2" serviceColor="#EC7211" navItems={ec2Nav}>
      <EC2PlaceholderView
        title="Capacity Reservations"
        description="On-Demand Capacity Reservations enable you to reserve compute capacity for your Amazon EC2 instances."
        primaryActionLabel="Create Capacity Reservation"
        columns={["Reservation ID", "Instance type", "Availability Zone", "Total count", "Available count", "State"]}
        rows={rows}
        emptyTitle="No Capacity Reservations found"
        emptyDescription="There are no Capacity Reservations active in region us-east-1 on the emulator."
      />
    </ServiceLayout>
  );
}
