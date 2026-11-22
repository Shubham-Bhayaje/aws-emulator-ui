"use client";

import ServiceLayout from "@/components/ServiceLayout";
import { cloudmapNav } from "./cloudmapNav";

export default function CloudMapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ServiceLayout
      serviceName="AWS Cloud Map"
      serviceColor="#8C4FFF"
      navItems={cloudmapNav}
    >
      {children}
    </ServiceLayout>
  );
}
