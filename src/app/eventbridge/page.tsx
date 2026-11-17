import ServiceLayout from "@/components/ServiceLayout";
import ComingSoon from "@/components/ComingSoon";

const nav = [
  { label: "Event buses", href: "/eventbridge" },
  { label: "Rules", href: "/eventbridge/rules" },
];

export default function EventBridgePage() {
  return (
    <ServiceLayout serviceName="EventBridge" serviceColor="#D946EF" navItems={nav}>
      <h1 className="text-[22px] font-bold text-[#16191f] mb-1">Event buses</h1>
      <p className="text-[13px] text-[#545b64] mb-4">
        Amazon EventBridge is a serverless event bus for building event-driven applications.
      </p>
      <ComingSoon
        serviceName="EventBridge"
        description="Create event buses and rules to route events between AWS services, SaaS applications, and your own applications."
      />
    </ServiceLayout>
  );
}
