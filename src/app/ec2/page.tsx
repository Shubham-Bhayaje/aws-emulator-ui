import ServiceLayout from "@/components/ServiceLayout";
import ComingSoon from "@/components/ComingSoon";

const nav = [{ label: "Instances", href: "/ec2" }];

export default function EC2Page() {
  return (
    <ServiceLayout serviceName="EC2" serviceColor="#EC7211" navItems={nav}>
      <h1 className="text-[22px] font-bold text-[#16191f] mb-1">Instances</h1>
      <p className="text-[13px] text-[#545b64] mb-4">
        Amazon EC2 provides scalable computing capacity in the AWS Cloud.
      </p>
      <ComingSoon
        serviceName="EC2 Instances"
        description="Launch and manage virtual servers (EC2 instances) in the cloud. Create, start, stop, and terminate instances with various configurations."
      />
    </ServiceLayout>
  );
}
