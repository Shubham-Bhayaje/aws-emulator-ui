/**
 * [service]/page.tsx – Dynamic service page for all AWS services in the catalog.
 * Renders an authentic AWS Management Console layout and overview.
 */

import { notFound } from "next/navigation";
import ServiceLayout from "@/components/ServiceLayout";
import ComingSoon from "@/components/ComingSoon";
import { findServiceByHref, findServiceById, ALL_SERVICES } from "@/lib/services-catalog";

type Props = {
  params: Promise<{ service: string }>;
};

export async function generateStaticParams() {
  // Existing statically built top-level directories:
  const staticDirs = new Set([
    "s3", "sqs", "dynamodb", "iam", "services", "api",
    "ec2", "lambda", "elasticbeanstalk", "lightsail", "ecs", "eks",
    "efs", "glacier", "rds", "elasticache", "redshift", "vpc",
    "cloudfront", "route53", "apigateway", "sns", "stepfunctions",
    "eventbridge", "kms", "secretsmanager", "cognito", "cloudwatch",
    "cloudtrail", "cloudformation", "systems-manager", "kinesis",
    "athena", "sagemaker", "bedrock", "codecommit", "codebuild", "codepipeline"
  ]);

  return ALL_SERVICES
    .filter((s) => !staticDirs.has(s.id))
    .map((s) => ({ service: s.id }));
}

export default async function DynamicServicePage(props: Props) {
  const { service: slug } = await props.params;

  const service = findServiceByHref("/" + slug) || findServiceById(slug);

  if (!service) {
    notFound();
  }

  const nav = [
    { label: `${service.shortName} Overview`, href: service.href },
    { label: "Documentation", href: `https://docs.aws.amazon.com/${service.id}/`, external: true },
  ];

  return (
    <ServiceLayout
      serviceName={service.shortName}
      serviceColor={service.color || "#FF9900"}
      navItems={nav}
    >
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-[22px] font-bold text-[#16191f]">{service.name}</h1>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#f2f3f3] text-[#545b64] border border-[#d5dbdb]">
            {service.category}
          </span>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#f2f3f3] text-[#545b64] border border-[#d5dbdb]">
            Coming Soon
          </span>
        </div>
        <p className="text-[13px] text-[#545b64] max-w-3xl leading-relaxed">
          {service.desc}
        </p>
      </div>

      <ComingSoon
        serviceName={service.name}
        description={service.desc}
      />
    </ServiceLayout>
  );
}
