import ServiceLayout from "@/components/ServiceLayout";
import ComingSoon from "@/components/ComingSoon";

const nav = [{ label: "Topics", href: "/sns" }];

export default function SNSPage() {
  return (
    <ServiceLayout serviceName="SNS" serviceColor="#D946EF" navItems={nav}>
      <h1 className="text-[22px] font-bold text-[#16191f] mb-1">Topics</h1>
      <p className="text-[13px] text-[#545b64] mb-4">
        Amazon SNS is a fully managed messaging service for pub/sub and mobile notifications.
      </p>
      <ComingSoon
        serviceName="SNS Topics"
        description="Create and manage notification topics. Send messages to multiple subscribers via email, SMS, HTTP, SQS, and Lambda."
      />
    </ServiceLayout>
  );
}
