/**
 * src/app/ec2/launch-configurations/page.tsx – EC2 Launch Configurations Page.
 * Zero emojis, Cloudscape enterprise styling.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { ec2Nav } from "@/components/ec2/EC2Nav";
import LaunchConfigurationsClient from "@/components/ec2/LaunchConfigurationsClient";
import { fetchLiveLaunchConfigurations } from "../actions";

export const dynamic = "force-dynamic";

export default async function LaunchConfigurationsPage() {
  const { launchConfigurations = [], isLive = true, error } =
    await fetchLiveLaunchConfigurations();

  return (
    <ServiceLayout serviceName="EC2" serviceColor="#EC7211" navItems={ec2Nav}>
      <LaunchConfigurationsClient
        initialConfigurations={launchConfigurations || []}
        isLive={isLive}
        liveError={error}
      />
    </ServiceLayout>
  );
}
