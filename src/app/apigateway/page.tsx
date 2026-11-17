import ServiceLayout from "@/components/ServiceLayout";
import ComingSoon from "@/components/ComingSoon";

const nav = [{ label: "APIs", href: "/apigateway" }];

export default function APIGatewayPage() {
  return (
    <ServiceLayout serviceName="API Gateway" serviceColor="#8B5CF6" navItems={nav}>
      <h1 className="text-[22px] font-bold text-[#16191f] mb-1">APIs</h1>
      <p className="text-[13px] text-[#545b64] mb-4">
        Amazon API Gateway is a fully managed service to create, publish, and manage APIs.
      </p>
      <ComingSoon
        serviceName="API Gateway"
        description="Create, publish, maintain, and monitor APIs at any scale. Handle traffic management, authorization, access control, and API version management."
      />
    </ServiceLayout>
  );
}
