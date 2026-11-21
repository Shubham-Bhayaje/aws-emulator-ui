/**
 * src/lib/searchServices.ts – Advanced AWS Console-Style Search Engine.
 * Token-based matching, acronym expansion, alias matching, feature discovery,
 * and intelligent relevance ranking.
 * Zero emojis, Cloudscape enterprise standard.
 */

import { ALL_SERVICES, ServiceDefinition } from "./services-catalog";

export interface ServiceFeatureItem {
  id: string;
  name: string;
  href: string;
  serviceId: string;
  serviceName: string;
  category: string;
  desc: string;
  color?: string;
  aliases: string[];
}

export interface SearchMatchResult {
  services: ServiceDefinition[];
  features: ServiceFeatureItem[];
  totalMatches: number;
}

// Sub-service feature deep links across console
export const COMMON_FEATURES: ServiceFeatureItem[] = [
  // Systems Manager
  {
    id: "feat-ssm-params",
    name: "Parameter Store",
    href: "/systems-manager/parameter-store",
    serviceId: "systems-manager",
    serviceName: "AWS Systems Manager",
    category: "Management & Governance",
    desc: "Hierarchical configuration and secrets storage (String, StringList, SecureString)",
    color: "#C925D1",
    aliases: [
      "parameter store",
      "ssm parameters",
      "securestring",
      "config store",
      "parameters",
      "ssm parameter store",
      "systems manager parameter store",
    ],
  },
  {
    id: "feat-ssm-params-create",
    name: "Create parameter",
    href: "/systems-manager/parameter-store/create",
    serviceId: "systems-manager",
    serviceName: "AWS Systems Manager",
    category: "Management & Governance",
    desc: "Create standard or advanced parameter with KMS encryption",
    color: "#C925D1",
    aliases: ["create parameter", "new parameter", "add parameter", "store parameter"],
  },
  {
    id: "feat-ssm-fleet",
    name: "Fleet Manager",
    href: "/systems-manager",
    serviceId: "systems-manager",
    serviceName: "AWS Systems Manager",
    category: "Management & Governance",
    desc: "Centrally manage hybrid cloud nodes, patch compliance, and instance health",
    color: "#C925D1",
    aliases: ["fleet manager", "managed nodes", "ssm fleet", "node management"],
  },
  {
    id: "feat-ssm-session",
    name: "Session Manager",
    href: "/systems-manager/session-manager",
    serviceId: "systems-manager",
    serviceName: "AWS Systems Manager",
    category: "Management & Governance",
    desc: "Browser-based shell access to managed nodes without bastion hosts",
    color: "#C925D1",
    aliases: ["session manager", "ssh", "terminal", "bastionless", "ssm shell"],
  },

  // Secrets Manager
  {
    id: "feat-sm-new",
    name: "Store a new secret",
    href: "/secretsmanager/new",
    serviceId: "secretsmanager",
    serviceName: "AWS Secrets Manager",
    category: "Security, Identity, & Compliance",
    desc: "Create and encrypt database credentials, OAuth tokens, or API keys",
    color: "#DD3522",
    aliases: ["create secret", "new secret", "store secret", "store password", "save credentials"],
  },
  {
    id: "feat-sm-secrets",
    name: "Secrets inventory",
    href: "/secretsmanager",
    serviceId: "secretsmanager",
    serviceName: "AWS Secrets Manager",
    category: "Security, Identity, & Compliance",
    desc: "View and manage active, encrypted, and scheduled-for-deletion secrets",
    color: "#DD3522",
    aliases: ["secrets", "passwords", "credentials", "api keys", "secret list"],
  },

  // Certificate Manager (ACM)
  {
    id: "feat-acm-request",
    name: "Request a certificate",
    href: "/acm/request",
    serviceId: "acm",
    serviceName: "AWS Certificate Manager",
    category: "Security, Identity, & Compliance",
    desc: "Request a public SSL/TLS certificate with DNS (Route 53) or email validation",
    color: "#E7157B",
    aliases: ["request certificate", "new ssl certificate", "create certificate", "tls request", "ssl cert"],
  },
  {
    id: "feat-acm-import",
    name: "Import a certificate",
    href: "/acm/import",
    serviceId: "acm",
    serviceName: "AWS Certificate Manager",
    category: "Security, Identity, & Compliance",
    desc: "Import an existing X.509 certificate, private key, and certificate chain",
    color: "#E7157B",
    aliases: ["import certificate", "upload certificate", "pem certificate", "custom cert"],
  },
  {
    id: "feat-acm-pca",
    name: "AWS Private CA",
    href: "/acm/pca",
    serviceId: "acm-pca",
    serviceName: "AWS Private CA",
    category: "Security, Identity, & Compliance",
    desc: "Private Certificate Authority for internal enterprise services",
    color: "#E7157B",
    aliases: [
      "private ca",
      "pca",
      "private certificate authority",
      "internal ca",
      "root ca",
      "subordinate ca",
      "certificate authority",
      "x.509",
    ],
  },
  {
    id: "feat-acm-pca-create",
    name: "Create a private CA",
    href: "/acm/pca/create",
    serviceId: "acm-pca",
    serviceName: "AWS Private CA",
    category: "Security, Identity, & Compliance",
    desc: "Create a root or subordinate private certificate authority with custom CRL and algorithms",
    color: "#E7157B",
    aliases: ["create private ca", "new ca", "create root ca", "create subordinate ca", "create certificate authority"],
  },

  // KMS
  {
    id: "feat-kms-customer",
    name: "Customer managed keys",
    href: "/kms",
    serviceId: "kms",
    serviceName: "AWS KMS",
    category: "Security, Identity, & Compliance",
    desc: "KMS encryption keys created, owned, and managed by your AWS account",
    color: "#E7157B",
    aliases: ["customer keys", "cmk", "kms keys", "encryption keys", "customer managed keys"],
  },
  {
    id: "feat-kms-aws",
    name: "AWS managed keys",
    href: "/kms/default-keys",
    serviceId: "kms",
    serviceName: "AWS KMS",
    category: "Security, Identity, & Compliance",
    desc: "Default service encryption keys managed on your behalf by AWS (aws/s3, aws/ssm)",
    color: "#E7157B",
    aliases: ["aws keys", "default keys", "aws/ssm", "aws/s3", "managed keys"],
  },
  {
    id: "feat-kms-create",
    name: "Create KMS key",
    href: "/kms/keys/create",
    serviceId: "kms",
    serviceName: "AWS KMS",
    category: "Security, Identity, & Compliance",
    desc: "Step-by-step wizard to create symmetric or asymmetric KMS keys with IAM policy",
    color: "#E7157B",
    aliases: ["create key", "new key", "generate key", "create kms key"],
  },

  // S3
  {
    id: "feat-s3-buckets",
    name: "S3 Buckets",
    href: "/s3",
    serviceId: "s3",
    serviceName: "Amazon S3",
    category: "Storage",
    desc: "Scalable object storage containers for files, backups, and static websites",
    color: "#3F8624",
    aliases: ["buckets", "s3 buckets", "file storage", "object storage", "blobs", "bucket list"],
  },

  // SQS
  {
    id: "feat-sqs-queues",
    name: "SQS Queues",
    href: "/sqs",
    serviceId: "sqs",
    serviceName: "Amazon SQS",
    category: "Application Integration",
    desc: "Standard and FIFO message queues for decoupling distributed software",
    color: "#E7157B",
    aliases: ["queues", "message queue", "fifo queue", "dead letter queue", "dlq"],
  },

  // DynamoDB
  {
    id: "feat-ddb-tables",
    name: "DynamoDB Tables",
    href: "/dynamodb",
    serviceId: "dynamodb",
    serviceName: "Amazon DynamoDB",
    category: "Database",
    desc: "Fast, flexible NoSQL database tables with single-digit millisecond latency",
    color: "#2E27AD",
    aliases: ["tables", "nosql tables", "dynamo tables", "items", "json database"],
  },

  // IAM
  {
    id: "feat-iam-users",
    name: "IAM Users",
    href: "/iam/users",
    serviceId: "iam",
    serviceName: "AWS IAM",
    category: "Security, Identity, & Compliance",
    desc: "Create and manage individual user identities, passwords, and access keys",
    color: "#DD3522",
    aliases: ["users", "iam users", "credentials", "access keys"],
  },
  {
    id: "feat-iam-roles",
    name: "IAM Roles",
    href: "/iam/roles",
    serviceId: "iam",
    serviceName: "AWS IAM",
    category: "Security, Identity, & Compliance",
    desc: "Delegable identities with specific permissions assumed by AWS services and users",
    color: "#DD3522",
    aliases: ["roles", "iam roles", "instance profile", "service role"],
  },
  {
    id: "feat-iam-policies",
    name: "IAM Policies",
    href: "/iam/policies",
    serviceId: "iam",
    serviceName: "AWS IAM",
    category: "Security, Identity, & Compliance",
    desc: "JSON permission documents defining allowable actions and resources",
    color: "#DD3522",
    aliases: ["policies", "iam policies", "permissions", "json policy"],
  },

  // EC2
  {
    id: "feat-ec2-instances",
    name: "EC2 Instances",
    href: "/ec2/instances",
    serviceId: "ec2",
    serviceName: "Amazon EC2",
    category: "Compute",
    desc: "Launch, inspect, start, stop, and terminate virtual cloud server instances",
    color: "#FF9900",
    aliases: ["instances", "virtual machines", "servers", "vms", "ec2 instances"],
  },
  {
    id: "feat-ec2-elbv2",
    name: "Load Balancers",
    href: "/ec2/load-balancers",
    serviceId: "ec2",
    serviceName: "Amazon EC2",
    category: "Networking & Content Delivery",
    desc: "Distribute incoming application traffic across multiple targets (ALB / NLB)",
    color: "#8C4FFF",
    aliases: ["load balancers", "alb", "nlb", "elb", "elastic load balancing"],
  },
  {
    id: "feat-ec2-target-groups",
    name: "Target Groups",
    href: "/ec2/target-groups",
    serviceId: "ec2",
    serviceName: "Amazon EC2",
    category: "Networking & Content Delivery",
    desc: "Route requests to registered compute targets with configurable health checks",
    color: "#8C4FFF",
    aliases: ["target groups", "backend targets", "health check targets"],
  },
  {
    id: "feat-ec2-asg",
    name: "Auto Scaling Groups",
    href: "/ec2/auto-scaling-groups",
    serviceId: "ec2",
    serviceName: "Amazon EC2",
    category: "Compute",
    desc: "Automatically add or remove compute instances to match traffic demand",
    color: "#FF9900",
    aliases: ["auto scaling", "asg", "scaling policies", "dynamic scaling"],
  },

  // Resource Groups & Tag Editor
  {
    id: "feat-tag-editor",
    name: "Tag Editor",
    href: "/resource-groups/tag-editor",
    serviceId: "resource-groups",
    serviceName: "Resource Groups",
    category: "Management & Governance",
    desc: "Search resources across AWS services and Regions to bulk edit or remove tags",
    color: "#C925D1",
    aliases: ["tag editor", "bulk tagging", "find resources by tag", "tags"],
  },

  // Service Quotas
  {
    id: "feat-quota-requests",
    name: "Quota Increase Requests",
    href: "/service-quotas/requests",
    serviceId: "service-quotas",
    serviceName: "Service Quotas",
    category: "Management & Governance",
    desc: "Track and review requested quota increases across all AWS services",
    color: "#C925D1",
    aliases: ["quota requests", "request increase", "increase limit", "limit increase"],
  },

  // Account Management
  {
    id: "feat-account-contacts",
    name: "Alternate Contacts",
    href: "/account/alternate-contacts",
    serviceId: "account",
    serviceName: "Account Management",
    category: "Management & Governance",
    desc: "Configure Billing, Operations, and Security alternate notification contacts",
    color: "#C925D1",
    aliases: ["alternate contacts", "billing contact", "security contact", "ops contact"],
  },
  {
    id: "feat-account-regions",
    name: "AWS Regions Opt-in",
    href: "/account/regions",
    serviceId: "account",
    serviceName: "Account Management",
    category: "Management & Governance",
    desc: "Enable or disable global AWS Region availability for your account",
    color: "#C925D1",
    aliases: ["regions", "opt-in regions", "enable region", "region availability"],
  },
];

