"use client";

import ServiceLayout from "@/components/ServiceLayout";
import { ecrNav } from "./ecrNav";

export default function EcrLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ServiceLayout
      serviceName="Amazon ECR"
      serviceColor="#FF9900"
      navItems={ecrNav}
    >
      {children}
    </ServiceLayout>
  );
}
