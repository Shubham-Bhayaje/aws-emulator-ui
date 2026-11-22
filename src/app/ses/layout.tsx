"use client";

import ServiceLayout from "@/components/ServiceLayout";
import { sesNav } from "./sesNav";

export default function SESLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ServiceLayout
      serviceName="Amazon SES"
      serviceColor="#DD344C"
      navItems={sesNav}
    >
      {children}
    </ServiceLayout>
  );
}
