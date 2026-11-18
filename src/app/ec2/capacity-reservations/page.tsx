/**
 * src/app/ec2/capacity-reservations/page.tsx – EC2 Capacity Reservations Page.
 * Zero emojis, Cloudscape enterprise styling.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { ec2Nav } from "@/components/ec2/EC2Nav";
import CapacityReservationsClient from "@/components/ec2/CapacityReservationsClient";
import { fetchLiveCapacityReservations } from "../actions";

export const dynamic = "force-dynamic";

export default async function CapacityReservationsPage() {
  const { reservations, isLive } = await fetchLiveCapacityReservations();

  return (
    <ServiceLayout serviceName="EC2" serviceColor="#EC7211" navItems={ec2Nav}>
      <CapacityReservationsClient
        initialReservations={reservations}
        isLive={isLive}
      />
    </ServiceLayout>
  );
}
