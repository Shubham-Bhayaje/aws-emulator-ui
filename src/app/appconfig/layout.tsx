"use client";

import ServiceLayout from "@/components/ServiceLayout";
import { appconfigNav } from "./appconfigNav";

export default function AppConfigLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ServiceLayout
      serviceName="AWS AppConfig"
      serviceColor="#C925D1"
      navItems={appconfigNav}
    >
      {children}
    </ServiceLayout>
  );
}
