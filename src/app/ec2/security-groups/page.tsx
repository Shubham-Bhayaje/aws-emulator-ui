/**
 * EC2 Security Groups Page – Manage virtual firewall rules for instances.
 * Connected to live AWS Emulator via Server Actions.
 * Zero emojis, Cloudscape enterprise styling.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { ec2Nav } from "@/components/ec2/EC2Nav";
import SecurityGroupsClient from "@/components/ec2/SecurityGroupsClient";
import { fetchLiveSecurityGroups } from "../actions";

export const dynamic = "force-dynamic";

export default async function SecurityGroupsPage() {
  const { securityGroups, isLive, error } = await fetchLiveSecurityGroups();

  return (
    <ServiceLayout serviceName="EC2" serviceColor="#EC7211" navItems={ec2Nav}>
      <SecurityGroupsClient
        initialSecurityGroups={securityGroups || []}
        isLive={isLive}
        liveError={error}
      />
    </ServiceLayout>
  );
}
