/**
 * src/app/ec2/launch-templates/page.tsx – EC2 Launch Templates Page.
 * Zero emojis, Cloudscape enterprise styling.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { ec2Nav } from "@/components/ec2/EC2Nav";
import LaunchTemplatesClient from "@/components/ec2/LaunchTemplatesClient";
import { fetchLiveLaunchTemplates } from "../actions";

export const dynamic = "force-dynamic";

export default async function LaunchTemplatesPage() {
  const { templates, isLive } = await fetchLiveLaunchTemplates();

  return (
    <ServiceLayout serviceName="EC2" serviceColor="#EC7211" navItems={ec2Nav}>
      <LaunchTemplatesClient initialTemplates={templates} isLive={isLive} />
    </ServiceLayout>
  );
}
