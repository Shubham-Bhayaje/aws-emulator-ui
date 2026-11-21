"use client";

import ServiceLayout from "@/components/ServiceLayout";
import { secretsManagerNav } from "./secretsManagerNav";

export default function SecretsManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ServiceLayout
      serviceName="Secrets Manager"
      serviceColor="#DD3522"
      navItems={secretsManagerNav}
    >
      {children}
    </ServiceLayout>
  );
}
