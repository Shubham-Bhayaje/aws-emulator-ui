import ServiceLayout from "@/components/ServiceLayout";
import ComingSoon from "@/components/ComingSoon";

const nav = [
  { label: "Clusters", href: "/redshift" },
  { label: "Query editor", href: "/redshift/query-editor" },
];

export default function RedshiftPage() {
  return (
    <ServiceLayout serviceName="Redshift" serviceColor="#3B82F6" navItems={nav}>
      <h1 className="text-[22px] font-bold text-[#16191f] mb-1">Clusters</h1>
      <p className="text-[13px] text-[#545b64] mb-4">
        Amazon Redshift is a fast, fully managed, petabyte-scale data warehouse service.
      </p>
      <ComingSoon
        serviceName="Redshift Clusters"
        description="Create and manage data warehouse clusters. Run complex analytic queries against petabytes of structured data using SQL."
      />
    </ServiceLayout>
  );
}
