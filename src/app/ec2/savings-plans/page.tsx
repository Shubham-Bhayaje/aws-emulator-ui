/**
 * src/app/ec2/savings-plans/page.tsx – EC2 Savings Plans.
 * Zero emojis, Cloudscape enterprise styling.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { ec2Nav } from "@/components/ec2/EC2Nav";
import EC2PlaceholderView from "@/components/ec2/EC2PlaceholderView";

export default function SavingsPlansPage() {
  return (
    <ServiceLayout serviceName="EC2" serviceColor="#EC7211" navItems={ec2Nav}>
      <EC2PlaceholderView
        title="Savings Plans"
        description="Savings Plans are a flexible pricing model offering lower prices compared to On-Demand pricing, in exchange for a commitment to a consistent amount of usage."
        columns={["Plan ID", "Plan type", "Commitment", "Term", "Payment option", "Start time", "End time"]}
        rows={[]}
        emptyTitle="No Savings Plans active"
        emptyDescription="Purchase a Savings Plan through AWS Cost Management to reduce compute spending."
      />
    </ServiceLayout>
  );
}
