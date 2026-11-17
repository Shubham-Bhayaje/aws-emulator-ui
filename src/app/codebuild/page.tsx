import ServiceLayout from "@/components/ServiceLayout";
import ComingSoon from "@/components/ComingSoon";

const nav = [{ label: "Build projects", href: "/codebuild" }];

export default function CodeBuildPage() {
  return (
    <ServiceLayout serviceName="CodeBuild" serviceColor="#3B82F6" navItems={nav}>
      <h1 className="text-[22px] font-bold text-[#16191f] mb-1">Build projects</h1>
      <p className="text-[13px] text-[#545b64] mb-4">
        AWS CodeBuild is a fully managed build service that compiles source code, runs tests, and produces software packages.
      </p>
      <ComingSoon
        serviceName="CodeBuild"
        description="Create and manage build projects. Compile source code, run tests, and produce deployable software packages continuously."
      />
    </ServiceLayout>
  );
}
