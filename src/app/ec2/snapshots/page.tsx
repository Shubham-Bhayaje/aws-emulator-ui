/**
 * src/app/ec2/snapshots/page.tsx – EBS Snapshots Page.
 * Zero emojis, Cloudscape enterprise styling.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { ec2Nav } from "@/components/ec2/EC2Nav";
import SnapshotsClient from "@/components/ec2/SnapshotsClient";
import { fetchLiveSnapshots, fetchLiveVolumes } from "../actions";

export const dynamic = "force-dynamic";

export default async function SnapshotsPage() {
  const [snapRes, volRes] = await Promise.all([
    fetchLiveSnapshots(),
    fetchLiveVolumes(),
  ]);

  const volumeIds = volRes.volumes.map((v) => v.id);

  return (
    <ServiceLayout serviceName="EC2" serviceColor="#EC7211" navItems={ec2Nav}>
      <SnapshotsClient
        initialSnapshots={snapRes.snapshots}
        availableVolumeIds={volumeIds}
        isLive={snapRes.isLive}
      />
    </ServiceLayout>
  );
}
