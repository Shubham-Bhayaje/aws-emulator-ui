import ServiceLayout from "@/components/ServiceLayout";
import ComingSoon from "@/components/ComingSoon";

const nav = [{ label: "Distributions", href: "/cloudfront" }];

export default function CloudFrontPage() {
  return (
    <ServiceLayout serviceName="CloudFront" serviceColor="#8B5CF6" navItems={nav}>
      <h1 className="text-[22px] font-bold text-[#16191f] mb-1">Distributions</h1>
      <p className="text-[13px] text-[#545b64] mb-4">
        Amazon CloudFront is a fast content delivery network (CDN) service.
      </p>
      <ComingSoon
        serviceName="CloudFront"
        description="Create and manage CDN distributions. Deliver your content with low latency and high transfer speeds to viewers around the world."
      />
    </ServiceLayout>
  );
}
