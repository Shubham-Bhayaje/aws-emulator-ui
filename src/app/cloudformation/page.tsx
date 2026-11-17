import ServiceLayout from "@/components/ServiceLayout";
import ComingSoon from "@/components/ComingSoon";

const nav = [{ label: "Stacks", href: "/cloudformation" }];

export default function CloudFormationPage() {
  return (
    <ServiceLayout serviceName="CloudFormation" serviceColor="#D946EF" navItems={nav}>
      <h1 className="text-[22px] font-bold text-[#16191f] mb-1">Stacks</h1>
      <p className="text-[13px] text-[#545b64] mb-4">
        AWS CloudFormation lets you model and set up your AWS resources using templates.
      </p>
      <ComingSoon
        serviceName="CloudFormation"
        description="Create and manage stacks of AWS resources. Use JSON or YAML templates to define and provision your infrastructure as code."
      />
    </ServiceLayout>
  );
}
