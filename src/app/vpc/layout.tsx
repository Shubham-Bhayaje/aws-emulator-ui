import ServiceLayout from "@/components/ServiceLayout";
import { vpcNav } from "./vpcNav";

export const metadata = {
  title: "VPC | AWS Management Console",
  description: "Amazon Virtual Private Cloud console",
};

export default function VPCLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ServiceLayout
      serviceName="VPC"
      serviceColor="#8C4FFF"
      navItems={vpcNav}
    >
      {children}
    </ServiceLayout>
  );
}
