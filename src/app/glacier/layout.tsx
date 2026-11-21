"use client";

import ServiceLayout from "@/components/ServiceLayout";
import { glacierNav } from "./glacierNav";

export default function GlacierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ServiceLayout
      serviceName="Amazon S3 Glacier"
      serviceColor="#3B8526"
      navItems={glacierNav}
    >
      {children}
    </ServiceLayout>
  );
}
