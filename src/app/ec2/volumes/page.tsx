/**
 * src/app/ec2/volumes/page.tsx – EBS Volumes Console Page.
 * Zero emojis, Cloudscape enterprise styling.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { ec2Nav } from "@/components/ec2/EC2Nav";
import VolumesClient from "@/components/ec2/VolumesClient";
import { fetchLiveVolumes } from "../actions";

export const dynamic = "force-dynamic";

export default async function EC2VolumesPage() {
  const { volumes, isLive } = await fetchLiveVolumes();

  return (
    <ServiceLayout serviceName="EC2" serviceColor="#EC7211" navItems={ec2Nav}>
      <VolumesClient initialVolumes={volumes} isLive={isLive} />
    </ServiceLayout>
  );
}
