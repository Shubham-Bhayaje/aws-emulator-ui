"use client";

import ServiceLayout from "@/components/ServiceLayout";
import { cloudwatchNav } from "./logs/cloudwatchNav";

export default function CloudWatchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ServiceLayout
      serviceName="CloudWatch"
      serviceColor="#E7157B"
      navItems={cloudwatchNav}
    >
      {children}
    </ServiceLayout>
  );
}
