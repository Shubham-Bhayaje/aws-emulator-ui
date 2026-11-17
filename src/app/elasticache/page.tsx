import ServiceLayout from "@/components/ServiceLayout";
import ComingSoon from "@/components/ComingSoon";

const nav = [{ label: "Redis clusters", href: "/elasticache" }];

export default function ElastiCachePage() {
  return (
    <ServiceLayout serviceName="ElastiCache" serviceColor="#3B82F6" navItems={nav}>
      <h1 className="text-[22px] font-bold text-[#16191f] mb-1">Redis clusters</h1>
      <p className="text-[13px] text-[#545b64] mb-4">
        Amazon ElastiCache makes it easy to deploy and run Redis or Memcached in the cloud.
      </p>
      <ComingSoon
        serviceName="ElastiCache"
        description="Create and manage in-memory data stores. Deploy Redis or Memcached clusters for caching, session management, and real-time analytics."
      />
    </ServiceLayout>
  );
}
