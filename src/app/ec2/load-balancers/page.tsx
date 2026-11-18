/**
 * src/app/ec2/load-balancers/page.tsx – Elastic Load Balancers.
 * Zero emojis, Cloudscape enterprise styling.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { ec2Nav } from "@/components/ec2/EC2Nav";
import EC2PlaceholderView from "@/components/ec2/EC2PlaceholderView";

export default function LoadBalancersPage() {
  return (
    <ServiceLayout serviceName="EC2" serviceColor="#EC7211" navItems={ec2Nav}>
      <EC2PlaceholderView
        title="Load Balancers"
        description="Elastic Load Balancing automatically distributes your incoming traffic across multiple instances, containers, and IP addresses."
        primaryActionLabel="Create load balancer"
        columns={["Name", "DNS name", "State", "Type", "Scheme", "VPC ID", "Availability Zones"]}
        rows={[]}
        emptyTitle="No load balancers found"
        emptyDescription="Set up an Application, Network, or Gateway Load Balancer to distribute traffic across your targets."
      />
    </ServiceLayout>
  );
}
