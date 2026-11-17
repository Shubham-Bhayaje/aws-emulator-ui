/**
 * Services Catalog page – Full catalog of all AWS services.
 * Features search and filtering across categories.
 */

"use client";

import { useState, useMemo } from "react";
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
} from "@/components/AwsIcons";

interface ServiceItem {
  name: string;
  href: string;
  desc: string;
  icon: React.ReactNode;
  status?: "functional" | "emulator" | "preview";
}

interface CategoryGroup {
  category: string;
  services: ServiceItem[];
}

const serviceCatalog: CategoryGroup[] = [
  {
    category: "Compute",
    services: [
      { name: "EC2", href: "/ec2", icon: <EC2Icon size={24} />, desc: "Virtual servers in the cloud" },
      { name: "Lambda", href: "/lambda", icon: <LambdaIcon size={24} />, desc: "Run code without thinking about servers" },
      { name: "Elastic Beanstalk", href: "/elasticbeanstalk", icon: <BeanstalkIcon size={24} />, desc: "Run and manage web applications" },
      { name: "Lightsail", href: "/lightsail", icon: <LightsailIcon size={24} />, desc: "Launch and manage virtual private servers" },
      { name: "ECS", href: "/ecs", icon: <ECSIcon size={24} />, desc: "Run and manage Docker containers" },
      { name: "EKS", href: "/eks", icon: <EKSIcon size={24} />, desc: "Run managed Kubernetes clusters" },
    ],
  },
  {
    category: "Storage",
    services: [
      { name: "S3", href: "/s3", icon: <S3Icon size={24} />, desc: "Scalable object storage in the cloud", status: "functional" },
      { name: "EFS", href: "/efs", icon: <EFSIcon size={24} />, desc: "Managed file storage for EC2" },
      { name: "S3 Glacier", href: "/glacier", icon: <GlacierIcon size={24} />, desc: "Low-cost archive storage in the cloud" },
    ],
  },
  {
    category: "Database",
    services: [
      { name: "DynamoDB", href: "/dynamodb", icon: <DynamoDBIcon size={24} />, desc: "Managed NoSQL key-value database", status: "emulator" },
      { name: "RDS", href: "/rds", icon: <RDSIcon size={24} />, desc: "Managed relational database service" },
      { name: "ElastiCache", href: "/elasticache", icon: <ElastiCacheIcon size={24} />, desc: "In-memory caching service (Redis / Memcached)" },
      { name: "Redshift", href: "/redshift", icon: <RedshiftIcon size={24} />, desc: "Fast, simple, cost-effective data warehousing" },
    ],
  },
  {
    category: "Networking & Content Delivery",
    services: [
      { name: "VPC", href: "/vpc", icon: <VPCIcon size={24} />, desc: "Isolated cloud resources and virtual networks" },
      { name: "CloudFront", href: "/cloudfront", icon: <CloudFrontIcon size={24} />, desc: "Global content delivery network (CDN)" },
      { name: "Route 53", href: "/route53", icon: <Route53Icon size={24} />, desc: "Scalable Domain Name System (DNS) web service" },
      { name: "API Gateway", href: "/apigateway", icon: <APIGatewayIcon size={24} />, desc: "Build, publish, and manage APIs" },
    ],
  },
  {
    category: "Security, Identity, & Compliance",
    services: [
      { name: "IAM", href: "/iam", icon: <IAMIcon size={24} />, desc: "Manage user access and encryption keys", status: "emulator" },
      { name: "KMS", href: "/kms", icon: <KMSIcon size={24} />, desc: "Managed creation and control of encryption keys" },
      { name: "Cognito", href: "/cognito", icon: <CognitoIcon size={24} />, desc: "Identity for your web and mobile applications" },
      { name: "Secrets Manager", href: "/secretsmanager", icon: <SecretsManagerIcon size={24} />, desc: "Rotate, manage, and retrieve secrets" },
    ],
  },
  {
    category: "Application Integration",
    services: [
      { name: "SQS", href: "/sqs", icon: <SQSIcon size={24} />, desc: "Managed message queuing service", status: "functional" },
      { name: "SNS", href: "/sns", icon: <SNSIcon size={24} />, desc: "Pub/Sub messaging and mobile notifications" },
      { name: "Step Functions", href: "/stepfunctions", icon: <StepFunctionsIcon size={24} />, desc: "Coordinate distributed applications with visual workflows" },
      { name: "EventBridge", href: "/eventbridge", icon: <EventBridgeIcon size={24} />, desc: "Serverless event bus for event-driven apps" },
    ],
  },
  {
    category: "Management & Governance",
    services: [
      { name: "CloudWatch", href: "/cloudwatch", icon: <CloudWatchIcon size={24} />, desc: "Monitor resources and applications in real time" },
      { name: "CloudTrail", href: "/cloudtrail", icon: <CloudTrailIcon size={24} />, desc: "Track user activity and API usage" },
      { name: "CloudFormation", href: "/cloudformation", icon: <CloudFormationIcon size={24} />, desc: "Model and set up AWS resources using code templates" },
      { name: "Systems Manager", href: "/systems-manager", icon: <SystemsManagerIcon size={24} />, desc: "Centralized operational insights and actions" },
    ],
  },
  {
    category: "Analytics",
    services: [
      { name: "Kinesis", href: "/kinesis", icon: <KinesisIcon size={24} />, desc: "Work with real-time streaming data" },
      { name: "Athena", href: "/athena", icon: <AthenaIcon size={24} />, desc: "Query data directly in S3 using standard SQL" },
    ],
  },
  {
    category: "Machine Learning",
    services: [
      { name: "SageMaker", href: "/sagemaker", icon: <SageMakerIcon size={24} />, desc: "Build, train, and deploy machine learning models" },
      { name: "Bedrock", href: "/bedrock", icon: <BedrockIcon size={24} />, desc: "Build generative AI applications with foundation models" },
    ],
  },
  {
    category: "Developer Tools",
    services: [
      { name: "CodeCommit", href: "/codecommit", icon: <CodeIcon size={24} />, desc: "Store code in private Git repositories" },
      { name: "CodeBuild", href: "/codebuild", icon: <CodeIcon size={24} />, desc: "Build and test code continuously" },
      { name: "CodePipeline", href: "/codepipeline", icon: <CodeIcon size={24} />, desc: "Automate continuous delivery workflows" },
    ],
  },
];

