/**
 * EC2 Instance Details Page – Deep inspection of individual instance configurations, metrics, and security.
 * Connected to live AWS Emulator via Server Actions.
 * Zero emojis, Cloudscape enterprise styling.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { ec2Nav } from "@/components/ec2/EC2Nav";
import InstanceDetailClient from "@/components/ec2/InstanceDetailClient";
import { fetchLiveInstanceDetail } from "../../actions";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function InstanceDetailPage(props: Props) {
  const { id } = await props.params;
  const { instance, isLive, error } = await fetchLiveInstanceDetail(id);

  return (
    <ServiceLayout serviceName="EC2" serviceColor="#EC7211" navItems={ec2Nav}>
      <InstanceDetailClient
        instanceId={id}
        liveDetail={instance}
        isLive={isLive}
        errorMessage={error}
      />
    </ServiceLayout>
  );
}
