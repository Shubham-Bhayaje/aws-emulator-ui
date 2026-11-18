/**
 * EC2 Launch Instance Wizard Page.
 * Connected to live AWS Emulator via Server Actions.
 * Zero emojis, Cloudscape enterprise styling.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { ec2Nav } from "@/components/ec2/EC2Nav";
import LaunchInstanceWizard from "@/components/ec2/LaunchInstanceWizard";
import { fetchLiveSecurityGroups, fetchLiveKeyPairs } from "../actions";

export const dynamic = "force-dynamic";

export default async function LaunchInstancePage() {
  const [sgRes, kpRes] = await Promise.all([
    fetchLiveSecurityGroups(),
    fetchLiveKeyPairs(),
  ]);

  return (
    <ServiceLayout serviceName="EC2" serviceColor="#EC7211" navItems={ec2Nav}>
      <LaunchInstanceWizard
        initialSecurityGroups={sgRes.securityGroups}
        initialKeyPairs={kpRes.keyPairs}
      />
    </ServiceLayout>
  );
}
