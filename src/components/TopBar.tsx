/**
 * TopBar – Pixel-perfect match of the real AWS Console top navigation.
 * Background is #000716 (near-black with slight blue tint).
 * All navbar buttons (Search, CloudShell, Notifications, Support, Settings, Region, Account)
 * are fully interactive and functional.
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
import SwitchIdentityModal from "./SwitchIdentityModal";
import CloudShellTerminal from "./CloudShellTerminal";
import { ActiveIdentity } from "@/lib/permissions";

type TopBarProps = {
  accountId: string;
  userName: string;
  region: string;
  initialIdentity?: ActiveIdentity;
};

// Full service catalog organized by category
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

// Flat list of all unique services for global search
const allServicesFlat = serviceCategories.flatMap((c) =>
  c.services.map((s) => ({ ...s, category: c.category }))
);
const uniqueServices = allServicesFlat.filter(
  (s, i, arr) => arr.findIndex((x) => x.href === s.href) === i
);

const availableRegions = [
  { id: "us-east-1", name: "US East (N. Virginia)", active: true, tag: "Default Emulator" },
  { id: "us-east-2", name: "US East (Ohio)", active: false },
  { id: "us-west-1", name: "US West (N. California)", active: false },
  { id: "us-west-2", name: "US West (Oregon)", active: false },
  { id: "eu-west-1", name: "Europe (Ireland)", active: false },
  { id: "eu-central-1", name: "Europe (Frankfurt)", active: false },
  { id: "ap-south-1", name: "Asia Pacific (Mumbai)", active: false },
  { id: "ap-southeast-1", name: "Asia Pacific (Singapore)", active: false },
];

export default function TopBar({ accountId, userName, region: initialRegion, initialIdentity }: TopBarProps) {
  const router = useRouter();

  // Active Identity State
  const [activeIdentity, setActiveIdentity] = useState<ActiveIdentity>(
    initialIdentity || { type: "admin", name: userName || "emulator", accountId: accountId || "000000000000" }
  );
  const [switchModalOpen, setSwitchModalOpen] = useState(false);

  // Sync if initialIdentity changes
  useEffect(() => {
    if (initialIdentity) setActiveIdentity(initialIdentity);
  }, [initialIdentity]);

  // Dropdown States
  const [servicesOpen, setServicesOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [regionOpen, setRegionOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [cloudShellOpen, setCloudShellOpen] = useState(false);

  // Search States
  const [servicesSearchQuery, setServicesSearchQuery] = useState("");
  const [globalSearch, setGlobalSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState(initialRegion || "us-east-1");

  // Notifications State
  const [hasUnread, setHasUnread] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [historyCleared, setHistoryCleared] = useState(false);

  // CloudShell Tab
  const [shellTab, setShellTab] = useState<"cli" | "env" | "health">("cli");

  // Refs for click outside
  const servicesRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const regionRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const supportRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Global Alt+S shortcut listener
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.altKey && (e.key === "s" || e.key === "S")) || (e.key === "/" && document.activeElement?.tagName !== "INPUT")) {
        e.preventDefault();
        searchInputRef.current?.focus();
        setSearchFocused(true);
      }
      if (e.key === "Escape") {
        closeAllDropdowns();
        searchInputRef.current?.blur();
        setSearchFocused(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Central click-outside listener
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (servicesRef.current && !servicesRef.current.contains(target)) setServicesOpen(false);
      if (accountRef.current && !accountRef.current.contains(target)) setAccountOpen(false);
      if (regionRef.current && !regionRef.current.contains(target)) setRegionOpen(false);
      if (notificationsRef.current && !notificationsRef.current.contains(target)) setNotificationsOpen(false);
      if (supportRef.current && !supportRef.current.contains(target)) setSupportOpen(false);
      if (settingsRef.current && !settingsRef.current.contains(target)) setSettingsOpen(false);
      if (searchContainerRef.current && !searchContainerRef.current.contains(target)) setSearchFocused(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function closeAllDropdowns() {
    setServicesOpen(false);
    setAccountOpen(false);
    setRegionOpen(false);
    setNotificationsOpen(false);
    setSupportOpen(false);
    setSettingsOpen(false);
  }

  function copyToClipboard(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  function handleServiceClick(name: string, href: string) {
    try {
      const stored = JSON.parse(localStorage.getItem("recentServices") || "[]");
      const filtered = stored.filter((s: { name: string }) => s.name !== name);
      filtered.unshift({ name, href, visitedAt: Date.now() });
      localStorage.setItem("recentServices", JSON.stringify(filtered.slice(0, 10)));
    } catch { /* ignore */ }
    closeAllDropdowns();
    setServicesSearchQuery("");
    setGlobalSearch("");
    setSearchFocused(false);
    router.push(href);
  }

  function handleClearHistory() {
    try {
      localStorage.removeItem("recentServices");
      setHistoryCleared(true);
      setTimeout(() => setHistoryCleared(false), 2000);
    } catch { /* ignore */ }
  }

  // Filtered services in Services dropdown menu
  const filteredCategories = useMemo(() => {
    if (!servicesSearchQuery.trim()) return serviceCategories;
    const q = servicesSearchQuery.toLowerCase();
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
  }, [servicesSearchQuery]);

  // Global search matching results
  const globalSearchResults = useMemo(() => {
    if (!globalSearch.trim()) return [];
    const q = globalSearch.toLowerCase();
    return uniqueServices.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.desc.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [globalSearch]);

  const currentRegionObj = availableRegions.find((r) => r.id === selectedRegion) || availableRegions[0];

  return (
    <>
      <header className="h-[40px] flex items-center text-[13px] fixed top-0 left-0 right-0 z-50 select-none" style={{ backgroundColor: "#000716" }}>
        
        {/* 1. AWS Logo */}
        <Link href="/" className="flex items-center px-4 h-full hover:opacity-80 transition-opacity" title="AWS Management Console Home">
          <svg width="39" height="24" viewBox="0 0 39 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <text x="0" y="17" fill="white" fontFamily="Amazon Ember, Inter, Arial" fontWeight="bold" fontSize="16" letterSpacing="0.5">aws</text>
            <path d="M2 20 Q20 26 37 20" stroke="#FF9900" strokeWidth="2" fill="none" strokeLinecap="round"/>
          </svg>
        </Link>

        {/* 2. Services Grid Menu */}
        <div ref={servicesRef} className="relative h-full">
          <button
            onClick={() => {
              const nextState = !servicesOpen;
              closeAllDropdowns();
              setServicesOpen(nextState);
            }}
            className={`flex items-center justify-center w-[40px] h-full hover:bg-white/10 text-white transition-colors ${servicesOpen ? "bg-white/15" : ""}`}
            title="Services Menu"
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
            <div className="absolute top-[40px] left-0 bg-white border border-[#d5dbdb] shadow-xl w-[360px] z-50 rounded-b-md max-h-[calc(100vh-60px)] overflow-y-auto">
              <div className="px-3 py-2 border-b border-[#eaeded] sticky top-0 bg-white z-10">
                <input
                  type="text"
                  placeholder="Search services..."
                  value={servicesSearchQuery}
                  onChange={(e) => setServicesSearchQuery(e.target.value)}
                  className="w-full border border-[#aab7b8] rounded px-2.5 py-[5px] text-[13px] text-[#16191f] placeholder-[#aab7b8] focus:outline-none focus:border-[#0073bb] focus:ring-1 focus:ring-[#0073bb]"
                  autoFocus
                />
              </div>

              <div className="py-1">
                {filteredCategories.map((cat) => (
                  <div key={cat.category}>
                    <div className="px-4 pt-3 pb-1 text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
                      {cat.category}
                    </div>
                    {cat.services.map((s) => (
                      <button
                        key={s.href}
                        onClick={() => handleServiceClick(s.name, s.href)}
                        className="w-full text-left px-4 py-[6px] text-[13px] text-[#0073bb] hover:bg-[#f2f3f3] flex items-center gap-2.5 group transition-colors"
                      >
                        {s.icon}
                        <div className="min-w-0">
                          <div className="group-hover:text-[#ec7211] font-medium text-[#16191f]">{s.name}</div>
                          <div className="text-[11px] text-[#545b64] truncate">{s.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                ))}
                {filteredCategories.length === 0 && (
                  <div className="px-4 py-8 text-[13px] text-[#545b64] text-center">
                    No services match &quot;{servicesSearchQuery}&quot;
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 3. Global Search Bar */}
        <div ref={searchContainerRef} className="flex-1 max-w-[500px] mx-3 relative">
          <div className="relative flex items-center">
            <svg className="absolute left-3 text-[#8d9ba8]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="7"/>
              <path d="m20 20-3.5-3.5"/>
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search services, features, and docs [Alt+S]"
              value={globalSearch}
              onChange={(e) => {
                setGlobalSearch(e.target.value);
                setSearchFocused(true);
              }}
              onFocus={() => setSearchFocused(true)}
              className="w-full border border-[#5f6b7a] rounded-md pl-9 pr-8 py-[5px] text-[13px] text-white placeholder-[#8d9ba8] focus:outline-none focus:border-white focus:ring-1 focus:ring-white/40 transition-all"
              style={{ backgroundColor: "#0d1b2a" }}
            />
            {globalSearch && (
              <button
                onClick={() => setGlobalSearch("")}
                className="absolute right-2.5 text-[#8d9ba8] hover:text-white text-[12px]"
                title="Clear"
              >
                ✕
              </button>
            )}
          </div>

          {/* Search Dropdown / Palette */}
          {searchFocused && (
            <div className="absolute top-[38px] left-0 right-0 bg-white border border-[#d5dbdb] shadow-2xl rounded-b-md z-50 overflow-hidden max-h-[380px] overflow-y-auto">
              {globalSearch.trim() ? (
                <div>
                  <div className="px-3 py-2 bg-[#fafafa] border-b border-[#eaeded] text-[11px] font-semibold text-[#545b64] uppercase tracking-wide">
                    Services ({globalSearchResults.length})
                  </div>
                  {globalSearchResults.map((s) => (
                    <button
                      key={s.href}
                      onClick={() => handleServiceClick(s.name, s.href)}
                      className="w-full text-left px-3 py-2 hover:bg-[#f2f3f3] flex items-center gap-3 border-b border-[#eaeded]/60 group transition-colors"
                    >
                      {s.icon}
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-medium text-[#16191f] group-hover:text-[#ec7211] flex items-center gap-2">
                          {s.name}
                          <span className="text-[11px] text-[#545b64] font-normal">in {s.category}</span>
                        </div>
                        <div className="text-[11px] text-[#545b64] truncate">{s.desc}</div>
                      </div>
                      <span className="text-[11px] text-[#0073bb] group-hover:underline">Open ↗</span>
                    </button>
                  ))}
                  {globalSearchResults.length === 0 && (
                    <div className="px-4 py-8 text-center text-[#545b64] text-[13px]">
                      No services found for &quot;{globalSearch}&quot;
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3">
                  <div className="text-[11px] font-semibold text-[#545b64] uppercase tracking-wide mb-2">
                    Quick Jump
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { name: "S3", href: "/s3", icon: <S3Icon size={14} /> },
                      { name: "SQS", href: "/sqs", icon: <SQSIcon size={14} /> },
                      { name: "DynamoDB", href: "/dynamodb", icon: <DynamoDBIcon size={14} /> },
                      { name: "IAM", href: "/iam", icon: <IAMIcon size={14} /> },
                      { name: "Services Catalog", href: "/services", icon: <CodeIcon size={14} /> },
                    ].map((item) => (
                      <button
                        key={item.href}
                        onClick={() => handleServiceClick(item.name, item.href)}
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-[#f2f3f3] text-[12px] text-[#16191f] text-left border border-transparent hover:border-[#d5dbdb]"
                      >
                        {item.icon}
                        <span className="font-medium">{item.name}</span>
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 pt-2 border-t border-[#eaeded] text-[11px] text-[#879596] flex items-center justify-between">
                    <span>Press <kbd className="bg-[#eaeded] px-1 py-0.5 rounded text-[#16191f]">Esc</kbd> to close</span>
                    <span>Local Emulator: 127.0.0.1:9297</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 4. Right Side Toolbar */}
        <div className="flex items-center ml-auto h-full">

          {/* CloudShell Terminal Drawer Button */}
          <button
            onClick={() => setCloudShellOpen(!cloudShellOpen)}
            className={`flex items-center justify-center w-[40px] h-full hover:bg-white/10 text-white transition-colors ${cloudShellOpen ? "bg-white/20 text-[#ff9900]" : ""}`}
            title="AWS CloudShell / CLI Console"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="4 17 10 11 4 5"/>
              <line x1="12" y1="19" x2="20" y2="19"/>
            </svg>
          </button>

          {/* Notifications Bell */}
          <div ref={notificationsRef} className="relative h-full">
            <button
              onClick={() => {
                const next = !notificationsOpen;
                closeAllDropdowns();
                setNotificationsOpen(next);
                if (next) setHasUnread(false);
              }}
              className={`flex items-center justify-center w-[40px] h-full hover:bg-white/10 text-white relative transition-colors ${notificationsOpen ? "bg-white/15" : ""}`}
              title="Notifications"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              {hasUnread && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#ec7211]" />
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute top-[40px] right-0 bg-white border border-[#d5dbdb] shadow-xl w-[320px] z-50 rounded-b-md text-[#16191f]">
                <div className="px-4 py-2.5 border-b border-[#eaeded] flex items-center justify-between">
                  <span className="font-bold text-[13px]">Notifications</span>
                  <button
                    onClick={() => setHasUnread(false)}
                    className="text-[11px] text-[#0073bb] hover:underline"
                  >
                    Mark all as read
                  </button>
                </div>
                <div className="divide-y divide-[#eaeded] max-h-[300px] overflow-y-auto">
                  <div className="p-3 hover:bg-[#fafafa] flex items-start gap-2.5">
                    <span className="w-2 h-2 mt-1.5 rounded-full bg-green-500 shrink-0" />
                    <div>
                      <div className="text-[12px] font-semibold text-[#16191f]">AWS Emulator Online</div>
                      <div className="text-[11px] text-[#545b64]">Listening on https://127.0.0.1:9297 with valid local TLS cert.</div>
                      <div className="text-[10px] text-[#879596] mt-0.5">Active</div>
                    </div>
                  </div>
                  <div className="p-3 hover:bg-[#fafafa] flex items-start gap-2.5">
                    <span className="w-2 h-2 mt-1.5 rounded-full bg-blue-500 shrink-0" />
                    <div>
                      <div className="text-[12px] font-semibold text-[#16191f]">Local Credentials Bound</div>
                      <div className="text-[11px] text-[#545b64]">Authenticated as Account ID 000000000000 (emulator).</div>
                      <div className="text-[10px] text-[#879596] mt-0.5">Connected</div>
                    </div>
                  </div>
                  <div className="p-3 hover:bg-[#fafafa] flex items-start gap-2.5">
                    <span className="w-2 h-2 mt-1.5 rounded-full bg-purple-500 shrink-0" />
                    <div>
                      <div className="text-[12px] font-semibold text-[#16191f]">Services Ready</div>
                      <div className="text-[11px] text-[#545b64]">S3, SQS, DynamoDB, and IAM are ready for local operations.</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Help & Support (?) */}
          <div ref={supportRef} className="relative h-full">
            <button
              onClick={() => {
                const next = !supportOpen;
                closeAllDropdowns();
                setSupportOpen(next);
              }}
              className={`flex items-center justify-center w-[40px] h-full hover:bg-white/10 text-white transition-colors ${supportOpen ? "bg-white/15" : ""}`}
              title="Help & Support"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                <circle cx="12" cy="17" r="0.5" fill="currentColor"/>
              </svg>
            </button>

            {supportOpen && (
              <div className="absolute top-[40px] right-0 bg-white border border-[#d5dbdb] shadow-xl w-[260px] z-50 rounded-b-md text-[#16191f]">
                <div className="px-4 py-2.5 border-b border-[#eaeded] font-bold text-[13px]">
                  Documentation & Support
                </div>
                <div className="py-1">
                  <a
                    href="https://docs.aws.amazon.com/emulator/latest/userguide/"
                    target="_blank"
                    rel="noreferrer"
                    className="block px-4 py-2 text-[12px] text-[#16191f] hover:bg-[#f2f3f3] hover:text-[#0073bb]"
                  >
                    📖 AWS Emulator User Guide ↗
                  </a>
                  <a
                    href="https://github.com/aws/aws-emulator"
                    target="_blank"
                    rel="noreferrer"
                    className="block px-4 py-2 text-[12px] text-[#16191f] hover:bg-[#f2f3f3] hover:text-[#0073bb]"
                  >
                    🐙 Official Emulator Repo ↗
                  </a>
                  <a
                    href="https://github.com/Shubham-Bhayaje/aws-emulator-ui"
                    target="_blank"
                    rel="noreferrer"
                    className="block px-4 py-2 text-[12px] text-[#16191f] hover:bg-[#f2f3f3] hover:text-[#0073bb]"
                  >
                    ⭐ AWS Emulator UI Repo ↗
                  </a>
                  <a
                    href="https://github.com/Shubham-Bhayaje/aws-emulator-ui/issues"
                    target="_blank"
                    rel="noreferrer"
                    className="block px-4 py-2 text-[12px] text-[#16191f] hover:bg-[#f2f3f3] hover:text-[#0073bb]"
                  >
                    🐛 Report an Issue ↗
                  </a>
                </div>
                <div className="px-4 py-2.5 border-t border-[#eaeded] bg-[#fafafa] text-[11px] text-[#545b64]">
                  <div>Keyboard shortcut: <kbd className="bg-white border border-[#d5dbdb] px-1 py-0.5 rounded font-mono">Alt + S</kbd></div>
                </div>
              </div>
            )}
          </div>

          {/* Settings Gear */}
          <div ref={settingsRef} className="relative h-full">
            <button
              onClick={() => {
                const next = !settingsOpen;
                closeAllDropdowns();
                setSettingsOpen(next);
              }}
              className={`flex items-center justify-center w-[40px] h-full hover:bg-white/10 text-white transition-colors ${settingsOpen ? "bg-white/15" : ""}`}
              title="Settings"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </button>

            {settingsOpen && (
              <div className="absolute top-[40px] right-0 bg-white border border-[#d5dbdb] shadow-xl w-[280px] z-50 rounded-b-md text-[#16191f] p-4">
                <div className="font-bold text-[13px] border-b border-[#eaeded] pb-2 mb-3">Console Preferences</div>
                
                <div className="mb-3">
                  <div className="text-[11px] text-[#545b64] font-medium">Emulator Endpoint</div>
                  <div className="text-[12px] font-mono text-[#0073bb] bg-[#f2f3f3] p-1.5 rounded mt-1 flex items-center justify-between">
                    <span>https://127.0.0.1:9297</span>
                    <span className="text-[10px] text-green-700 bg-green-100 px-1 py-0.5 rounded">Active</span>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="text-[11px] text-[#545b64] font-medium">Recent Services History</div>
                  <button
                    onClick={handleClearHistory}
                    className="mt-1 text-[12px] px-2.5 py-1 bg-[#eaeded] hover:bg-[#d5dbdb] rounded text-[#16191f] transition-colors"
                  >
                    {historyCleared ? "✓ History Cleared" : "Clear Visited Services"}
                  </button>
                </div>

                <div className="pt-2 border-t border-[#eaeded] text-[11px] text-[#879596]">
                  <div>Version: <span className="font-medium text-[#16191f]">v0.1.0</span></div>
                  <div>Mode: <span className="font-medium text-[#16191f]">Local Offline</span></div>
                </div>
              </div>
            )}
          </div>

          {/* Region Selector */}
          <div ref={regionRef} className="relative h-full">
            <button
              onClick={() => {
                const next = !regionOpen;
                closeAllDropdowns();
                setRegionOpen(next);
              }}
              className={`flex items-center gap-1.5 px-3 h-full hover:bg-white/10 text-white text-[12px] border-l border-white/20 transition-colors ${regionOpen ? "bg-white/15" : ""}`}
            >
              <span>{currentRegionObj.name.split(" ")[0]}</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-white/60">
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </button>

            {regionOpen && (
              <div className="absolute top-[40px] right-0 bg-white border border-[#d5dbdb] shadow-xl w-[260px] z-50 rounded-b-md text-[#16191f] py-1">
                <div className="px-4 py-2 border-b border-[#eaeded] text-[11px] font-bold text-[#545b64] uppercase tracking-wide">
                  Select Region
                </div>
                {availableRegions.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      setSelectedRegion(r.id);
                      setRegionOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-[12px] hover:bg-[#f2f3f3] flex items-center justify-between transition-colors ${
                      r.id === selectedRegion ? "bg-[#f2f3f3] font-semibold text-[#0073bb]" : "text-[#16191f]"
                    }`}
                  >
                    <div>
                      <div>{r.name}</div>
                      <div className="text-[10px] text-[#545b64] font-mono">{r.id}</div>
                    </div>
                    {r.tag && (
                      <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-normal">
                        {r.tag}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Account Menu */}
          <div ref={accountRef} className="relative h-full">
            <button
              onClick={() => {
                const next = !accountOpen;
                closeAllDropdowns();
                setAccountOpen(next);
              }}
              className={`flex items-center gap-1.5 px-3 h-full hover:bg-white/10 text-white text-[12px] border-l border-white/20 transition-colors ${accountOpen ? "bg-white/15" : ""}`}
            >
              {activeIdentity.type === "admin" ? (
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono font-medium">👑 Admin</span>
              ) : activeIdentity.type === "role" ? (
                <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded font-mono font-medium">🎭 Role</span>
              ) : (
                <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-mono font-medium">👤 User</span>
              )}
              <span>{activeIdentity.name} @ {activeIdentity.accountId}</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-white/60">
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </button>

            {accountOpen && (
              <div className="absolute top-[40px] right-0 bg-white border border-[#d5dbdb] shadow-xl w-[280px] z-50 rounded-b-md text-[#16191f]">
                <div className="px-4 py-3 border-b border-[#eaeded]">
                  <div className="text-[11px] text-[#545b64] mb-0.5">Account ID</div>
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-[#16191f] font-mono font-medium">{activeIdentity.accountId}</span>
                    <button
                      onClick={() => copyToClipboard(activeIdentity.accountId, "account")}
                      className="text-[11px] text-[#0073bb] hover:underline"
                    >
                      {copiedKey === "account" ? "✓ Copied" : "Copy"}
                    </button>
                  </div>
                </div>

                <div className="px-4 py-3 border-b border-[#eaeded]">
                  <div className="text-[11px] text-[#545b64] mb-0.5">
                    {activeIdentity.type === "role" ? "Assumed Role" : "IAM Identity"}
                  </div>
                  <div className="text-[13px] text-[#16191f] font-medium flex items-center justify-between">
                    <span>{activeIdentity.name}</span>
                    <span className="text-[10px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded font-mono uppercase">
                      {activeIdentity.type}
                    </span>
                  </div>
                </div>

                {/* Switch User Button */}
                <div className="p-2.5 border-b border-[#eaeded] bg-[#fafafa]">
                  <button
                    onClick={() => {
                      setAccountOpen(false);
                      setSwitchModalOpen(true);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 bg-[#ec7211] hover:bg-[#eb5f07] text-white rounded text-[12px] font-semibold transition-colors shadow-xs"
                  >
                    <span className="flex items-center gap-1.5">
                      🔄 Switch User / Role
                    </span>
                    <span className="text-[11px] opacity-80">Modal ↗</span>
                  </button>
                </div>

                <div className="px-4 py-2 border-b border-[#eaeded] bg-white">
                  <Link
                    href="/iam"
                    onClick={() => setAccountOpen(false)}
                    className="block py-1.5 text-[12px] text-[#0073bb] hover:underline font-medium"
                  >
                    IAM Dashboard ↗
                  </Link>
                  <Link
                    href="/iam/users"
                    onClick={() => setAccountOpen(false)}
                    className="block py-1.5 text-[12px] text-[#0073bb] hover:underline"
                  >
                    Manage Users & Policies ↗
                  </Link>
                </div>

                <div className="px-4 py-2.5">
                  <button
                    onClick={() => {
                      setAccountOpen(false);
                      router.push("/");
                    }}
                    className="w-full text-center py-1.5 text-[12px] border border-[#aab7b8] rounded hover:bg-[#eaeded] font-medium transition-colors"
                  >
                    Console Home
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* Switch Identity Modal */}
      <SwitchIdentityModal
        isOpen={switchModalOpen}
        onClose={() => setSwitchModalOpen(false)}
        onIdentityChanged={(newId) => setActiveIdentity(newId)}
      />

      {/* Functional Interactive AWS CloudShell Terminal */}
      <CloudShellTerminal
        isOpen={cloudShellOpen}
        onClose={() => setCloudShellOpen(false)}
      />
    </>
  );
}
