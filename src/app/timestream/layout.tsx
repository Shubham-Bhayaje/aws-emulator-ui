"use client";

import ServiceLayout from "@/components/ServiceLayout";
import { timestreamNav } from "./timestreamNav";

export default function TimestreamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ServiceLayout
      serviceName="Amazon Timestream"
      serviceColor="#2E27AD"
      navItems={timestreamNav}
    >
      {children}
    </ServiceLayout>
  );
}
