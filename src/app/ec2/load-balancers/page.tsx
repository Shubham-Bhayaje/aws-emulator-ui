/**
 * src/app/ec2/load-balancers/page.tsx – Elastic Load Balancers Page.
 * Zero emojis, Cloudscape enterprise styling.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { ec2Nav } from "@/components/ec2/EC2Nav";
import LoadBalancersClient from "@/components/ec2/LoadBalancersClient";
import { fetchLiveLoadBalancers, fetchLiveSecurityGroups } from "../actions";

export const dynamic = "force-dynamic";

export default async function LoadBalancersPage() {
  const [lbRes, sgRes] = await Promise.all([
    fetchLiveLoadBalancers(),
    fetchLiveSecurityGroups(),
  ]);

  return (
    <ServiceLayout serviceName="EC2" serviceColor="#EC7211" navItems={ec2Nav}>
      <LoadBalancersClient
        initialLoadBalancers={lbRes.loadBalancers || []}
        securityGroups={sgRes.securityGroups || []}
        isLive={lbRes.isLive}
        liveError={lbRes.error}
      />
    </ServiceLayout>
  );
}
