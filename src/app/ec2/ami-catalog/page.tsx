/**
 * src/app/ec2/ami-catalog/page.tsx – AWS EC2 AMI Catalog.
 * Directly connected to live AWS Emulator with real image discovery, OS filters, and launch actions.
 * Zero emojis, Cloudscape enterprise styling.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { ec2Nav } from "@/components/ec2/EC2Nav";
import AMICatalogClient from "@/components/ec2/AMICatalogClient";
import { fetchLiveAmis } from "../actions";

export const dynamic = "force-dynamic";

export default async function AMICatalogPage() {
  const { amis, isLive } = await fetchLiveAmis("all");

  return (
    <ServiceLayout serviceName="EC2" serviceColor="#EC7211" navItems={ec2Nav}>
      <AMICatalogClient catalogAmis={amis} isLive={isLive} />
    </ServiceLayout>
  );
}
