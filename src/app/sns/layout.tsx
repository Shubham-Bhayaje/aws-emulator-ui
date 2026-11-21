"use client";

import ServiceLayout from "@/components/ServiceLayout";
import { snsNav } from "./snsNav";

export default function SNSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ServiceLayout
      serviceName="Amazon SNS"
      serviceColor="#FF4F8B"
      navItems={snsNav}
    >
      {children}
    </ServiceLayout>
  );
}
