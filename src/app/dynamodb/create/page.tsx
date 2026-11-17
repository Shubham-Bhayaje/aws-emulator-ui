/**
 * Create DynamoDB table page.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { CreateTableForm } from "./CreateTableForm";

const dynamoNav = [
  { label: "Tables", href: "/dynamodb" },
];

export default function CreateTablePage() {
  return (
    <ServiceLayout serviceName="DynamoDB" serviceColor="#3B82F6" navItems={dynamoNav}>
      <div>
        <h1 className="text-[22px] font-bold text-[#16191f] mb-1">Create table</h1>
        <p className="text-[13px] text-[#545b64] mb-6">
          Create a NoSQL table to store items and organize your applications.
        </p>

        <CreateTableForm />
      </div>
    </ServiceLayout>
  );
}
