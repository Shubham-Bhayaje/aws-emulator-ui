import ServiceLayout from "@/components/ServiceLayout";
import ComingSoon from "@/components/ComingSoon";

const nav = [
  { label: "Query editor", href: "/athena" },
  { label: "Saved queries", href: "/athena/saved-queries" },
];

export default function AthenaPage() {
  return (
    <ServiceLayout serviceName="Athena" serviceColor="#8B5CF6" navItems={nav}>
      <h1 className="text-[22px] font-bold text-[#16191f] mb-1">Query editor</h1>
      <p className="text-[13px] text-[#545b64] mb-4">
        Amazon Athena is an interactive query service that makes it easy to analyze data in S3 using SQL.
      </p>
      <ComingSoon
        serviceName="Athena"
        description="Query data directly in Amazon S3 using standard SQL. No infrastructure to manage — just point to your data, define the schema, and start querying."
      />
    </ServiceLayout>
  );
}