// Acronym and common synonym expansion dictionary
const ACRONYM_MAP: Record<string, string[]> = {
  ssm: ["systems", "manager", "parameter", "store"],
  acm: ["certificate", "manager", "ssl", "tls"],
  kms: ["key", "management", "service", "encryption"],
  sqs: ["simple", "queue", "service", "messaging"],
  iam: ["identity", "access", "management", "users", "roles"],
  elb: ["elastic", "load", "balancing", "balancer"],
  alb: ["application", "load", "balancer"],
  nlb: ["network", "load", "balancer"],
  asg: ["auto", "scaling", "group"],
  ram: ["resource", "access", "manager", "sharing"],
  ddb: ["dynamodb", "nosql", "tables"],
  sm: ["secrets", "manager", "credentials"],
  ec2: ["elastic", "compute", "cloud", "instances", "virtual", "machines"],
  s3: ["simple", "storage", "service", "buckets", "objects"],
  r53: ["route", "53", "dns", "domains"],
  cw: ["cloudwatch", "logs", "metrics"],
  cfn: ["cloudformation", "templates"],
  ebs: ["elastic", "block", "store", "volumes"],
  vpc: ["virtual", "private", "cloud", "networking"],
};

/**
 * Calculates a match score for a searchable item against query and tokens.
 */
