import ServiceLayout from "@/components/ServiceLayout";
import ComingSoon from "@/components/ComingSoon";

const nav = [{ label: "State machines", href: "/stepfunctions" }];

export default function StepFunctionsPage() {
  return (
    <ServiceLayout serviceName="Step Functions" serviceColor="#D946EF" navItems={nav}>
      <h1 className="text-[22px] font-bold text-[#16191f] mb-1">State machines</h1>
      <p className="text-[13px] text-[#545b64] mb-4">
        AWS Step Functions lets you coordinate distributed applications using visual workflows.
      </p>
      <ComingSoon
        serviceName="Step Functions"
        description="Create and manage state machines to coordinate components of distributed applications. Build workflows with built-in error handling and retry logic."
      />
    </ServiceLayout>
  );
}
