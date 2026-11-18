/**
 * src/app/ec2/reserved-instances/page.tsx – EC2 Reserved Instances.
 * Zero emojis, Cloudscape enterprise styling.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { ec2Nav } from "@/components/ec2/EC2Nav";
import EC2PlaceholderView from "@/components/ec2/EC2PlaceholderView";

export default function ReservedInstancesPage() {
  return (
    <ServiceLayout serviceName="EC2" serviceColor="#EC7211" navItems={ec2Nav}>
      <EC2PlaceholderView
        title="Reserved Instances"
        description="Amazon EC2 Reserved Instances (RI) provide significant discounts compared to On-Demand instance pricing and provide a capacity reservation."
        primaryActionLabel="Purchase Reserved Instances"
        columns={["Reservation ID", "Instance type", "Scope", "Availability Zone", "State", "Offering class", "Expires"]}
        rows={[]}
        emptyTitle="No Reserved Instances found"
        emptyDescription="Purchase Reserved Instances for long-running production systems to reduce operating costs."
      />
    </ServiceLayout>
  );
}
