/**
 * src/app/ec2/auto-scaling-groups/page.tsx – EC2 Auto Scaling Groups Page.
 * Zero emojis, Cloudscape enterprise styling.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { ec2Nav } from "@/components/ec2/EC2Nav";
import AutoScalingGroupsClient from "@/components/ec2/AutoScalingGroupsClient";
import { fetchLiveAutoScalingGroups, fetchLiveLaunchTemplates } from "../actions";

export const dynamic = "force-dynamic";

export default async function AutoScalingGroupsPage() {
  const [asgRes, ltRes] = await Promise.all([
    fetchLiveAutoScalingGroups(),
    fetchLiveLaunchTemplates(),
  ]);

  return (
    <ServiceLayout serviceName="EC2" serviceColor="#EC7211" navItems={ec2Nav}>
      <AutoScalingGroupsClient
        initialGroups={asgRes.autoScalingGroups || []}
        launchTemplates={(ltRes.templates || []).map((lt) => ({
          id: lt.id,
          name: lt.name,
          defaultVersionNumber: lt.defaultVersion,
        }))}
        isLive={asgRes.isLive}
        liveError={asgRes.error}
      />
    </ServiceLayout>
  );
}
