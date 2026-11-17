import ServiceLayout from "@/components/ServiceLayout";
import ComingSoon from "@/components/ComingSoon";

const nav = [{ label: "Repositories", href: "/codecommit" }];

export default function CodeCommitPage() {
  return (
    <ServiceLayout serviceName="CodeCommit" serviceColor="#3B82F6" navItems={nav}>
      <h1 className="text-[22px] font-bold text-[#16191f] mb-1">Repositories</h1>
      <p className="text-[13px] text-[#545b64] mb-4">
        AWS CodeCommit is a fully-managed source control service for private Git repositories.
      </p>
      <ComingSoon
        serviceName="CodeCommit"
        description="Host secure and scalable private Git repositories. Collaborate on code with pull requests, branch management, and code reviews."
      />
    </ServiceLayout>
  );
}
