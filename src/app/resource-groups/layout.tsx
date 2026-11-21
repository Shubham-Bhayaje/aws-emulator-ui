"use client";

import ServiceLayout from "@/components/ServiceLayout";
import { resourceGroupsNav } from "./resourceGroupsNav";

export default function ResourceGroupsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ServiceLayout
      serviceName="Resource Groups"
      serviceColor="#C925D1"
      navItems={resourceGroupsNav}
    >
      {children}
    </ServiceLayout>
  );
}
