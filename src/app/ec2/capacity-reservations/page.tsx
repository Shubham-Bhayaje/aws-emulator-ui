/**
 * src/app/ec2/capacity-reservations/page.tsx – EC2 On-Demand Capacity Reservations.
 * Zero emojis, Cloudscape enterprise styling.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { ec2Nav } from "@/components/ec2/EC2Nav";
import EC2PlaceholderView from "@/components/ec2/EC2PlaceholderView";

export default function CapacityReservationsPage() {
  return (
    <ServiceLayout serviceName="EC2" serviceColor="#EC7211" navItems={ec2Nav}>
      <EC2PlaceholderView
        title="Capacity Reservations"
        description="On-Demand Capacity Reservations enable you to reserve capacity for your Amazon EC2 instances in a specific Availability Zone for any duration."
        primaryActionLabel="Create Capacity Reservation"
        columns={["Reservation ID", "Instance type", "Availability Zone", "State", "Instance count", "Available capacity"]}
        rows={[]}
        emptyTitle="No Capacity Reservations found"
        emptyDescription="Create a Capacity Reservation to guarantee compute capacity in any Availability Zone."
      />
    </ServiceLayout>
  );
}
