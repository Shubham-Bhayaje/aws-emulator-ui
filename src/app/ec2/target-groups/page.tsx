/**
 * src/app/ec2/target-groups/page.tsx – Elastic Load Balancing Target Groups Page.
 * Zero emojis, Cloudscape enterprise styling.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { ec2Nav } from "@/components/ec2/EC2Nav";
import TargetGroupsClient from "@/components/ec2/TargetGroupsClient";
import { fetchLiveTargetGroups } from "../actions";

export const dynamic = "force-dynamic";

export default async function TargetGroupsPage() {
  const { targetGroups = [], isLive = true, error } = await fetchLiveTargetGroups();

  return (
    <ServiceLayout serviceName="EC2" serviceColor="#EC7211" navItems={ec2Nav}>
      <TargetGroupsClient
        initialTargetGroups={targetGroups || []}
        isLive={isLive}
        liveError={error}
      />
    </ServiceLayout>
  );
}
