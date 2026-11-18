/**
 * src/app/ec2/savings-plans/page.tsx – EC2 Savings Plans.
 * Zero emojis, Cloudscape enterprise styling.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { ec2Nav } from "@/components/ec2/EC2Nav";
import SavingsPlansClient from "@/components/ec2/SavingsPlansClient";
import { fetchLiveSavingsPlans } from "../actions";

export const dynamic = "force-dynamic";

export default async function SavingsPlansPage() {
  const { savingsPlans, isLive } = await fetchLiveSavingsPlans();

  return (
    <ServiceLayout serviceName="EC2" serviceColor="#EC7211" navItems={ec2Nav}>
      <SavingsPlansClient initialPlans={savingsPlans} isLive={isLive} />
    </ServiceLayout>
  );
}
