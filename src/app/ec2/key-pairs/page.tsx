/**
 * EC2 Key Pairs Page – Manage SSH credentials for instance login.
 * Connected to live AWS Emulator via Server Actions.
 * Zero emojis, Cloudscape enterprise styling.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { ec2Nav } from "@/components/ec2/EC2Nav";
import KeyPairsClient from "@/components/ec2/KeyPairsClient";
import { fetchLiveKeyPairs } from "../actions";

export const dynamic = "force-dynamic";

export default async function KeyPairsPage() {
  const { keyPairs, isLive, error } = await fetchLiveKeyPairs();

  return (
    <ServiceLayout serviceName="EC2" serviceColor="#EC7211" navItems={ec2Nav}>
      <KeyPairsClient
        initialKeyPairs={keyPairs}
        isLive={isLive}
        liveError={error}
      />
    </ServiceLayout>
  );
}
