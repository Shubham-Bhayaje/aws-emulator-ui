import ServiceLayout from "@/components/ServiceLayout";
import ComingSoon from "@/components/ComingSoon";

const nav = [
  { label: "Clusters", href: "/ecs" },
  { label: "Task Definitions", href: "/ecs/task-definitions" },
];

export default function ECSPage() {
  return (
    <ServiceLayout serviceName="ECS" serviceColor="#EC7211" navItems={nav}>
      <h1 className="text-[22px] font-bold text-[#16191f] mb-1">Clusters</h1>
      <p className="text-[13px] text-[#545b64] mb-4">
        Amazon ECS is a fully managed container orchestration service.
      </p>
      <ComingSoon
        serviceName="ECS Clusters"
        description="Create and manage clusters to run your Docker containers. Define task definitions and services to orchestrate your containerized applications."
      />
    </ServiceLayout>
  );
}
