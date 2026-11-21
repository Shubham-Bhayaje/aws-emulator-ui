"use client";

import ServiceLayout from "@/components/ServiceLayout";
import { ssmNav } from "./parameter-store/ssmNav";

export default function SystemsManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ServiceLayout
      serviceName="Systems Manager"
      serviceColor="#D946EF"
      navItems={ssmNav}
    >
      {children}
    </ServiceLayout>
  );
}
