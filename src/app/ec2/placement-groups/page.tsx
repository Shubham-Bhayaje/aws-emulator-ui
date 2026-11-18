/**
 * src/app/ec2/placement-groups/page.tsx – EC2 Placement Groups Page.
 * Zero emojis, Cloudscape enterprise styling.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { ec2Nav } from "@/components/ec2/EC2Nav";
import PlacementGroupsClient from "@/components/ec2/PlacementGroupsClient";
import { fetchLivePlacementGroups } from "../actions";

export const dynamic = "force-dynamic";

export default async function PlacementGroupsPage() {
  const { placementGroups, isLive } = await fetchLivePlacementGroups();

  return (
    <ServiceLayout serviceName="EC2" serviceColor="#EC7211" navItems={ec2Nav}>
      <PlacementGroupsClient initialGroups={placementGroups} isLive={isLive} />
    </ServiceLayout>
  );
}
