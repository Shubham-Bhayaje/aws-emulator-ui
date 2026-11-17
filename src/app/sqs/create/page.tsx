/**
 * Create Queue page – form matching real AWS Console.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { CreateQueueForm } from "./CreateQueueForm";

const sqsNav = [{ label: "Queues", href: "/sqs" }];

export default function CreateQueuePage() {
  return (
    <ServiceLayout serviceName="SQS" serviceColor="#D946EF" navItems={sqsNav}>
      <div className="max-w-[800px]">
        <h1 className="text-[22px] font-bold text-[#16191f] mb-6">Create queue</h1>
        <CreateQueueForm />
      </div>
    </ServiceLayout>
  );
}
