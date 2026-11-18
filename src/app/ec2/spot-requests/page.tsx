/**
 * src/app/ec2/spot-requests/page.tsx – EC2 Spot Requests Page.
 * Zero emojis, Cloudscape enterprise styling.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { ec2Nav } from "@/components/ec2/EC2Nav";
import SpotRequestsClient from "@/components/ec2/SpotRequestsClient";
import { fetchLiveSpotRequests } from "../actions";

export const dynamic = "force-dynamic";

export default async function SpotRequestsPage() {
  const { spotRequests, isLive } = await fetchLiveSpotRequests();

  return (
    <ServiceLayout serviceName="EC2" serviceColor="#EC7211" navItems={ec2Nav}>
      <SpotRequestsClient initialSpotRequests={spotRequests} isLive={isLive} />
    </ServiceLayout>
  );
}
