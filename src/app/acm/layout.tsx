"use client";

import ServiceLayout from "@/components/ServiceLayout";
import { acmNav } from "./acmNav";

export default function ACMLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ServiceLayout
      serviceName="Certificate Manager"
      serviceColor="#E7157B"
      navItems={acmNav}
    >
      {children}
    </ServiceLayout>
  );
}
