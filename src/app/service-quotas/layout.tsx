"use client";

import ServiceLayout from "@/components/ServiceLayout";
import { serviceQuotasNav } from "./serviceQuotasNav";

export default function ServiceQuotasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ServiceLayout
      serviceName="Service Quotas"
      serviceColor="#C925D1"
      navItems={serviceQuotasNav}
    >
      {children}
    </ServiceLayout>
  );
}
