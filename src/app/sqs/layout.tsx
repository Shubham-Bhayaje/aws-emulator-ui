"use client";

import ServiceLayout from "@/components/ServiceLayout";
import { sqsNav } from "./sqsNav";

export default function SQSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ServiceLayout
      serviceName="SQS"
      serviceColor="#D946EF"
      navItems={sqsNav}
    >
      {children}
    </ServiceLayout>
  );
}
