import ServiceLayout from "@/components/ServiceLayout";
import { dxNav } from "./dxNav";

export const metadata = {
  title: "AWS Direct Connect | AWS Management Console",
  description: "AWS Direct Connect console",
};

export default function DirectConnectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ServiceLayout
      serviceName="AWS Direct Connect"
      serviceColor="#8C4FFF"
      navItems={dxNav}
    >
      {children}
    </ServiceLayout>
  );
}
