"use client";

import ServiceLayout from "@/components/ServiceLayout";
import { cloudhsmNav } from "./cloudhsmNav";

export default function CloudHSMLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ServiceLayout
      serviceName="CloudHSM"
      serviceColor="#E7157B"
      navItems={cloudhsmNav}
    >
      {children}
    </ServiceLayout>
  );
}