function calculateScore(
  name: string,
  shortName: string,
  desc: string,
  category: string,
  aliases: string[] = [],
  status?: string,
  rawQuery: string = "",
  tokens: string[] = []
): number {
  const query = rawQuery.toLowerCase().trim();
  if (!query) return 0;

  const nameLower = name.toLowerCase();
  const shortLower = shortName.toLowerCase();
  const descLower = desc.toLowerCase();
  const catLower = category.toLowerCase();
  const aliasLower = aliases.map((a) => a.toLowerCase());
  const combined = `${nameLower} ${shortLower} ${aliasLower.join(" ")} ${descLower} ${catLower}`;

  let score = 0;

  // 1. Exact full query match
  if (nameLower === query || shortLower === query) {
    score += 350;
  } else if (aliasLower.some((a) => a === query)) {
    score += 300;
  } else if (nameLower.startsWith(query) || shortLower.startsWith(query)) {
    score += 220;
  } else if (nameLower.includes(query) || shortLower.includes(query)) {
    score += 180;
  } else if (aliasLower.some((a) => a.includes(query))) {
    score += 150;
  } else if (combined.includes(query)) {
    score += 110;
  }

  // 2. Multi-token evaluation
  let matchedTokens = 0;
  for (const t of tokens) {
    if (!t) continue;
    let hit = false;

    if (nameLower.includes(t)) {
      score += 45;
      hit = true;
    }
    if (shortLower.includes(t)) {
      score += 40;
      hit = true;
    }
    if (aliasLower.some((a) => a.includes(t))) {
      score += 35;
      hit = true;
    }
    if (descLower.includes(t)) {
      score += 15;
      hit = true;
    }
    if (catLower.includes(t)) {
      score += 10;
      hit = true;
    }

    if (hit) matchedTokens++;
  }

  // If query had multiple tokens and all matched, provide significant bonus
  if (tokens.length > 1 && matchedTokens === tokens.length) {
    score += 90;
  }

  // If no tokens matched and no direct full query match, score is 0
  if (matchedTokens === 0 && !combined.includes(query)) {
    return 0;
  }

  // Filter out weak partial matches when many tokens were given
  if (tokens.length >= 3 && matchedTokens < Math.ceil(tokens.length * 0.5)) {
    return 0;
  }

  // If there was no match, score remains 0
  if (score <= 0) {
    return 0;
  }

  // Functional/emulator boost so usable pages rise to top
  if (status === "functional" || status === "emulator") {
    score += 30;
  }

  return score;
}

