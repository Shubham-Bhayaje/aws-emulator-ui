import ServiceLayout from "@/components/ServiceLayout";
import ComingSoon from "@/components/ComingSoon";

const nav = [{ label: "Pipelines", href: "/codepipeline" }];

export default function CodePipelinePage() {
  return (
    <ServiceLayout serviceName="CodePipeline" serviceColor="#3B82F6" navItems={nav}>
      <h1 className="text-[22px] font-bold text-[#16191f] mb-1">Pipelines</h1>
      <p className="text-[13px] text-[#545b64] mb-4">
        AWS CodePipeline is a continuous delivery service for fast and reliable application updates.
      </p>
      <ComingSoon
        serviceName="CodePipeline"
        description="Create and manage CI/CD pipelines. Automate your release process from source code to production deployment."
      />
    </ServiceLayout>
  );
}
