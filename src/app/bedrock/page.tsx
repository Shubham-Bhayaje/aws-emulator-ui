import ServiceLayout from "@/components/ServiceLayout";
import ComingSoon from "@/components/ComingSoon";

const nav = [
  { label: "Playgrounds", href: "/bedrock" },
  { label: "Model access", href: "/bedrock/model-access" },
];

export default function BedrockPage() {
  return (
    <ServiceLayout serviceName="Bedrock" serviceColor="#3B8526" navItems={nav}>
      <h1 className="text-[22px] font-bold text-[#16191f] mb-1">Playgrounds</h1>
      <p className="text-[13px] text-[#545b64] mb-4">
        Amazon Bedrock is the easiest way to build and scale generative AI applications with foundation models.
      </p>
      <ComingSoon
        serviceName="Bedrock"
        description="Build generative AI applications with foundation models. Access models from AI21 Labs, Anthropic, Cohere, Meta, Stability AI, and Amazon."
      />
    </ServiceLayout>
  );
}
