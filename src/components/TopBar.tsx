/**
 * TopBar – Pixel-perfect match of the real AWS Console top navigation.
 * Background is #000716 (near-black with slight blue tint).
 * Services dropdown shows all services organized by category.
 */

"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
} from "./AwsIcons";

type TopBarProps = {
  accountId: string;
  userName: string;
  region: string;
};

// Full service catalog organized by category – matches real AWS Console
const serviceCategories = [
  {
    category: "Compute",
    services: [
      { name: "EC2", href: "/ec2", icon: <EC2Icon size={16} />, desc: "Virtual Servers in the Cloud" },
      { name: "Lambda", href: "/lambda", icon: <LambdaIcon size={16} />, desc: "Run Code without Thinking about Servers" },
      { name: "Elastic Beanstalk", href: "/elasticbeanstalk", icon: <BeanstalkIcon size={16} />, desc: "Run and Manage Web Apps" },
      { name: "Lightsail", href: "/lightsail", icon: <LightsailIcon size={16} />, desc: "Launch and Manage Virtual Private Servers" },
      { name: "ECS", href: "/ecs", icon: <ECSIcon size={16} />, desc: "Run and Manage Docker Containers" },
      { name: "EKS", href: "/eks", icon: <EKSIcon size={16} />, desc: "Run Managed Kubernetes" },
    ],
  },
  {
    category: "Storage",
    services: [
      { name: "S3", href: "/s3", icon: <S3Icon size={16} />, desc: "Scalable Storage in the Cloud" },
      { name: "EFS", href: "/efs", icon: <EFSIcon size={16} />, desc: "Managed File Storage for EC2" },
      { name: "S3 Glacier", href: "/glacier", icon: <GlacierIcon size={16} />, desc: "Archive Storage in the Cloud" },
    ],
  },
  {
    category: "Database",
    services: [
      { name: "RDS", href: "/rds", icon: <RDSIcon size={16} />, desc: "Managed Relational Database Service" },
      { name: "DynamoDB", href: "/dynamodb", icon: <DynamoDBIcon size={16} />, desc: "Managed NoSQL Database" },
      { name: "ElastiCache", href: "/elasticache", icon: <ElastiCacheIcon size={16} />, desc: "In-Memory Caching Service" },
      { name: "Redshift", href: "/redshift", icon: <RedshiftIcon size={16} />, desc: "Fast, Simple, Cost-Effective Data Warehousing" },
    ],
  },
  {
    category: "Networking & Content Delivery",
    services: [
      { name: "VPC", href: "/vpc", icon: <VPCIcon size={16} />, desc: "Isolated Cloud Resources" },
      { name: "CloudFront", href: "/cloudfront", icon: <CloudFrontIcon size={16} />, desc: "Global Content Delivery Network" },
      { name: "Route 53", href: "/route53", icon: <Route53Icon size={16} />, desc: "Scalable Domain Name System" },
      { name: "API Gateway", href: "/apigateway", icon: <APIGatewayIcon size={16} />, desc: "Build, Deploy, and Manage APIs" },
    ],
  },
  {
    category: "Security, Identity, & Compliance",
    services: [
      { name: "IAM", href: "/iam", icon: <IAMIcon size={16} />, desc: "Manage User Access and Encryption Keys" },
      { name: "KMS", href: "/kms", icon: <KMSIcon size={16} />, desc: "Managed Creation and Control of Encryption Keys" },
      { name: "Cognito", href: "/cognito", icon: <CognitoIcon size={16} />, desc: "Identity for your Web and Mobile Apps" },
      { name: "Secrets Manager", href: "/secretsmanager", icon: <SecretsManagerIcon size={16} />, desc: "Rotate, Manage, and Retrieve Secrets" },
    ],
  },
  {
    category: "Application Integration",
    services: [
      { name: "SQS", href: "/sqs", icon: <SQSIcon size={16} />, desc: "Managed Message Queues" },
      { name: "SNS", href: "/sns", icon: <SNSIcon size={16} />, desc: "Managed Message Topics for Pub/Sub" },
      { name: "Step Functions", href: "/stepfunctions", icon: <StepFunctionsIcon size={16} />, desc: "Coordinate Distributed Applications" },
      { name: "EventBridge", href: "/eventbridge", icon: <EventBridgeIcon size={16} />, desc: "Serverless Event Bus" },
    ],
  },
  {
    category: "Management & Governance",
    services: [
      { name: "CloudWatch", href: "/cloudwatch", icon: <CloudWatchIcon size={16} />, desc: "Monitor Resources and Applications" },
      { name: "CloudTrail", href: "/cloudtrail", icon: <CloudTrailIcon size={16} />, desc: "Track User Activity and API Usage" },
      { name: "CloudFormation", href: "/cloudformation", icon: <CloudFormationIcon size={16} />, desc: "Create and Manage Resources with Templates" },
      { name: "Systems Manager", href: "/systems-manager", icon: <SystemsManagerIcon size={16} />, desc: "Operational Insights and Take Action" },
    ],
  },
  {
    category: "Analytics",
    services: [
      { name: "Kinesis", href: "/kinesis", icon: <KinesisIcon size={16} />, desc: "Work with Real-Time Streaming Data" },
      { name: "Athena", href: "/athena", icon: <AthenaIcon size={16} />, desc: "Query Data in S3 using SQL" },
      { name: "Redshift", href: "/redshift", icon: <RedshiftIcon size={16} />, desc: "Fast Data Warehousing" },
    ],
  },
  {
    category: "Machine Learning",
    services: [
      { name: "SageMaker", href: "/sagemaker", icon: <SageMakerIcon size={16} />, desc: "Build, Train, and Deploy ML Models" },
      { name: "Bedrock", href: "/bedrock", icon: <BedrockIcon size={16} />, desc: "Build with Foundation Models" },
    ],
  },
  {
    category: "Developer Tools",
    services: [
      { name: "CodeCommit", href: "/codecommit", icon: <CodeIcon size={16} />, desc: "Store Code in Private Git Repositories" },
      { name: "CodeBuild", href: "/codebuild", icon: <CodeIcon size={16} />, desc: "Build and Test Code" },
      { name: "CodePipeline", href: "/codepipeline", icon: <CodeIcon size={16} />, desc: "Release Software using Continuous Delivery" },
    ],
  },
];

