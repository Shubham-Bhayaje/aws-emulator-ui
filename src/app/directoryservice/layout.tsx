"use client";

import ServiceLayout from "@/components/ServiceLayout";
import { directoryServiceNav } from "./directoryServiceNav";

export default function DirectoryServiceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ServiceLayout
      serviceName="Directory Service"
      serviceColor="#E7157B"
      navItems={directoryServiceNav}
    >
      {children}
    </ServiceLayout>
  );
}
