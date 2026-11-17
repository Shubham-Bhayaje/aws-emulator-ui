import ServiceLayout from "@/components/ServiceLayout";
import ComingSoon from "@/components/ComingSoon";

const nav = [
  { label: "Fleet Manager", href: "/systems-manager" },
  { label: "Parameter Store", href: "/systems-manager/parameter-store" },
  { label: "Session Manager", href: "/systems-manager/session-manager" },
];

export default function SystemsManagerPage() {
  return (
    <ServiceLayout serviceName="Systems Manager" serviceColor="#D946EF" navItems={nav}>
      <h1 className="text-[22px] font-bold text-[#16191f] mb-1">Fleet Manager</h1>
      <p className="text-[13px] text-[#545b64] mb-4">
        AWS Systems Manager gives you visibility and control of your infrastructure on AWS.
      </p>
      <ComingSoon
        serviceName="Systems Manager"
        description="Manage your AWS resources centrally. Use Parameter Store, Session Manager, and Fleet Manager to operate at scale."
      />
    </ServiceLayout>
  );
}
