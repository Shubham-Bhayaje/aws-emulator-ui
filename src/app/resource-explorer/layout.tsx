"use client";

import ServiceLayout from "@/components/ServiceLayout";
import { resourceExplorerNav } from "./resourceExplorerNav";

export default function ResourceExplorerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ServiceLayout
      serviceName="AWS Resource Explorer"
      serviceColor="#C925D1"
      navItems={resourceExplorerNav}
    >
      {children}
    </ServiceLayout>
  );
}
