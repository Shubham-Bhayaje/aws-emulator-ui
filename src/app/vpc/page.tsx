import ServiceLayout from "@/components/ServiceLayout";
import ComingSoon from "@/components/ComingSoon";

const nav = [
  { label: "Your VPCs", href: "/vpc" },
  { label: "Subnets", href: "/vpc/subnets" },
  { label: "Security Groups", href: "/vpc/security-groups" },
];

export default function VPCPage() {
  return (
    <ServiceLayout serviceName="VPC" serviceColor="#8B5CF6" navItems={nav}>
      <h1 className="text-[22px] font-bold text-[#16191f] mb-1">Your VPCs</h1>
      <p className="text-[13px] text-[#545b64] mb-4">
        Amazon VPC lets you provision a logically isolated section of the AWS Cloud.
      </p>
      <ComingSoon
        serviceName="VPC"
        description="Create and manage Virtual Private Clouds. Define your own virtual network with IP address ranges, subnets, route tables, and security groups."
      />
    </ServiceLayout>
  );
}
