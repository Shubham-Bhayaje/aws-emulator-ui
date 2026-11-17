import ServiceLayout from "@/components/ServiceLayout";
import ComingSoon from "@/components/ComingSoon";

const nav = [{ label: "Instances", href: "/lightsail" }];

export default function LightsailPage() {
  return (
    <ServiceLayout serviceName="Lightsail" serviceColor="#EC7211" navItems={nav}>
      <h1 className="text-[22px] font-bold text-[#16191f] mb-1">Instances</h1>
      <p className="text-[13px] text-[#545b64] mb-4">
        Amazon Lightsail is the easiest way to get started with AWS for simple workloads.
      </p>
      <ComingSoon
        serviceName="Lightsail"
        description="Launch and manage simple virtual private servers, storage, databases, and networking at a low, predictable price."
      />
    </ServiceLayout>
  );
}
