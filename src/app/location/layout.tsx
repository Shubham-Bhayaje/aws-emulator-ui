"use client";

import ServiceLayout from "@/components/ServiceLayout";
import { locationNav } from "./locationNav";

export default function LocationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ServiceLayout
      serviceName="Amazon Location Service"
      serviceColor="#00A4A6"
      navItems={locationNav}
    >
      {children}
    </ServiceLayout>
  );
}
