"use client";

import ServiceLayout from "@/components/ServiceLayout";
import { accountNav } from "./accountNav";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ServiceLayout
      serviceName="Account"
      serviceColor="#C925D1"
      navItems={accountNav}
    >
      {children}
    </ServiceLayout>
  );
}
