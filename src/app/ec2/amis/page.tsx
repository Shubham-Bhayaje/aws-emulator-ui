/**
 * src/app/ec2/amis/page.tsx – Amazon Machine Images (AMIs) Console.
 * Directly connected to live AWS Emulator with real image discovery, registration, and launch actions.
 * Zero emojis, Cloudscape enterprise styling.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { ec2Nav } from "@/components/ec2/EC2Nav";
import AMIsClient from "@/components/ec2/AMIsClient";
import { fetchLiveAmis } from "../actions";

export const dynamic = "force-dynamic";

export default async function AMIsPage() {
  const { amis, isLive } = await fetchLiveAmis("all");

  return (
    <ServiceLayout serviceName="EC2" serviceColor="#EC7211" navItems={ec2Nav}>
      <AMIsClient initialAmis={amis} isLive={isLive} />
    </ServiceLayout>
  );
}
