import ServiceLayout from "@/components/ServiceLayout";
import ComingSoon from "@/components/ComingSoon";

const nav = [
  { label: "Event history", href: "/cloudtrail" },
  { label: "Trails", href: "/cloudtrail/trails" },
];

export default function CloudTrailPage() {
  return (
    <ServiceLayout serviceName="CloudTrail" serviceColor="#D946EF" navItems={nav}>
      <h1 className="text-[22px] font-bold text-[#16191f] mb-1">Event history</h1>
      <p className="text-[13px] text-[#545b64] mb-4">
        AWS CloudTrail tracks user activity and API usage across your AWS account.
      </p>
      <ComingSoon
        serviceName="CloudTrail"
        description="View event history and create trails. Track all API calls made in your AWS account for auditing, compliance, and operational troubleshooting."
      />
    </ServiceLayout>
  );
}
