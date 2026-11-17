import ServiceLayout from "@/components/ServiceLayout";
import ComingSoon from "@/components/ComingSoon";

const nav = [
  { label: "Databases", href: "/rds" },
  { label: "Snapshots", href: "/rds/snapshots" },
];

export default function RDSPage() {
  return (
    <ServiceLayout serviceName="RDS" serviceColor="#3B82F6" navItems={nav}>
      <h1 className="text-[22px] font-bold text-[#16191f] mb-1">Databases</h1>
      <p className="text-[13px] text-[#545b64] mb-4">
        Amazon RDS makes it easy to set up, operate, and scale relational databases in the cloud.
      </p>
      <ComingSoon
        serviceName="RDS Databases"
        description="Create and manage relational database instances. Choose from MySQL, PostgreSQL, Oracle, SQL Server, and MariaDB engines."
      />
    </ServiceLayout>
  );
}
