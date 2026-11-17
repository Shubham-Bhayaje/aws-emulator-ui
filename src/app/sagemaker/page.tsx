import ServiceLayout from "@/components/ServiceLayout";
import ComingSoon from "@/components/ComingSoon";

const nav = [
  { label: "Notebook", href: "/sagemaker" },
  { label: "Training jobs", href: "/sagemaker/training" },
  { label: "Models", href: "/sagemaker/models" },
];

export default function SageMakerPage() {
  return (
    <ServiceLayout serviceName="SageMaker" serviceColor="#3B8526" navItems={nav}>
      <h1 className="text-[22px] font-bold text-[#16191f] mb-1">Notebook instances</h1>
      <p className="text-[13px] text-[#545b64] mb-4">
        Amazon SageMaker is a fully managed service to build, train, and deploy machine learning models.
      </p>
      <ComingSoon
        serviceName="SageMaker"
        description="Build, train, and deploy machine learning models quickly. Provides every developer and data scientist with the ability to build ML models at scale."
      />
    </ServiceLayout>
  );
}
