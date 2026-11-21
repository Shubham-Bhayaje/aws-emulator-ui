"use client";

import ServiceLayout from "@/components/ServiceLayout";
import { dynamoNav } from "./dynamoNav";

export default function DynamoDBLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ServiceLayout
      serviceName="DynamoDB"
      serviceColor="#2E27AD"
      navItems={dynamoNav}
    >
      {children}
    </ServiceLayout>
  );
}
