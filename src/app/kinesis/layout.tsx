"use client";

import ServiceLayout from "@/components/ServiceLayout";
import { kinesisNav } from "./kinesisNav";

export default function KinesisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ServiceLayout
      serviceName="Amazon Kinesis"
      serviceColor="#8C4FFF"
      navItems={kinesisNav}
    >
      {children}
    </ServiceLayout>
  );
}