/**
 * Searches across all AWS Services and Features with intelligent ranking.
 */
export function searchServicesAndFeatures(rawQuery: string): SearchMatchResult {
  const query = rawQuery.toLowerCase().trim();
  if (!query) {
    return { services: [], features: [], totalMatches: 0 };
  }

  // Build token set including acronym expansions
  const baseTokens = query
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  const expandedTokens = new Set<string>(baseTokens);
  for (const t of baseTokens) {
    if (ACRONYM_MAP[t]) {
      ACRONYM_MAP[t].forEach((word) => expandedTokens.add(word));
    }
  }
  const allTokens = Array.from(expandedTokens);

  // Score Services
  const scoredServices = ALL_SERVICES.map((s) => {
    const score = calculateScore(
      s.name,
      s.shortName,
      s.desc,
      s.category,
      s.aliases || [],
      s.status,
      query,
      allTokens
    );
    return { service: s, score };
  })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.service);

  // Score Features
  const scoredFeatures = COMMON_FEATURES.map((f) => {
    const score = calculateScore(
      f.name,
      f.serviceName,
      f.desc,
      f.category,
      f.aliases,
      "functional",
      query,
      allTokens
    );
    return { feature: f, score };
  })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.feature);

  return {
    services: scoredServices.slice(0, 10),
    features: scoredFeatures.slice(0, 6),
    totalMatches: scoredServices.length + scoredFeatures.length,
  };
}
