/**
 * src/app/ec2/network-interfaces/page.tsx – EC2 Network Interfaces Page.
 * Zero emojis, Cloudscape enterprise styling.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { ec2Nav } from "@/components/ec2/EC2Nav";
import NetworkInterfacesClient from "@/components/ec2/NetworkInterfacesClient";
import {
  fetchLiveNetworkInterfaces,
  fetchLiveEC2Instances,
  fetchLiveSecurityGroups,
} from "../actions";

export const dynamic = "force-dynamic";

export default async function EC2NetworkInterfacesPage() {
  const [eniRes, instRes, sgRes] = await Promise.all([
    fetchLiveNetworkInterfaces(),
    fetchLiveEC2Instances(),
    fetchLiveSecurityGroups(),
  ]);

  return (
    <ServiceLayout serviceName="EC2" serviceColor="#EC7211" navItems={ec2Nav}>
      <NetworkInterfacesClient
        initialInterfaces={eniRes.interfaces || []}
        instances={instRes.instances || []}
        securityGroups={sgRes.securityGroups || []}
        isLive={eniRes.isLive}
        liveError={eniRes.error}
      />
    </ServiceLayout>
  );
}
