import ServiceLayout from "@/components/ServiceLayout";
import ComingSoon from "@/components/ComingSoon";

const nav = [{ label: "Secrets", href: "/secretsmanager" }];

export default function SecretsManagerPage() {
  return (
    <ServiceLayout serviceName="Secrets Manager" serviceColor="#DD3522" navItems={nav}>
      <h1 className="text-[22px] font-bold text-[#16191f] mb-1">Secrets</h1>
      <p className="text-[13px] text-[#545b64] mb-4">
        AWS Secrets Manager helps you manage secrets needed to access your applications and services.
      </p>
      <ComingSoon
        serviceName="Secrets Manager"
        description="Store and retrieve database credentials, API keys, and other secrets. Rotate secrets automatically and manage access with fine-grained permissions."
      />
    </ServiceLayout>
  );
}