// Flat list of all services for search
const allServicesFlat = serviceCategories.flatMap((c) =>
  c.services.map((s) => ({ ...s, category: c.category }))
);

// De-duplicate by href (Redshift appears in Database + Analytics)
const uniqueServices = allServicesFlat.filter(
  (s, i, arr) => arr.findIndex((x) => x.href === s.href) === i
);

export default function TopBar({ accountId, userName, region }: TopBarProps) {
  const [servicesOpen, setServicesOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const servicesRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (servicesRef.current && !servicesRef.current.contains(e.target as Node)) setServicesOpen(false);
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) setAccountOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Filtered services based on search
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return serviceCategories;
    const q = searchQuery.toLowerCase();
    return serviceCategories
      .map((cat) => ({
        ...cat,
        services: cat.services.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.desc.toLowerCase().includes(q) ||
            cat.category.toLowerCase().includes(q)
        ),
      }))
      .filter((cat) => cat.services.length > 0);
  }, [searchQuery]);

  function handleServiceClick(name: string, href: string) {
    try {
      const stored = JSON.parse(localStorage.getItem("recentServices") || "[]");
      const filtered = stored.filter((s: { name: string }) => s.name !== name);
      filtered.unshift({ name, href, visitedAt: Date.now() });
      localStorage.setItem("recentServices", JSON.stringify(filtered.slice(0, 10)));
    } catch { /* ignore */ }
    setServicesOpen(false);
    setSearchQuery("");
    router.push(href);
  }

  return (
    <header className="h-[40px] flex items-center text-[13px] fixed top-0 left-0 right-0 z-50" style={{ backgroundColor: "#000716" }}>

      {/* AWS Logo */}
      <Link href="/" className="flex items-center px-4 h-full hover:opacity-80">
        <svg width="39" height="24" viewBox="0 0 39 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <text x="0" y="17" fill="white" fontFamily="Amazon Ember, Inter, Arial" fontWeight="bold" fontSize="16" letterSpacing="0.5">aws</text>
          <path d="M2 20 Q20 26 37 20" stroke="#FF9900" strokeWidth="2" fill="none" strokeLinecap="round"/>
        </svg>
      </Link>

      {/* Services grid icon */}
      <div ref={servicesRef} className="relative">
        <button
          onClick={() => { setServicesOpen(!servicesOpen); setAccountOpen(false); }}
          className="flex items-center justify-center w-[40px] h-[40px] hover:bg-white/10 text-white"
          title="Services"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="white">
            <rect x="1" y="1" width="3.5" height="3.5" rx="0.5"/>
            <rect x="6.25" y="1" width="3.5" height="3.5" rx="0.5"/>
            <rect x="11.5" y="1" width="3.5" height="3.5" rx="0.5"/>
            <rect x="1" y="6.25" width="3.5" height="3.5" rx="0.5"/>
            <rect x="6.25" y="6.25" width="3.5" height="3.5" rx="0.5"/>
            <rect x="11.5" y="6.25" width="3.5" height="3.5" rx="0.5"/>
            <rect x="1" y="11.5" width="3.5" height="3.5" rx="0.5"/>
            <rect x="6.25" y="11.5" width="3.5" height="3.5" rx="0.5"/>
            <rect x="11.5" y="11.5" width="3.5" height="3.5" rx="0.5"/>
          </svg>
        </button>

        {servicesOpen && (
          <div className="absolute top-[40px] left-0 bg-white border border-[#d5dbdb] shadow-lg w-[340px] z-50 rounded-b max-h-[calc(100vh-60px)] overflow-y-auto">
            {/* Search within services */}
            <div className="px-3 py-2 border-b border-[#eaeded] sticky top-0 bg-white z-10">
              <input
                type="text"
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-[#aab7b8] rounded px-2.5 py-[5px] text-[13px] text-[#16191f] placeholder-[#aab7b8] focus:outline-none focus:border-[#0073bb] focus:ring-1 focus:ring-[#0073bb]"
                autoFocus
              />
            </div>

            {/* Categorized services */}
            <div className="py-1">
              {filteredCategories.map((cat) => (
                <div key={cat.category}>
                  {/* Category header */}
                  <div className="px-4 pt-3 pb-1 text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
                    {cat.category}
                  </div>
                  {/* Service items */}
                  {cat.services.map((s) => (
                    <button
                      key={s.href}
                      onClick={() => handleServiceClick(s.name, s.href)}
                      className="w-full text-left px-4 py-[6px] text-[13px] text-[#0073bb] hover:bg-[#f2f3f3] flex items-center gap-2.5 group"
                    >
                      {s.icon}
                      <div className="min-w-0">
                        <div className="group-hover:text-[#ec7211] truncate">{s.name}</div>
                        <div className="text-[11px] text-[#545b64] truncate">{s.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              ))}
              {filteredCategories.length === 0 && (
                <div className="px-4 py-6 text-[13px] text-[#545b64] text-center">
                  No services match &quot;{searchQuery}&quot;
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* "Services" text button */}
      <button
        onClick={() => { setServicesOpen(!servicesOpen); setAccountOpen(false); }}
        className="text-white text-[13px] px-2 h-full hover:bg-white/10"
      >
        Services
      </button>

      {/* Search bar */}
      <div className="flex-1 max-w-[480px] mx-2">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8d9ba8]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="7"/>
            <path d="m20 20-3.5-3.5"/>
          </svg>
          <input
            type="text"
            placeholder="Search                                                               [Alt+S]"
            className="w-full border border-[#5f6b7a] rounded-md pl-8 pr-3 py-[5px] text-[13px] text-white placeholder-[#8d9ba8] focus:outline-none focus:border-white focus:bg-[#0d1b2a]"
            style={{ backgroundColor: "#0d1b2a" }}
            readOnly
          />
        </div>
      </div>

      {/* Right side icons */}
      <div className="flex items-center ml-auto h-full">
        {/* CloudShell icon */}
        <button className="flex items-center justify-center w-[40px] h-full hover:bg-white/10 text-white" title="CloudShell">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <path d="M8 12l3 3 5-5"/>
          </svg>
        </button>

        {/* Bell */}
        <button className="flex items-center justify-center w-[40px] h-full hover:bg-white/10 text-white" title="Notifications">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </button>

        {/* Help / Support (?) */}
        <button className="flex items-center justify-center w-[40px] h-full hover:bg-white/10 text-white" title="Support">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
            <circle cx="12" cy="17" r="0.5" fill="currentColor"/>
          </svg>
        </button>

        {/* Settings gear */}
        <button className="flex items-center justify-center w-[40px] h-full hover:bg-white/10 text-white" title="Settings">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </button>

        {/* Region */}
        <button className="flex items-center gap-1 px-3 h-full hover:bg-white/10 text-white text-[12px] border-l border-white/20">
          N. Virginia
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-white/60">
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </button>

        {/* Account */}
        <div ref={accountRef} className="relative h-full">
          <button
            onClick={() => { setAccountOpen(!accountOpen); setServicesOpen(false); }}
            className="flex items-center gap-1 px-3 h-full hover:bg-white/10 text-white text-[12px] border-l border-white/20"
          >
            {userName} @ {accountId}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-white/60">
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </button>

          {accountOpen && (
            <div className="absolute top-[40px] right-0 bg-white border border-[#d5dbdb] shadow-lg w-[280px] z-50 rounded-b">
              <div className="px-4 py-3 border-b border-[#eaeded]">
                <div className="text-[11px] text-[#545b64] mb-0.5">Account ID</div>
                <div className="text-[13px] text-[#16191f] font-mono">{accountId}</div>
              </div>
              <div className="px-4 py-3 border-b border-[#eaeded]">
                <div className="text-[11px] text-[#545b64] mb-0.5">IAM User</div>
                <div className="text-[13px] text-[#16191f]">{userName}</div>
              </div>
              <div className="px-4 py-3">
                <div className="text-[11px] text-[#545b64] mb-0.5">Region</div>
                <div className="text-[13px] text-[#16191f]">{region} (us-east-1)</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
