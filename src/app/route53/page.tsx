import ServiceLayout from "@/components/ServiceLayout";
import ComingSoon from "@/components/ComingSoon";

const nav = [
  { label: "Hosted zones", href: "/route53" },
  { label: "Health checks", href: "/route53/health-checks" },
  { label: "Resolver", href: "/route53/resolver" },
];

export default function Route53Page() {
  return (
    <ServiceLayout serviceName="Route 53" serviceColor="#8B5CF6" navItems={nav}>
      <h1 className="text-[22px] font-bold text-[#16191f] mb-1">Hosted zones</h1>
      <p className="text-[13px] text-[#545b64] mb-4">
        Amazon Route 53 is a scalable and highly available Domain Name System (DNS) web service.
      </p>
      <ComingSoon
        serviceName="Route 53"
        description="Create and manage DNS hosted zones and records. Route internet traffic to your resources with high reliability and low latency."
      />
    </ServiceLayout>
  );
}
