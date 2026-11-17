import ServiceLayout from "@/components/ServiceLayout";
import ComingSoon from "@/components/ComingSoon";

const nav = [{ label: "File systems", href: "/efs" }];

export default function EFSPage() {
  return (
    <ServiceLayout serviceName="EFS" serviceColor="#3B8526" navItems={nav}>
      <h1 className="text-[22px] font-bold text-[#16191f] mb-1">File systems</h1>
      <p className="text-[13px] text-[#545b64] mb-4">
        Amazon EFS provides scalable, elastic file storage for use with AWS services.
      </p>
      <ComingSoon
        serviceName="EFS File Systems"
        description="Create and manage elastic file systems. EFS automatically grows and shrinks as you add and remove files, so you don't need to provision capacity."
      />
    </ServiceLayout>
  );
}
