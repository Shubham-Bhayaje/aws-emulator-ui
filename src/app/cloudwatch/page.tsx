import ServiceLayout from "@/components/ServiceLayout";
import ComingSoon from "@/components/ComingSoon";

const nav = [
  { label: "Dashboards", href: "/cloudwatch" },
  { label: "Alarms", href: "/cloudwatch/alarms" },
  { label: "Logs", href: "/cloudwatch/logs" },
  { label: "Metrics", href: "/cloudwatch/metrics" },
];

export default function CloudWatchPage() {
  return (
    <ServiceLayout serviceName="CloudWatch" serviceColor="#D946EF" navItems={nav}>
      <h1 className="text-[22px] font-bold text-[#16191f] mb-1">Dashboards</h1>
      <p className="text-[13px] text-[#545b64] mb-4">
        Amazon CloudWatch monitors your AWS resources and applications in real time.
      </p>
      <ComingSoon
        serviceName="CloudWatch"
        description="Create dashboards, set alarms, and view logs and metrics. Monitor your AWS resources, applications, and services in real time."
      />
    </ServiceLayout>
  );
}
