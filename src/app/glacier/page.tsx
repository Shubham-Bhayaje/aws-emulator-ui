import ServiceLayout from "@/components/ServiceLayout";
import ComingSoon from "@/components/ComingSoon";

const nav = [{ label: "Vaults", href: "/glacier" }];

export default function GlacierPage() {
  return (
    <ServiceLayout serviceName="S3 Glacier" serviceColor="#3B8526" navItems={nav}>
      <h1 className="text-[22px] font-bold text-[#16191f] mb-1">Vaults</h1>
      <p className="text-[13px] text-[#545b64] mb-4">
        Amazon S3 Glacier is a secure and durable service for low-cost data archiving.
      </p>
      <ComingSoon
        serviceName="S3 Glacier"
        description="Create and manage vaults for long-term data archiving. Store data for months, years, or decades at extremely low cost."
      />
    </ServiceLayout>
  );
}
