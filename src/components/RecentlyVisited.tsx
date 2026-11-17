/**
 * RecentlyVisited widget – Tracks services visited using localStorage.
 * Shows a 2-column grid of recent services with real AWS icons.
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  S3Icon, SQSIcon, DynamoDBIcon, IAMIcon,
  EC2Icon, LambdaIcon, BeanstalkIcon, LightsailIcon, ECSIcon, EKSIcon,
  EFSIcon, GlacierIcon,
  RDSIcon, ElastiCacheIcon, RedshiftIcon,
  VPCIcon, CloudFrontIcon, Route53Icon, APIGatewayIcon,
  SNSIcon, StepFunctionsIcon, EventBridgeIcon,
  KMSIcon, SecretsManagerIcon, CognitoIcon,
  CloudWatchIcon, CloudTrailIcon, CloudFormationIcon, SystemsManagerIcon,
  KinesisIcon, AthenaIcon,
  SageMakerIcon, BedrockIcon,
  CodeIcon,
  AwsServiceIcon,
} from "./AwsIcons";

type RecentService = {
  name: string;
  href: string;
  visitedAt: number;
};

// Map service names to their real AWS icons
function getServiceIcon(name: string) {
  const icons: Record<string, React.ReactNode> = {
    "S3": <S3Icon size={16} />,
    "SQS": <SQSIcon size={16} />,
    "DynamoDB": <DynamoDBIcon size={16} />,
    "IAM": <IAMIcon size={16} />,
    "EC2": <EC2Icon size={16} />,
    "Lambda": <LambdaIcon size={16} />,
    "Elastic Beanstalk": <BeanstalkIcon size={16} />,
    "Lightsail": <LightsailIcon size={16} />,
    "ECS": <ECSIcon size={16} />,
    "EKS": <EKSIcon size={16} />,
    "EFS": <EFSIcon size={16} />,
    "S3 Glacier": <GlacierIcon size={16} />,
    "RDS": <RDSIcon size={16} />,
    "ElastiCache": <ElastiCacheIcon size={16} />,
    "Redshift": <RedshiftIcon size={16} />,
    "VPC": <VPCIcon size={16} />,
    "CloudFront": <CloudFrontIcon size={16} />,
    "Route 53": <Route53Icon size={16} />,
    "API Gateway": <APIGatewayIcon size={16} />,
    "SNS": <SNSIcon size={16} />,
    "Step Functions": <StepFunctionsIcon size={16} />,
    "EventBridge": <EventBridgeIcon size={16} />,
    "KMS": <KMSIcon size={16} />,
    "Secrets Manager": <SecretsManagerIcon size={16} />,
    "Cognito": <CognitoIcon size={16} />,
    "CloudWatch": <CloudWatchIcon size={16} />,
    "CloudTrail": <CloudTrailIcon size={16} />,
    "CloudFormation": <CloudFormationIcon size={16} />,
    "Systems Manager": <SystemsManagerIcon size={16} />,
    "Kinesis": <KinesisIcon size={16} />,
    "Athena": <AthenaIcon size={16} />,
    "SageMaker": <SageMakerIcon size={16} />,
    "Bedrock": <BedrockIcon size={16} />,
    "CodeCommit": <CodeIcon size={16} />,
    "CodeBuild": <CodeIcon size={16} />,
    "CodePipeline": <CodeIcon size={16} />,
  };
  return icons[name] || <AwsServiceIcon size={16} label={name} />;
}

export default function RecentlyVisited() {
  const [recents, setRecents] = useState<RecentService[]>([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("recentServices") || "[]");
      setRecents(stored.slice(0, 8));
    } catch { /* ignore */ }
  }, []);

  return (
    <div className="bg-white border border-[#d5dbdb] rounded awsui-shadow">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#eaeded]">
        <div className="flex items-center gap-2">
          <h2 className="text-[14px] font-bold text-[#16191f]">Recently visited</h2>
          <button className="text-[12px] text-[#0073bb] hover:text-[#ec7211] hover:underline">
            Info
          </button>
        </div>
        <button className="text-[#545b64] hover:text-[#16191f]" title="Widget options">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="5" r="1.5"/>
            <circle cx="12" cy="12" r="1.5"/>
            <circle cx="12" cy="19" r="1.5"/>
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {recents.length === 0 ? (
          <p className="text-[13px] text-[#545b64]">
            No recently visited services. Navigate to a service using the menu above.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            {recents.map((s) => (
              <Link
                key={s.name}
                href={s.href}
                className="flex items-center gap-2 py-1 text-[13px] text-[#0073bb] hover:text-[#ec7211] hover:underline"
              >
                {getServiceIcon(s.name)}
                {s.name}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-[#eaeded]">
        <Link
          href="/services"
          className="text-[12px] text-[#0073bb] hover:text-[#ec7211] hover:underline"
        >
          View all services
        </Link>
      </div>
    </div>
  );
}
