/**
 * src/app/ec2/network-interfaces/page.tsx – Network Interfaces Page.
 * Zero emojis, Cloudscape enterprise styling.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { ec2Nav } from "@/components/ec2/EC2Nav";
import NetworkInterfacesClient from "@/components/ec2/NetworkInterfacesClient";
import { fetchLiveNetworkInterfaces } from "../actions";

export const dynamic = "force-dynamic";

export default async function EC2NetworkInterfacesPage() {
  const { interfaces, isLive } = await fetchLiveNetworkInterfaces();

  return (
    <ServiceLayout serviceName="EC2" serviceColor="#EC7211" navItems={ec2Nav}>
      <NetworkInterfacesClient initialInterfaces={interfaces} isLive={isLive} />
    </ServiceLayout>
  );
}
