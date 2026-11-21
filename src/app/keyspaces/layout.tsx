"use client";

import ServiceLayout from "@/components/ServiceLayout";
import { keyspacesNav } from "./keyspacesNav";

export default function KeyspacesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ServiceLayout
      serviceName="Amazon Keyspaces"
      serviceColor="#2E27AD"
      navItems={keyspacesNav}
    >
      {children}
    </ServiceLayout>
  );
}
