/**
 * EC2 Elastic IPs Page – Allocate, associate, and manage static public IPv4 addresses.
 * Connected to live AWS Emulator via Server Actions.
 * Zero emojis, Cloudscape enterprise styling.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { ec2Nav } from "@/components/ec2/EC2Nav";
import ElasticIpsClient from "@/components/ec2/ElasticIpsClient";
import { fetchLiveElasticIps, fetchLiveEC2Instances } from "../actions";

export const dynamic = "force-dynamic";

export default async function ElasticIpsPage() {
  const [eipRes, instRes] = await Promise.all([
    fetchLiveElasticIps(),
    fetchLiveEC2Instances(),
  ]);

  return (
    <ServiceLayout serviceName="EC2" serviceColor="#EC7211" navItems={ec2Nav}>
      <ElasticIpsClient
        initialElasticIps={eipRes.elasticIps || []}
        instances={instRes.instances || []}
        isLive={eipRes.isLive}
        liveError={eipRes.error}
      />
    </ServiceLayout>
  );
}