export default function ServicesCatalogPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = useMemo(() => ["All", ...serviceCatalog.map((c) => c.category)], []);

  const filteredCatalog = useMemo(() => {
    return serviceCatalog
      .filter((cat) => selectedCategory === "All" || cat.category === selectedCategory)
      .map((cat) => ({
        ...cat,
        services: cat.services.filter((s) => {
          if (!searchQuery.trim()) return true;
          const q = searchQuery.toLowerCase();
          return (
            s.name.toLowerCase().includes(q) ||
            s.desc.toLowerCase().includes(q) ||
            cat.category.toLowerCase().includes(q)
          );
        }),
      }))
      .filter((cat) => cat.services.length > 0);
  }, [searchQuery, selectedCategory]);

  return (
    <div className="max-w-[1300px] mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[24px] font-bold text-[#16191f] mb-1">AWS Services</h1>
        <p className="text-[14px] text-[#545b64]">
          Explore and launch services across compute, storage, databases, networking, security, and more.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white border border-[#d5dbdb] rounded p-4 mb-6 awsui-shadow flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="relative w-full md:w-[420px]">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#545b64]"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="text"
            placeholder="Search by service name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-[#aab7b8] rounded pl-9 pr-3 py-[6px] text-[13px] text-[#16191f] placeholder-[#8d9ba8] focus:outline-none focus:border-[#0073bb] focus:ring-1 focus:ring-[#0073bb]"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-1.5 overflow-x-auto max-w-full">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 text-[12px] rounded-full transition-colors whitespace-nowrap ${
                selectedCategory === cat
                  ? "bg-[#0073bb] text-white font-medium"
                  : "bg-[#f2f3f3] text-[#545b64] hover:bg-[#eaeded] hover:text-[#16191f]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Services Grid by Category */}
      <div className="space-y-8">
        {filteredCatalog.map((group) => (
          <div key={group.category} className="space-y-3">
            <div className="flex items-center gap-2 border-b border-[#eaeded] pb-2">
              <h2 className="text-[16px] font-bold text-[#16191f]">{group.category}</h2>
              <span className="text-[12px] text-[#879596]">({group.services.length})</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {group.services.map((service) => (
                <Link
                  key={service.name}
                  href={service.href}
                  className="bg-white border border-[#d5dbdb] rounded p-4 hover:border-[#0073bb] hover:shadow-sm transition-all group flex items-start gap-3.5"
                >
                  <div className="shrink-0 mt-0.5">{service.icon}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-[14px] text-[#0073bb] group-hover:text-[#ec7211] group-hover:underline truncate">
                        {service.name}
                      </span>
                      {service.status === "functional" && (
                        <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-[#f2f8f0] text-[#1d8102] border border-[#d4e8cc]">
                          Active
                        </span>
                      )}
                      {service.status === "emulator" && (
                        <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-[#f2f8fd] text-[#0073bb] border border-[#cbe2f2]">
                          Ready
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-[#545b64] mt-1 leading-relaxed line-clamp-2">
                      {service.desc}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}

        {filteredCatalog.length === 0 && (
          <div className="bg-white border border-[#d5dbdb] rounded p-12 text-center awsui-shadow">
            <p className="text-[14px] text-[#545b64]">
              No services found matching &quot;{searchQuery}&quot;
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
              }}
              className="mt-3 text-[13px] text-[#0073bb] hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
