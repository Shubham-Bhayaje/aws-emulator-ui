import SecurityGroupsClient from "@/components/ec2/SecurityGroupsClient";
import { fetchLiveSecurityGroups } from "@/app/ec2/actions";

export const dynamic = "force-dynamic";

export default async function VpcSecurityGroupsPage() {
  const { securityGroups, isLive, error } = await fetchLiveSecurityGroups();

  return (
    <SecurityGroupsClient
      initialSecurityGroups={securityGroups || []}
      isLive={isLive}
      liveError={error}
    />
  );
}
