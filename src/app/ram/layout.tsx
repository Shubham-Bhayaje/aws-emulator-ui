"use client";

import ServiceLayout from "@/components/ServiceLayout";
import { ramNav } from "./ramNav";

export default function RAMLayout({ children }: { children: React.ReactNode }) {
  return (
    <ServiceLayout
      serviceName="Resource Access Manager"
      serviceColor="#E7157B"
      navItems={ramNav}
    >
      {children}
    </ServiceLayout>
  );
}
