import ServiceLayout from "@/components/ServiceLayout";
import { resolverNav } from "./resolverNav";

export default function Route53ResolverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ServiceLayout
      serviceName="Route 53 Resolver"
      serviceColor="#8C4FFF"
      navItems={resolverNav}
    >
      {children}
    </ServiceLayout>
  );
}
