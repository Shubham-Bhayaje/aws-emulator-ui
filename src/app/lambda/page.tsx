import ServiceLayout from "@/components/ServiceLayout";
import ComingSoon from "@/components/ComingSoon";

const nav = [{ label: "Functions", href: "/lambda" }];

export default function LambdaPage() {
  return (
    <ServiceLayout serviceName="Lambda" serviceColor="#EC7211" navItems={nav}>
      <h1 className="text-[22px] font-bold text-[#16191f] mb-1">Functions</h1>
      <p className="text-[13px] text-[#545b64] mb-4">
        AWS Lambda lets you run code without provisioning or managing servers.
      </p>
      <ComingSoon
        serviceName="Lambda Functions"
        description="Create and manage serverless functions. Upload your code and Lambda handles everything required to run and scale it with high availability."
      />
    </ServiceLayout>
  );
}
