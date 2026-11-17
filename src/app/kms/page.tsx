import ServiceLayout from "@/components/ServiceLayout";
import ComingSoon from "@/components/ComingSoon";

const nav = [{ label: "Customer managed keys", href: "/kms" }];

export default function KMSPage() {
  return (
    <ServiceLayout serviceName="KMS" serviceColor="#DD3522" navItems={nav}>
      <h1 className="text-[22px] font-bold text-[#16191f] mb-1">Customer managed keys</h1>
      <p className="text-[13px] text-[#545b64] mb-4">
        AWS KMS makes it easy to create and control encryption keys used to encrypt your data.
      </p>
      <ComingSoon
        serviceName="KMS"
        description="Create and manage cryptographic keys. Control the use of encryption across AWS services and in your own applications."
      />
    </ServiceLayout>
  );
}
